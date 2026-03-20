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

// ==============================================================================
// 5. SATURATION/DISTORTION (HG-2 Style)
// ==============================================================================
class HG2Saturator {
public:
    void prepare(double sr) { sampleRate = sr; }
    float process(float in, float saturation, float pentode, float triode) {
        float x = in * (1.0f + saturation * 2.0f);
        // Pentode (Odd harmonics - tanh)
        float p = std::tanh(x * (1.0f + pentode));
        // Triode (Even harmonics - offset squared)
        float t = std::pow(std::abs(x + triode * 0.1f), 1.2f) * (x > -triode * 0.1f ? 1.0f : -1.0f);
        return (p * 0.6f + t * 0.4f) * 0.8f;
    }
private:
    double sampleRate;
};

// ==============================================================================
// 6. R-VOX (Vocal Comp/Gate)
// ==============================================================================
class RVoxProcessor {
public:
    void prepare(double sr) { sampleRate = sr; comp.prepare({ sr, 512, 1 }); }
    float process(float in, float thresh, float gate) {
        if (std::abs(in) < gate) return 0.0f;
        comp.setThreshold(thresh);
        comp.setRatio(4.0f);
        comp.setAttack(5.0f);
        comp.setRelease(100.0f);
        return comp.processSample(0, in);
    }
private:
    double sampleRate;
    juce::dsp::Compressor<float> comp;
};

// ==============================================================================
// 7. 902 DE-ESSER
// ==============================================================================
class DeEsser902 {
public:
    void prepare(double sr) { 
        sampleRate = sr; 
        filter.prepare({ sr, 512, 1 });
        *filter.coefficients = *juce::dsp::IIR::Coefficients<float>::makeBandPass(sr, 6000.0f, 1.0f);
    }
    float process(float in, float range, float freq) {
        float sibilance = filter.processSample(0, in);
        float env = std::abs(sibilance);
        float reduction = 1.0f;
        if (env > 0.1f) reduction = 1.0f - (range * (env - 0.1f));
        return in * std::max(0.2f, reduction);
    }
private:
    double sampleRate;
    juce::dsp::IIR::Filter<float> filter;
};

// ==============================================================================
// 8. STEREO MAKER / WIDTH
// ==============================================================================
class StereoMaker {
public:
    void prepare(double sr) { sampleRate = sr; }
    void process(juce::AudioBuffer<float>& buffer, float width, float monoMakerFreq) {
        auto* l = buffer.getWritePointer(0);
        auto* r = buffer.getWritePointer(1);
        for (int i=0; i<buffer.getNumSamples(); ++i) {
            float mid = (l[i] + r[i]) * 0.5f;
            float side = (l[i] - r[i]) * 0.5f;
            side *= width;
            l[i] = mid + side;
            r[i] = mid - side;
        }
    }
private:
    double sampleRate;
};

// ==============================================================================
// 9. MAIN PROCESSOR
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

    const juce::String getName() const override { return "NADA CHANNEL STRIP"; }
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

    // --- 14-STEP AUTHENTIC DSP CHAIN ---
    NADAPitchShifter pitchShifter; // 1. Crispytuner
    
    struct ProQ3 {
        juce::dsp::IIR::Filter<float> bands[6]; // 2. Pro-Q 3 (6 bands)
    } eq6;

    FETCompressor fet1176;     // 3. 1176
    OPTOCompressor optoLA2A;   // 4. LA-2A
    
    struct Pultec {
        juce::dsp::IIR::Filter<float> low, high; // 5. Pultec
    } pultec;

    struct SSL4000G {
        juce::dsp::IIR::Filter<float> bands[4]; // 6. SSL
    } ssl;

    HG2Saturator hg2;          // 7. HG-2
    RVoxProcessor rvox;        // 8. R-Vox
    DeEsser902 deesser;        // 9. 902
    StereoMaker stereomaker;   // 10. StereoMaker
    
    juce::dsp::Limiter<float> limiter; // 11. True Peak Limiter
    juce::dsp::Reverb reverb;          // 12. Hitsville Reverb
    
    struct HDelay {
        float mix = 0.2f;
        juce::dsp::DelayLine<float> lineL, lineR; // 13. H-Delay
    } delay;

    // 14. PAZ Analyzer (Analysis only)

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
