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
    updateDSPChain();

    // Step 3: Autotune (Real Pitch Shifting)
    if (*apvts.getRawParameterValue("AUTOTUNE_ACTIVE") > 0.5f) {
        float speed = *apvts.getRawParameterValue("AUTOTUNE_SPEED");
        float pitch = *apvts.getRawParameterValue("AUTOTUNE_PITCH");
        pitchShifter.process(buffer, std::pow(2.0f, pitch / 12.0f)); 
    }

    // Step 4+: DSP Chain (Comp/EQ/Sat/Limit)
    juce::dsp::AudioBlock<float> block(buffer);
    dspChain.process(juce::dsp::ProcessContextReplacing<float>(block));

    float outRMS = buffer.getRMSLevel(0, 0, buffer.getNumSamples());
    
    // Metering
    inputLevel = inRMS;
    outputLevel = outRMS;
}

void NADAAudioProcessor::updateDSPChain()
{
    // 1. High Pass
    *dspChain.get<0>().coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighPass(currentSampleRate, 80.0f);
    
    // 2. Mud EQ
    auto mudFreq = apvts.getRawParameterValue("MUD_FREQ")->load();
    auto mudCut = apvts.getRawParameterValue("MUD_CUT")->load();
    *dspChain.get<1>().coefficients = *juce::dsp::IIR::Coefficients<float>::makePeakFilter(currentSampleRate, mudFreq, 1.0f, juce::Decibels::decibelsToGain(mudCut));

    // 3. FET 1176
    auto fetActive = *apvts.getRawParameterValue("FET_ACTIVE") > 0.5f;
    dspChain.setPartiallyBypassed<2>(!fetActive);
    auto& fet = dspChain.get<2>();
    fet.setThreshold(apvts.getRawParameterValue("FET_THRESH")->load());
    float fetRatios[] = { 4.0f, 8.0f, 12.0f, 20.0f, 100.0f };
    fet.setRatio(fetRatios[(int)std::floor(apvts.getRawParameterValue("FET_RATIO")->load())]);
    fet.setAttack(apvts.getRawParameterValue("FET_ATTACK")->load() / 1000.0f);
    fet.setRelease(apvts.getRawParameterValue("FET_RELEASE")->load() / 1000.0f);

    // 4. OPTO LA-2A
    auto optoActive = *apvts.getRawParameterValue("OPTO_ACTIVE") > 0.5f;
    dspChain.setPartiallyBypassed<3>(!optoActive);
    auto& opto = dspChain.get<3>();
    opto.setThreshold(-apvts.getRawParameterValue("OPTO_RED")->load());
    opto.setRatio(3.0f);
    opto.setAttack(0.01f);
    opto.setRelease(0.5f);
    
    // 5. EQP-A
    auto air = apvts.getRawParameterValue("AIR")->load();
    auto warmth = apvts.getRawParameterValue("TONE_WARMTH")->load();
    *dspChain.get<4>().coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighShelf(currentSampleRate, 12000.0f, 0.7f, juce::Decibels::decibelsToGain(air));
    
    // 6. SSL Console
    auto sslDrive = apvts.getRawParameterValue("SSL_DRIVE")->load();
    auto& ssl = dspChain.get<5>();
    ssl.setBias(sslDrive * 0.5f);

    // 7. Saturation
    auto satActive = *apvts.getRawParameterValue("SAT_ACTIVE") > 0.5f;
    dspChain.setPartiallyBypassed<6>(!satActive);
    auto& sat = dspChain.get<6>();
    sat.setGainLinear(1.0f + apvts.getRawParameterValue("SAT_DRIVE")->load());

    // 8. Final Comp
    auto& finalComp = dspChain.get<7>();
    finalComp.setThreshold(apvts.getRawParameterValue("FINAL_COMP_THRESH")->load());
    finalComp.setRatio(apvts.getRawParameterValue("FINAL_COMP_RATIO")->load());

    // 9. De-esser
    auto deessFreq = apvts.getRawParameterValue("DEESSER_FREQ")->load();
    auto deessRange = apvts.getRawParameterValue("DEESSER_RANGE")->load();
    *dspChain.get<8>().coefficients = *juce::dsp::IIR::Coefficients<float>::makePeakFilter(currentSampleRate, deessFreq, 2.0f, juce::Decibels::decibelsToGain(-deessRange));

    // 10. Final EQ
    auto finalGain = apvts.getRawParameterValue("FINAL_EQ_GAIN")->load();
    *dspChain.get<9>().coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighShelf(currentSampleRate, 8000.0f, 0.7f, juce::Decibels::decibelsToGain(finalGain));

    // 11. Stereo Width
    auto width = apvts.getRawParameterValue("STEREO_WIDTH")->load();
    dspChain.get<10>().setPan(width - 1.0f);

    // 12. Reverb
    auto revMix = apvts.getRawParameterValue("REVERB_MIX")->load();
    auto revSize = apvts.getRawParameterValue("REVERB_SIZE")->load();
    juce::dsp::Reverb::Parameters revParams;
    revParams.roomSize = revSize;
    revParams.wetLevel = revMix;
    revParams.dryLevel = 1.0f - revMix;
    dspChain.get<11>().setParameters(revParams);
    
    // 13. Delay
    auto delMix = apvts.getRawParameterValue("DELAY_MIX")->load();
    auto delFB = apvts.getRawParameterValue("DELAY_FEEDBACK")->load();
    dspChain.get<12>().setGainLinear(delMix); // Placeholder logic

    // 14. Limiter
    auto limThresh = apvts.getRawParameterValue("LIMITER_THRESH")->load();
    auto& limiter = dspChain.get<13>();
    limiter.setThreshold(limThresh);
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

    // 3. Extract Features
    int binCount = fft.getSize() / 2;
    float nyquist = (float)currentSampleRate / 2.0f;
    float binWidth = nyquist / (float)binCount;

    float centroid = 0.0f;
    float totalEnergy = 0.0f;
    float sibilanceEnergy = 0.0f;

    for (int i = 1; i < binCount; ++i)
    {
        float freq = i * binWidth;
        float mag = fftData[i];

        centroid += freq * mag;
        totalEnergy += mag;
        
        if (freq > 5000.0f) sibilanceEnergy += mag;
    }

    if (totalEnergy > 0.0001f) {
        lastAnalysis.lowEnergy = totalEnergy / (float)binCount;
        lastAnalysis.midEnergy = centroid / (totalEnergy * 20000.0f); 
        lastAnalysis.highEnergy = sibilanceEnergy / totalEnergy;
    }

    // AI MAPPING
    if (auto* deesserParam = apvts.getParameter("DEESSER_RANGE"))
        if (lastAnalysis.highEnergy > 0.3f) deesserParam->setValueNotifyingHost(0.6f); 
    
    if (auto* airParam = apvts.getParameter("AIR"))
        if (lastAnalysis.midEnergy < 0.2f) airParam->setValueNotifyingHost(0.4f);

    analysisRequested = false;
}

