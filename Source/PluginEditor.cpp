#include "PluginProcessor.h"
#include "PluginEditor.h"

NADALookAndFeel::NADALookAndFeel() {}

void NADALookAndFeel::drawRotarySlider (juce::Graphics& g, int x, int y, int width, int height,
                                       float sliderPos, float rotaryStartAngle, float rotaryEndAngle,
                                       juce::Slider& slider)
{
    auto radius = (float)juce::jmin (width / 2, height / 2) - 10.0f;
    auto centreX = (float)x + (float)width  * 0.5f;
    auto centreY = (float)y + (float)height * 0.5f;
    auto angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);

    // Get the BOUTIQUE KNOB from BinaryData
    auto knobImg = juce::ImageCache::getFromMemory (BinaryData::knob_png, BinaryData::knob_pngSize);
    
    if (knobImg.isValid())
    {
        juce::AffineTransform trans;
        trans = trans.rotation (angle, (float)knobImg.getWidth() / 2.0f, (float)knobImg.getHeight() / 2.0f);
        trans = trans.scaled (radius * 2.2f / (float)knobImg.getWidth()); // Fit to radius
        trans = trans.translated (centreX - radius * 1.1f, centreY - radius * 1.1f);
        
        g.drawImageTransformed (knobImg, trans);
    }
}

// --- EDITOR ---

NADAAudioProcessorEditor::NADAAudioProcessorEditor (NADAAudioProcessor& p)
    : AudioProcessorEditor (&p), audioProcessor (p)
{
    // Load Photo-Realistic Assets
    backgroundImage = juce::ImageCache::getFromMemory (BinaryData::background_png, BinaryData::background_pngSize);
    buttonImage = juce::ImageCache::getFromMemory (BinaryData::nada_ai_button_png, BinaryData::nada_ai_button_pngSize);

    setLookAndFeel (&customLookAndFeel);

    // --- SLIDERS ---
    auto setupSlider = [this](juce::Slider& s, juce::String pid, std::unique_ptr<SliderAttachment>& att) {
        addAndMakeVisible(s);
        s.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
        s.setTextBoxStyle(juce::Slider::NoTextBox, false, 0, 0);
        att = std::make_unique<SliderAttachment>(audioProcessor.apvts, pid, s);
    };

    setupSlider(autotuneSpeedSlider, "AUTOTUNE_SPEED", autotuneSpeedAtt);
    setupSlider(fetThreshSlider, "FET_THRESH", fetThreshAtt);
    setupSlider(fetRatioSlider, "FET_RATIO", fetRatioAtt);
    setupSlider(optoThreshSlider, "OPTO_THRESH", optoThreshAtt);
    setupSlider(reverbMixSlider, "REVERB_MIX", reverbMixAtt);
    setupSlider(delayMixSlider, "DELAY_MIX", delayMixAtt);
    setupSlider(stereoWidthSlider, "STEREO_WIDTH", stereoWidthAtt);

    // Buttons
    addAndMakeVisible(nadaButton);
    nadaButton.addListener(this);
    nadaButton.setAlpha(0.0f); // Overlay on the golden image

    setSize (1000, 750);
}

NADAAudioProcessorEditor::~NADAAudioProcessorEditor() { setLookAndFeel (nullptr); }

void NADAAudioProcessorEditor::paint (juce::Graphics& g)
{
    // 1. DRAW TITANIUM BACKGROUND
    if (backgroundImage.isValid())
        g.drawImageWithin (backgroundImage, 0, 0, getWidth(), getHeight(), juce::RectanglePlacement::fillDestination);

    // 2. TEXT (Luxury Bold)
    g.setColour (juce::Colours::white);
    g.setFont (juce::Font (36.0f, juce::Font::bold));
    g.drawText ("NADA BOSS VOCAL SUITE", 40, 40, 800, 60, juce::Justification::left);

    g.setFont (20.0f);
    g.setColour (juce::Colours::red.withAlpha(0.8f));
    g.drawText("AUTOTUNE", 100, 120, 200, 30, juce::Justification::centred);
    g.drawText("COMPRESSION", 350, 120, 300, 30, juce::Justification::centred);
    g.drawText("FX BUS", 700, 120, 200, 30, juce::Justification::centred);

    // 3. GOLDEN NADA CENTERPIECE
    if (buttonImage.isValid())
        g.drawImageWithin (buttonImage, getWidth()/2 - 100, getHeight() - 160, 200, 120, juce::RectanglePlacement::centred);
}

void NADAAudioProcessorEditor::resized()
{
    // Autotune
    autotuneSpeedSlider.setBounds(100, 160, 200, 200);
    
    // Dynamics
    fetThreshSlider.setBounds(360, 160, 130, 130);
    optoThreshSlider.setBounds(520, 160, 130, 130);
    fetRatioSlider.setBounds(360, 300, 130, 130);

    // FX
    reverbMixSlider.setBounds(700, 160, 120, 120);
    delayMixSlider.setBounds(850, 160, 120, 120);
    stereoWidthSlider.setBounds(775, 290, 130, 130);

    // NADA Button Hitbox
    nadaButton.setBounds(getWidth()/2 - 100, getHeight() - 160, 200, 120);
}

void NADAAudioProcessorEditor::buttonClicked (juce::Button* button)
{
    if (button == &nadaButton) audioProcessor.triggerNADAAnalysis();
}
