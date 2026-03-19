#pragma once

#include <JuceHeader.h>

class NADAAudioProcessor  : public juce::AudioProcessor
{
public:
    NADAAudioProcessor();
    ~NADAAudioProcessor() override;

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int index) override {}
    const juce::String getProgramName (int index) override { return {}; }
    void changeProgramName (int index, const juce::String& newName) override {}

    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    // AI Analysis Trigger
    void triggerNADAAnalysis();

    // Parameters
    juce::AudioProcessorValueTreeState apvts;

private:
    // DSP Modules
    std::unique_ptr<juce::dsp::Compressor<float>> fetCompressor;
    std::unique_ptr<juce::dsp::Compressor<float>> optoCompressor;
    
    // Autotune Logic
    float currentPitch = 0.0f;
    float targetPitch = 0.0f;
    void applyAutotune (juce::AudioBuffer<float>& buffer);

    // AI Helper
    bool isAnalyzing = false;
    void performAIAnalysis(juce::AudioBuffer<float>& buffer);

    juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (NADAAudioProcessor)
};
