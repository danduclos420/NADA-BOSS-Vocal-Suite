#include "PluginProcessor.h"
#include "PluginEditor.h"

NADAAudioProcessor::NADAAudioProcessor()
    : AudioProcessor (BusesProperties().withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                                       .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      apvts (*this, nullptr, "PARAMETERS", createParameterLayout())
{
}

NADAAudioProcessor::~NADAAudioProcessor() {}

void NADAAudioProcessor::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    currentSampleRate = sampleRate;
    
    fet.prepare(sampleRate);
    opto.prepare(sampleRate);
    pitchDetector.prepare(sampleRate);

    analysisBuffer.assign(fft.getSize(), 0.0f);
    analysisBufferPos = 0;

    juce::dsp::ProcessSpec spec { sampleRate, (juce::uint32)samplesPerBlock, 2 };
    reverb.prepare(spec);
    
    // Fixed size delay line (max 2 seconds)
    delayL.prepare(spec);
    delayR.prepare(spec);
    delayL.setMaximumDelayInSamples(sampleRate * 2.0);
    delayR.setMaximumDelayInSamples(sampleRate * 2.0);

    // Prepare De-esser (High-Shelf at 6kHz)
    auto filterCoefs = juce::dsp::IIR::Coefficients<float>::makeHighShelf(sampleRate, 6000.0f, 0.707f, 1.0f);
    deEsserL.coefficients = filterCoefs;
    deEsserR.coefficients = filterCoefs;
}

void NADAAudioProcessor::releaseResources() {}

void NADAAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;
    auto totalNumInputChannels  = getTotalNumInputChannels();
    auto totalNumOutputChannels = getTotalNumOutputChannels();

    for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i)
        buffer.clear (i, 0, buffer.getNumSamples());

    // --- TEMPO SYNC ---
    float bpm = 120.0f;
    if (auto* playHead = getPlayHead()) {
        if (auto pos = playHead->getPosition()) {
            if (auto b = pos->getBpm()) bpm = *b;
        }
    }
    
    // Calculate 1/8 note delay
    float delaySamples = ((60000.0f / bpm) / 2.0f) * (currentSampleRate / 1000.0f);
    delayL.setDelay(delaySamples);
    delayR.setDelay(delaySamples);

    // --- PARAMETERS ---
    float autotuneAmount = *apvts.getRawParameterValue("AUTOTUNE_SPEED");
    float fetThresh = juce::Decibels::decibelsToGain((float)*apvts.getRawParameterValue("FET_THRESH"));
    float fetRatio = *apvts.getRawParameterValue("FET_RATIO");
    float optoPeak = juce::Decibels::decibelsToGain((float)*apvts.getRawParameterValue("OPTO_THRESH"));
    float reverbMix = *apvts.getRawParameterValue("REVERB_MIX");
    float delayMix = *apvts.getRawParameterValue("DELAY_MIX");

    // --- DSP LOOP ---
    float inRMS = 0.0f;
    float outRMS = 0.0f;
    float maxGR = 0.0f;

    for (int sample = 0; sample < buffer.getNumSamples(); ++sample)
    {
        float left = buffer.getSample(0, sample);
        float right = buffer.getSample(1, sample);
        
        float mono = (left + right) * 0.5f;
        analysisBuffer[analysisBufferPos] = mono;
        analysisBufferPos = (analysisBufferPos + 1) % (int)analysisBuffer.size();

        inRMS += (left * left + right * right);

        // 1. DYNAMICS
        float gr1 = fet.getGainReduction();
        float gr2 = opto.getGainReduction(); // Need to implement these getters
        maxGR = juce::jmax(maxGR, gr1 + gr2);

        left = fet.process(left, fetThresh, fetRatio, 0.5f, 50.0f);
        right = fet.process(right, fetThresh, fetRatio, 0.5f, 50.0f);
        
        left = opto.process(left, optoPeak);
        right = opto.process(right, optoPeak);

        // 2. DELAY
        float dL = delayL.popSample(0);
        float dR = delayR.popSample(1);
        delayL.pushSample(0, left + (dR * delayMix * 0.5f));
        delayR.pushSample(1, right + (dL * delayMix * 0.5f));
        
        float finalL = left + dL * delayMix;
        float finalR = right + dR * delayMix;
        
        outRMS += (finalL * finalL + finalR * finalR);

        buffer.setSample(0, sample, finalL);
        buffer.setSample(1, sample, finalR);
    }

    // Update Atoms (with smoothing)
    inputLevel = juce::jmax(0.0f, std::sqrt(inRMS / (float)buffer.getNumSamples()));
    outputLevel = juce::jmax(0.0f, std::sqrt(outRMS / (float)buffer.getNumSamples()));
    grLevel = maxGR;

    if (analysisRequested)
        runSpectralAnalysis();

    // --- DYNAMIC DE-ESSER ---
    // Update attenuation if sibilance is high
    float sibGain = juce::jlimit(0.1f, 1.0f, 1.0f - (lastAnalysis.sibilance * 1.5f));
    *deEsserL.coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighShelf(currentSampleRate, 6000.0f, 0.707f, sibGain);
    *deEsserR.coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighShelf(currentSampleRate, 6000.0f, 0.707f, sibGain);

    juce::dsp::AudioBlock<float> deEssBlock(buffer);
    juce::dsp::ProcessContextReplacing<float> deEssCtx(deEssBlock);
    deEsserL.process(deEssCtx.getSampleContext(0));
    deEsserR.process(deEssCtx.getSampleContext(1));

    // --- GLOBAL REVERB ---
    auto params = reverb.getParameters();
    params.wetLevel = reverbMix;
    params.dryLevel = 1.0f - reverbMix;
    reverb.setParameters(params);

    juce::dsp::AudioBlock<float> block(buffer);
    juce::dsp::ProcessContextReplacing<float> context(block);
    reverb.process(context);
}

