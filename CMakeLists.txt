cmake_minimum_required(VERSION 3.22)

project(NADA_BOSS_VOCAL_SUITE VERSION 1.0.0)

# 1. Fetch JUCE
include(FetchContent)
FetchContent_Declare(
    juce
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG        8.0.4
)
FetchContent_MakeAvailable(juce)

# 2. Setup Plugin
juce_add_plugin(NADA_BOSS_VOCAL_SUITE
    COMPANY_NAME "AntigravityAI"
    BUNDLE_ID "com.AntigravityAI.NADABOSSVocalSuite"
    IS_SYNTH FALSE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS TRUE
    PLUGIN_CODE "NADA"
    FORMATS VST3
    PRODUCT_NAME "NADA BOSS Vocal Suite"
    NEEDS_WEBVIEW2 FALSE
)

# 3. Generate JuceHeader.h
juce_generate_juce_header(NADA_BOSS_VOCAL_SUITE)

# 4. Source Files - NATIVE JUCE ONLY
target_sources(NADA_BOSS_VOCAL_SUITE PRIVATE
    Source/dsp/PluginProcessor.cpp
    Source/dsp/PluginProcessor.h
    Source/gui/PluginEditor.cpp
    Source/gui/PluginEditor.h
    Source/ai/ONNXModelManager.h
)

target_include_directories(NADA_BOSS_VOCAL_SUITE PRIVATE 
    Source/dsp
    Source/gui
    Source/ai
)

# 5. Compile Definitions
target_compile_definitions(NADA_BOSS_VOCAL_SUITE
    PUBLIC
    JUCE_WEB_BROWSER=0
    JUCE_USE_WIN_WEBVIEW2=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
)

# 6. Link JUCE Libraries
target_link_libraries(NADA_BOSS_VOCAL_SUITE PRIVATE
    juce::juce_audio_utils
    juce::juce_audio_processors
    juce::juce_audio_formats
    juce::juce_audio_devices
    juce::juce_events
    juce::juce_core
    juce::juce_data_structures
    juce::juce_dsp
    juce::juce_gui_extra
    juce::juce_graphics
)

# 7. ONNX Runtime (Optional - for AI)
include(FetchContent)
FetchContent_Declare(
    onnxruntime
    URL https://github.com/microsoft/onnxruntime/releases/download/v1.18.0/onnxruntime-win-x64-1.18.0.zip
)
FetchContent_MakeAvailable(onnxruntime)

target_include_directories(NADA_BOSS_VOCAL_SUITE PRIVATE ${onnxruntime_SOURCE_DIR}/include)
target_link_libraries(NADA_BOSS_VOCAL_SUITE PRIVATE ${onnxruntime_SOURCE_DIR}/lib/onnxruntime.lib)

# 8. Post-Build DLL Copy
add_custom_command(TARGET NADA_BOSS_VOCAL_SUITE POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
    "${onnxruntime_SOURCE_DIR}/lib/onnxruntime.dll"
    $<TARGET_FILE_DIR:NADA_BOSS_VOCAL_SUITE>
)
