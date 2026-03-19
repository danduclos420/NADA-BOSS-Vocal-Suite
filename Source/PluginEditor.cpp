#include "PluginProcessor.h"
#include "PluginEditor.h"

NADALookAndFeel::NADALookAndFeel()
{
}

void NADALookAndFeel::drawRotarySlider (juce::Graphics& g, int x, int y, int width, int height,
                                       float sliderPos, float rotaryStartAngle, float rotaryEndAngle,
                                       juce::Slider& slider)
{
    auto radius = (float)juce::jmin (width / 2, height / 2) - 10.0f;
    auto centreX = (float)x + (float)width  * 0.5f;
    auto centreY = (float)y + (float)height * 0.5f;
    auto rx = centreX - radius;
    auto ry = centreY - radius;
    auto rw = radius * 2.0f;
    auto angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);

    // 1. Shadow
    g.setColour (juce::Colours::black.withAlpha (0.4f));
    g.fillEllipse (rx + 3, ry + 3, rw, rw);

    // 2. Outer Ring (Shiny Metal)
    juce::ColourGradient ringGrad (juce::Colour(0xff666666), centreX, ry,
                                  juce::Colour(0xff222222), centreX, ry + rw, false);
    g.setGradientFill (ringGrad);
    g.drawEllipse (rx, ry, rw, rw, 2.0f);

    // 3. Main Body (Dark Radial Metal)
    juce::ColourGradient bodyGrad (juce::Colour(0xff333333), centreX, centreY,
                                  juce::Colour(0xff111111), centreX + radius, centreY + radius, true);
    g.setGradientFill (bodyGrad);
    g.fillEllipse (rx + 1, ry + 1, rw - 2, rw - 2);
    
    // 4. LED Indicator
    juce::Path p;
    auto pointerLength = radius * 0.7f;
    auto pointerThickness = 4.0f;
    p.addRoundedRectangle (-pointerThickness * 0.5f, -radius, pointerThickness, pointerLength, 1.0f);
    p.applyTransform (juce::AffineTransform::rotation (angle).translated (centreX, centreY));
    
    // Glow effect
    juce::Path outline;
    juce::PathStrokeType stroke(2.0f);
    stroke.createStrokedPath(outline, p);
    g.setColour (juce::Colours::red.withAlpha (0.4f));
    g.fillPath (outline);
    
    g.setColour (juce::Colours::red);
    g.fillPath (p);
}

// --- EDITOR ---

