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

class NADAAudioProcessorEditor  : public juce::AudioProcessorEditor, public juce::Button::Listener
{
public:
    NADAAudioProcessorEditor (NADAAudioProcessor&);
    ~NADAAudioProcessorEditor() override;

    void paint (juce::Graphics&) override;
    void resized() override;
    void buttonClicked (juce::Button* button) override;

private:
    NADAAudioProcessor& audioProcessor;
    NADALookAndFeel customLookAndFeel;

    // UI Elements
    juce::Slider fetSlider;
    juce::Slider optoSlider;
    juce::Slider autotuneSlider;
    juce::TextButton nadaButton { "TRAITEMENT AI (NADA)" };

    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> fetAttachment;
    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> optoAttachment;
    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> autotuneAttachment;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (NADAAudioProcessorEditor)
};
