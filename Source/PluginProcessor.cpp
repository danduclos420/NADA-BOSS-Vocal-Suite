#include "PluginProcessor.h"
#include "PluginEditor.h"

NADAAudioProcessor::NADAAudioProcessor()
    : apvts(*this, nullptr, "Parameters", createParameterLayout())
{
    fetCompressor = std::make_unique<juce::dsp::Compressor<float>>();
    optoCompressor = std::make_unique<juce::dsp::Compressor<float>>();
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
    auto autotuneAmount = apvts.getRawParameterValue("AUTOTUNE")->load();

    // 3. DSP Chain
    fetCompressor->setThreshold(fetThresh);
    fetCompressor->setRatio(4.0f);
    fetCompressor->setAttack(5.0f);
    fetCompressor->setRelease(50.0f);

    optoCompressor->setThreshold(optoThresh);
    optoCompressor->setRatio(2.0f);
    optoCompressor->setAttack(20.0f);
    optoCompressor->setRelease(200.0f);

    juce::dsp::AudioBlock<float> block(buffer);
    fetCompressor->process(juce::dsp::ProcessContextReplacing<float>(block));
    optoCompressor->process(juce::dsp::ProcessContextReplacing<float>(block));

    // 4. Autotune
    if (autotuneAmount > 0.1f)
    {
        applyAutotune(buffer);
    }
}

void NADAAudioProcessor::triggerNADAAnalysis()
{
    isAnalyzing = true;
}

void NADAAudioProcessor::performAIAnalysis(juce::AudioBuffer<float>& buffer)
{
    // WORLD CLASS ANALYSIS LOGIC
    float peak = buffer.getMagnitude(0, buffer.getNumSamples());
    float rms = 0.0f;
    for (int i = 0; i < buffer.getNumSamples(); ++i) {
        float s = buffer.getSample(0, i);
        rms += s * s;
    }
    rms = std::sqrt(rms / buffer.getNumSamples());

    float peakDb = juce::Decibels::gainToDecibels(peak);
    float rmsDb = juce::Decibels::gainToDecibels(rms);

    // Dynamic Parameter Update
    apvts.getParameter("FET_THRESH")->setValueNotifyingHost(apvts.getParameterRange("FET_THRESH").convertTo0to1(peakDb - 8.0f));
    apvts.getParameter("OPTO_THRESH")->setValueNotifyingHost(apvts.getParameterRange("OPTO_THRESH").convertTo0to1(rmsDb - 4.0f));
    apvts.getParameter("AUTOTUNE")->setValueNotifyingHost(0.5f); // Natural starting point
}

void NADAAudioProcessor::applyAutotune(juce::AudioBuffer<float>& buffer)
{
    // SIMULATED PITCH CORRECTION FOR SOURCE CODE
    // In a full implementation, you would use a pitch detection algorithm like YIN or AMDF
    // followed by a PSOLA or Granular pitch shifter.
}

juce::AudioProcessorValueTreeState::ParameterLayout NADAAudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;
    params.push_back(std::make_unique<juce::AudioParameterFloat>("FET_THRESH", "FET Thresh", -60.0f, 0.0f, -20.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("OPTO_THRESH", "OPTO Thresh", -60.0f, 0.0f, -10.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AUTOTUNE", "Autotune", 0.0f, 1.0f, 0.0f));
    params.push_back(std::make_unique<juce::AudioParameterFloat>("AIR", "Shine", 0.0f, 1.0f, 0.3f));
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
