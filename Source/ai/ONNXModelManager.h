#pragma once

#include <JuceHeader.h>
#include <onnxruntime_c_api.h>
#include <onnxruntime_cxx_api.h>
#include <vector>
#include <memory>
#include <array>
#include <cmath>

#pragma comment(lib, "onnxruntime.lib")

// ==============================================================================
// AI SPECTRAL ANALYZER - Analyzes vocal characteristics in real-time
// ==============================================================================
class AISpectralAnalyzer
{
public:
    struct VocalProfile {
        float lowFreqEnergy = 0.0f;      // 50-200 Hz (mud/rumble)
        float lowMidEnergy = 0.0f;       // 200-500 Hz (boxiness)
        float midEnergy = 0.0f;          // 500-2k Hz (presence)
        float presenceEnergy = 0.0f;     // 2k-5k Hz (clarity/bite)
        float sibilanceEnergy = 0.0f;    // 5k-10k Hz (sibilance)
        float brillianceEnergy = 0.0f;   // 10k-20k Hz (air)
        float dynamicRange = 0.0f;       // Peak-to-avg ratio
        float thd = 0.0f;                // Total harmonic distortion estimate
    };

    AISpectralAnalyzer() : fftSize(2048), fft(11) {
        window.resize(fftSize);
        magnitudes.resize(fftSize / 2);
        
        // Hann window
        for (int i = 0; i < fftSize; ++i) {
            window[i] = 0.5f * (1.0f - std::cos(2.0f * 3.14159265f * i / (fftSize - 1)));
        }
    }

    VocalProfile analyzeBuffer(const std::vector<float>& audioBuffer) {
        VocalProfile profile;
        
        if (audioBuffer.size() < (size_t)fftSize) {
            return profile;
        }

        // FFT-based analysis
        std::vector<float> fftBuffer(fftSize);
        for (int i = 0; i < fftSize; ++i) {
            fftBuffer[i] = audioBuffer[i] * window[i];
        }

        // Apply FFT (using JUCE's FFT)
        fft.performFrequencyOnlyForwardTransform(fftBuffer.data());

        // Convert to magnitudes
        for (int i = 0; i < fftSize / 2; ++i) {
            float re = fftBuffer[2 * i];
            float im = fftBuffer[2 * i + 1];
            magnitudes[i] = std::sqrt(re * re + im * im + 1e-9f);
        }

        // Band energy calculation
        float sampleRate = 48000.0f; // Assume 48kHz - will be passed in real implementation
        
        profile.lowFreqEnergy = getBandEnergy(50.0f, 200.0f, sampleRate);
        profile.lowMidEnergy = getBandEnergy(200.0f, 500.0f, sampleRate);
        profile.midEnergy = getBandEnergy(500.0f, 2000.0f, sampleRate);
        profile.presenceEnergy = getBandEnergy(2000.0f, 5000.0f, sampleRate);
        profile.sibilanceEnergy = getBandEnergy(5000.0f, 10000.0f, sampleRate);
        profile.brillianceEnergy = getBandEnergy(10000.0f, 20000.0f, sampleRate);

        // Dynamic range (RMS-based)
        float maxSample = 0.0f;
        float sumSquares = 0.0f;
        for (float s : audioBuffer) {
            maxSample = std::max(maxSample, std::abs(s));
            sumSquares += s * s;
        }
        float rms = std::sqrt(sumSquares / audioBuffer.size());
        profile.dynamicRange = (rms > 1e-6f) ? 20.0f * std::log10(maxSample / rms) : 0.0f;

        return profile;
    }

private:
    float getBandEnergy(float freqLow, float freqHigh, float sampleRate) {
        int binLow = (int)(freqLow * fftSize / sampleRate);
        int binHigh = (int)(freqHigh * fftSize / sampleRate);
        
        binLow = std::max(0, std::min(binLow, fftSize / 2 - 1));
        binHigh = std::max(0, std::min(binHigh, fftSize / 2 - 1));

        float energy = 0.0f;
        for (int i = binLow; i <= binHigh; ++i) {
            energy += magnitudes[i];
        }
        
        return energy / (binHigh - binLow + 1);
    }

    int fftSize;
    juce::dsp::FFT fft;
    std::vector<float> window;
    std::vector<float> magnitudes;
};

// ==============================================================================
// AI MIXER - Applies professional mixing decisions based on spectral analysis
// ==============================================================================
class AIMixer
{
public:
    struct MixingParameters {
        // Pro-Q 3 (6 Bands)
        struct EQBand {
            float frequency = 1000.0f;
            float gain = 0.0f;       // dB
            float q = 1.0f;
        };
        std::array<EQBand, 6> eqBands;

        // Compression
        float fet1176Threshold = -20.0f;  // dB
        float fet1176Ratio = 4.0f;
        float optoLA2AReduction = 30.0f;  // 0-100

        // Saturation
        float hg2Saturation = 0.0f;

        // De-esser
        float deesserRange = 0.0f;        // 0-1

