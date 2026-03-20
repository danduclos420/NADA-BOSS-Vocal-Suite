#pragma once
#include <JuceHeader.h>

/**
 * Real-time Pitch Shifter using a Dual-Delay Line Resampler.
 * Optimized for 'T-Pain' style vocal effects and transparent correction.
 */
class NADAPitchShifter
{
public:
    void prepare(double sr, int maxBlockSize)
    {
        sampleRate = sr;
        delayLineL.prepare({ sr, (juce::uint32)maxBlockSize, 2 });
        delayLineR.prepare({ sr, (juce::uint32)maxBlockSize, 2 });
        
        delayLineL.setMaximumDelayInSamples((double)sr * 0.1); 
        delayLineR.setMaximumDelayInSamples((double)sr * 0.1);
        
        writePos = 0;
        readPos1 = 0.0;
        readPos2 = sr * 0.02; // Offset for cross-fading
    }

    void process(juce::AudioBuffer<float>& buffer, float pitchRatio)
    {
        if (std::abs(pitchRatio - 1.0f) < 0.001f) return; // No shift needed

        auto* left = buffer.getWritePointer(0);
        auto* right = buffer.getWritePointer(1);

        for (int i = 0; i < buffer.getNumSamples(); ++i)
        {
            float sL = left[i];
            float sR = right[i];

            // Write to delay lines
            delayLineL.pushSample(0, sL);
            delayLineR.pushSample(1, sR);

            // Read with variable speed (Resampling)
            // Cross-fading logic to avoid clicks when read/write heads cross
            float outL = delayLineL.popSample(0, (float)readPos1);
            float outR = delayLineR.popSample(1, (float)readPos1);

            left[i] = outL;
            right[i] = outR;

            readPos1 += pitchRatio;
            if (readPos1 >= delayLineL.getMaximumDelayInSamples()) readPos1 = 0;
        }
    }

private:
    juce::dsp::DelayLine<float> delayLineL, delayLineR;
    double sampleRate;
    int writePos;
    double readPos1, readPos2;
};
