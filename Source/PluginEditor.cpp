#include "PluginProcessor.h"
#include "PluginEditor.h"

NADALookAndFeel::NADALookAndFeel()
{
    setColour(juce::Slider::thumbColourId, juce::Colours::red);
}

void NADALookAndFeel::drawRotarySlider (juce::Graphics& g, int x, int y, int width, int height,
                                       float sliderPos, float rotaryStartAngle, float rotaryEndAngle,
                                       juce::Slider& slider)
{
    auto bounds = juce::Rectangle<int> (x, y, width, height).toFloat().reduced (8);
    auto radius = juce::jmin (bounds.getWidth(), bounds.getHeight()) / 2.0f;
    auto angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);
    
    // --- 1. CHASSIS DEPTH --- (Ambient Occlusion)
    g.setColour (juce::Colours::black.withAlpha (0.6f));
    g.fillEllipse (bounds.getCentreX() - radius - 2, bounds.getCentreY() - radius + 3, radius * 2.2f, radius * 2.2f);

    // --- 2. THE KNOB (Gunmetal Steel) ---
    auto knobRadius = radius * 0.9f;
    juce::Path knob;
    knob.addEllipse (bounds.getCentreX() - knobRadius, bounds.getCentreY() - knobRadius, knobRadius * 2.0f, knobRadius * 2.0f);
    
    juce::ColourGradient grad (juce::Colour (0xff333333), bounds.getCentreX(), bounds.getCentreY() - knobRadius,
                               juce::Colour (0xff111111), bounds.getCentreX(), bounds.getCentreY() + knobRadius, false);
    grad.addColour (0.5, juce::Colour (0xff222222));
    g.setGradientFill (grad);
    g.fillPath (knob);
    
    // Top Rim highlight
    g.setColour (juce::Colours::white.withAlpha (0.05f));
    g.drawEllipse (bounds.getCentreX() - knobRadius, bounds.getCentreY() - knobRadius, knobRadius * 2.0f, knobRadius * 2.0f, 1.0f);

    // --- 3. THE INDICATOR (Laser Red Glow) ---
    juce::Path p;
    auto pointerLength = knobRadius * 0.5f;
    auto pointerThickness = 4.0f;
    p.addRoundedRectangle (-pointerThickness * 0.5f, -knobRadius + 2.0f, pointerThickness, pointerLength, 1.0f);
    p.applyTransform (juce::AffineTransform::rotation (angle).translated (bounds.getCentreX(), bounds.getCentreY()));
    
    // Outer Glow
    g.setColour (juce::Colours::red.withAlpha (0.3f));
    g.strokePath (p, juce::PathStrokeType (3.0f));
    
    // Bright Core
    g.setColour (juce::Colours::red.withBrightness(1.2f));
    g.fillPath (p);
}

void NADALookAndFeel::drawButtonBackground (juce::Graphics& g, juce::Button& button,
                                           const juce::Colour& backgroundColour,
                                           bool shouldDrawButtonAsHighlighted,
                                           bool shouldDrawButtonAsDown)
{
    auto cornerSize = 6.0f;
    auto bounds = button.getLocalBounds().toFloat().reduced (0.5f);

    auto baseColour = backgroundColour.withMultipliedSaturation (shouldDrawButtonAsHighlighted ? 1.3f : 1.0f)
                                       .withMultipliedBrightness (shouldDrawButtonAsDown ? 0.8f : 1.0f);

    if (shouldDrawButtonAsDown) bounds = bounds.translated (0, 1.0f);

    // Gold Button Effect for NADA AI
    if (button.getName() == "NADA AI")
    {
        juce::ColourGradient gold (juce::Colour(0xffffd700), bounds.getX(), bounds.getY(),
                                  juce::Colour(0xffb8860b), bounds.getRight(), bounds.getBottom(), false);
        g.setGradientFill(gold);
    }
    else
    {
        g.setColour (baseColour);
    }

    g.fillRoundedRectangle (bounds, cornerSize);
    g.setColour (button.findColour (juce::ComboBox::outlineColourId));
    g.drawRoundedRectangle (bounds, cornerSize, 1.0f);
}

