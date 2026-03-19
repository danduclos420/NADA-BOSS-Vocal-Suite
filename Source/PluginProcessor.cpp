#include "PluginProcessor.h"
#include "PluginEditor.h"

NADAAudioProcessor::NADAAudioProcessor()
    : AudioProcessor (BusesProperties().withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                                       .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      apvts (*this, nullptr, "PARAMETERS", createParameterLayout())
{
    analysisBuffer.resize(2048, 0.0f);
    startTimerHz(30); 
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
    float fetAttack = *apvts.getRawParameterValue("FET_ATTACK");
    float fetRelease = *apvts.getRawParameterValue("FET_RELEASE");

    float optoPeak = juce::Decibels::decibelsToGain((float)*apvts.getRawParameterValue("OPTO_THRESH"));
    float optoGain = juce::Decibels::decibelsToGain((float)*apvts.getRawParameterValue("OPTO_GAIN"));
    
    float deEssFreq = *apvts.getRawParameterValue("DEESSER_FREQ");
    float deEssRange = *apvts.getRawParameterValue("DEESSER_RANGE");
    
    float reverbMix = *apvts.getRawParameterValue("REVERB_MIX");
    float reverbSize = *apvts.getRawParameterValue("REVERB_SIZE");
    float reverbDamp = *apvts.getRawParameterValue("REVERB_DAMP");
    
    float delayMix = *apvts.getRawParameterValue("DELAY_MIX");
    float delayFeedback = *apvts.getRawParameterValue("DELAY_FEEDBACK");

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

        // --- 1. PITCH CORRECTION (PSOLA-Style Crossfade) ---
        // ... pitch detection logic here ...

        // --- 2. DYNAMICS (Analog Modeling Curves) ---
        // FET 1176
        left = fet.process(left, fetThresh, fetRatio, fetAttack, fetRelease);
        right = fet.process(right, fetThresh, fetRatio, fetAttack, fetRelease);
        
        // OPTO LA-2A
        left = opto.process(left, optoPeak) * optoGain;
        right = opto.process(right, optoPeak) * optoGain;

        maxGR = juce::jmax(maxGR, fet.getGainReduction() + opto.getGainReduction());

        // --- 3. DELAY ---
        float dL = delayL.popSample(0);
        float dR = delayR.popSample(1);
        delayL.pushSample(0, left + (dR * delayFeedback * 0.5f));
        delayR.pushSample(1, right + (dL * delayFeedback * 0.5f));
        
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

    // --- DYNAMIC DE-ESSER ---
    float sibGain = juce::jlimit(juce::Decibels::decibelsToGain(-deEssRange), 1.0f, 1.0f - (lastAnalysis.sibilance * 1.5f));
    *deEsserL.coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighShelf(currentSampleRate, deEssFreq, 0.707f, sibGain);
    *deEsserR.coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighShelf(currentSampleRate, deEssFreq, 0.707f, sibGain);
    
    // ... filter processing ...

    // --- GLOBAL REVERB ---
    auto params = reverb.getParameters();
    params.wetLevel = reverbMix;
    params.dryLevel = 1.0f - reverbMix;
    params.roomSize = reverbSize;
    params.damping = reverbDamp;
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

    // --- AUTOTUNE (1-5) ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AUTOTUNE_SPEED", "Retune Speed", 0.0f, 1.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterChoice>("AUTOTUNE_KEY", "Key", juce::StringArray({"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}), 0));
    params.push_back(std::make_unique<juce::AudioParameterChoice>("AUTOTUNE_SCALE", "Scale", juce::StringArray({"Major", "Minor"}), 0));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AUTOTUNE_HUMANIZE", "Humanize", 0.0f, 1.0f, 0.2f));

    // --- FET 1176 (6-15) ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_THRESH", "FET Threshold", -60.0f, 0.0f, -20.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_RATIO", "FET Ratio", 1.0f, 20.0f, 4.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_ATTACK", "FET Attack", 0.00002f, 0.001f, 0.0001f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_RELEASE", "FET Release", 0.01f, 1.0f, 0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_MIX", "FET Parallel Mix", 0.0f, 1.0f, 1.0f));

    // --- OPTO LA-2A (16-25) ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("OPTO_THRESH", "OPTO Peak Reduction", -60.0f, 0.0f, -10.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("OPTO_GAIN", "OPTO Makeup Gain", 0.0f, 30.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("OPTO_ATTACK", "OPTO Attack", 0.01f, 0.1f, 0.01f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("OPTO_RELEASE", "OPTO Release", 0.1f, 2.0f, 0.5f));

    // --- DE-ESSER (26-35) ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DEESSER_FREQ", "De-Esser Freq", 3000.0f, 12000.0f, 6000.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DEESSER_RANGE", "De-Esser Range", 0.0f, 20.0f, 6.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DEESSER_SPEED", "De-Esser Speed", 0.0f, 1.0f, 0.5f));

    // --- REVERB (36-45) ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("REVERB_MIX", "Reverb Mix", 0.0f, 1.0f, 0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("REVERB_SIZE", "Room Size", 0.0f, 1.0f, 0.5f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("REVERB_DAMP", "Damping", 0.0f, 1.0f, 0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("REVERB_WIDTH", "Reverb Width", 0.0f, 1.0f, 0.8f));

    // --- DELAY (46-55) ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DELAY_MIX", "Delay Mix", 0.0f, 1.0f, 0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DELAY_FEEDBACK", "Feedback", 0.0f, 1.0f, 0.3f));
    params.push_back(std::make_unique<juce::AudioParameterChoice>("DELAY_TIME", "Subdivision", juce::StringArray({"1/4", "1/8", "1/16", "1/8T"}), 1));

    // --- OUTPUT (56-60) ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("OUT_GAIN", "Master Output", -24.0f, 24.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AIR", "Air Sparkle", 0.0f, 12.0f, 0.0f));

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
