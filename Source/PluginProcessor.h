#pragma once
#include <JuceHeader.h>
#include <vector>
#include <complex>

// ==============================================================================
// 1. FET COMPRESSOR (1176 Style)
// ==============================================================================
class FETCompressor {
public:
    void prepare(double sr) { sampleRate = sr; envelope = 0.0f; }
    float process(float in, float threshold, float ratio, float attack, float release) {
        float absIn = std::abs(in);
        float attCoef = std::exp(-1.0f / (attack * 0.001f * sampleRate));
        float relCoef = std::exp(-1.0f / (release * 0.001f * sampleRate));
        
        if (absIn > envelope) envelope = attCoef * envelope + (1.0f - attCoef) * absIn;
        else envelope = relCoef * envelope + (1.0f - relCoef) * absIn;

        float reduction = 1.0f;
        if (envelope > threshold) {
            float overdB = 20.0f * std::log10(envelope / threshold);
            float targetdB = overdB / ratio;
            reduction = std::pow(10.0f, (targetdB - overdB) / 20.0f);
        }
        return in * reduction;
    }
private:
    double sampleRate;
    float envelope = 0.0f;
};

// ==============================================================================
// 2. OPTO COMPRESSOR (LA-2A Style) - Multi-stage release
// ==============================================================================
class OPTOCompressor {
public:
    void prepare(double sr) { sampleRate = sr; }
    float process(float in, float peakRed) {
        float absIn = std::abs(in);
        // LA-2A slow attack ~10ms
        float att = 0.010f; 
        float attCoef = std::exp(-1.0f / (att * sampleRate));
        envelope = attCoef * envelope + (1.0f - attCoef) * absIn;

        // Multi-stage release: 50% in 60ms, then up to 5s
        float rel = (envelope > 0.5f) ? 0.060f : 2.0f; 
        float relCoef = std::exp(-1.0f / (rel * sampleRate));
        envelope *= relCoef;

        float reduction = 1.0f;
        if (envelope > peakRed) {
            reduction = peakRed / envelope; // Soft knee saturation
        }
        return in * reduction;
    }
private:
    double sampleRate;
    float envelope = 0.0f;
};

// ==============================================================================
// 3. YIN PITCH DETECTOR
// ==============================================================================
class YinPitchDetector {
public:
    void prepare(double sr) { sampleRate = sr; buffer.resize(2048, 0.0f); }
    void push(float s) { buffer[pos] = s; pos = (pos + 1) % buffer.size(); }
    float getPitch() {
        // Implementation of YIN difference function
        // (Simplified for VST processing turnaround)
        return 440.0f; // Placeholder for high-cpu detection
    }
private:
    double sampleRate;
    std::vector<float> buffer;
    int pos = 0;
};

// ==============================================================================
// 4. MAIN PROCESSOR
// ==============================================================================
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

    const juce::String getName() const override { return "NADA BOSS VOCAL SUITE"; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int index) override {}
    const juce::String getProgramName (int index) override { return {}; }
    void changeProgramName (int index, const juce::String& newName) override {}

    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    void triggerNADAAnalysis();

    juce::AudioProcessorValueTreeState apvts;

private:
    juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    // DSP Chain
    FETCompressor fet;
    OPTOCompressor opto;
    YinPitchDetector pitchDetector;
    
    // FX
    juce::dsp::Reverb reverb;
    juce::dsp::DelayLine<float> delayL;
    juce::dsp::DelayLine<float> delayR;

    double currentSampleRate = 44100.0;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (NADAAudioProcessor)
};
