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
    mSampleRate = sampleRate;
    juce::dsp::ProcessSpec spec { sampleRate, (juce::uint32)samplesPerBlock, 2 };
    
    pitchShifter.prepare(sampleRate, samplesPerBlock);
    for (int i=0; i<6; ++i) eq6.bands[i].prepare(spec);
    fet1176.prepare(sampleRate);
    optoLA2A.prepare(sampleRate);
    pultec.low.prepare(spec); pultec.high.prepare(spec);
    for (int i=0; i<4; ++i) ssl.bands[i].prepare(spec);
    hg2.prepare(sampleRate);
    rvox.prepare(sampleRate);
    deesser.prepare(sampleRate);
    stereomaker.prepare(sampleRate);
    limiter.prepare(spec);
    reverb.prepare(spec);
    delay.lineL.prepare(spec); delay.lineR.prepare(spec);
    
    analysisBuffer.assign(fft.getSize(), 0.0f);
    analysisBufferPos = 0;
}

void NADAAudioProcessor::releaseResources() {}

void NADAAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ignoreUnused(buffer, midiMessages);
    juce::ScopedNoDenormals noDenormals;
    auto totalNumInputChannels  = getTotalNumInputChannels();
    auto totalNumOutputChannels = getTotalNumOutputChannels();

    for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i)
        buffer.clear (i, 0, buffer.getNumSamples());

    // --- 1. CAPTURE DATA FOR AI ---
    auto* inL = buffer.getReadPointer(0);
    for (int i=0; i<buffer.getNumSamples(); ++i) {
        analysisBuffer[analysisBufferPos] = inL[i];
        analysisBufferPos = (analysisBufferPos + 1) % (int)analysisBuffer.size();
    }
    inputLevel = buffer.getRMSLevel(0, 0, buffer.getNumSamples());

    // --- 2. UPDATE PARAMETERS (Coefficient calculation) ---
    updateDSPChain();

    // --- 3. HARVEST PARAMETERS (Atomic loads once per block) ---
    float userPitch = apvts.getRawParameterValue("AUTOTUNE_PITCH")->load();
    float fetThr = apvts.getRawParameterValue("FET_THRESH")->load();
    float fetRat = apvts.getRawParameterValue("FET_RATIO")->load();
    float optoRed = apvts.getRawParameterValue("OPTO_RED")->load();
    float satDrv = apvts.getRawParameterValue("SAT_DRIVE")->load();
    float rvoxComp = apvts.getRawParameterValue("RVOX_COMP")->load();
    float dsRange = apvts.getRawParameterValue("DEESSER_RANGE")->load();
    float widthValue = apvts.getRawParameterValue("STEREO_WIDTH")->load();
    juce::ignoreUnused(widthValue);

    // 1. Pitch (Crispytuner)
    float pitchRatio = std::pow(2.0f, userPitch / 12.0f);
    pitchShifter.process(buffer, pitchRatio);

    // Block-based Processing
    juce::dsp::AudioBlock<float> block(buffer);
    juce::dsp::ProcessContextReplacing<float> context(block);

    // 2. Pro-Q 3
    for (int i=0; i<6; ++i) eq6.bands[i].process(context);

    // --- SAMPLE-WISE POWER LOOP (Stages 3-9) ---
    auto* left = buffer.getWritePointer(0);
    auto* right = buffer.getWritePointer(1);
    for (int s = 0; s < buffer.getNumSamples(); ++s) {
        float l = left[s]; float r = right[s];
        
        // 3. 1176
        l = fet1176.process(l, fetThr, fetRat);
        r = fet1176.process(r, fetThr, fetRat);

        // 4. LA-2A
        l = optoLA2A.process(l, optoRed);
        r = optoLA2A.process(r, optoRed);

        // 7. HG-2
        l = hg2.process(l, satDrv, 0.1f, 0.1f);
        r = hg2.process(r, satDrv, 0.1f, 0.1f);

        // 8. R-Vox
        l = rvox.process(l, rvoxComp, 0.001f);
        r = rvox.process(r, rvoxComp, 0.001f);

        // 9. 902 De-esser
        l = deesser.process(l, dsRange);
        r = deesser.process(r, dsRange);

        left[s] = l; right[s] = r;
    }

    // 5. Pultec
    pultec.low.process(context); pultec.high.process(context);

    // 6. SSL
    for (int i=0; i<4; ++i) ssl.bands[i].process(context);

    // 10. Stereo Width
    stereomaker.process(buffer, apvts.getRawParameterValue("STEREO_WIDTH")->load(), 100.0f);

    // 11. Limiter
    limiter.process(context);

    // 12. Reverb
    reverb.process(context);

    // 13. Delay
    // Simplified sample-wise delay loop for H-Delay
    for (int s = 0; s < buffer.getNumSamples(); ++s) {
        float delL = delay.lineL.popSample(0);
        delay.lineL.pushSample(0, left[s] + delL * 0.3f);
        left[s] = left[s] * 0.8f + delL * 0.2f;
    }

    outputLevel = buffer.getRMSLevel(0, 0, buffer.getNumSamples());
}

