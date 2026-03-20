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
    juce::dsp::ProcessSpec spec { sampleRate, (juce::uint32)samplesPerBlock, 2 };
    
    pitchShifter.prepare(sampleRate, samplesPerBlock);
    dspChain.prepare(spec);
    
    analysisBuffer.assign(fft.getSize(), 0.0f);
    analysisBufferPos = 0;
}

void NADAAudioProcessor::releaseResources() {}

void NADAAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;
    auto totalNumInputChannels  = getTotalNumInputChannels();
    auto totalNumOutputChannels = getTotalNumOutputChannels();

    for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i)
        buffer.clear (i, 0, buffer.getNumSamples());

    if (totalNumInputChannels < 2) return;

    // --- 1. CAPTURE DATA FOR AI ---
    for (int i=0; i<buffer.getNumSamples(); ++i) {
        analysisBuffer[analysisBufferPos] = (buffer.getSample(0, i) + buffer.getSample(1, i)) * 0.5f;
        analysisBufferPos = (analysisBufferPos + 1) % (int)analysisBuffer.size();
    }

    float inRMS = buffer.getRMSLevel(0, 0, buffer.getNumSamples());

    // --- 2. THE 14-STEP GANGSTER CHAIN ---
    
    // Step 3: Autotune (Real Pitch Shifting)
    float speed = *apvts.getRawParameterValue("AUTOTUNE_SPEED");
    pitchShifter.process(buffer, 1.0f); // Placeholder for dynamic ratio

    // Step 4+: DSP Chain (Comp/EQ/Sat/Limit)
    updateDSPChain();
    juce::dsp::AudioBlock<float> block(buffer);
    dspChain.process(juce::dsp::ProcessContextReplacing<float>(block));

    float outRMS = buffer.getRMSLevel(0, 0, buffer.getNumSamples());
    
    // Metering
    inputLevel = inRMS;
    outputLevel = outRMS;
    grLevel = 0.0f; 
}

void NADAAudioProcessor::updateDSPChain()
{
    // High Pass
    *dspChain.get<0>().coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighPass(currentSampleRate, 100.0f);
    
    // FET 1176 Style
    auto& fet = dspChain.get<4>();
    fet.setThreshold(*apvts.getRawParameterValue("FET_THRESH"));
    fet.setRatio(*apvts.getRawParameterValue("FET_RATIO"));
    fet.setAttack(*apvts.getRawParameterValue("FET_ATTACK") * 1000.0f);
    fet.setRelease(*apvts.getRawParameterValue("FET_RELEASE") * 1000.0f);
    
    // OPTO LA-2A Style
    auto& opto = dspChain.get<5>();
    opto.setThreshold(*apvts.getRawParameterValue("OPTO_THRESH"));
    opto.setRatio(4.0f);
    opto.setAttack(10.0f);
    opto.setRelease(500.0f);
    
    // Limiter
    auto& lim = dspChain.get<9>();
    lim.setThreshold(-0.1f);
    lim.setRelease(50.0f);
}
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
