#include "../dsp/PluginProcessor.h"
#include "PluginEditor.h"

NADALookAndFeel::NADALookAndFeel()
{
    setColour(juce::Slider::thumbColourId, juce::Colours::red);
}

void NADALookAndFeel::drawRotarySlider(juce::Graphics& g, int x, int y, int width, int height,
                                       float sliderPos, float rotaryStartAngle, float rotaryEndAngle,
                                       juce::Slider& slider)
{
    juce::ignoreUnused(slider);
    auto bounds = juce::Rectangle<int>(x, y, width, height).toFloat().reduced(8);
    auto radius = juce::jmin(bounds.getWidth(), bounds.getHeight()) / 2.0f;
    auto angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);
    
    g.setColour(juce::Colours::black.withAlpha(0.6f));
    g.fillEllipse(bounds.getCentreX() - radius - 2, bounds.getCentreY() - radius + 3, 
                  radius * 2.2f, radius * 2.2f);

    auto knobRadius = radius * 0.9f;
    juce::Path knob;
    knob.addEllipse(bounds.getCentreX() - knobRadius, bounds.getCentreY() - knobRadius, 
                    knobRadius * 2.0f, knobRadius * 2.0f);
    
    juce::ColourGradient grad(juce::Colour(0xff333333), bounds.getCentreX(), 
                              bounds.getCentreY() - knobRadius,
                              juce::Colour(0xff111111), bounds.getCentreX(), 
                              bounds.getCentreY() + knobRadius, false);
    grad.addColour(0.5, juce::Colour(0xff222222));
    g.setGradientFill(grad);
    g.fillPath(knob);
    
    g.setColour(juce::Colours::white.withAlpha(0.05f));
    g.drawEllipse(bounds.getCentreX() - knobRadius, bounds.getCentreY() - knobRadius, 
                  knobRadius * 2.0f, knobRadius * 2.0f, 1.0f);

    juce::Path p;
    auto pointerLength = knobRadius * 0.5f;
    auto pointerThickness = 4.0f;
    p.addRoundedRectangle(-pointerThickness * 0.5f, -knobRadius + 2.0f, pointerThickness, 
                          pointerLength, 1.0f);
    p.applyTransform(juce::AffineTransform::rotation(angle)
                     .translated(bounds.getCentreX(), bounds.getCentreY()));
    
    g.setColour(juce::Colours::red.withAlpha(0.3f));
    g.strokePath(p, juce::PathStrokeType(3.0f));
    
    g.setColour(juce::Colours::red.withBrightness(1.2f));
    g.fillPath(p);
}

void NADALookAndFeel::drawButtonBackground(juce::Graphics& g, juce::Button& button,
                                           const juce::Colour& backgroundColour,
                                           bool shouldDrawButtonAsHighlighted,
                                           bool shouldDrawButtonAsDown)
{
    auto cornerSize = 6.0f;
    auto bounds = button.getLocalBounds().toFloat().reduced(0.5f);

    auto baseColour = backgroundColour
        .withMultipliedSaturation(shouldDrawButtonAsHighlighted ? 1.3f : 1.0f)
        .withMultipliedBrightness(shouldDrawButtonAsDown ? 0.8f : 1.0f);

    if (shouldDrawButtonAsDown) bounds = bounds.translated(0, 1.0f);

    if (button.getName() == "NADA AI") {
        juce::ColourGradient gold(juce::Colour(0xffffd700), bounds.getX(), bounds.getY(),
                                  juce::Colour(0xffb8860b), bounds.getRight(), 
                                  bounds.getBottom(), false);
        g.setGradientFill(gold);
    } else {
        g.setColour(baseColour);
    }

    g.fillRoundedRectangle(bounds, cornerSize);
    g.setColour(button.findColour(juce::ComboBox::outlineColourId));
    g.drawRoundedRectangle(bounds, cornerSize, 1.0f);
}

NADAAudioProcessorEditor::NADAAudioProcessorEditor(NADAAudioProcessor& p)
    : AudioProcessorEditor(&p), audioProcessor(p)
{
    setLookAndFeel(&lnf);

    masterGainKnob.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    masterGainKnob.setTextBoxStyle(juce::Slider::NoTextBox, false, 0, 0);
    addAndMakeVisible(masterGainKnob);
    masterGainAttachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(
        audioProcessor.apvts, "LIMITER_THRESH", masterGainKnob);

    aiAnalyzeButton.setButtonText("AI ANALYZE");
    aiAnalyzeButton.setName("NADA AI");
    addAndMakeVisible(aiAnalyzeButton);
    aiAnalyzeButton.onClick = [this] { audioProcessor.triggerNADAAnalysis(); };

    aiAutoButton.setButtonText("AUTO");
    aiAutoButton.setToggleState(false, juce::dontSendNotification);
    addAndMakeVisible(aiAutoButton);

    statusLabel.setText("AI READY", juce::dontSendNotification);
    statusLabel.setColour(juce::Label::textColourId, juce::Colour(0xffd4af37));
    addAndMakeVisible(statusLabel);

    aiStatusLabel.setText("WAITING FOR SIGNAL...", juce::dontSendNotification);
    aiStatusLabel.setColour(juce::Label::textColourId, juce::Colour(0xff00ff00));
    addAndMakeVisible(aiStatusLabel);

    startTimerHz(30);
    setSize(1600, 900);
}