void NADAAudioProcessor::updateDSPChain()
{
    // 1. Crispytuner - Handled in processBlock directly

    // 2. Pro-Q 3 (6 Bands)
    for (int i=0; i<6; ++i) {
        juce::String prefix = "EQ_BAND_" + juce::String(i+1) + "_";
        float f = apvts.getRawParameterValue(prefix + "FREQ")->load();
        float g = apvts.getRawParameterValue(prefix + "GAIN")->load();
        float q = apvts.getRawParameterValue(prefix + "Q")->load();
        *eq6.bands[i].coefficients = *juce::dsp::IIR::Coefficients<float>::makePeakFilter(mSampleRate, f, q, juce::Decibels::decibelsToGain(g));
    }

    // 3. 1176 Coefficients
    float fAtk = apvts.getRawParameterValue("FET_ATTACK")->load();
    float fRel = apvts.getRawParameterValue("FET_RELEASE")->load();
    fet1176.updateCoefficients(fAtk, fRel);

    // 5. Pultec
    float pLowBoost = apvts.getRawParameterValue("PULTEC_LOW_BOOST")->load();
    float pHighBoost = apvts.getRawParameterValue("PULTEC_HIGH_BOOST")->load();
    *pultec.low.coefficients = *juce::dsp::IIR::Coefficients<float>::makeLowShelf(mSampleRate, 60.0f, 0.7f, juce::Decibels::decibelsToGain(pLowBoost));
    *pultec.high.coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighShelf(mSampleRate, 10000.0f, 0.7f, juce::Decibels::decibelsToGain(pHighBoost));

    // 6. SSL
    for (int i=0; i<4; ++i) {
        float f = 200.0f * std::pow(4.0f, (float)i);
        *ssl.bands[i].coefficients = *juce::dsp::IIR::Coefficients<float>::makePeakFilter(mSampleRate, f, 1.0f, 1.0f);
    }

    // 11. Limiter
    limiter.setThreshold(apvts.getRawParameterValue("LIMITER_THRESH")->load());
    limiter.setRelease(200.0f);

    // 12. Reverb
    juce::dsp::Reverb::Parameters revParams;
    revParams.roomSize = apvts.getRawParameterValue("REVERB_SIZE")->load();
    revParams.wetLevel = apvts.getRawParameterValue("REVERB_MIX")->load();
    revParams.dryLevel = 1.0f - revParams.wetLevel;
    reverb.setParameters(revParams);
}

void NADAAudioProcessor::triggerNADAAnalysis()
{
    analysisRequested = true;
}

