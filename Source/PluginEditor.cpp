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
    auto radius = (float) juce::jmin (width / 2, height / 2) - 4.0f;
    auto centreX = (float) x + (float) width  * 0.5f;
    auto centreY = (float) y + (float) height * 0.5f;
    auto rx = centreX - radius;
    auto ry = centreY - radius;
    auto rw = radius * 2.0f;
    auto angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);

    // --- 1. OUTER SHADOW (Ambient Occlusion) ---
    juce::Path shadowPath;
    shadowPath.addEllipse(rx - 2, ry - 1, rw + 4, rw + 4);
    g.setColour(juce::Colours::black.withAlpha(0.4f));
    g.fillPath(shadowPath);

    // --- 2. MAIN KNOB BODY (Brushed Steel Effect) ---
    juce::ColourGradient grad (juce::Colour(0xff2d2d2d), centreX, centreY,
                              juce::Colour(0xff121212), centreX + radius, centreY + radius, true);
    grad.addColour(0.5, juce::Colour(0xff3d3d3d)); // Highlight mid
    g.setGradientFill (grad);
    g.fillEllipse (rx, ry, rw, rw);

    // --- 3. METALLIC RIM ---
    g.setColour (juce::Colours::white.withAlpha(0.2f));
    g.drawEllipse (rx, ry, rw, rw, 1.5f);

    // --- 4. INDICATOR (Red Dot or Line) ---
    juce::Path p;
    auto pointerLength = radius * 0.8f;
    auto pointerThickness = 3.0f;
    p.addRoundedRectangle (-pointerThickness * 0.5f, -radius, pointerThickness, radius * 0.4f, 1.0f);
    p.applyTransform (juce::AffineTransform::rotation (angle).translated (centreX, centreY));

    g.setColour (juce::Colours::red);
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
    // --- 1. PROCEDURAL BRUSHED TITANIUM BACKGROUND ---
    g.fillAll (juce::Colour (0xff1a1a1a));
    
    // Vignette Effect (Elite Polish)
    juce::ColourGradient bgGrad (juce::Colours::transparentWhite, 0, 0,
                                juce::Colours::black.withAlpha(0.7f), 0, (float)getHeight(), false);
    g.setGradientFill(bgGrad);
    g.fillRect(getLocalBounds());

    // Decorative Lines (Vector Brushed Effect)
    g.setColour(juce::Colours::white.withAlpha(0.02f));
    for (int i = 0; i < getWidth(); i += 2)
        g.drawVerticalLine(i, 0.0f, (float)getHeight());

    // Titles (Antares/PA Style)
    g.setColour (juce::Colours::white);
    g.setFont (juce::Font ("Inter", 26.0f, juce::Font::bold));
    g.drawText ("NADA BOSS VOCAL SUITE", 40, 40, 500, 40, juce::Justification::left);
    
    g.setFont (12.0f);
    g.setColour (juce::Colours::cyan.withAlpha(0.7f));
    g.drawText ("ULTIMATE AI EDITION // SPECTRAL MATCHING ENGINE", 40, 75, 500, 20, juce::Justification::left);

    // Section Labels
    g.setColour(juce::Colours::grey.brighter());
    g.setFont(juce::Font("Inter", 14.0f, juce::Font::plain));
    g.drawText("AUTOTUNE", 100, 130, 200, 20, juce::Justification::centred);
    g.drawText("DYNAMICS", 360, 130, 300, 20, juce::Justification::centred);
    g.drawText("FX STACK", 700, 130, 280, 20, juce::Justification::centred);

    // --- 2. VUMETERS (Vector Needle Simulation) ---
    auto drawMeter = [&](int x, int y, int w, int h, float val, const char* label)
    {
        // Glass Overlay
        g.setColour(juce::Colour(0xff050505));
        g.fillRoundedRectangle(x, y, w, h, 8.0f);
        
        // Scale Lights
        g.setColour(juce::Colours::white.withAlpha(0.4f));
        g.setFont(10.0f);
        g.drawText(label, x, y + h - 15, w, 15, juce::Justification::centred);
        
        // Background Arc (Vector)
        juce::Path arc;
        arc.addCentredArc(x + w/2, y + h + 10, w*0.85f, w*0.85f, 0.0f, -0.9f, 0.9f, true);
        g.setColour(juce::Colours::grey.darker().darker());
        g.strokePath(arc, juce::PathStrokeType(3.0f));

        // Ticks
        for (float a = -0.9f; a <= 0.9f; a += 0.3f) {
            juce::Path tick;
            tick.startNewSubPath(x + w/2 + std::sin(a) * (h*0.75f), y + h + 10 - std::cos(a) * (h*0.75f));
            tick.lineTo(x + w/2 + std::sin(a) * (h*0.85f), y + h + 10 - std::cos(a) * (h*0.85f));
            g.strokePath(tick, juce::PathStrokeType(1.0f));
        }

        // Needle (Physics-based)
        float angle = -0.9f + val * 1.8f;
        juce::Path needle;
        needle.startNewSubPath(x + w/2, y + h + 10);
        needle.lineTo(x + w/2 + std::sin(angle) * (h*0.85f), y + h + 10 - std::cos(angle) * (h*0.85f));
        g.setColour(juce::Colours::red.withBrightness(0.9f));
        g.strokePath(needle, juce::PathStrokeType(1.5f));
    };

    drawMeter(40, 500, 140, 90, inputMeter.val, "INPUT (dB)");
    drawMeter(210, 500, 140, 90, gainReductionMeter.val, "GR (dB)");
    drawMeter(820, 500, 140, 90, outputMeter.val, "OUTPUT (dB)");

    // --- 3. SPECTRAL ANALYZER DISPLAY [Legit AI View] ---
    g.setColour(juce::Colour(0xff080808));
    g.fillRoundedRectangle(360, 480, 440, 120, 10.0f);
    g.setColour(juce::Colours::cyan.withAlpha(0.1f));
    g.drawRoundedRectangle(360, 480, 440, 120, 10.0f, 1.0f);

    // Draw Frequency Bars (Historical AI Data)
    float low = audioProcessor.lastAnalysis.lowEnergy * 400.0f;
    float mid = audioProcessor.lastAnalysis.midEnergy * 400.0f;
    float high = audioProcessor.lastAnalysis.highEnergy * 400.0f;

    auto drawBand = [&](int x, float val, const juce::Colour& c) {
        g.setColour(c.withAlpha(0.4f));
        g.fillRect((float)x, 600.0f - val, 50.0f, val);
    };

    drawBand(400, low, juce::Colours::orange);
    drawBand(550, mid, juce::Colours::cyan);
    drawBand(700, high, juce::Colours::white);

    g.setColour(juce::Colours::white.withAlpha(0.4f));
    g.setFont(10.0f);
    g.drawText("AI SPECTRAL ANALYSIS ACTIVE", 360, 485, 440, 20, juce::Justification::centred);
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
