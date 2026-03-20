#pragma once

#include <juce_gui_extra/juce_gui_extra.h>
#include "../dsp/PluginProcessor.h"

// ==============================================================================
// 1. CUSTOM LOOK AND FEEL (Genuine Machine Style)
// ==============================================================================
class NADALookAndFeel : public juce::LookAndFeel_V4
{
public:
    NADALookAndFeel();
    void drawRotarySlider (juce::Graphics& g, int x, int y, int width, int height, float sliderPos,
                           float rotaryStartAngle, float rotaryEndAngle, juce::Slider& slider) override;
};

// ==============================================================================
// 2. MAIN EDITOR
// ==============================================================================
class NADAAudioProcessorEditor  : public juce::AudioProcessorEditor, public juce::Timer
{
public:
    NADAAudioProcessorEditor (NADAAudioProcessor&);
    ~NADAAudioProcessorEditor() override;

    void paint (juce::Graphics&) override;
    void resized() override;
    void timerCallback() override;

private:
    NADAAudioProcessor& audioProcessor;
    NADALookAndFeel lnf;

    // --- NATIVE UI COMPONENTS ---
    struct ControlGroup {
        juce::Slider slider;
        std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> attachment;
        juce::Label label;
    };

    ControlGroup masterGain;
    ControlGroup saturation;
    ControlGroup compression;
    ControlGroup eqHigh;
    ControlGroup eqLow;
    ControlGroup reverbMix;
    ControlGroup delayMix;

    juce::Label statusLabel;

    void setupControl(ControlGroup& group, const juce::String& paramID, const juce::String& labelText);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (NADAAudioProcessorEditor)
};
