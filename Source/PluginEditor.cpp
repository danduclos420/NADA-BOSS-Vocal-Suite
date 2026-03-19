#include "PluginProcessor.h"
#include "PluginEditor.h"

NADALookAndFeel::NADALookAndFeel()
{
    setColour(juce::Slider::thumbColourId, juce::Colours::red);
    setColour(juce::Slider::rotarySliderFillColourId, juce::Colours::darkgrey);
}

void NADALookAndFeel::drawRotarySlider (juce::Graphics& g, int x, int y, int width, int height,
                                       float sliderPos, float rotaryStartAngle, float rotaryEndAngle,
                                       juce::Slider& slider)
{
    auto radius = (float)juce::jmin (width / 2, height / 2) - 4.0f;
    auto centreX = (float)x + (float)width  * 0.5f;
    auto centreY = (float)y + (float)height * 0.5f;
    auto rx = centreX - radius;
    auto ry = centreY - radius;
    auto rw = radius * 2.0f;
    auto angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);

    // Dark Metal Base
    g.setColour (juce::Colour::fromRGB(40, 40, 42));
    g.fillEllipse (rx, ry, rw, rw);
    g.setColour (juce::Colours::black.withAlpha(0.5f));
    g.drawEllipse (rx, ry, rw, rw, 2.0f);

    // Led Ring
    juce::Path p;
    p.addCentredArc(centreX, centreY, radius, radius, 0.0f, rotaryStartAngle, angle, true);
    g.setColour (juce::Colours::red);
    g.strokePath(p, juce::PathStrokeType(4.0f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));

    // Dial Pointer
    juce::Path needle;
    needle.addRectangle(-2, -radius, 4, radius * 0.5f);
    g.setColour (juce::Colours::white);
    g.fillPath (needle, juce::AffineTransform::rotation (angle).translated (centreX, centreY));
}

NADAAudioProcessorEditor::NADAAudioProcessorEditor (NADAAudioProcessor& p)
    : AudioProcessorEditor (&p), audioProcessor (p)
{
    setLookAndFeel(&customLookAndFeel);

    // Setup Sliders
    fetSlider.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    fetSlider.setTextBoxStyle(juce::Slider::NoTextBox, false, 0, 0);
    addAndMakeVisible(fetSlider);
    fetAttachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(p.apvts, "FET_THRESH", fetSlider);

    optoSlider.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    optoSlider.setTextBoxStyle(juce::Slider::NoTextBox, false, 0, 0);
    addAndMakeVisible(optoSlider);
    optoAttachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(p.apvts, "OPTO_THRESH", optoSlider);

    autotuneSlider.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    autotuneSlider.setTextBoxStyle(juce::Slider::NoTextBox, false, 0, 0);
    addAndMakeVisible(autotuneSlider);
    autotuneAttachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(p.apvts, "AUTOTUNE", autotuneSlider);

    nadaButton.setButtonText("AI TREATMENT (NADA)");
    nadaButton.setColour(juce::TextButton::buttonColourId, juce::Colour::fromRGB(180, 20, 20)); // Deep Red
    nadaButton.addListener(this);
    addAndMakeVisible(nadaButton);

    setSize (600, 450);
}

NADAAudioProcessorEditor::~NADAAudioProcessorEditor() { setLookAndFeel(nullptr); }

void NADAAudioProcessorEditor::paint (juce::Graphics& g)
{
    // Background: Dark Metal
    g.fillAll (juce::Colour::fromRGB(25, 25, 28));

    // Headers with BEBAS (Mocking Font loading here)
    g.setColour (juce::Colours::white);
    g.setFont(juce::Font("Bebas Neue", 36.0f, juce::Font::bold));
    g.drawText ("NADA BOSS VOCAL SUITE", 20, 20, 400, 40, juce::Justification::left);

    g.setFont(juce::Font("Bebas Neue", 18.0f, juce::Font::plain));
    g.drawText("FET COMP", 50, 100, 100, 20, juce::Justification::centred);
    g.drawText("OPTO LEVEL", 250, 100, 100, 20, juce::Justification::centred);
    g.drawText("AUTOTUNE", 450, 100, 100, 20, juce::Justification::centred);
}

void NADAAudioProcessorEditor::resized()
{
    fetSlider.setBounds(50, 130, 150, 150);
    optoSlider.setBounds(250, 130, 150, 150);
    autotuneSlider.setBounds(450, 130, 150, 150);
    nadaButton.setBounds(150, 320, 300, 60);
}

void NADAAudioProcessorEditor::buttonClicked(juce::Button* button)
{
    if (button == &nadaButton)
    {
        audioProcessor.triggerNADAAnalysis();
    }
}
