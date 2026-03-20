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

    // UI Components
    juce::Slider masterGainKnob;
    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> masterGainAttachment;

    juce::TextButton aiAnalyzeButton;
    juce::ToggleButton aiAutoButton;
    juce::Label statusLabel;
    juce::Label aiStatusLabel;

    // AI Visualization
    struct SpectrumVisualizer {
        std::array<float, 6> bandLevels = {};
        std::array<juce::String, 6> bandNames = {
            "RUMBLE", "BOXINESS", "MID", "PRESENCE", "SIBILANCE", "BRILLIANCE"
        };
        std::array<juce::Colour, 6> bandColours = {
            juce::Colour(0xff880000), juce::Colour(0xff884400),
            juce::Colour(0xff888800), juce::Colour(0xff008800),
            juce::Colour(0xff0088ff), juce::Colour(0xff8800ff)
        };
    } spectrumViz;

    void drawAIAnalysis(juce::Graphics& g);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(NADAAudioProcessorEditor)
};
