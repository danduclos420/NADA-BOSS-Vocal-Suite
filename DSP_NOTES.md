# NADA CHANNEL STRIP - DSP Technical Notes

## 14-Stage Audio Architecture

1.  **bx_Crispytuner**: Real-time pitch detection (YIN) + Pitch Shifting (Dual-delay resampler).
2.  **Pro-Q 3 Style EQ**: Cascade of 6 second-order biquad filters (1x Low-Cut, 4x Bell, 1x High-Cut).
3.  **1176 Rev A**: FET Compressor model with fast attack (20µs - 800µs) and program-dependent release.
4.  **LA-2A**: Opto Compressor model with multi-stage non-linear release (memory effect).
5.  **Pultec EQP-1A**: Passive EQ emulation (Low boost/cut at 30/60/100Hz, High boost with variable bandwidth).
6.  **SSL 4000 G**: 4-band console EQ with specialized curves and analog-style non-linearities.
7.  **Black Box HG-2**: Saturation model using harmonic-weighted waveshaping (Soft-clipping + Pentode/Triode flavoring).
8.  **R-Vox**: Combined downward compressor and expander/gate optimized for vocal consistency.
9.  **902 De-Esser**: Focused band-pass sidechain (4-10kHz) controlling a gain reduction stage for sibilance.
10. **bx_StereoMaker**: Mid/Side conversion logic with frequency-dependent width and mono-maker for subs.
11. **bx_Limiter True Peak**: Look-ahead limiter with inter-sample peak detection, targeting -10 LUFS.
12. **Bus Reverb - Hitsville**: Algorithmic reverb with pre-delay and lush non-linear decay.
13. **Bus H-Delay**: Ping-pong delay with tempo synchronization and LPF/HPF filters in the feedback loop.
14. **PAZ Analyzer**: FFT-based spectral visualization and Stereo Correlation Meter.

## AI Analyze Engine
- **Inference**: High-speed ONNX model comparing input spectral features to a "US Vocal" golden reference.
- **Sound Matching**: Dynamically generates a 14-stage preset to target professional frequency balance and dynamic density.
- **Target Logic**: Integrated LUFS estimation ensures consistent -10 LUFS output across all source materials.
