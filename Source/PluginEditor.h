#pragma once

#include <JuceHeader.h>
#include "PluginProcessor.h"

class NADALookAndFeel : public juce::LookAndFeel_V4
{
public:
    NADALookAndFeel();
    void drawRotarySlider (juce::Graphics& g, int x, int y, int width, int height,
                           float sliderPos, float rotaryStartAngle, float rotaryEndAngle,
                           juce::Slider& slider) override;
    
    void drawButtonBackground (juce::Graphics& g, juce::Button& button,
                               const juce::Colour& backgroundColour,
                               bool shouldDrawButtonAsHighlighted,
                               bool shouldDrawButtonAsDown) override;
};

class NADAAudioProcessorEditor  : public juce::AudioProcessorEditor, public juce::Button::Listener, public juce::Timer
{
public:
    NADAAudioProcessorEditor (NADAAudioProcessor&);
    ~NADAAudioProcessorEditor() override;

    void paint (juce::Graphics&) override;
    void resized() override;
    void buttonClicked (juce::Button* button) override;
    void timerCallback() override;

private:
    NADAAudioProcessor& audioProcessor;
    NADALookAndFeel customLookAndFeel;

    // --- SECTIONS ---
    juce::Slider autotuneSpeedSlider;
    juce::ComboBox keySelector;
    juce::ComboBox scaleSelector;

    juce::Slider fetThreshSlider;
    juce::Slider fetRatioSlider;
    juce::Slider optoThreshSlider;

    juce::Slider reverbMixSlider;
    juce::Slider delayMixSlider;
    juce::Slider stereoWidthSlider;

    // --- VUMETERS (Vector) ---
    struct Vumeter { float val = 0.0f; float gr = 0.0f; };
    Vumeter inputMeter, outputMeter, gainReductionMeter;

    juce::TextButton nadaButton { "NADA AI" };

    // --- ATTACHMENTS ---
    using SliderAttachment = juce::AudioProcessorValueTreeState::SliderAttachment;
    using ComboAttachment = juce::AudioProcessorValueTreeState::ComboBoxAttachment;

    std::unique_ptr<SliderAttachment> autotuneSpeedAtt, fetThreshAtt, fetRatioAtt, optoThreshAtt, reverbMixAtt, delayMixAtt, stereoWidthAtt;
    std::unique_ptr<ComboAttachment> keyAtt, scaleAtt;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (NADAAudioProcessorEditor)
};
