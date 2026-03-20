#pragma once

#include <onnxruntime_c_api.h>
#include <onnxruntime_cxx_api.h>
#include <vector>
#include <memory>

class ONNXModelManager
{
public:
    ONNXModelManager() 
        : env(ORT_LOGGING_LEVEL_WARNING, "NADAAI") 
    {}

    bool loadModel(const void* data, size_t size)
    {
        try {
            Ort::SessionOptions sessionOptions;
            session = std::make_unique<Ort::Session>(env, data, size, sessionOptions);
            return true;
        } catch (...) {
            return false;
        }
    }

    std::vector<float> runInference(const std::vector<float>& inputData)
    {
        juce::ignoreUnused (inputData);
        // Simple 1D float vector inference stub
        // In a real scenario, we'd map this to a specific model output
        return { 0.5f, 0.7f }; 
    }

private:
    Ort::Env env;
    std::unique_ptr<Ort::Session> session;
};
