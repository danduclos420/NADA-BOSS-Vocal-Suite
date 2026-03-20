#include "PluginProcessor.h"
#include "PluginEditor.h"

NADAAudioProcessor::NADAAudioProcessor()
    : AudioProcessor(BusesProperties()
        .withInput("Input", juce::AudioChannelSet::stereo(), true)
        .withOutput("Output", juce::AudioChannelSet::stereo(), true)),
      apvts(*this, nullptr, "PARAMETERS", createParameterLayout())
{
    analysisBuffer.resize(2048, 0.0f);
    startTimerHz(30);
}

NADAAudioProcessor::~NADAAudioProcessor() {}

void NADAAudioProcessor::timerCallback()
{
    if (analysisRequested.load()) {
        runSpectralAnalysis();
        analysisRequested.store(false);
    }
}

void NADAAudioProcessor::prepareToPlay(double sampleRate, int samplesPerBlock)
{
    mSampleRate = sampleRate;
    juce::dsp::ProcessSpec spec { sampleRate, (juce::uint32)samplesPerBlock, 2 };
    
    // Initialize DSP chain
    pitchShifter.prepare(sampleRate, samplesPerBlock);
    
    for (int i = 0; i < 6; ++i) {
        eq6.bands[i].prepare(spec);
    }
    
    pultec.low.prepare(spec);
    pultec.high.prepare(spec);
    
    for (int i = 0; i < 4; ++i) {
        ssl.bands[i].prepare(spec);
    }
    
    fet1176.prepare(sampleRate);
    optoLA2A.prepare(sampleRate);
    hg2.prepare(sampleRate);
    rvox.prepare(sampleRate);
    deesser.prepare(sampleRate);
    stereomaker.maker.prepare(sampleRate);
    
    limiter.prepare(spec);
    reverb.prepare(spec);
    
    // FIX: Set maximum delay time (5 seconds at current sample rate)
    delay.lineL.setMaximumDelayInSamples((int)(sampleRate * 5.0));
    delay.lineR.setMaximumDelayInSamples((int)(sampleRate * 5.0));
    delay.lineL.prepare(spec);
    delay.lineR.prepare(spec);
    
    // Set delay to 500ms
    float delayTime = (float)sampleRate * 0.5f;
    delay.lineL.setDelay(delayTime);
    delay.lineR.setDelay(delayTime);
    
    // FFT setup
    analysisBuffer.assign(fft.getSize(), 0.0f);
    analysisBufferPos = 0;
}

void NADAAudioProcessor::releaseResources()
{
}

void NADAAudioProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ignoreUnused(midiMessages);
    juce::ScopedNoDenormals noDenormals;
    
    auto totalNumInputChannels = getTotalNumInputChannels();
    auto totalNumOutputChannels = getTotalNumOutputChannels();

    // Clear unused channels
    for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i) {
        buffer.clear(i, 0, buffer.getNumSamples());
    }

    // --- 1. CAPTURE DATA FOR AI ANALYSIS ---
    auto* inL = buffer.getReadPointer(0);
    for (int i = 0; i < buffer.getNumSamples(); ++i) {
        analysisBuffer[(size_t)analysisBufferPos] = inL[i];
        analysisBufferPos = (analysisBufferPos + 1) % (int)analysisBuffer.size();
    }
    inputLevel = buffer.getRMSLevel(0, 0, buffer.getNumSamples());

    // --- 2. UPDATE PARAMETERS ---
    updateDSPChain();

    // --- 3. GET PARAMETER VALUES ---
    float userPitch = apvts.getRawParameterValue("AUTOTUNE_PITCH")->load();
    float fetThr = apvts.getRawParameterValue("FET_THRESH")->load();
    float fetRat = apvts.getRawParameterValue("FET_RATIO")->load();
    float optoRed = apvts.getRawParameterValue("OPTO_RED")->load();
    float satDrv = apvts.getRawParameterValue("SAT_DRIVE")->load();
    float rvoxComp = apvts.getRawParameterValue("RVOX_COMP")->load();
    float dsRange = apvts.getRawParameterValue("DEESSER_RANGE")->load();
    float widthValue = apvts.getRawParameterValue("STEREO_WIDTH")->load();
    float delayMix = apvts.getRawParameterValue("DELAY_MIX")->load();

    // --- 4. PITCH SHIFTING (Crispytuner) ---
    float pitchRatio = std::pow(2.0f, userPitch / 12.0f);
    float tunerAmt = apvts.getRawParameterValue("AUTOTUNE_AMOUNT")->load();
    if (tunerAmt > 0.01f) {
        pitchShifter.process(buffer, 1.0f + (pitchRatio - 1.0f) * tunerAmt);
    }

    // --- 5. BLOCK-BASED PROCESSING (EQ, REVERB, LIMITER) ---
    juce::dsp::AudioBlock<float> block(buffer);
    juce::dsp::ProcessContextReplacing<float> context(block);

    // Pro-Q 3 (Stage 2)
    for (int i = 0; i < 6; ++i) {
        eq6.bands[i].process(context);
    }

    // Pultec (Stage 3 - MOVED BEFORE HG-2)
    pultec.low.process(context);
    pultec.high.process(context);

    // SSL (Stage 4 - MOVED BEFORE HG-2)
    for (int i = 0; i < 4; ++i) {
        ssl.bands[i].process(context);
    }

    // Reverb (Stage 12)
    reverb.process(context);

    // Limiter (Stage 11)
    limiter.process(context);

    // --- 6. SAMPLE-WISE PROCESSING (DYNAMICS + SATURATION) ---
    auto* left = buffer.getWritePointer(0);
    auto* right = buffer.getWritePointer(1);
    
    for (int s = 0; s < buffer.getNumSamples(); ++s) {
        float l = left[s];
        float r = right[s];
        
        // Stage 5: 1176 Compressor
        l = fet1176.process(l, fetThr, fetRat);
        r = fet1176.process(r, fetThr, fetRat);

        // Stage 6: LA-2A Compressor
        l = optoLA2A.process(l, optoRed);
        r = optoLA2A.process(r, optoRed);

        // Stage 7: HG-2 Saturation (NOW AFTER Pultec/SSL)
        l = hg2.process(l, satDrv, 0.1f, 0.1f);
        r = hg2.process(r, satDrv, 0.1f, 0.1f);

        // Stage 8: R-Vox
        l = rvox.process(l, rvoxComp, 0.001f);
        r = rvox.process(r, rvoxComp, 0.001f);

        // Stage 9: De-esser
        l = deesser.process(l, dsRange);
        r = deesser.process(r, dsRange);

        left[s] = l;
        right[s] = r;
    }

    // --- 7. STEREO WIDTH (Stage 10) ---
    stereomaker.maker.process(buffer, widthValue, 100.0f);

    // --- 8. DELAY (Stage 13) - FIX: push BEFORE pop ---
    for (int s = 0; s < buffer.getNumSamples(); ++s) {
        // Push current sample first
        delay.lineL.pushSample(0, left[s]);
        delay.lineR.pushSample(0, right[s]);
        
        // Then pop the delayed sample
        float delL = delay.lineL.popSample(0);
        float delR = delay.lineR.popSample(0);
        
        // Mix with dry signal
        left[s] = left[s] * (1.0f - delayMix) + delL * delayMix;
        right[s] = right[s] * (1.0f - delayMix) + delR * delayMix;
    }

    // --- 9. OUTPUT MEASUREMENT ---
    outputLevel = buffer.getRMSLevel(0, 0, buffer.getNumSamples());
}