        // Limiter
        float limiterThreshold = -0.1f;   // dB

        // Reverb/Effects
        float reverbMix = 0.15f;
        float delayMix = 0.1f;
    };

    MixingParameters generateMixingParameters(const AISpectralAnalyzer::VocalProfile& profile) {
        MixingParameters params;

        // STEP 1: Rumble and mud removal (Pro-Q 3 - Low Cut)
        if (profile.lowFreqEnergy > 0.4f) {
            params.eqBands[0].frequency = 80.0f;
            params.eqBands[0].gain = -6.0f;
        }

        // STEP 2: De-boxiness (Reduce 200-500Hz if too loud)
        if (profile.lowMidEnergy > 0.5f) {
            params.eqBands[1].frequency = 300.0f;
            params.eqBands[1].gain = -3.0f;
            params.eqBands[1].q = 1.5f;
        }

        // STEP 3: Presence peak enhancement (2k-5k for clarity)
        params.eqBands[2].frequency = 3000.0f;
        params.eqBands[2].gain = 2.0f + (profile.presenceEnergy < 0.3f ? 2.0f : 0.0f);
        params.eqBands[2].q = 2.0f;

        // STEP 4: De-esser (if sibilance too high)
        if (profile.sibilanceEnergy > 0.6f) {
            params.deesserRange = 0.5f;
        }

        // STEP 5: Air/Brilliance boost (10k+)
        if (profile.brillianceEnergy < 0.3f) {
            params.eqBands[5].frequency = 12000.0f;
            params.eqBands[5].gain = 3.0f;
        }

        // STEP 6: Serial compression (1176 -> LA-2A)
        // 1176: Aggressive on transients
        params.fet1176Threshold = -20.0f - (profile.dynamicRange > 12.0f ? 5.0f : 0.0f);
        params.fet1176Ratio = profile.dynamicRange > 15.0f ? 8.0f : 4.0f;

        // LA-2A: Smooth glue
        params.optoLA2AReduction = 25.0f + (profile.dynamicRange > 10.0f ? 10.0f : 0.0f);

        // STEP 7: Saturation (add color if too thin)
        if (profile.presenceEnergy > 0.7f && profile.brillianceEnergy < 0.4f) {
            params.hg2Saturation = 0.15f;
        }

        // STEP 8: Limiting (safety gate to -10 LUFS target)
        params.limiterThreshold = -1.0f;

        // STEP 9: Reverb (small room for clarity)
        params.reverbMix = 0.1f;

        // STEP 10: Delay (for width)
        params.delayMix = 0.08f;

        return params;
    }
};

// ==============================================================================
// ONNX MODEL MANAGER - Real-time AI inference (placeholder for future ML model)
// ==============================================================================
class ONNXModelManager
{
public:
    ONNXModelManager() 
        : env(ORT_LOGGING_LEVEL_WARNING, "NADAAI"),
          session(nullptr),
          isModelLoaded(false)
    {}

    bool loadModel(const juce::File& modelPath)
    {
        try {
            std::wstring wideModelPath = modelPath.getFullPathName().toWideCharPointer();
            Ort::SessionOptions sessionOptions;
            sessionOptions.SetGraphOptimizationLevel(GraphOptimizationLevel::ORT_ENABLE_ALL);
            
            session = std::make_unique<Ort::Session>(env, wideModelPath.c_str(), sessionOptions);
            isModelLoaded = true;
            return true;
        } catch (const std::exception& e) {
            DBG("Failed to load ONNX model: " << e.what());
            return false;
        }
    }

    std::vector<float> runInference(const std::vector<float>& inputData)
    {
        if (!isModelLoaded || !session) {
            return { 0.0f };
        }

        try {
            // Prepare input tensors
            std::vector<const char*> inputNames = { "input" };
            std::vector<const char*> outputNames = { "output" };
            std::vector<int64_t> inputShape = { 1, (int64_t)inputData.size() };

            Ort::Value inputTensor = Ort::Value::CreateTensor<float>(
                memoryInfo,
                const_cast<float*>(inputData.data()),
                inputData.size(),
                inputShape.data(),
                inputShape.size()
            );

            // Run inference
            auto outputTensors = session->Run(
                Ort::RunOptions { nullptr },
                inputNames.data(),
                &inputTensor,
                1,
                outputNames.data(),
                1
            );

            // Extract output
            float* output = outputTensors[0].GetTensorMutableData<float>();
            size_t outputSize = outputTensors[0].GetTensorTypeAndShapeInfo().GetElementCount();
            return std::vector<float>(output, output + outputSize);

        } catch (const std::exception& e) {
            DBG("ONNX inference failed: " << e.what());
            return { 0.0f };
        }
    }

    bool isLoaded() const { return isModelLoaded; }

private:
    Ort::Env env;
    std::unique_ptr<Ort::Session> session;
    Ort::MemoryInfo memoryInfo { Ort::MemoryInfo::CreateCpu(OrtArenaAllocator, OrtMemTypeDefault) };
    bool isModelLoaded;
};
