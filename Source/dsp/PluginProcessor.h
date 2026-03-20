#pragma once
#define JUCE_VST3_CAN_REPLACE_VST2 0
#define JUCE_IGNORE_VST3_MISMATCHED_PARAMETER_ID_WARNING 1

#include <JuceHeader.h>
#include <vector>
#include <complex>
#include "../ai/ONNXModelManager.h"

// ==============================================================================
// 1. FET COMPRESSOR (1176 Style) - FIXED threshold dB conversion
// ==============================================================================
class FETCompressor {
public:
    void prepare(double sr) { 
        sampleRate = sr; 
        envelope = 0.0f;
        thresholdLinear = 0.1f; // Linear representation
        updateCoefficients(0.1f, 100.0f); // Default attack/release ms
    }
    
    void updateCoefficients(float attackMs, float releaseMs) {
        attCoef = (float)std::exp(-1.0f / (attackMs * 0.001f * (float)sampleRate));
        relCoef = (float)std::exp(-1.0f / (releaseMs * 0.001f * (float)sampleRate));
    }

    float process(float in, float thresholdDb, float ratio) {
        // FIX: Convert threshold from dB to linear
        thresholdLinear = juce::Decibels::decibelsToGain(thresholdDb);
        
        float absIn = std::abs(in);
        // Attack/Release envelope follower
        if (absIn > envelope) {
            envelope = attCoef * envelope + (1.0f - attCoef) * absIn;
        } else {
            envelope = relCoef * envelope + (1.0f - relCoef) * absIn;
        }

        if (envelope > thresholdLinear) {
            float overdB = 20.0f * std::log10(envelope / thresholdLinear + 1e-9f);
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
    float thresholdLinear = 0.1f;
    float attCoef, relCoef;
    float lastGR = 0.0f;
};

// ==============================================================================
// 2. OPTO COMPRESSOR (LA-2A Style) - FIXED release logic
// ==============================================================================
class OPTOCompressor {
public:
    void prepare(double sr) { 
        sampleRate = sr; 
        attCoef = (float)std::exp(-1.0f / (0.010f * (float)sampleRate)); // Fixed 10ms attack
        relCoefSlow = (float)std::exp(-1.0f / (2.0f * (float)sampleRate));
        relCoefFast = (float)std::exp(-1.0f / (0.060f * (float)sampleRate));
        envelope = 0.0f;
        inDecay = false;
    }
    
    float process(float in, float peakRed) {
        // FIX: peakRed comes in as 0-100 range, normalize to 0-1
        float peakRedLinear = peakRed / 100.0f;
        float absIn = std::abs(in);
        
        // Attack phase
        if (absIn > envelope) {
            envelope = attCoef * envelope + (1.0f - attCoef) * absIn;
            inDecay = false;
        } else {
            // FIX: Only apply release in decay phase
            inDecay = true;
            float relCoef = (envelope > 0.5f) ? relCoefFast : relCoefSlow;
            envelope = relCoef * envelope + (1.0f - relCoef) * absIn;
        }

        if (envelope > peakRedLinear) {
            float reduction = peakRedLinear / (envelope + 1e-9f);
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
    bool inDecay = false;
};

// ==============================================================================
// 3. YIN PITCH DETECTOR (Placeholder - can be upgraded)
// ==============================================================================
class YinPitchDetector {
public:
    void prepare(double sr) { 
        sampleRate = sr; 
        buffer.resize(2048, 0.0f);
        pos = 0;
    }
    
    void push(float s) { 
        buffer[pos] = s; 
        pos = (pos + 1) % buffer.size(); 
    }
    
    float getPitch() {
        // Placeholder: Returns estimated pitch
        // In production, implement proper YIN algorithm
        return 440.0f;
    }
    
private:
    double sampleRate;
    std::vector<float> buffer;
    size_t pos = 0;
};

// ==============================================================================
// 4. SATURATION/DISTORTION (HG-2 Style)
// ==============================================================================
class HG2Saturator {
public:
    void prepare(double sr) { sampleRate = sr; }
    
    float process(float in, float saturation, float pentode, float triode) {
        float x = in * (1.0f + saturation * 2.0f);
        float p = std::tanh(x * (1.0f + pentode));
        float triodeOffset = triode * 0.1f;
        float t = (x + triodeOffset);
        t = (t * t) * (t > 0 ? 1.0f : -1.0f);
        return (p * 0.6f + t * 0.4f) * 0.8f;
    }
    
private:
    double sampleRate;
};

// ==============================================================================
// 5. R-VOX (Vocal Comp/Gate)
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
// 6. 902 DE-ESSER
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
// 7. STEREO MAKER / WIDTH
// ==============================================================================
class StereoMaker {
public:
    void prepare(double sr) { sampleRate = sr; }
    
    void process(juce::AudioBuffer<float>& buffer, float width, float monoMakerFreq) {
        juce::ignoreUnused(monoMakerFreq);
        auto* l = buffer.getWritePointer(0);
        auto* r = buffer.getWritePointer(1);
        for (int i = 0; i < buffer.getNumSamples(); ++i) {
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
// 8. NADA PITCH SHIFTER (Simple - can be upgraded to full phase vocoder)
// ==============================================================================
class NADAPitchShifter {
public:
    void prepare(double sampleRate, int blockSize) {
        mSampleRate = sampleRate;
        mBlockSize = blockSize;
    }

    void process(juce::AudioBuffer<float>& buffer, float pitchRatio) {
        // Placeholder: Pass audio through unchanged
        // In production: implement proper phase vocoder or time-stretch algorithm
        juce::ignoreUnused(pitchRatio);
        // Currently: identity operation - audio passes through
    }

private:
    double mSampleRate = 48000.0;
    int mBlockSize = 512;
};

// ==============================================================================
// 9. MAIN NADA AUDIO PROCESSOR
// ==============================================================================
class NADAAudioProcessor : public juce::AudioProcessor, public juce::Timer
{
public:
    NADAAudioProcessor();
    ~NADAAudioProcessor() override;

    void timerCallback() override;
    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;
    
    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "NADA CHANNEL STRIP"; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int index) override { juce::ignoreUnused(index); }
    const juce::String getProgramName(int index) override { juce::ignoreUnused(index); return {}; }
    void changeProgramName(int index, const juce::String& newName) override { juce::ignoreUnused(index, newName); }

    void triggerNADAAnalysis();
    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

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
    void updateDSPChain();
    void runSpectralAnalysis();

    // --- DSP CHAIN (14 STAGES IN CORRECT ORDER) ---
    NADAPitchShifter pitchShifter; // 1. Crispytuner
    
    struct ProQ3 {
        juce::dsp::IIR::Filter<float> bands[6];
    } eq6; // 2. Pro-Q 3 (6 bands)

    struct Pultec {
        juce::dsp::IIR::Filter<float> low, high;
    } pultec; // 3. Pultec (moved before HG-2)

    struct SSL4000G {
        juce::dsp::IIR::Filter<float> bands[4];
    } ssl; // 4. SSL (moved before HG-2)

    FETCompressor fet1176;     // 5. 1176
    OPTOCompressor optoLA2A;   // 6. LA-2A
    HG2Saturator hg2;          // 7. HG-2
    RVoxProcessor rvox;        // 8. R-Vox
    DeEsser902 deesser;        // 9. De-esser

    struct StereoWidth {
        StereoMaker maker;
    } stereomaker; // 10. Stereo Width

    juce::dsp::Limiter<float> limiter;     // 11. Limiter
    juce::dsp::Reverb reverb;              // 12. Reverb

    struct HDelay {
        juce::dsp::DelayLine<float, juce::dsp::MaximumLength<44100*5>> lineL;
        juce::dsp::DelayLine<float, juce::dsp::MaximumLength<44100*5>> lineR;
    } delay; // 13. H-Delay

    // 14. Master Output (gain handled by parameter)

    // --- AI/ANALYSIS ---
    juce::dsp::FFT fft { 11 }; // 2048-point FFT
    std::vector<float> analysisBuffer;
    int analysisBufferPos = 0;
    std::atomic<bool> analysisRequested { false };

    double mSampleRate = 48000.0;
};