NADAAudioProcessorEditor::NADAAudioProcessorEditor (NADAAudioProcessor& p)
    : AudioProcessorEditor (&p), audioProcessor (p)
{
    setLookAndFeel (&customLookAndFeel);

    // --- AUTOTUNE ---
    addAndMakeVisible(autotuneSpeedSlider);
    autotuneSpeedSlider.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    autotuneSpeedSlider.setTextBoxStyle(juce::Slider::NoTextBox, false, 0, 0);
    autotuneSpeedAtt = std::make_unique<SliderAttachment>(audioProcessor.apvts, "AUTOTUNE_SPEED", autotuneSpeedSlider);

    addAndMakeVisible(keySelector);
    keySelector.addItemList({"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}, 1);
    keyAtt = std::make_unique<ComboAttachment>(audioProcessor.apvts, "AUTOTUNE_KEY", keySelector);

    addAndMakeVisible(scaleSelector);
    scaleSelector.addItemList({"Major", "Minor"}, 1);
    scaleAtt = std::make_unique<ComboAttachment>(audioProcessor.apvts, "AUTOTUNE_SCALE", scaleSelector);

    // --- DYNAMICS ---
    addAndMakeVisible(fetThreshSlider);
    fetThreshSlider.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    fetThreshAtt = std::make_unique<SliderAttachment>(audioProcessor.apvts, "FET_THRESH", fetThreshSlider);

    addAndMakeVisible(fetRatioSlider);
    fetRatioSlider.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    fetRatioAtt = std::make_unique<SliderAttachment>(audioProcessor.apvts, "FET_RATIO", fetRatioSlider);

    addAndMakeVisible(optoThreshSlider);
    optoThreshSlider.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    optoThreshAtt = std::make_unique<SliderAttachment>(audioProcessor.apvts, "OPTO_THRESH", optoThreshSlider);

    // --- FX ---
    addAndMakeVisible(reverbMixSlider);
    reverbMixSlider.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    reverbMixAtt = std::make_unique<SliderAttachment>(audioProcessor.apvts, "REVERB_MIX", reverbMixSlider);

    addAndMakeVisible(delayMixSlider);
    delayMixSlider.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    delayMixAtt = std::make_unique<SliderAttachment>(audioProcessor.apvts, "DELAY_MIX", delayMixSlider);

    addAndMakeVisible(stereoWidthSlider);
    stereoWidthSlider.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    stereoWidthAtt = std::make_unique<SliderAttachment>(audioProcessor.apvts, "STEREO_WIDTH", stereoWidthSlider);

    // --- CENTERPIECE ---
    addAndMakeVisible(nadaButton);
    nadaButton.addListener(this);

    setSize (1000, 750);
    startTimerHz(30);
}

NADAAudioProcessorEditor::~NADAAudioProcessorEditor()
{
    setLookAndFeel (nullptr);
}

void NADAAudioProcessorEditor::timerCallback()
{
    repaint();
}

void NADAAudioProcessorEditor::paint (juce::Graphics& g)
{
    // --- BACKGROUND: BRUSHED DARK METAL ---
    g.fillAll (juce::Colour(0xff0d0d0f));
    
    // Noise/Brush Texture
    juce::Random r;
    for (int i = 0; i < 1000; ++i) {
        g.setColour (juce::Colours::white.withAlpha (0.015f));
        int x = r.nextInt(getWidth());
        int y = r.nextInt(getHeight());
        g.drawLine (x, y, x + r.nextInt(100), y, 1.0f);
    }

    // Panels/Bezels
    g.setColour (juce::Colours::black.withAlpha(0.6f));
    g.fillRoundedRectangle(20, 100, 300, 400, 12.0f); // Auto
    g.fillRoundedRectangle(340, 100, 320, 400, 12.0f); // Comp
    g.fillRoundedRectangle(680, 100, 300, 400, 12.0f); // FX

    g.setColour (juce::Colours::white.withAlpha(0.1f));
    g.drawRoundedRectangle(20, 100, 300, 400, 12.0f, 2.0f);
    g.drawRoundedRectangle(340, 100, 320, 400, 12.0f, 2.0f);
    g.drawRoundedRectangle(680, 100, 300, 400, 12.0f, 2.0f);

    // --- TITLES (BEBAS STYLE) ---
    g.setColour (juce::Colours::white);
    g.setFont (juce::Font ("Inter", 50.0f, juce::Font::bold)); // Fallback if Bebas not loaded
    g.drawText ("NADA BOSS VOCAL SUITE", 30, 30, getWidth() - 60, 60, juce::Justification::left);

    g.setFont (30.0f);
    g.setColour (juce::Colours::red);
    g.drawText("AUTOTUNE", 20, 110, 300, 40, juce::Justification::centred);
    g.drawText("COMPRESSORS", 340, 110, 320, 40, juce::Justification::centred);
    g.drawText("FX BUS", 680, 110, 300, 40, juce::Justification::centred);

    // Labels
    g.setFont (16.0f);
    g.setColour (juce::Colours::white.withAlpha(0.7f));
    g.drawText("SPEED", 120, 280, 100, 20, juce::Justification::centred);
    g.drawText("KEY", 60, 370, 70, 20, juce::Justification::centred);
    g.drawText("SCALE", 210, 370, 70, 20, juce::Justification::centred);
    
    g.drawText("FET THRESH", 360, 280, 120, 20, juce::Justification::centred);
    g.drawText("FET RATIO", 360, 430, 120, 20, juce::Justification::centred);
    g.drawText("OPTO LEVEL", 520, 280, 120, 20, juce::Justification::centred);

    g.drawText("REVERB", 720, 280, 80, 20, juce::Justification::centred);
    g.drawText("DELAY", 880, 280, 80, 20, juce::Justification::centred);
    g.drawText("STEREO", 800, 430, 100, 20, juce::Justification::centred);

    // --- LED METERS (SIMULATED) ---
    for (int i = 0; i < 10; ++i) {
        g.setColour (juce::Colours::red.withAlpha (r.nextFloat() > 0.3 ? 0.8f : 0.1f));
        g.fillRect(30, 480 - (i * 12), 15, 8);
        g.fillRect(50, 480 - (i * 12), 15, 8);
    }
}

void NADAAudioProcessorEditor::resized()
{
    // Autotune
    autotuneSpeedSlider.setBounds(70, 150, 200, 200);
    keySelector.setBounds(50, 330, 90, 35);
    scaleSelector.setBounds(200, 330, 90, 35);

    // Dynamics
    fetThreshSlider.setBounds(360, 150, 120, 120);
    fetRatioSlider.setBounds(360, 310, 120, 120);
    optoThreshSlider.setBounds(520, 150, 120, 120);

    // FX
    reverbMixSlider.setBounds(700, 150, 120, 120);
    delayMixSlider.setBounds(860, 150, 120, 120);
    stereoWidthSlider.setBounds(780, 310, 140, 140);

    // NADA AI Button (Glow Centerpiece)
    nadaButton.setBounds(getWidth()/2 - 100, getHeight() - 140, 200, 80);
}

void NADAAudioProcessorEditor::buttonClicked (juce::Button* button)
{
    if (button == &nadaButton)
    {
        audioProcessor.triggerNADAAnalysis();
    }
}
