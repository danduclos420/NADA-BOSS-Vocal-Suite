#pragma once
#define JUCE_VST3_CAN_REPLACE_VST2 0
#define JUCE_IGNORE_VST3_MISMATCHED_PARAMETER_ID_WARNING 1

#include <JuceHeader.h>
#include <vector>
#include <complex>
#include "../ai/ONNXModelManager.h"

// ==============================================================================
// 1. FET COMPRESSOR (1176 Style)
// ==============================================================================
// ==============================================================================
// 1. FET COMPRESSOR (1176 Style) - Optimized
// ==============================================================================
class FETCompressor {
public:
    void prepare(double sr) { 
        sampleRate = sr; 
        envelope = 0.0f;
        updateCoefficients(0.1f, 100.0f); // Defaults
    }
    
    void updateCoefficients(float attackMs, float releaseMs) {
        attCoef = (float)std::exp(-1.0f / (attackMs * 0.001f * (float)sampleRate));
        relCoef = (float)std::exp(-1.0f / (releaseMs * 0.001f * (float)sampleRate));
    }

    float process(float in, float threshold, float ratio) {
        float absIn = std::abs(in);
        if (absIn > envelope) envelope = attCoef * envelope + (1.0f - attCoef) * absIn;
        else envelope = relCoef * envelope + (1.0f - relCoef) * absIn;

        if (envelope > threshold) {
            float overdB = 20.0f * std::log10(envelope / threshold);
            float targetdB = overdB / ratio;
            float reduction = std::pow(10.0f, (targetdB - overdB) / 20.0f);
            lastGR = 1.0f - reduction;
            return in * reduction;
        }
        lastGR = 0.0f;
        return in;
    }
    
    float getGainReduction() const { return lastGR; }

private:
    double sampleRate;
    float envelope = 0.0f;
    float attCoef, relCoef;
    float lastGR = 0.0f;
};

// ==============================================================================
// 2. OPTO COMPRESSOR (LA-2A Style) - Multi-stage release
// ==============================================================================
// ==============================================================================
// 2. OPTO COMPRESSOR (LA-2A Style) - Optimized
// ==============================================================================
class OPTOCompressor {
public:
    void prepare(double sr) { 
        sampleRate = sr; 
        attCoef = (float)std::exp(-1.0f / (0.010f * (float)sampleRate)); // Fixed 10ms attack
        relCoefSlow = (float)std::exp(-1.0f / (2.0f * (float)sampleRate));
        relCoefFast = (float)std::exp(-1.0f / (0.060f * (float)sampleRate));
    }
    float process(float in, float peakRed) {
        float absIn = std::abs(in);
        envelope = attCoef * envelope + (1.0f - attCoef) * absIn;
        
        float relCoef = (envelope > 0.5f) ? relCoefFast : relCoefSlow;
        envelope *= relCoef;

        if (envelope > peakRed) {
            float reduction = peakRed / envelope;
            lastGR = 1.0f - reduction;
            return in * reduction;
        }
        lastGR = 0.0f;
        return in;
    }
    float getGainReduction() const { return lastGR; }
private:
    double sampleRate;
    float envelope = 0.0f;
    float attCoef, relCoefSlow, relCoefFast;
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
// --- CLASS DECLARATIONS MOVED BELOW HELPER CLASSES ---

// ==============================================================================
// 5. SATURATION/DISTORTION (HG-2 Style)
// ==============================================================================
// ==============================================================================
// 5. SATURATION/DISTORTION (HG-2 Style) - Optimized
// ==============================================================================
class HG2Saturator {
public:
    void prepare(double sr) { sampleRate = sr; }
    float process(float in, float saturation, float pentode, float triode) {
        float x = in * (1.0f + saturation * 1.5f);
        
        // Pentode (Odd harmonics - smooth compression)
        float p = std::tanh(x * (1.0f + pentode));
        
        // Triode (Even harmonics - asymmetric tanh)
        float triodeDrive = x * (1.0f + triode);
        float t = std::tanh(triodeDrive + 0.2f) - std::tanh(0.2f); // Asymmetric bias
        
        return (p * 0.7f + t * 0.3f) * 0.9f;
    }
private:
    double sampleRate;
};

// ==============================================================================
// 6. R-VOX (Vocal Comp/Gate) - Optimized
// ==============================================================================
class RVoxProcessor {
public:
    void prepare(double sr) { 
        sampleRate = sr; 
        comp.prepare({ sr, 512, 1 }); 
        comp.setRatio(4.0f);
        comp.setAttack(5.0f);
        comp.setRelease(100.0f);
    }
    float process(float in, float thresh, float gate) {
        if (std::abs(in) < gate) return 0.0f;
        comp.setThreshold(thresh);
        return comp.processSample(0, in);
    }
private:
    double sampleRate;
    juce::dsp::Compressor<float> comp;
};

// ==============================================================================
// 7. 902 DE-ESSER - Optimized
// ==============================================================================
class DeEsser902 {
public:
    void prepare(double sr) { 
        sampleRate = sr; 
        filter.prepare({ sr, 512, 1 });
        *filter.coefficients = *juce::dsp::IIR::Coefficients<float>::makeBandPass(sr, 6000.0f, 1.0f);
    }
    float process(float in, float range) {
        float sibilance = filter.processSample(in);
        float reduction = 1.0f - (range * std::abs(sibilance));
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
        juce::ignoreUnused(monoMakerFreq); // Added
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
    void setCurrentProgram (int index) override { juce::ignoreUnused(index); }
    const juce::String getProgramName (int index) override { juce::ignoreUnused(index); return {}; }
    void changeProgramName (int index, const juce::String& newName) override { juce::ignoreUnused(index, newName); }

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

    double mSampleRate = 44100.0;

    // --- AI ANALYSIS (Legit Spectral Engine) ---
    ONNXModelManager onnxManager;

    void runSpectralAnalysis();
    
    juce::dsp::FFT fft { 11 }; // 2048 samples
    std::vector<float> analysisBuffer;
    int analysisBufferPos = 0;
    std::atomic<bool> analysisRequested { false };

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (NADAAudioProcessor)
};
