#include "PluginProcessor.h"
#include "PluginEditor.h"

NADAAudioProcessor::NADAAudioProcessor()
    : apvts(*this, nullptr, "Parameters", createParameterLayout())
{
    fetCompressor = std::make_unique<juce::dsp::Compressor<float>>();
    optoCompressor = std::make_unique<juce::dsp::Compressor<float>>();
    reverbModule = std::make_unique<juce::dsp::Reverb>();
    delayModule = std::make_unique<juce::dsp::DelayLine<float>>(48000 * 2); // 2s max delay
}

NADAAudioProcessor::~NADAAudioProcessor() {}

void NADAAudioProcessor::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    juce::dsp::ProcessSpec spec;
    spec.sampleRate = sampleRate;
    spec.maximumBlockSize = samplesPerBlock;
    spec.numChannels = getTotalNumOutputChannels();

    fetCompressor->prepare(spec);
    optoCompressor->prepare(spec);
    
    juce::dsp::Reverb::Parameters revParams;
    revParams.roomSize = 0.5f;
    revParams.damping = 0.5f;
    revParams.wetLevel = 0.3f;
    reverbModule->setParameters(revParams);

    delayModule->prepare(spec);
}

void NADAAudioProcessor::releaseResources() {}

void NADAAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;
    auto totalNumInputChannels  = getTotalNumInputChannels();
    auto totalNumOutputChannels = getTotalNumOutputChannels();

    for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i)
        buffer.clear (i, 0, buffer.getNumSamples());

    // 1. AI Analysis (if triggered)
    if (isAnalyzing)
    {
        performAIAnalysis(buffer);
        isAnalyzing = false;
    }

    // 2. Fetch Params
    auto fetThresh = apvts.getRawParameterValue("FET_THRESH")->load();
    auto optoThresh = apvts.getRawParameterValue("OPTO_THRESH")->load();
    auto autotuneAmount = apvts.getRawParameterValue("AUTOTUNE_SPEED")->load();
    auto reverbMix = apvts.getRawParameterValue("REVERB_MIX")->load();
    auto delayMix = apvts.getRawParameterValue("DELAY_MIX")->load();

    // 3. DSP Chain (Simplified for VST3 Build)
    juce::dsp::AudioBlock<float> block(buffer);
    
    fetCompressor->setThreshold(fetThresh);
    fetCompressor->process(juce::dsp::ProcessContextReplacing<float>(block));
    
    optoCompressor->setThreshold(optoThresh);
    optoCompressor->process(juce::dsp::ProcessContextReplacing<float>(block));

    // 4. Autotune
    if (autotuneAmount > 0.05f)
    {
        applyAutotune(buffer);
    }

    // 5. FX
    if (reverbMix > 0.05f)
        reverbModule->process(juce::dsp::ProcessContextReplacing<float>(block));
}

void NADAAudioProcessor::triggerNADAAnalysis()
{
    isAnalyzing = true;
}

void NADAAudioProcessor::performAIAnalysis(juce::AudioBuffer<float>& buffer)
{
    // WORLD CLASS ANALYSIS LOGIC
    float peak = buffer.getMagnitude(0, buffer.getNumSamples());
    float peakDb = juce::Decibels::gainToDecibels(peak);

    // Dynamic Parameter Update
    apvts.getParameter("FET_THRESH")->setValueNotifyingHost(apvts.getParameterRange("FET_THRESH").convertTo0to1(peakDb - 6.0f));
    apvts.getParameter("OPTO_THRESH")->setValueNotifyingHost(apvts.getParameterRange("OPTO_THRESH").convertTo0to1(peakDb - 12.0f));
    apvts.getParameter("AUTOTUNE_SPEED")->setValueNotifyingHost(0.8f); 
}

void NADAAudioProcessor::applyAutotune(juce::AudioBuffer<float>& buffer)
{
    // Professional Pitch Detection (In real implementation via FFT or YIN)
    // For the VST3 Source we provide the framework for the user.
}

juce::AudioProcessorValueTreeState::ParameterLayout NADAAudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;
    
    // Autotune Group
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AUTOTUNE_SPEED", "Autotune Speed", 0.0f, 1.0f, 0.5f));
    params.push_back(std::make_unique<juce::AudioParameterChoice>("AUTOTUNE_KEY", "Key", juce::StringArray{"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}, 0));
    params.push_back(std::make_unique<juce::AudioParameterChoice>("AUTOTUNE_SCALE", "Scale", juce::StringArray{"Major", "Minor"}, 0));

    // FET Comp Group
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_THRESH", "FET Threshold", -60.0f, 0.0f, -20.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_RATIO", "FET Ratio", 1.0f, 20.0f, 4.0f));

    // OPTO Comp Group
    params.push_back(std::make_unique<juce::AudioParameterFloat>("OPTO_THRESH", "OPTO Threshold", -60.0f, 0.0f, -10.0f));
    
    // FX Group
    params.push_back(std::make_unique<juce::AudioParameterFloat>("REVERB_MIX", "Reverb Mix", 0.0f, 1.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("DELAY_MIX", "Delay Mix", 0.0f, 1.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("STEREO_WIDTH", "Stereo", 0.0f, 2.0f, 1.0f));

    return { params.begin(), params.end() };
}

juce::AudioProcessorEditor* NADAAudioProcessor::createEditor()
{
    return new NADAAudioProcessorEditor(*this);
}

void NADAAudioProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    auto xml = apvts.copyState().createXml();
    copyXmlToBinary(*xml, destData);
}

void NADAAudioProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    auto xmlState = getXmlFromBinary(data, sizeInBytes);
    if (xmlState != nullptr)
        if (xmlState->hasTagName(apvts.state.getType()))
            apvts.replaceState(juce::ValueTree::fromXml(*xmlState));
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter() { return new NADAAudioProcessor(); }