// --- EDITOR ---

NADAAudioProcessorEditor::NADAAudioProcessorEditor (NADAAudioProcessor& p)
    : AudioProcessorEditor (&p), audioProcessor (p)
{
    setLookAndFeel (&customLookAndFeel);

    auto setupSlider = [this](juce::Slider& s, const juce::String& paramID, std::unique_ptr<SliderAttachment>& att)
    {
        addAndMakeVisible(s);
        s.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
        s.setTextBoxStyle(juce::Slider::NoTextBox, false, 0, 0);
        att = std::make_unique<SliderAttachment>(audioProcessor.apvts, paramID, s);
    };

    setupSlider(autotuneSpeedSlider, "AUTOTUNE_SPEED", autotuneSpeedAtt);
    setupSlider(fetThreshSlider, "FET_THRESH", fetThreshAtt);
    setupSlider(fetRatioSlider, "FET_RATIO", fetRatioAtt);
    setupSlider(optoThreshSlider, "OPTO_THRESH", optoThreshAtt);
    setupSlider(reverbMixSlider, "REVERB_MIX", reverbMixAtt);
    setupSlider(delayMixSlider, "DELAY_MIX", delayMixAtt);
    setupSlider(stereoWidthSlider, "STEREO_WIDTH", stereoWidthAtt);

    // Key / Scale (Legacy Selector)
    addAndMakeVisible(keySelector);
    keySelector.addItemList({"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}, 1);
    keyAtt = std::make_unique<ComboAttachment>(audioProcessor.apvts, "AUTOTUNE_KEY", keySelector);
    
    addAndMakeVisible(scaleSelector);
    scaleSelector.addItemList({"Major", "Minor"}, 1);
    scaleAtt = std::make_unique<ComboAttachment>(audioProcessor.apvts, "AUTOTUNE_SCALE", scaleSelector);

    // Buttons
    addAndMakeVisible(nadaButton);
    nadaButton.setName("NADA AI");
    nadaButton.addListener(this);

    startTimerHz(30);
    setSize (1000, 750);
}

NADAAudioProcessorEditor::~NADAAudioProcessorEditor()
{
    setLookAndFeel (nullptr);
}

void NADAAudioProcessorEditor::paint (juce::Graphics& g)
{
    // --- SINFUL DARK METAL BACKGROUND ---
    g.fillAll (juce::Colour (0xff0d0d0d));
    
    // Brushed Grain Texture Simulation
    auto& random = juce::Random::getSystemRandom();
    for (int i = 0; i < 2000; ++i) {
        g.setColour (juce::Colours::white.withAlpha (random.nextFloat() * 0.03f));
        g.drawRect (random.nextInt (getWidth()), random.nextInt (getHeight()), 1, 1);
    }

    // Rack Structure Dividers
    g.setColour (juce::Colours::black);
    g.fillRect (0.0f, 100.0f, (float)getWidth(), 4.0f); // Top divider
    g.fillRect (0.0f, 480.0f, (float)getWidth(), 4.0f); // Bottom divider

    // --- ACCENT GLOW (Red Header) ---
    g.setGradientFill (juce::ColourGradient (juce::Colours::red.withAlpha (0.08f), 0, 0,
                                            juce::Colours::transparentWhite, 0, 100, false));
    g.fillRect (0, 0, getWidth(), 100);

    // Titles
    g.setColour (juce::Colours::red);
    g.setFont (juce::Font ("Inter", 42.0f, juce::Font::bold));
    g.drawText ("NADA BOSS", 40, 20, 300, 60, juce::Justification::left);
    
    g.setColour (juce::Colours::white.withAlpha (0.4f));
    g.setFont (12.0f);
    g.drawText ("V3 // ULTIMATE SINFUL METAL RACK", 42, 65, 400, 20, juce::Justification::left);

    // --- SECTION LABELS ---
    auto drawLabel = [&](int x, int y, int w, juce::String text) {
        g.setColour (juce::Colours::white.withAlpha (0.2f));
        g.setFont (juce::Font (12.0f, juce::Font::bold));
        g.drawText (text, x, y, w, 20, juce::Justification::centred);
        g.setColour (juce::Colours::red.withAlpha (0.3f));
        g.drawHorizontalLine (y + 18, (float)x, (float)(x + w));
    };

    drawLabel (50, 120, 280, "AI TREATMENT");
    drawLabel (350, 120, 300, "DYNAMIC SURGERY");
    drawLabel (680, 120, 280, "TEXTURE & SPACE");

    // --- ANALOG VU METERS ---
    auto drawVU = [&](int x, int y, float val, juce::String label) {
        g.setColour (juce::Colour (0xff050505));
        g.fillRoundedRectangle (x, y, 160, 100, 4.0f);
        g.setColour (juce::Colours::red.withAlpha (0.4f));
        g.drawRoundedRectangle (x, y, 160, 100, 4.0f, 1.5f);
        
        // Needle Pivot
        float cx = x + 80.0f;
        float cy = y + 105.0f;
        float angle = juce::jmap (val, 0.0f, 1.0f, -0.7f, 0.7f);
        
        g.setColour (juce::Colours::red.withBrightness(1.5f));
        g.setOpacity(0.9f);
        g.drawLine (cx, cy, cx + std::sin(angle)*90, cy - std::cos(angle)*90, 2.5f);
        
        g.setColour (juce::Colours::white.withAlpha (0.5f));
        g.setFont (10.0f);
        g.drawText (label, x, y + 80, 160, 20, juce::Justification::centred);
    };

    drawVU (100, 500, inputMeter.val, "INPUT (dB)");
    drawVU (420, 500, gainReductionMeter.val, "COMPRESSION (dB)");
    drawVU (740, 500, outputMeter.val, "OUTPUT (dB)");
}

void NADAAudioProcessorEditor::resized()
{
    // Autotune (Left)
    autotuneSpeedSlider.setBounds(90, 160, 220, 220);
    keySelector.setBounds(90, 390, 100, 30);
    scaleSelector.setBounds(210, 390, 100, 30);
    
    // Dynamics (Center)
    fetThreshSlider.setBounds(370, 160, 130, 130);
    optoThreshSlider.setBounds(520, 160, 130, 130);
    fetRatioSlider.setBounds(445, 300, 130, 130);

    // FX (Right)
    reverbMixSlider.setBounds(710, 160, 120, 120);
    delayMixSlider.setBounds(860, 160, 120, 120);
    stereoWidthSlider.setBounds(785, 290, 130, 130);

    // NADA Button Hitbox (Bottom Center)
    nadaButton.setBounds(getWidth()/2 - 100, getHeight() - 140, 200, 80);
}

void NADAAudioProcessorEditor::buttonClicked (juce::Button* button)
{
    if (button == &nadaButton) audioProcessor.triggerNADAAnalysis();
}

void NADAAudioProcessorEditor::timerCallback()
{
    // Smooth meter movement (Needle Inertia - Simulating Analog Physics)
    auto targetIn = audioProcessor.inputLevel.load() * 1.5f; // Calibration
    auto targetOut = audioProcessor.outputLevel.load() * 1.5f;
    auto targetGR = audioProcessor.grLevel.load() * 2.0f;

    inputMeter.val += (targetIn - inputMeter.val) * 0.15f;
    outputMeter.val += (targetOut - outputMeter.val) * 0.15f;
    gainReductionMeter.val += (targetGR - gainReductionMeter.val) * 0.08f;

    repaint();
}
