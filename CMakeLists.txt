cmake_minimum_required(VERSION 3.22)

project(NADA_BOSS_VOCAL_SUITE VERSION 1.0.0)

# 1. Fetch JUCE
include(FetchContent)
FetchContent_Declare(
    juce
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG        7.0.7
)
FetchContent_MakeAvailable(juce)

# 2. Setup Plugin
juce_add_plugin(NADA_BOSS_VOCAL_SUITE
    COMPANY_NAME "Antigravity AI"
    IS_SYNTH FALSE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS TRUE
    PLUGIN_CODE "NADA"
    FORMATS VST3
    PRODUCT_NAME "NADA BOSS Vocal Suite"
)

# 3. Generate JuceHeader.h
juce_generate_juce_header(NADA_BOSS_VOCAL_SUITE)

# 4. Source Files
target_sources(NADA_BOSS_VOCAL_SUITE PRIVATE
    Source/PluginProcessor.cpp
    Source/PluginProcessor.h
    Source/PluginEditor.cpp
    Source/PluginEditor.h
)

# 5. Dependencies
target_compile_definitions(NADA_BOSS_VOCAL_SUITE
    PUBLIC
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
)

target_link_libraries(NADA_BOSS_VOCAL_SUITE PRIVATE
    juce::juce_audio_utils
    juce::juce_audio_processors
    juce::juce_audio_basics
    juce::juce_dsp
    juce::juce_gui_extra
    juce::juce_graphics
)

# 6. Binary Data (LEGENDARY ASSETS)
juce_add_binary_data(Assets
    SOURCES
    Assets/background.png
    Assets/knob.png
    Assets/nada_ai_button.png
)

target_link_libraries(NADA_BOSS_VOCAL_SUITE PRIVATE Assets)
