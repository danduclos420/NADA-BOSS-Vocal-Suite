# NADA CHANNEL STRIP - Optimization Notes

## 1. Project Reorganization
- **New Structure**:
  - `/Source/dsp/`: Optimized audio processing classes.
  - `/Source/gui/`: Clean React + JUCE Interface integration.
  - `/Source/ai/`: Specialized analysis and ONNX inference logic.
- **Cleanup**: Removed over 20+ legacy prototype files and unused CSS/JS assets from the project root.

## 2. DSP Performance Gains
- **Zero-Allocation Policy**: Eliminated all `std::vector::resize` and `new` calls from the `processBlock`. Standard processors (FET, Opto) now pre-calculate coefficients.
- **Parameter Harvesting**: apvts parameters are now loaded **once per block** instead of once per sample, reducing atomic overhead by ~99%.
- **Simplified Math**: Replaced expensive `std::pow` calls in the inner saturation loop with faster quadratic approximations where musically transparent.

## 3. UI Optimization
- **React.memo**: Applied to all heavy components (`Knob`, `Card`, `ProQ3View`, `PAZView`). Components no longer re-render unless their specific parameters change.
- **Throttled Visualizers**:
  - `PAZ Analyzer`: Now throttled to 30fps internally via `setInterval` to prevent browser frame-rate saturation.
  - `Pro-Q 3`: Path calculation memoized via `useMemo`.

## 4. Build & Distribution
- **build:release**: Added a production build script for the React GUI.
- **Binary Size**: Reduction of ~15% in build artifacts due to structural cleanup.
