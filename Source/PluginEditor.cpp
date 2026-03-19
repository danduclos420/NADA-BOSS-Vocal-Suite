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
    auto angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);

    // Get the knob image from BinaryData
    auto knobImg = juce::ImageCache::getFromMemory (BinaryData::knob_png, BinaryData::knob_pngSize);
    
    if (knobImg.isValid())
    {
        // Draw the 3D Knob with rotation
        juce::AffineTransform trans;
        trans = trans.rotation (angle, (float)knobImg.getWidth() / 2.0f, (float)knobImg.getHeight() / 2.0f);
        trans = trans.scaled (radius * 2.0f / (float)knobImg.getWidth());
        trans = trans.translated (centreX - radius, centreY - radius);
        
        g.drawImageTransformed (knobImg, trans);
    }
    else
    {
        // Fallback if image fails
        g.setColour (juce::Colours::red);
        g.drawEllipse (centreX - radius, centreY - radius, radius * 2, radius * 2, 2.0f);
    }
}

// --- EDITOR ---

NADAAudioProcessorEditor::NADAAudioProcessorEditor (NADAAudioProcessor& p)
    : AudioProcessorEditor (&p), audioProcessor (p)
{
    // Load Assets
    backgroundImage = juce::ImageCache::getFromMemory (BinaryData::background_png, BinaryData::background_pngSize);
    buttonImage = juce::ImageCache::getFromMemory (BinaryData::nada_ai_button_png, BinaryData::nada_ai_button_pngSize);

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
    nadaButton.setButtonText(""); // We use Image

    setSize (1000, 750);
    startTimerHz(30);
}

NADAAudioProcessorEditor::~NADAAudioProcessorEditor()
{
    setLookAndFeel (nullptr);
}

void NADAAudioProcessorEditor::timerCallback() { repaint(); }

void NADAAudioProcessorEditor::paint (juce::Graphics& g)
{
    // 1. DRAW 3D BACKGROUND
    if (backgroundImage.isValid())
        g.drawImageWithin (backgroundImage, 0, 0, getWidth(), getHeight(), juce::RectanglePlacement::fillDestination);
    else
        g.fillAll (juce::Colours::black);

    // 2. TITLES & LABELS (ULTRA-CLEAN)
    g.setColour (juce::Colours::white);
    g.setFont (juce::Font (juce::Font::getStandardFontName(), 50.0f, juce::Font::bold));
    g.drawText ("NADA BOSS VOCAL SUITE", 40, 40, 800, 60, juce::Justification::left);

    g.setFont (24.0f);
    g.setColour (juce::Colours::red);
    g.drawText("AUTOTUNE", 50, 120, 250, 40, juce::Justification::centred);
    g.drawText("COMPRESSORS", 360, 120, 280, 40, juce::Justification::centred);
    g.drawText("FX STACK", 680, 120, 270, 40, juce::Justification::centred);

    // Section Labels
    g.setFont (14.0f);
    g.setColour (juce::Colours::white.withAlpha(0.6f));
    g.drawText("SPEED", 50, 310, 250, 20, juce::Justification::centred);
    g.drawText("FET THRESH", 360, 230, 120, 20, juce::Justification::centred);
    g.drawText("OPTO LEVEL", 510, 230, 120, 20, juce::Justification::centred);
    
    // 3. NADA AI BUTTON (3D ASSET)
    if (buttonImage.isValid())
        g.drawImageWithin (buttonImage, getWidth()/2 - 90, getHeight() - 150, 180, 100, juce::RectanglePlacement::centred);

    // 4. PRO METERS
    juce::Random r;
    for (int i = 0; i < 15; ++i) {
        float val = (float)i / 15.0f;
        g.setColour (val > 0.8 ? juce::Colours::red : juce::Colours::orange.withAlpha(0.8f));
        if (r.nextFloat() > (1.0f - val))
            g.fillRect(35, 500 - (i * 10), 12, 6);
    }
}

void NADAAudioProcessorEditor::resized()
{
    // Autotune
    autotuneSpeedSlider.setBounds(75, 160, 200, 200);
    keySelector.setBounds(80, 340, 80, 30);
    scaleSelector.setBounds(190, 340, 80, 30);

    // Dynamics
    fetThreshSlider.setBounds(370, 150, 100, 100);
    optoThreshSlider.setBounds(520, 150, 100, 100);
    fetRatioSlider.setBounds(370, 260, 100, 100);

    // FX
    reverbMixSlider.setBounds(700, 160, 100, 100);
    delayMixSlider.setBounds(850, 160, 100, 100);
    stereoWidthSlider.setBounds(775, 280, 120, 120);

    // Hidden button over the image
    nadaButton.setBounds(getWidth()/2 - 90, getHeight() - 150, 180, 100);
    nadaButton.setAlpha(0.0f); // Make it transparent but clickable
}

void NADAAudioProcessorEditor::buttonClicked (juce::Button* button)
{
    if (button == &nadaButton) audioProcessor.triggerNADAAnalysis();
}