juce::AudioProcessorValueTreeState::ParameterLayout NADAAudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    // --- 1. AUTOTUNE ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AUTOTUNE_SPEED", "Speed", 0.0f, 1.0f, 0.2f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AUTOTUNE_PITCH", "Pitch", -12.0f, 12.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AUTOTUNE_TUNE", "Tune", -100.0f, 100.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterChoice>("AUTOTUNE_KEY", "Key", juce::StringArray({"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}), 0));
    params.push_back(std::make_unique<juce::AudioParameterChoice>("AUTOTUNE_SCALE", "Scale", juce::StringArray({"Major", "Minor", "Chromatic"}), 0));
    params.push_back(std::make_unique<juce::AudioParameterBool>("AUTOTUNE_ACTIVE", "Autotune Active", true));

    // --- 2. MUD EQ ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("MUD_FREQ", "Mud Freq", 100.0f, 500.0f, 250.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("MUD_CUT", "Mud Cut", -12.0f, 0.0f, -3.0f));

    // --- 3. 1176 FET ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_THRESH", "FET Threshold", -60.0f, 0.0f, -20.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_RATIO", "FET Ratio", 0.0f, 4.0f, 0.0f)); // 4, 8, 12, 20
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_ATTACK", "FET Attack", 0.02f, 0.8f, 0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_RELEASE", "FET Release", 50.0f, 1100.0f, 100.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_MAKEUP", "FET Makeup", 0.0f, 20.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterBool>("FET_ACTIVE", "FET Active", true));

    // --- 4. LA-2A OPTO ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("OPTO_RED", "Peak Red", 0.0f, 100.0f, 30.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("OPTO_GAIN", "Opto Gain", 0.0f, 40.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterBool>("OPTO_ACTIVE", "OPTO Active", true));

    // --- 5. EQP-A & COLOR ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AIR", "High Sparkle", 0.0f, 12.0f, 2.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("TONE_WARMTH", "Low Warmth", 0.0f, 12.0f, 0.0f));

    // --- 6. SSL & SAT ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("SSL_DRIVE", "SSL Drive", 0.0f, 1.0f, 0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("SAT_MIX", "Sat Mix", 0.0f, 1.0f, 0.2f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("SAT_DRIVE", "Sat Drive", 0.0f, 1.0f, 0.1f));

    // --- 8. FINAL COMP ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FINAL_COMP_THRESH", "Final Comp Thresh", -30.0f, 0.0f, -10.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FINAL_COMP_RATIO", "Final Comp Ratio", 1.0f, 10.0f, 2.0f));

    // --- 9. DE-ESSER ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DEESSER_RANGE", "De-Esser Range", 0.0f, 20.0f, 6.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DEESSER_FREQ", "De-Esser Freq", 4000.0f, 8000.0f, 6000.0f));

    // --- 10. FINAL EQ ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FINAL_EQ_GAIN", "Final EQ Gain", -12.0f, 12.0f, 0.0f));

    // --- 11-14. MASTERING & FX ---
    params.push_back(std::make_unique<juce::AudioParameterFloat>("STEREO_WIDTH", "Width", 0.0f, 2.0f, 1.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("LIMITER_THRESH", "Limiter Threshold", -24.0f, 0.0f, -0.1f));
    
    params.push_back(std::make_unique<juce::AudioParameterFloat>("REVERB_MIX", "Reverb Mix", 0.0f, 1.0f, 0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("REVERB_SIZE", "Room Size", 0.0f, 1.0f, 0.5f));
    
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DELAY_MIX", "Delay Mix", 0.0f, 1.0f, 0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DELAY_FEEDBACK", "Delay Feedback", 0.0f, 1.0f, 0.3f));

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
