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
    // --- 1. SETUP WEB VIEW ---
    auto options = juce::WebBrowserComponent::Options{}
        .withResourceProvider ([this](const juce::String& url) {
            auto fileName = url == "/" ? "index.html" : url.fromFirstOccurrenceOf("/", false, false);
            auto file = juce::File::getCurrentWorkingDirectory().getChildFile("Source").getChildFile("Interface").getChildFile(fileName);
            if (file.existsAsFile())
                return std::make_optional (juce::WebBrowserComponent::Resource { file.loadFileAsData(), file.getFileExtension().replace(".", "") });
            return std::optional<juce::WebBrowserComponent::Resource>{};
        });

    webView = std::make_unique<juce::WebBrowserComponent>(options);
    
    // --- 2. NATIVE BRIDGE (JS -> C++) ---
    webView->addNativeAlias ("juce", [this] (const juce::var& method, const juce::Array<juce::var>& args) {
        if (method == "setParam" && args.size() >= 2) {
            juce::String paramID = args[0].toString();
            float value = (float)args[1];
            if (auto* param = audioProcessor.apvts.getParameter(paramID))
                param->setValueNotifyingHost(value);
        }
        return juce::var();
    });

    addAndMakeVisible (*webView);
    webView->goToURL ("http://localhost/");

    startTimerHz(30);
    setSize (1000, 750);
}

NADAAudioProcessorEditor::~NADAAudioProcessorEditor()
{
}

void NADAAudioProcessorEditor::paint (juce::Graphics& g)
{
}

void NADAAudioProcessorEditor::resized()
{
    webView->setBounds (getLocalBounds());
}

void NADAAudioProcessorEditor::timerCallback()
{
    // 1. Meters
    auto input = audioProcessor.inputLevel.load();
    auto gr = audioProcessor.grLevel.load();
    auto output = audioProcessor.outputLevel.load();
    
    juce::String meterJs = juce::String::formatted("if(window.updateMeters) updateMeters(%f, %f, %f);", input, gr, output);
    webView->executeJavaScript(meterJs);

    // 2. Spectrum (Simplified telemetry)
    juce::String specJs = juce::String::formatted("if(window.updateSpectrum) updateSpectrum([%f, %f, %f]);", 
        audioProcessor.lastAnalysis.lowEnergy, 
        audioProcessor.lastAnalysis.midEnergy, 
        audioProcessor.lastAnalysis.highEnergy);
    webView->executeJavaScript(specJs);
    
    // 3. LED Displays
    auto speed = audioProcessor.apvts.getRawParameterValue("AUTOTUNE_SPEED")->load();
    juce::String ledJs = juce::String::formatted("if(window.updateLedDisplay) updateLedDisplay('note', 'C#');"); // Note detection logic here
    webView->executeJavaScript(ledJs);

    // 4. Goniometer (Simplified)
    webView->executeJavaScript("if(window.updateGoniometer) updateGoniometer([0.1, 0.2, -0.1, 0.3]);");
}
