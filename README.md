# NADA CHANNEL STRIP 🎬💎🚀🎙️

The ultimate vocal production suite. A professional 14-stage channel strip featuring AI-driven sound matching and boutique hardware emulation.

## 🚀 Key Features
- **14-Stage DSP Path**: Crispytuner, Pro-Q 3 EQ, 1176, LA-2A, Pultec, SSL 4kG, HG-2, etc.
- **AI ANALYZE**: Single-click "US Vocal" profiling using spectral heuristics.
- **Precision GUI**: High-fidelity 1600x900 hardware-style interface with real-time analyzers.
- **Zero-Latency**: Optimized C++ backend with no dynamic allocations in the audio thread.

## 🛠️ Build Instructions

### GUI (React)
```bash
cd Source/gui/vst-gui
npm install
npm run build:release
```

### VST (JUCE)
Open `NADA BOSS.jucer` in the Projucer and build for your target platform (VST3/AU/Standalone).

## 📄 Documentation
- [DSP_NOTES.md](./DSP_NOTES.md): Technical details on algorithms.
- [OPTIMIZATION_NOTES.md](./OPTIMIZATION_NOTES.md): Performance and cleanup details.