void NADAAudioProcessor::runSpectralAnalysis()
{
    // Capture and analyze frequency bands
    // ... logic to fill spectrum ...

    // AI HEURISTICS (Sound Matching)
    // Targeting "US VOCAL" Profile: Bright, controlled low-mids, flat but present 2k-5k.
    
    // Example: If low energy is > target, reduce EQ Band 2 (Mud)
    if (lastAnalysis.lowEnergy > 0.5f) {
        if (auto* p = apvts.getParameter("EQ_BAND_2_GAIN"))
            p->setValueNotifyingHost((float)juce::Decibels::gainToDecibels(0.7f) / 12.0f); // Normalize
    }

    // Example: If sibilance is high, increase De-esser Range
    if (lastAnalysis.highEnergy > 0.4f) {
        if (auto* p = apvts.getParameter("DEESSER_RANGE"))
            p->setValueNotifyingHost(0.8f);
    }

    // Normalize Output to -10 LUFS
    float targetLUFS = -10.0f;
    float currentLUFS = (float)juce::Decibels::gainToDecibels(outputLevel.load());
    float makeup = targetLUFS - currentLUFS;
    if (auto* p = apvts.getParameter("LIMITER_THRESH"))
        p->setValueNotifyingHost(std::clamp(makeup / 24.0f, 0.0f, 1.0f));

    analysisRequested = false;
}

juce::AudioProcessorValueTreeState::ParameterLayout NADAAudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    // 1. AUTOTUNE
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AUTOTUNE_SPEED", "Speed", 0.0f, 1.0f, 0.2f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AUTOTUNE_PITCH", "Pitch", -12.0f, 12.0f, 0.0f));

    // 2. Pro-Q 3 (6 Bands)
    for (int i=1; i<=6; ++i) {
        juce::String s = "EQ_BAND_" + juce::String(i);
        params.push_back(std::make_unique<juce::AudioParameterFloat>(s + "_FREQ", s + " Freq", 20.0f, 20000.0f, 1000.0f * i));
        params.push_back(std::make_unique<juce::AudioParameterFloat>(s + "_GAIN", s + " Gain", -18.0f, 18.0f, 0.0f));
        params.push_back(std::make_unique<juce::AudioParameterFloat>(s + "_Q", s + " Q", 0.1f, 10.0f, 1.0f));
    }

    // 3. 1176
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_THRESH", "FET Threshold", -60.0f, 0.0f, -20.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_RATIO", "FET Ratio", 4.0f, 20.0f, 4.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_ATTACK", "FET Attack", 20.0f, 800.0f, 100.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_RELEASE", "FET Release", 50.0f, 1100.0f, 100.0f));

    // 4. LA-2A
    params.push_back(std::make_unique<juce::AudioParameterFloat>("OPTO_RED", "Peak Red", 0.0f, 100.0f, 30.0f));

    // 5. Pultec
    params.push_back(std::make_unique<juce::AudioParameterFloat>("PULTEC_LOW_BOOST", "Low Boost", 0.0f, 12.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("PULTEC_HIGH_BOOST", "High Boost", 0.0f, 12.0f, 0.0f));

    // 6. SSL
    params.push_back(std::make_unique<juce::AudioParameterFloat>("SSL_DRIVE", "SSL Drive", 0.0f, 1.0f, 0.1f));

    // 7. HG-2
    params.push_back(std::make_unique<juce::AudioParameterFloat>("SAT_DRIVE", "Sat Drive", 0.0f, 1.0f, 0.1f));

    // 8. R-Vox
    params.push_back(std::make_unique<juce::AudioParameterFloat>("RVOX_COMP", "Vox Comp", -30.0f, 0.0f, -10.0f));

    // 9. De-esser
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DEESSER_RANGE", "De-Esser Range", 0.0f, 1.0f, 0.2f));

    // 10. Master
    params.push_back(std::make_unique<juce::AudioParameterFloat>("STEREO_WIDTH", "Width", 0.0f, 2.0f, 1.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("LIMITER_THRESH", "Limiter Threshold", -24.0f, 0.0f, -0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("REVERB_MIX", "Reverb Mix", 0.0f, 1.0f, 0.2f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("REVERB_SIZE", "Room Size", 0.0f, 1.0f, 0.5f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DELAY_MIX", "Delay Mix", 0.0f, 1.0f, 0.2f));

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
