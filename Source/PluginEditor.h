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

    // --- 3D ASSETS ---
    juce::Image backgroundImage;
    juce::Image knobImage;
    juce::Image buttonImage;

    // --- AUTOTUNE SECTION ---
    juce::Slider autotuneSpeedSlider;
    juce::ComboBox keySelector;
    juce::ComboBox scaleSelector;

    // --- DYNAMICS SECTION ---
    juce::Slider fetThreshSlider;
    juce::Slider fetRatioSlider;
    juce::Slider optoThreshSlider;

    // --- FX SECTION ---
    juce::Slider reverbMixSlider;
    juce::Slider delayMixSlider;
    juce::Slider stereoWidthSlider;

    // --- CENTERPIECE ---
    juce::TextButton nadaButton { "NADA AI" };

    // --- ATTACHMENTS ---
    using SliderAttachment = juce::AudioProcessorValueTreeState::SliderAttachment;
    using ComboAttachment = juce::AudioProcessorValueTreeState::ComboBoxAttachment;

    std::unique_ptr<SliderAttachment> autotuneSpeedAtt;
    std::unique_ptr<ComboAttachment> keyAtt;
    std::unique_ptr<ComboAttachment> scaleAtt;
    
    std::unique_ptr<SliderAttachment> fetThreshAtt;
    std::unique_ptr<SliderAttachment> fetRatioAtt;
    std::unique_ptr<SliderAttachment> optoThreshAtt;
    
    std::unique_ptr<SliderAttachment> reverbMixAtt;
    std::unique_ptr<SliderAttachment> delayMixAtt;
    std::unique_ptr<SliderAttachment> stereoWidthAtt;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (NADAAudioProcessorEditor)
};