NADAAudioProcessorEditor::~NADAAudioProcessorEditor() {}

void NADAAudioProcessorEditor::paint(juce::Graphics& g)
{
    g.fillAll(juce::Colour(0xff0b0c0f));
    
    juce::ColourGradient chassis(juce::Colour(0xff242629), 0, 0, 
                                 juce::Colour(0xff16181a), 0, (float)getHeight(), false);
    g.setGradientFill(chassis);
    auto rackArea = getLocalBounds().toFloat().reduced(16);
    g.fillRoundedRectangle(rackArea, 8.0f);

    g.setColour(juce::Colours::white.withAlpha(0.1f));
    g.setFont(juce::Font("Inter", 12.0f, juce::Font::bold));
    
    auto headerArea = getLocalBounds().removeFromTop(60).reduced(20, 10);
    g.drawText("NADA BOSS // ELITE VOCAL CHANNEL STRIP", headerArea, juce::Justification::centredLeft);
    
    g.setColour(juce::Colour(0xffd4af37));
    g.drawText(audioProcessor.getAIState().statusText, headerArea, juce::Justification::centredRight);
    
    g.setColour(juce::Colours::white.withAlpha(0.02f));
    for (int i = 1; i < 5; ++i) {
        g.drawVerticalLine(i * getWidth() / 5, 60, (float)getHeight() - 40);
    }

    drawAIAnalysis(g);
}

void NADAAudioProcessorEditor::drawAIAnalysis(juce::Graphics& g)
{
    auto aiState = audioProcessor.getAIState();
    int panelWidth = 200;
    int panelHeight = 400;
    int panelX = getWidth() - panelWidth - 20;
    int panelY = 80;

    g.setColour(juce::Colour(0xff1a1a2e).withAlpha(0.8f));
    g.fillRoundedRectangle((float)panelX, (float)panelY, (float)panelWidth, (float)panelHeight, 8.0f);

    g.setColour(juce::Colour(0xff0f3460).withAlpha(0.5f));
    g.drawRoundedRectangle((float)panelX, (float)panelY, (float)panelWidth, (float)panelHeight, 8.0f, 1.0f);

    g.setColour(juce::Colour(0xffd4af37));
    g.setFont(juce::Font("Inter", 11.0f, juce::Font::bold));
    g.drawText("SPECTRAL ANALYSIS", panelX + 10, panelY + 10, panelWidth - 20, 20, 
               juce::Justification::centred);

    int barWidth = (panelWidth - 30) / 6;
    int barX = panelX + 15;
    int barStartY = panelY + 50;
    int barMaxHeight = panelHeight - 100;

    auto& profile = aiState.lastProfile;
    std::array<float, 6> bandValues = {
        profile.lowFreqEnergy,
        profile.lowMidEnergy,
        profile.midEnergy,
        profile.presenceEnergy,
        profile.sibilanceEnergy,
        profile.brillianceEnergy
    };

    for (int i = 0; i < 6; ++i) {
        float height = bandValues[i] * barMaxHeight;
        g.setColour(spectrumViz.bandColours[i]);
        g.fillRect(barX + i * (barWidth + 5), barStartY + barMaxHeight - (int)height, barWidth, (int)height);
        g.setColour(juce::Colours::white.withAlpha(0.3f));
        g.drawRect(barX + i * (barWidth + 5), barStartY, barWidth, barMaxHeight);
        g.setColour(juce::Colours::white.withAlpha(0.5f));
        g.setFont(juce::Font("Inter", 8.0f));
        g.drawText(spectrumViz.bandNames[i], barX + i * (barWidth + 5), barStartY + barMaxHeight + 10, 
                   barWidth, 15, juce::Justification::centred);
    }

    g.setColour(aiState.isAnalyzing ? juce::Colour(0xffff9500) : juce::Colour(0xff00ff00));
    g.setFont(juce::Font("Inter", 9.0f));
    g.drawText(aiState.statusText, panelX + 10, panelY + panelHeight - 30, panelWidth - 20, 20,
               juce::Justification::centred);
}

void NADAAudioProcessorEditor::resized()
{
    auto area = getLocalBounds().reduced(40);
    auto header = area.removeFromTop(60);
    aiAnalyzeButton.setBounds(header.removeFromRight(120).reduced(0, 15));
    aiAutoButton.setBounds(header.removeFromRight(100).reduced(0, 15));
    statusLabel.setBounds(header.removeFromRight(200));
    masterGainKnob.setBounds(getLocalBounds().getCentreX() - 80, 
                             getLocalBounds().getCentreY() - 80, 160, 160);
}

void NADAAudioProcessorEditor::timerCallback()
{
    repaint();
}
