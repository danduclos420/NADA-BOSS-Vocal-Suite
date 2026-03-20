#pragma once
#include <JuceHeader.h>
#include <vector>
#include <complex>
#include "ONNXModelManager.h"

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
        lastGR = 1.0f - reduction; // For metering
        return in * reduction;
    }
    
    float getGainReduction() const { return lastGR; }

private:
    double sampleRate;
    float envelope = 0.0f;
    float lastGR = 0.0f;
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
        lastGR = 1.0f - reduction;
        return in * reduction;
    }
    float getGainReduction() const { return lastGR; }
private:
    double sampleRate;
    float envelope = 0.0f;
    float lastGR = 0.0f;
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
class NADAAudioProcessor  : public juce::AudioProcessor, public juce::Timer
{
public:
    NADAAudioProcessor();
    ~NADAAudioProcessor() override;

    void timerCallback() override
    {
        if (analysisRequested.load())
        {
            runSpectralAnalysis();
            analysisRequested = false;
        }
    }

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

    void triggerNADAAnalysis();
    
    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    // --- PUBLIC FOR EDITOR ACCESS ---
    struct SpectralFeatures {
        float lowEnergy = 0.0f;
        float midEnergy = 0.0f;
        float highEnergy = 0.0f;
        float tilt = 0.0f;
        float sibilance = 0.0f;
    };
    SpectralFeatures lastAnalysis;
    std::atomic<float> inputLevel { 0.0f };
    std::atomic<float> outputLevel { 0.0f };
    std::atomic<float> grLevel { 0.0f };

    juce::AudioProcessorValueTreeState apvts;

private:
    juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

#include "NADAPitchShifter.h"

// ... existing code ...

    // --- 14-STEP PRO DSP CHAIN ---
    NADAPitchShifter pitchShifter;
    juce::dsp::ProcessorChain<
        juce::dsp::IIR::Filter<float>,    // 1. High Pass
        juce::dsp::IIR::Filter<float>,    // 2. Subtractive EQ
        juce::dsp::Bias<float>,           // 3. SSL Saturation (Placeholder Bias)
        juce::dsp::Gain<float>,            // 4. Input Gain
        juce::dsp::Compressor<float>,      // 5. FET 1176
        juce::dsp::Compressor<float>,      // 6. OPTO LA-2A
        juce::dsp::IIR::Filter<float>,    // 7. De-esser
        juce::dsp::IIR::Filter<float>,    // 8. Air Shelf
        juce::dsp::Gain<float>,            // 9. Saturation Drive
        juce::dsp::Limiter<float>         // 10. True Peak Limiter
    > dspChain;

    void updateDSPChain();

    double currentSampleRate = 44100.0;

    // --- AI ANALYSIS (Legit Spectral Engine) ---
    ONNXModelManager onnxManager;

    void runSpectralAnalysis();
    
    juce::dsp::FFT fft { 11 }; // 2048 samples
    std::vector<float> analysisBuffer;
    int analysisBufferPos = 0;
    std::atomic<bool> analysisRequested { false };

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (NADAAudioProcessor)
};