void NADAAudioProcessor::updateDSPChain()
{
    // Update Pro-Q 3 (6 Bands)
    for (int i = 0; i < 6; ++i) {
        juce::String prefix = "EQ_BAND_" + juce::String(i + 1) + "_";
        bool active = apvts.getRawParameterValue(prefix + "ACTIVE")->load() > 0.5f;
        
        if (!active) {
            *eq6.bands[i].coefficients = *juce::dsp::IIR::Coefficients<float>::makeAllPass(mSampleRate, 1000.0f);
            continue;
        }
        
        float f = apvts.getRawParameterValue(prefix + "FREQ")->load();
        float g = apvts.getRawParameterValue(prefix + "GAIN")->load();
        float q = apvts.getRawParameterValue(prefix + "Q")->load();
        int type = (int)apvts.getRawParameterValue(prefix + "TYPE")->load();
        
        if (type == 0) { // Low Cut
            *eq6.bands[i].coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighPass(mSampleRate, f, q);
        } else if (type == 1) { // Bell
            *eq6.bands[i].coefficients = *juce::dsp::IIR::Coefficients<float>::makePeakFilter(
                mSampleRate, f, q, juce::Decibels::decibelsToGain(g));
        } else { // High Cut
            *eq6.bands[i].coefficients = *juce::dsp::IIR::Coefficients<float>::makeLowPass(mSampleRate, f, q);
        }
    }

    // Update 1176
    float fAtk = apvts.getRawParameterValue("FET_ATTACK")->load();
    float fRel = apvts.getRawParameterValue("FET_RELEASE")->load();
    fet1176.updateCoefficients(fAtk, fRel);

    // Update Pultec
    float pLowBoost = apvts.getRawParameterValue("PULTEC_LOW_BOOST")->load();
    float pHighBoost = apvts.getRawParameterValue("PULTEC_HIGH_BOOST")->load();
    *pultec.low.coefficients = *juce::dsp::IIR::Coefficients<float>::makeLowShelf(
        mSampleRate, 60.0f, 0.7f, juce::Decibels::decibelsToGain(pLowBoost));
    *pultec.high.coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighShelf(
        mSampleRate, 10000.0f, 0.7f, juce::Decibels::decibelsToGain(pHighBoost));

    // Update SSL (4 Bands) - FIX: Use SSL_DRIVE parameter
    float sslDrive = apvts.getRawParameterValue("SSL_DRIVE")->load();
    float freqs[] = { 200.0f, 800.0f, 3200.0f, 12800.0f };
    for (int i = 0; i < 4; ++i) {
        float gain = 1.0f + sslDrive * 0.5f; // Convert drive to gain boost
        *ssl.bands[i].coefficients = *juce::dsp::IIR::Coefficients<float>::makePeakFilter(
            mSampleRate, freqs[i], 1.0f, gain);
    }

    // Update Limiter
    limiter.setThreshold(apvts.getRawParameterValue("LIMITER_THRESH")->load());
    limiter.setRelease(200.0f);

    // Update Reverb
    juce::dsp::Reverb::Parameters revParams;
    revParams.roomSize = apvts.getRawParameterValue("REVERB_SIZE")->load();
    revParams.wetLevel = apvts.getRawParameterValue("REVERB_MIX")->load();
    revParams.dryLevel = 1.0f - revParams.wetLevel;
    revParams.damping = 0.5f;
    revParams.width = 1.0f;
    reverb.setParameters(revParams);
}

void NADAAudioProcessor::triggerNADAAnalysis()
{
    analysisRequested.store(true);
}

void NADAAudioProcessor::runSpectralAnalysis()
{
    // Placeholder: In production, run ONNX inference here
    // Currently: Simple heuristic analysis
    
    float lowSum = 0.0f, midSum = 0.0f, highSum = 0.0f;
    
    for (size_t i = 0; i < analysisBuffer.size(); ++i) {
        float sample = analysisBuffer[i];
        lowSum += std::abs(sample) * 0.33f;
        midSum += std::abs(sample) * 0.33f;
        highSum += std::abs(sample) * 0.33f;
    }
    
    lastAnalysis.lowEnergy = lowSum / analysisBuffer.size();
    lastAnalysis.midEnergy = midSum / analysisBuffer.size();
    lastAnalysis.highEnergy = highSum / analysisBuffer.size();
}