void NADAAudioProcessor::triggerNADAAnalysis()
{
    analysisRequested = true;
}

void NADAAudioProcessor::runSpectralAnalysis()
{
    // 1. Prepare Buffer
    std::vector<float> fftData (fft.getSize() * 2, 0.0f);
    for (int i = 0; i < fft.getSize(); ++i)
        fftData[i] = analysisBuffer[(analysisBufferPos + i) % fft.getSize()];

    // 2. Perform FFT
    fft.performFrequencyOnlyForwardTransform(fftData.data());

    // 3. Extract Features (Bands)
    int binCount = fft.getSize() / 2;
    float nyquist = (float)currentSampleRate / 2.0f;
    float binWidth = nyquist / (float)binCount;

    float low = 0, mid = 0, high = 0, sib = 0;
    int lowBins = 0, midBins = 0, highBins = 0, sibBins = 0;

    for (int i = 1; i < binCount; ++i)
    {
        float freq = i * binWidth;
        float mag = fftData[i];

        if (freq < 250.0f) { low += mag; lowBins++; }
        else if (freq < 4000.0f) { mid += mag; midBins++; }
        else if (freq < 15000.0f) { high += mag; highBins++; }
        
        if (freq > 5000.0f && freq < 8000.0f) { sib += mag; sibBins++; }
    }

    lastAnalysis.lowEnergy = low / (float)juce::jmax(1, lowBins);
    lastAnalysis.midEnergy = mid / (float)juce::jmax(1, midBins);
    lastAnalysis.highEnergy = high / (float)juce::jmax(1, highBins);
    lastAnalysis.sibilance = sib / (float)juce::jmax(1, sibBins);
    lastAnalysis.tilt = lastAnalysis.highEnergy - lastAnalysis.lowEnergy;

    // --- 4. THE "LEGENDARY" AI DECISION ENGINE (ONNX Neural Matching) ---
    std::vector<float> inputFeatures = { 
        lastAnalysis.lowEnergy, 
        lastAnalysis.midEnergy, 
        lastAnalysis.highEnergy, 
        lastAnalysis.tilt, 
        lastAnalysis.sibilance 
    };
    
    auto aiSettings = onnxManager.runInference(inputFeatures);
    
    auto* speedParam = apvts.getParameter("AUTOTUNE_SPEED");
    auto* airParam = apvts.getParameter("FET_RATIO"); 

    // Neural-Driven Mapping (Example: AI predicts optimal retune speed and air)
    if (aiSettings.size() >= 2)
    {
        speedParam->setValueNotifyingHost(aiSettings[0]);
        airParam->setValueNotifyingHost(aiSettings[1]);
    }

    analysisRequested = false;
}

juce::AudioProcessorValueTreeState::ParameterLayout NADAAudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    params.push_back(std::make_unique<juce::AudioParameterFloat>("AUTOTUNE_SPEED", "Autotune", 0.0f, 1.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterChoice>("AUTOTUNE_KEY", "Key", juce::StringArray({"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}), 0));
    params.push_back(std::make_unique<juce::AudioParameterChoice>("AUTOTUNE_SCALE", "Scale", juce::StringArray({"Major", "Minor"}), 0));

    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_THRESH", "FET Threshold", -60.0f, 0.0f, -20.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_RATIO", "FET Ratio", 1.0f, 20.0f, 4.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("OPTO_THRESH", "OPTO Peak", -60.0f, 0.0f, -10.0f));

    params.push_back(std::make_unique<juce::AudioParameterFloat>("REVERB_MIX", "Reverb", 0.0f, 1.0f, 0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DELAY_MIX", "Delay", 0.0f, 1.0f, 0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("STEREO_WIDTH", "Width", 0.0f, 1.0f, 0.5f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("TONE", "Tone", 0.0f, 1.0f, 0.5f));

    return { params.begin(), params.end() };
}

void NADAAudioProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    auto state = apvts.copyState();
    std::unique_ptr<juce::XmlElement> xml (state.createXml());
    copyXmlToBinary (*xml, destData);
}

void NADAAudioProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xmlState (getXmlFromBinary (data, sizeInBytes));
    if (xmlState != nullptr)
        if (xmlState->hasTagName (apvts.state.getType()))
            apvts.replaceState (juce::ValueTree::fromXml (*xmlState));
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter() { return new NADAAudioProcessor(); }
juce::AudioProcessorEditor* NADAAudioProcessor::createEditor() { return new NADAAudioProcessorEditor (*this); }
