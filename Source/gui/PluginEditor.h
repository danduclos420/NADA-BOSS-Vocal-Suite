#pragma once

#include <JuceHeader.h>
#include "../dsp/PluginProcessor.h"

class NADALookAndFeel : public juce::LookAndFeel_V4
{
public:
    NADALookAndFeel();
    
    void drawRotarySlider(juce::Graphics& g, int x, int y, int width, int height,
                          float sliderPos, float rotaryStartAngle, float rotaryEndAngle,
                          juce::Slider& slider) override;
    
    void drawButtonBackground(juce::Graphics& g, juce::Button& button,
                              const juce::Colour& backgroundColour,
                              bool shouldDrawButtonAsHighlighted,
                              bool shouldDrawButtonAsDown) override;
};

class NADAAudioProcessorEditor : public juce::AudioProcessorEditor, public juce::Timer
{
public:
    NADAAudioProcessorEditor(NADAAudioProcessor&);
    ~NADAAudioProcessorEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;
    void timerCallback() override;

private:
    NADAAudioProcessor& audioProcessor;
    NADALookAndFeel lnf;

    // --- NATIVE UI COMPONENTS ---
    juce::Slider masterGainKnob;
    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> masterGainAttachment;

    juce::TextButton aiAnalyzeButton;
    // Removed ButtonAttachment - use onClick callback instead

    juce::Label statusLabel;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(NADAAudioProcessorEditor)
};