juce::AudioProcessorValueTreeState::ParameterLayout NADAAudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    // AUTOTUNE
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "AUTOTUNE_SPEED", "Speed", 0.0f, 1.0f, 0.2f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "AUTOTUNE_PITCH", "Pitch", -12.0f, 12.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "AUTOTUNE_HUMAN", "Human", 0.0f, 1.0f, 0.5f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "AUTOTUNE_AMOUNT", "Amount", 0.0f, 1.0f, 1.0f));
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        "AUTOTUNE_KEY", "Key", juce::StringArray {
            "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
        }, 0));
    params.push_back(std::make_unique<juce::AudioParameterChoice>(
        "AUTOTUNE_SCALE", "Scale", juce::StringArray { "Maj", "Min" }, 0));

    // PRO-Q 3 (6 Bands)
    for (int i = 1; i <= 6; ++i) {
        juce::String s = "EQ_BAND_" + juce::String(i);
        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            s + "_FREQ", s + " Freq", 20.0f, 20000.0f, 1000.0f * i));
        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            s + "_GAIN", s + " Gain", -18.0f, 18.0f, 0.0f));
        params.push_back(std::make_unique<juce::AudioParameterFloat>(
            s + "_Q", s + " Q", 0.1f, 10.0f, 1.0f));
        params.push_back(std::make_unique<juce::AudioParameterBool>(
            s + "_ACTIVE", s + " Active", true));
        params.push_back(std::make_unique<juce::AudioParameterChoice>(
            s + "_TYPE", s + " Type", juce::StringArray { "Low Cut", "Bell", "High Cut" },
            (i == 1 ? 0 : (i == 6 ? 2 : 1))));
    }

    // 1176
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "FET_THRESH", "FET Threshold", -60.0f, 0.0f, -20.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "FET_RATIO", "FET Ratio", 4.0f, 20.0f, 4.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "FET_ATTACK", "FET Attack", 20.0f, 800.0f, 100.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "FET_RELEASE", "FET Release", 50.0f, 1100.0f, 100.0f));

    // LA-2A
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "OPTO_RED", "Peak Red", 0.0f, 100.0f, 30.0f));

    // Pultec
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "PULTEC_LOW_BOOST", "Low Boost", 0.0f, 12.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "PULTEC_HIGH_BOOST", "High Boost", 0.0f, 12.0f, 0.0f));

    // SSL
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "SSL_DRIVE", "SSL Drive", 0.0f, 1.0f, 0.1f));

    // HG-2
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "SAT_DRIVE", "Sat Drive", 0.0f, 1.0f, 0.1f));

    // R-Vox
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "RVOX_COMP", "Vox Comp", -30.0f, 0.0f, -10.0f));

    // De-esser
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "DEESSER_RANGE", "De-Esser Range", 0.0f, 1.0f, 0.2f));

    // Master
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "STEREO_WIDTH", "Width", 0.0f, 2.0f, 1.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "LIMITER_THRESH", "Limiter Threshold", -24.0f, 0.0f, -0.1f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "REVERB_MIX", "Reverb Mix", 0.0f, 1.0f, 0.2f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "REVERB_SIZE", "Room Size", 0.0f, 1.0f, 0.5f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "DELAY_MIX", "Delay Mix", 0.0f, 1.0f, 0.2f));

    return { params.begin(), params.end() };
}

void NADAAudioProcessor::getStateInformation(juce::MemoryBlock& destData)
{
    auto state = apvts.copyState();
    std::unique_ptr<juce::XmlElement> xml(state.createXml());
    copyXmlToBinary(*xml, destData);
}

void NADAAudioProcessor::setStateInformation(const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xmlState(getXmlFromBinary(data, sizeInBytes));
    if (xmlState != nullptr && xmlState->hasTagName(apvts.state.getType())) {
        apvts.replaceState(juce::ValueTree::fromXml(*xmlState));
    }
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new NADAAudioProcessor();
}
