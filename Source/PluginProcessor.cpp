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

    juce::dsp::ProcessSpec spec { sampleRate, (juce::uint32)samplesPerBlock, 2 };
    reverb.prepare(spec);
    delay.prepare(spec);
    
    // Default Delay (1/8 ping pong)
    delay.setDelayTime(0, 500.0f); // ms, will be updated by BPM
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
    float delayMs = (60000.0f / bpm) / 2.0f;
    delay.setDelayTime(0, delayMs);
    delay.setDelayTime(1, delayMs); // Ping pong cross-feedback logic handled in internal delay usually

    // --- PARAMETERS ---
    float autotuneAmount = *apvts.getRawParameterValue("AUTOTUNE_SPEED");
    float fetThresh = juce::Decibels::decibelsToGain((float)*apvts.getRawParameterValue("FET_THRESH"));
    float fetRatio = *apvts.getRawParameterValue("FET_RATIO");
    float optoPeak = juce::Decibels::decibelsToGain((float)*apvts.getRawParameterValue("OPTO_THRESH"));
    float reverbMix = *apvts.getRawParameterValue("REVERB_MIX");
    float delayMix = *apvts.getRawParameterValue("DELAY_MIX");

    // --- DSP LOOP ---
    for (int channel = 0; channel < totalNumInputChannels; ++channel)
    {
        auto* channelData = buffer.getWritePointer (channel);

        for (int sample = 0; sample < buffer.getNumSamples(); ++sample)
        {
            float s = channelData[sample];

            // 1. AUTOTUNE (STUB)
            pitchDetector.push(s);
            // In a real PSOLA, we would resample 's' here based on pitchDetector.getPitch()
            
            // 2. FET COMP
            s = fet.process(s, fetThresh, fetRatio, 0.5f, 50.0f);

            // 3. OPTO COMP
            s = opto.process(s, optoPeak);

            channelData[sample] = s;
        }
    }

    // --- GLOBAL FX ---
    juce::dsp::AudioBlock<float> block(buffer);
    juce::dsp::ProcessContextReplacing<float> context(block);
    
    // Reverb & Delay
    reverb.process(context);
    delay.process(context);
}

void NADAAudioProcessor::triggerNADAAnalysis()
{
    // Intelligent AI Setup (Stub for ONNX integration)
    apvts.getParameter("FET_THRESH")->setValueNotifyingHost(0.5f);
    apvts.getParameter("OPTO_THRESH")->setValueNotifyingHost(0.7f);
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
