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

    // --- 1. CAPTURE DATA FOR AI ---
    auto* channel0 = buffer.getReadPointer(0);
    for (int i=0; i<buffer.getNumSamples(); ++i) {
        analysisBuffer[analysisBufferPos] = channel0[i];
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
    auto speed = apvts.getRawParameterValue("AUTOTUNE_SPEED")->load();
    auto fetThresh = apvts.getRawParameterValue("FET_THRESH")->load();
    auto optoRed = apvts.getRawParameterValue("OPTO_RED")->load();
    auto air = apvts.getRawParameterValue("AIR")->load();
    auto width = apvts.getRawParameterValue("STEREO_WIDTH")->load();
    auto reverbWet = apvts.getRawParameterValue("REVERB_WET")->load();
    
    // 1. High Pass
    *dspChain.get<0>().coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighPass(currentSampleRate, 80.0f);
    
    // 3. FET 1176
    auto& fet = dspChain.get<2>();
    fet.setThreshold(fetThresh);
    fet.setRatio(4.0f);
    fet.setAttack(0.0001f);
    fet.setRelease(0.1f);
    
    // 4. OPTO LA-2A
    auto& opto = dspChain.get<3>();
    opto.setThreshold(optoRed);
    opto.setRatio(3.0f);
    opto.setAttack(0.01f);
    opto.setRelease(0.5f);
    
    // 5. EQP-A (Air Shelf)
    *dspChain.get<4>().coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighShelf(currentSampleRate, 12000.0f, 0.7f, juce::Decibels::decibelsToGain(air));
    
    // 11. Stereo Width
    dspChain.get<10>().setPan(width); // Simplified width mapping
    
    // 12. Reverb
    juce::dsp::Reverb::Parameters revParams;
    revParams.roomSize = 0.5f;
    revParams.damping = 0.1f;
    revParams.wetLevel = reverbWet;
    revParams.dryLevel = 1.0f - reverbWet;
    dspChain.get<11>().setParameters(revParams);
    
    // 14. Limiter
    auto& limiter = dspChain.get<13>();
    limiter.setThreshold(-0.1f);
    limiter.setRelease(0.1f);
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
        
        centroid += freq * mag;
        totalEnergy += mag;
        
        if (freq > 5000.0f) sibilanceEnergy += mag;
    }

    if (totalEnergy > 0.0001f) {
        lastAnalysis.lowEnergy = totalEnergy / numBins;
        lastAnalysis.midEnergy = centroid / (totalEnergy * 20000.0f); // Normalized
        lastAnalysis.highEnergy = sibilanceEnergy / totalEnergy;
    }

    // AI MAPPING (Rule-Based for "Gold" stability)
    // 1. If sibilance is high, increase De-esser
    auto* deesserParam = apvts.getParameter("DEESSER_RANGE");
    if (lastAnalysis.highEnergy > 0.3f) deesserParam->setValueNotifyingHost(0.6f); 
    
    // 2. If brightness is low, increase Air
    auto* airParam = apvts.getParameter("AIR");
    if (lastAnalysis.midEnergy < 0.2f) airParam->setValueNotifyingHost(0.4f);

    analysisRequested = false;
}

juce::AudioProcessorValueTreeState::ParameterLayout NADAAudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    // 1-4: AUTOTUNE
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AUTOTUNE_SPEED", "Retune Speed", 0.0f, 1.0f, 0.2f));
    params.push_back(std::make_unique<juce::AudioParameterChoice>("AUTOTUNE_KEY", "Key", juce::StringArray({"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}), 0));
    params.push_back(std::make_unique<juce::AudioParameterChoice>("AUTOTUNE_SCALE", "Scale", juce::StringArray({"Major", "Minor"}), 0));

    // 5-8: DYNAMICS
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_THRESH", "1176 Threshold", -60.0f, 0.0f, -20.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("OPTO_RED", "LA-2A Reduction", -60.0f, 0.0f, -10.0f));
    
    // 9-12: TONAL
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AIR", "EQP-A Air", 0.0f, 12.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("SSL_DRIVE", "SSL Console Sat", 0.0f, 1.0f, 0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DEESSER_RANGE", "De-Esser Range", 0.0f, 20.0f, 6.0f));

    // 13-16: SPATIAL & BUS
    params.push_back(std::make_unique<juce::AudioParameterFloat>("STEREO_WIDTH", "Stereo Enhancer", -1.0f, 1.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("REVERB_WET", "Bus Reverb Mix", 0.0f, 1.0f, 0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DELAY_WET", "Bus Delay Mix", 0.0f, 1.0f, 0.1f));

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
