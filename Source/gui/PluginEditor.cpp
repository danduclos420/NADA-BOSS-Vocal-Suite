#include "PluginEditor.h"

// ==============================================================================
// 1. CUSTOM LOOK AND FEEL (Genuine Machine Style - Native Restoration)
// ==============================================================================
NADALookAndFeel::NADALookAndFeel()
{
    setColour(juce::Slider::thumbColourId, juce::Colour(0xffd4af37)); // Gold
    setColour(juce::Slider::rotarySliderFillColourId, juce::Colour(0xff1c1e21));
    setColour(juce::Slider::rotarySliderOutlineColourId, juce::Colour(0xff0b0c0f));
}

void NADALookAndFeel::drawRotarySlider (juce::Graphics& g, int x, int y, int width, int height, float sliderPos,
                                       float rotaryStartAngle, float rotaryEndAngle, juce::Slider& slider)
{
    auto radius = (float)juce::jmin (width / 2, height / 2) - 4.0f;
    auto centreX = (float)x + (float)width  * 0.5f;
    auto centreY = (float)y + (float)height * 0.5f;
    auto rx = centreX - radius;
    auto ry = centreY - radius;
    auto rw = radius * 2.0f;
    auto angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);

    // Fill
    g.setColour (juce::Colour (0xff1c1e21));
    g.fillEllipse (rx, ry, rw, rw);

    // Subtle Gradient for Depth
    juce::ColourGradient grad (juce::Colour (0xff2d3436).withAlpha(0.1f), centreX, centreY, 
                               juce::Colour (0xff000000).withAlpha(0.3f), rx, ry, true);
    g.setGradientFill (grad);
    g.fillEllipse (rx, ry, rw, rw);

    // Pointer (Golden Precision - High Tech Glow)
    auto angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);
    auto pLen = radius * 0.8f;
    auto pThick = 2.5f;
    
    g.setColour (juce::Colour (0xffd4af37)); // Elite Gold
    juce::Path p;
    p.addRoundedRectangle(-pThick*0.5f, -radius, pThick, pLen, 1.0f);
    p.applyTransform(juce::AffineTransform::rotation(angle).translated(centreX, centreY));
    g.fillPath(p);
}

// ==============================================================================
// 2. MAIN EDITOR
// ==============================================================================
NADAAudioProcessorEditor::NADAAudioProcessorEditor (NADAAudioProcessor& p)
    : AudioProcessorEditor (&p), audioProcessor (p)
{
    setLookAndFeel(&lnf);

    setupControl(masterGain, "LIMITER_THRESH", "MASTER GAIN");
    setupControl(saturation, "SAT_DRIVE", "HG-2 DRIVE");
    setupControl(compression, "1176_THR", "1176 THR");
    setupControl(eqHigh, "EQ_BAND_5_GAIN", "PULTEC HIGH");
    setupControl(eqLow, "EQ_BAND_1_GAIN", "PULTEC LOW");
    setupControl(reverbMix, "REVERB_MIX", "BUS REVERB");
    setupControl(delayMix, "DELAY_MIX", "H-DELAY");

    statusLabel.setText("NADA BOSS // ELITE SERIES // READY", juce::dontSendNotification);
    statusLabel.setJustificationType(juce::Justification::centred);
    statusLabel.setColour(juce::Label::textColourId, juce::Colour(0xffd4af37));
    addAndMakeVisible(statusLabel);

    startTimerHz(30);
    setSize (1000, 600); 
}

NADAAudioProcessorEditor::~NADAAudioProcessorEditor()
{
    setLookAndFeel(nullptr);
}

void NADAAudioProcessorEditor::setupControl(ControlGroup& group, const juce::String& paramID, const juce::String& labelText)
{
    group.slider.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    group.slider.setTextBoxStyle(juce::Slider::NoTextBox, false, 0, 0);
    addAndMakeVisible(group.slider);
    
    group.attachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(audioProcessor.apvts, paramID, group.slider);
    
    group.label.setText(labelText, juce::dontSendNotification);
    group.label.setJustificationType(juce::Justification::centred);
    group.label.setFont(juce::Font("Inter", 12.0f, juce::Font::bold));
    group.label.setColour(juce::Label::textColourId, juce::Colours::white.withAlpha(0.6f));
    addAndMakeVisible(group.label);
}

void NADAAudioProcessorEditor::paint (juce::Graphics& g)
{
    // --- INDUSTRIAL RACK BACKGROUND ---
    g.fillAll (juce::Colour (0xff0b0c0f));
    
    auto area = getLocalBounds().toFloat().reduced(20);
    g.setColour (juce::Colour (0xff1c1e21));
    g.fillRoundedRectangle (area, 12.0f);
    
    // Grid Dividers
    g.setColour (juce::Colours::white.withAlpha(0.05f));
    for (int i=1; i<4; ++i)
        g.drawVerticalLine (i * getWidth() / 4, 40, (float)getHeight() - 40);

    // Header
    g.setColour (juce::Colours::white.withAlpha(0.1f));
    g.setFont (juce::Font ("Inter", 14.0f, juce::Font::bold));
    g.drawText ("NADA BOSS // PROFESSIONAL MASTERING FRAME // ELITE SERIES", 
                getLocalBounds().removeFromTop(50), juce::Justification::centred);
}

void NADAAudioProcessorEditor::resized()
{
    auto area = getLocalBounds().reduced(40);
    area.removeFromTop(40); // Space for header
    
    auto topRow = area.removeFromTop(area.getHeight() / 2);
    auto bottomRow = area;

    auto cellW = topRow.getWidth() / 4;
    
    // Top Row
    masterGain.slider.setBounds(topRow.removeFromLeft(cellW).reduced(20));
    saturation.slider.setBounds(topRow.removeFromLeft(cellW).reduced(20));
    compression.slider.setBounds(topRow.removeFromLeft(cellW).reduced(20));
    eqHigh.slider.setBounds(topRow.removeFromLeft(cellW).reduced(20));
    
    // Labels for Top Row
    auto labelArea = getLocalBounds().reduced(40);
    labelArea.removeFromTop(180);
    auto lRow = labelArea.removeFromTop(30);
    masterGain.label.setBounds(lRow.removeFromLeft(cellW));
    saturation.label.setBounds(lRow.removeFromLeft(cellW));
    compression.label.setBounds(lRow.removeFromLeft(cellW));
    eqHigh.label.setBounds(lRow.removeFromLeft(cellW));

    // Bottom Row
    eqLow.slider.setBounds(bottomRow.removeFromLeft(cellW).reduced(20));
    reverbMix.slider.setBounds(bottomRow.removeFromLeft(cellW).reduced(20));
    delayMix.slider.setBounds(bottomRow.removeFromLeft(cellW).reduced(20));
    
    // Labels for Bottom Row
    auto blRow = labelArea.removeFromTop(180); // Move down
    blRow = labelArea.removeFromTop(30);
    eqLow.label.setBounds(blRow.removeFromLeft(cellW));
    reverbMix.label.setBounds(blRow.removeFromLeft(cellW));
    delayMix.label.setBounds(blRow.removeFromLeft(cellW));

    statusLabel.setBounds(getLocalBounds().removeFromBottom(40));
}

void NADAAudioProcessorEditor::timerCallback()
{
    // Native level monitoring would go here (optional for now)
    repaint();
}
