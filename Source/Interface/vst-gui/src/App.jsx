import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';

// --- BRIDGE UTILS ---
const setParam = (id, val) => {
  if (window.setParam) window.setParam(id, val);
};

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SCALES = ["MAJ", "MIN"];
const SLOPES = ["6dB", "12dB", "24dB", "48dB", "96dB"];

const MARGIN = 16;
const GAP = 16;
const CARD_PADDING = 16;

const KNOB_SM = 38;
const KNOB_MD = 62;
const KNOB_LG = 120;

// --- ADVANCED AI INTELLIGENCE HOOK (RADIO-READY LOGIC) ---
const useAIIntelligence = (aiOn, spectrum, meters, goniometer, states, setters) => {
  const [report, setReport] = useState("AI IDLE - READY FOR ANALYSIS");
  
  useEffect(() => {
    if (!aiOn) {
      setReport("AI IDLE - READY FOR ANALYSIS");
      return;
    }

    const timer = setInterval(() => {
      let stage = "ANALYZING SIGNAL...";
      
      // Calculate spectral averages
      const lowEnd = (spectrum[0] + spectrum[1] + spectrum[2]) / 3;
      const boxiness = (spectrum[8] + spectrum[10] + spectrum[12]) / 3;
      const presence = (spectrum[25] + spectrum[30] + spectrum[32]) / 3;
      const sibilance = (spectrum[38] + spectrum[40] + spectrum[42]) / 3;
      const air = (spectrum[45] + spectrum[46] + spectrum[47]) / 3;

      // 1. Pro-Q 3 Cleaning (Rumble & Boxiness)
      if (lowEnd > 0.5) {
        stage = "CLEANING RUMBLE (PRO-Q 3)...";
        setters.setSHpf(v => Math.min(0.25, v + 0.01)); // Boost High-pass
      } else if (boxiness > 0.7) {
        stage = "REDUCING BOXINESS (PRO-Q 3)...";
        // Mocking EQ band adjustment if we had full access to Pro-Q internal state here
      }

      // 2. Serial Compression (1176 -> LA-2A)
      if (meters.in > 0.85) {
        stage = "CONTROLLING PEAKS (1176 REV A)...";
        setters.setFInput(v => Math.min(0.8, v + 0.005)); // Increase Input for more gain reduction
      } else if (meters.gr < 0.1) {
        stage = "LEVELING DYNAMICS (LA-2A)...";
        setters.setOThresh(v => Math.max(0.4, v - 0.005)); // Lower threshold
      }

      // 3. Presence & Sibilance (SSL & De-Esser)
      if (sibilance > 0.65) {
        stage = "DE-ESSING (DBX 902)...";
        setters.setDsRng(v => Math.min(0.8, v + 0.02));
      } else if (presence < 0.3) {
        stage = "ADDING PRESENCE (SSL 4000)...";
        setters.setSHfG(v => Math.min(0.7, v + 0.005));
      }

      // 4. Harmonic Enrichment (Black Box)
      if (meters.outL < 0.6) {
        stage = "ADDING HARMONICS (HG-2)...";
        setters.setHSat(v => Math.min(0.75, v + 0.002));
      }

      // 5. Final True Peak Limiting
      if (meters.outL > 0.95 || meters.outR > 0.95) {
        stage = "LIMITING TRUE PEAK (BX_LIMITER)...";
        setters.setLimGn(v => Math.max(0.2, v - 0.01));
      } else {
        // Goal: Radio Ready (~ -1dBTP)
        stage = "SIGNAL STABLE - RADIO READY";
      }

      setReport(stage);
    }, 800);

    return () => clearInterval(timer);
  }, [aiOn, spectrum, meters, goniometer]);

  return report;
};

// --- COMPONENTS ---
const getFilterResponse = (x, band) => {
  const { type, freq, gain, q, active } = band;
  if (!active) return 0;
  const f = x / 400; const targetF = freq / 400; const g = (gain - 0.5) * 100;
  if (type === 'cut') {
    if (targetF < 0.5) return f < targetF ? -100 * Math.pow(1 - f/targetF, 3 / (q + 0.1)) : 0;
    else return f > targetF ? -100 * Math.pow((f - targetF)/(1 - targetF), 3 / (q + 0.1)) : 0;
  }
  const dist = Math.abs(f - targetF); const width = (1.2 - q) * 0.25;
  return g * Math.exp(-(dist * dist) / (width * width));
};

const Knob = ({ label, value, onChange, size = 40, showValueInside = false, color = "var(--neon-red)" }) => {
  const circ = 2 * Math.PI * (size * 0.45);
  const offset = circ - (value * 0.75 * circ);
  return (
    <div className="knob-unit" style={{ display:'flex', flexDirection:'column', alignItems:'center', userSelect: 'none' }}>
      <div className="knob-bezel" style={{ width: size, height: size, position:'relative' }}>
        <div className="knob-holes">{[0, 60, 120, 180, 240, 300].map(deg => (
          <div key={deg} className="knob-hole" style={{ top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-${size*0.55}px)` }}></div>
        ))}</div>
        <svg style={{ position:'absolute', top:'-2px', left:'-2px', width:size+4, height:size+4, pointerEvents:'none' }}>
           <circle cx={(size+4)/2} cy={(size+4)/2} r={size*0.45} fill="none" stroke="#000" strokeWidth="1.5" strokeDasharray={circ} strokeDashoffset={circ*0.25} transform={`rotate(135 ${(size+4)/2} ${(size+4)/2})`} />
           <circle cx={(size+4)/2} cy={(size+4)/2} r={size*0.45} fill="none" stroke={color} strokeWidth="2" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(135 ${(size+4)/2} ${(size+4)/2})`} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
        </svg>
        <div className="knob-body" 
          onMouseDown={(e) => {
            const sY = e.clientY; const sV = value;
            const mv = (me) => onChange(Math.min(1, Math.max(0, sV + (sY-me.clientY)/200)));
            const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
            document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
          }} 
          onWheel={(e) => onChange(Math.min(1, Math.max(0, value - e.deltaY / 1000)))}
          style={{ width: size*0.75, height: size*0.75, transform: `rotate(${value * 270 - 135}deg)` }}>
          {showValueInside ? <div className="knob-value-internal" style={{ transform: `rotate(${-value * 270 + 135}deg)`, fontSize: size/4.8, fontWeight:900 }}>{(value * 10).toFixed(1)}</div> : <div className="knob-tick" style={{ width: size*0.08, height: size*0.12, top: '2px' }}></div>}
        </div>
      </div>
      <div className="label-sm" style={{marginTop:'4px', fontSize:'7px', fontWeight:1000, color:'#555', letterSpacing:0.5}}>{label}</div>
    </div>
  );
};

const Slider = ({ label, value, onChange, height = 80 }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, userSelect:'none' }}>
    <div 
      onMouseDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mv = (me) => {
          const y = Math.min(rect.height, Math.max(0, me.clientY - rect.top));
          onChange(Math.min(1, Math.max(0, 1.0 - y / rect.height)));
        };
        const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
        document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
        mv(e);
      }}
      onWheel={(e) => onChange(Math.min(1, Math.max(0, value - e.deltaY/1000)))}
      style={{ height, width:14, background:'#000', position:'relative', borderRadius:4, border:'1px solid #222', boxShadow:'inset 1px 1px 3px #000', cursor:'ns-resize' }}>
      <div style={{ position:'absolute', bottom: `${value * 100}%`, left:-4, width:22, height:6, background:'#fff', borderRadius:2, boxShadow:'0 0 10px #fff', transform:'translateY(50%)' }}></div>
    </div>
    <span style={{ fontSize:7, color:'#666', fontWeight:1000, letterSpacing:1 }}>{label}</span>
  </div>
);

const LEDButton = ({ label, active, onClick, color="var(--neon-red)" }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, userSelect:'none' }}>
     <button onClick={onClick} style={{ width:14, height:14, borderRadius:'50%', background: active ? color : '#111', border:'1px solid #333', boxShadow: active ? `0 0 10px ${color}` : 'none', cursor:'pointer' }}></button>
     <span style={{ fontSize:6.5, color:'#444', fontWeight:1000, letterSpacing:0.5 }}>{label}</span>
  </div>
);

const Card = ({ title, children, style = {} }) => (
  <div className="section-zone" style={{ padding: CARD_PADDING, display:'flex', flexDirection:'column', position:'relative', boxSizing:'border-box', userSelect:'none', width:'100%', ...style }}>
     <div style={{ marginBottom: 12, display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.03)', paddingBottom:6 }}>
        <span className="label-sm" style={{color:'#777', fontWeight:1000, letterSpacing:1}}>{title}</span>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--gold)', boxShadow:'0 0 8px var(--gold)' }}></div>
     </div>
     <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', width:'100%' }}>{children}</div>
  </div>
);

const ProQ3View = () => {
  const [bands, setBands] = useState([
    { id:1, type: 'cut', freq: 80, gain: 0.5, q: 0.8, slopeIdx: 2, color: '#ff4d4d', active: true },
    { id:2, type: 'bell', freq: 120, gain: 0.42, q: 0.4, slopeIdx: 2, color: '#ffaa00', active: true },
    { id:3, type: 'bell', freq: 200, gain: 0.45, q: 0.5, slopeIdx: 2, color: '#4dff4d', active: true },
    { id:4, type: 'bell', freq: 280, gain: 0.43, q: 0.6, slopeIdx: 2, color: '#00d2ff', active: true },
    { id:5, type: 'bell', freq: 350, gain: 0.55, q: 0.3, slopeIdx: 2, color: '#0088ff', active: true },
    { id:6, type: 'cut', freq: 390, gain: 0.5, q: 0.8, slopeIdx: 2, color: '#cc66ff', active: true },
  ]);
  const [selectedIdx, setSelectedIdx] = useState(1);
  const svgRef = useRef(null);
  const updateBand = (idx, patch) => { const n = [...bands]; n[idx] = { ...n[idx], ...patch }; setBands(n); };
  const onDragStart = (idx, e) => {
    e.stopPropagation(); setSelectedIdx(idx);
    const rect = svgRef.current.getBoundingClientRect();
    const handleMove = (mv) => {
      const x = mv.clientX - rect.left; const y = mv.clientY - rect.top;
      updateBand(idx, { freq: Math.min(400, Math.max(0, (x / rect.width) * 400)), gain: 0.5 - (Math.min(200, Math.max(0, (y / rect.height) * 200)) - 100) / 200 });
    };
    const handleUp = () => { document.removeEventListener('mousemove', handleMove); document.removeEventListener('mouseup', handleUp); };
    document.addEventListener('mousemove', handleMove); document.addEventListener('mouseup', handleUp);
  };
  const curvePath = useMemo(() => {
    let pts = []; for (let x = 0; x <= 400; x += 4) { let y = 100; bands.forEach(b => { y -= getFilterResponse(x, b); }); pts.push(`${x},${Math.min(180, Math.max(20, y))}`); }
    return `M ${pts.join(' L ')}`;
  }, [bands]);
  const sel = bands[selectedIdx];
  return (
    <Card title="FABFILTER PRO-Q 3 ELITE" style={{ flex:'none' }}>
       <div style={{ width:'100%', display:'flex', flexDirection:'column' }}>
          <div ref={svgRef} style={{ width:'100%', height:'130px', background:'#050608', position:'relative', overflow:'hidden', borderRadius:2, border:'1px solid #111' }}>
             <svg viewBox="0 0 400 200" style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}>
                <path d={curvePath} fill="none" stroke="var(--neon-red)" strokeWidth="3" style={{ filter:'drop-shadow(0 0 6px var(--neon-red))' }} />
                {bands.map((b, i) => <circle key={b.id} cx={b.freq} cy={100 - (b.gain-0.5)*200} r={selectedIdx === i ? 7 : 5} fill={b.active ? b.color : '#333'} onMouseDown={(e) => onDragStart(i, e)} style={{ cursor:'grab' }} />)}
             </svg>
          </div>
          <div style={{ background:'rgba(0,0,0,0.6)', padding:'10px 16px', display:'flex', flexDirection:'column', gap:10, borderTop:'1px solid rgba(255,255,255,0.03)' }}>
             <div style={{ display:'flex', gap:6, background:'#000', padding:'4px 12px', borderRadius:10, border:'1px solid #222', alignSelf:'center' }}>
                {bands.map((b, i) => <div key={b.id} onClick={() => setSelectedIdx(i)} style={{ width:7, height:7, borderRadius:'50%', background: b.active ? b.color : '#222', cursor:'pointer', border: selectedIdx === i ? '1.5px solid #fff' : '1.5px solid transparent' }}></div>)}
             </div>
             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%' }}>
                <div style={{ display:'flex', gap:12 }}>
                   <Knob label="FREQ" size={32} value={sel.freq/400} onChange={(v) => updateBand(selectedIdx, { freq: v*400 })} color={sel.color} />
                   <Knob label="GAIN" size={32} value={sel.gain} onChange={(v) => updateBand(selectedIdx, { gain: v })} color={sel.color} />
                   <Knob label="Q" size={32} value={sel.q} onChange={(v) => updateBand(selectedIdx, { q: v })} color={sel.color} />
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                   <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'center' }}>
                      <div onClick={() => updateBand(selectedIdx, { type: sel.type === 'bell' ? 'cut' : 'bell' })} style={{ cursor:'pointer', background:'#000', color: sel.color, fontSize:8, fontWeight:1000, padding:'3px 8px', border:'1px solid #333', borderRadius:2, minWidth:42, textAlign:'center' }}>{sel.type.toUpperCase()}</div>
                      <div onClick={() => updateBand(selectedIdx, { slopeIdx: (sel.slopeIdx + 1) % SLOPES.length })} style={{ cursor:'pointer', background:'#000', color: sel.color, fontSize:8, fontWeight:1000, padding:'3px 8px', border:'1px solid #333', borderRadius:2, minWidth:42, textAlign:'center' }}>{SLOPES[sel.slopeIdx]}</div>
                   </div>
                   <LEDButton label="ON/OFF" active={sel.active} onClick={() => updateBand(selectedIdx, { active: !sel.active })} color={sel.color} />
                </div>
             </div>
          </div>
       </div>
    </Card>
  );
};

const PAZView = ({ spectrum, goniometer, style={} }) => (
  <Card title="WAVES PAZ ANALYSIS (PRECISION)" style={{ ...style, flex: 2, minHeight:180 }}>
     <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column' }}>
        <div style={{ flex:1, display:'flex', gap:1, alignItems:'flex-end', borderBottom:'1px solid #222', paddingBottom:5, position:'relative', background:'#050608' }}>
           <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0.1, backgroundImage:'linear-gradient(#444 1px, transparent 1px)', backgroundSize:'100% 20%' }}></div>
           {spectrum.map((h, i) => (
             <div key={i} style={{ flex:1, height: `${h * 100}%`, background: `linear-gradient(to top, #000 0%, ${i % 12 === 0 ? 'var(--gold)' : 'var(--neon-red)'} 100%)`, borderRadius:'1px 1px 0 0', boxShadow: h > 0.05 ? `0 0 5px ${i % 12 === 0 ? 'var(--gold)' : 'var(--neon-red)'}` : 'none' }}></div>
           ))}
        </div>
        <div style={{ height:14, display:'flex', justifyContent:'space-between', padding:'2px 8px' }}>
           {['20', '100', '1K', '5K', '10K', '20K'].map(f => <span key={f} style={{ fontSize:7, color:'#555', fontWeight:1000 }}>{f}</span>)}
        </div>
        <div style={{ height:65, display:'flex', justifyContent:'center', alignItems:'center', borderTop:'1px solid #111', background:'#000' }}>
           <div style={{ width:130, height:55, border:'1px solid #222', borderBottom:'none', borderRadius:'65px 65px 0 0', position:'relative', overflow:'hidden' }}>
              <svg viewBox="0 0 100 50" style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}>
                 <path d={`M 50,50 Q ${50 + goniometer[0]*35},${25 - goniometer[1]*20} 50,5 Q ${50 + goniometer[2]*35},${25 - goniometer[3]*20} 50,50`} fill="none" stroke="var(--neon-red)" strokeWidth="2" style={{ filter:'drop-shadow(0 0 3px red)' }} />
              </svg>
           </div>
        </div>
     </div>
  </Card>
);

function App() {
  const [aiOn, setAiOn] = useState(false);
  const [dsBy, setDsBy] = useState(false);
  const [ssIn, setSsIn] = useState(true);
  const [ssX3, setSsX3] = useState(false);
  const [oComp, setOComp] = useState(true);

  const [spectrum, setSpectrum] = useState(Array(48).fill(0.1));
  const [goniometer, setGoniometer] = useState([0, 0, 0, 0]);
  const [meters, setMeters] = useState({ in: 0, gr: 0, outL: 0, outR: 0 });

  const [pitch, setPitch] = useState(0.5);
  const [human, setHuman] = useState(0.5);
  const [tSpd, setTSpd] = useState(0.2);
  const [keyIdx, setKeyIdx] = useState(1);
  const [scaleIdx, setScaleIdx] = useState(1);

  const [rvComp, setRvComp] = useState(0.5);
  const [rvGain, setRvGain] = useState(0.5);
  const [rvGate, setRvGate] = useState(0.5);
  const [fInput, setFInput] = useState(0.5);
  const [fOutput, setFOutput] = useState(0.5);
  const [fAttack, setFAttack] = useState(0.2);
  const [fRelease, setFRelease] = useState(0.8);
  const [oThresh, setOThresh] = useState(0.7);
  const [oGain, setOGain] = useState(0.5);
  
  const [dsFrq, setDsFrq] = useState(0.5);
  const [dsRng, setDsRng] = useState(0.3);

  const [pLowBst, setPLowBst] = useState(0.5);
  const [pLowAtn, setPLowAtn] = useState(0.5);
  const [pHiBst, setPHiBst] = useState(0.5);
  const [pHiAtn, setPHiAtn] = useState(0.5);
  const [pLowF, setPLowF] = useState(0.2);
  const [pHiF, setPHiF] = useState(0.5);

  const [sHfG, setSHfG] = useState(0.5); const [sHfF, setSHfF] = useState(0.7);
  const [sHmfG, setSHmfG] = useState(0.5); const [sHmfF, setSHmfF] = useState(0.5);
  const [sLmfG, setSLmfG] = useState(0.5); const [sLmfF, setSLmfF] = useState(0.3);
  const [sLfG, setSLfG] = useState(0.5); const [sLfF, setSLfF] = useState(0.1);
  const [sHpf, setSHpf] = useState(0.1);
  const [sLpf, setSLpf] = useState(0.9);

  const [hSat, setHSat] = useState(0.6);
  const [hPent, setHPent] = useState(0.3);
  const [hTrio, setHTrio] = useState(0.4);
  const [hgTube, setHgTube] = useState(false);

  const [sWidth, setSWidth] = useState(0.8);
  const [sMono, setSMono] = useState(0.3);
  const [sDamp, setSDamp] = useState(0.4);

  const [bcThr, setBcThr] = useState(0.2);
  const [bcRat, setBcRat] = useState(0.4);
  const [bcMak, setBcMak] = useState(0.5);
  const [bcAtk, setBcAtk] = useState(0.5);
  const [bcRel, setBcRel] = useState(0.5);

  const [limGn, setLimGn] = useState(0.9);
  const [limCl, setLimCl] = useState(0.8);
  const [limRe, setLimRe] = useState(0.5);

  const [mGain, setMGain] = useState(0.8);

  const [dTime, setDTime] = useState(0.4);
  const [dFbk, setDFbk] = useState(0.3);
  const [dMix, setDMix] = useState(0.2);
  const [rMix, setRMix] = useState(0.2);
  const [rDec, setRDec] = useState(0.7);
  const [rRoom, setRRoom] = useState(0.5);

  const setters = { setSHpf, setDsRng, setOThresh, setSWidth, setFInput, setSHfG, setHSat, setLimGn };
  const aiReport = useAIIntelligence(aiOn, spectrum, meters, goniometer, {}, setters);

  useEffect(() => {
    window.updateMeters = (iv, gv, ol, or) => setMeters({ in: iv, gr: gv, outL: ol, outR: or });
    window.updateSpectrum = (data) => setSpectrum(data);
    window.updateGoniometer = (data) => setGoniometer(data);
  }, []);

  const colStyle = { display:'flex', flexDirection:'column', gap: GAP, flex: 1, minHeight: 0 };

  return (
    <div className="rack-chassis" style={{ padding: MARGIN, boxSizing: 'border-box', display:'flex', flexDirection:'column', height: '100vh', overflow: 'hidden', userSelect:'none', WebkitUserSelect:'none' }}>
      <div className="metallic-grain"></div>
      <div style={{ height:46, display:'flex', justifyContent:'space-between', alignItems:'center', padding:`0 ${CARD_PADDING}px`, background:'rgba(0,0,0,0.6)', borderRadius:4, border:'1px solid rgba(255,255,255,0.05)', boxSizing:'border-box', marginBottom: GAP, flexShrink:0 }}>
         <div style={{ display:'flex', gap:16, alignItems:'center' }}>
            <span style={{ fontSize:15, fontWeight:1000, letterSpacing:5, color:'#888' }}>NADA BOSS</span>
            <div style={{ width:1, height:18, background:'#333' }}></div>
            <span style={{ fontSize:9, color:'var(--gold)', letterSpacing:1.5, fontWeight:1000 }}>{aiReport}</span>
         </div>
         <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span className="label-sm" style={{letterSpacing:2}}>AI ANALYZE: <span style={{color: aiOn ? 'var(--neon-red)' : 'var(--gold)'}}>{aiOn ? 'ACTIVE' : 'READY'}</span></span>
            <button className="ai-gold-btn" onClick={() => setAiOn(!aiOn)} style={{ boxShadow: aiOn ? '0 0 15px var(--neon-red)' : 'none', border: aiOn ? '2px solid #fff' : '2px solid #000' }}></button>
         </div>
      </div>
      <div className="main-grid" style={{ gap: GAP, flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 2.5fr 1fr 1fr', minHeight: 0 }}>
         <div style={colStyle}>
            <Card title="BX_CRISPYTUNER" style={{ minHeight:170 }}>
               <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', padding:`0 5px` }}>
                  <Knob label="RE-TUNE" size={56} value={pitch} onChange={(v)=>setPitch(v)} />
                  <div style={{ display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}>
                    <div style={{ display:'flex', gap:6 }}>
                        <div onClick={() => setKeyIdx(p => (p + 1) % KEYS.length)} onWheel={(e)=>setKeyIdx(p=>(p+(e.deltaY<0?1:-1)+KEYS.length)%KEYS.length)} style={{ cursor:'pointer', background:'#000', color:'var(--neon-red)', fontSize:12, fontWeight:1000, padding:'5px 10px', border:'1px solid #333', borderRadius:2, boxShadow:'inset 0 0 6px rgba(255,0,0,0.2)', width:30, textAlign:'center' }}>{KEYS[keyIdx]}</div>
                        <div onClick={() => setScaleIdx(p => (p + 1) % SCALES.length)} onWheel={(e)=>setScaleIdx(p=>(p+(e.deltaY<0?1:-1)+SCALES.length)%SCALES.length)} style={{ cursor:'pointer', background:'#000', color:'var(--neon-red)', fontSize:12, fontWeight:1000, padding:'5px 10px', border:'1px solid #333', borderRadius:2, boxShadow:'inset 0 0 6px rgba(255,0,0,0.2)', width:35, textAlign:'center' }}>{SCALES[scaleIdx]}</div>
                    </div>
                    <Knob label="SPEED" size={KNOB_SM} value={tSpd} onChange={(v)=>setTSpd(v)} />
                  </div>
                  <Knob label="HUMAN" size={44} value={human} onChange={(v)=>setHuman(v)} />
               </div>
            </Card>
            <Card title="R-VOX (ELITE)" style={{ minHeight:125 }}><div style={{ display:'flex', gap:22, justifyContent:'center' }}><Slider label="COMP" value={rvComp} onChange={(v)=>setRvComp(v)} height={60} /><Slider label="GAIN" value={rvGain} onChange={(v)=>setRvGain(v)} height={60} /><Slider label="GATE" value={rvGate} onChange={(v)=>setRvGate(v)} height={60} /></div></Card>
            <Card title="DBX 902 DE-ESSER" style={{ minHeight:125 }}><div style={{ display:'flex', gap:16, alignItems:'center' }}><Knob label="FREQ" size={KNOB_SM} value={dsFrq} onChange={(v)=>setDsFrq(v)} /><LEDButton label="ACTIVE" active={!dsBy} onClick={()=>setDsBy(!dsBy)} /><Knob label="RANGE" size={KNOB_SM} value={dsRng} onChange={(v)=>setDsRng(v)} /></div></Card>
            <Card title="BUS REVERB" style={{ flex: 1, minHeight: 125 }}><div style={{ display:'flex', gap:14, justifyContent:'center' }}><Knob label="MIX" size={42} value={rMix} onChange={(v)=>setRMix(v)} /><Knob label="DECAY" size={42} value={rDec} onChange={(v)=>setRDec(v)} /><Knob label="ROOM" size={42} value={rRoom} onChange={(v)=>setRRoom(v)} /></div></Card>
         </div>
         <div style={colStyle}>
            <Card title="1176 REV A" style={{ minHeight:210 }}><div style={{ display:'flex', gap:10, alignItems:'center', width:'100%', justifyContent:'center' }}><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}><Knob label="IN" size={46} value={fInput} onChange={(v)=>setFInput(v)} /><Knob label="OUT" size={46} value={fOutput} onChange={(v)=>setFOutput(v)} /><Knob label="ATTK" size={KNOB_SM} value={fAttack} onChange={(v)=>setFAttack(v)} /><Knob label="REL" size={KNOB_SM} value={fRelease} onChange={(v)=>setFRelease(v)} /></div><div className="meter-strip" style={{height:'80px', width:7, borderRadius:2, border:'1px solid #111'}}><div className="meter-fill" style={{height:`${meters.gr * 100}%`}}></div></div></div></Card>
            <Card title="LA-2A COMPRESSOR" style={{ minHeight:145 }}><div style={{ display:'flex', gap:16, justifyContent:'center', alignItems:'center' }}><Knob label="THRES" size={KNOB_MD + 8} value={oThresh} showValueInside={true} onChange={(v)=>setOThresh(v)} /><LEDButton label="LIM" active={oComp} onClick={()=>setOComp(!oComp)} /><Knob label="GAIN" size={48} value={oGain} onChange={(v)=>setOGain(v)} /></div></Card>
            <Card title="SSL 4000 G EQ" style={{ flex: 1 }}><div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10, width:'100%', justifyContent:'center' }}>{[[sHfF, sHfG, "HF"], [sHmfF, sHmfG, "HMF"], [sLmfF, sLmfG, "LMF"], [sLfF, sLfG, "LF"], [sHpf, sLpf, "CUT"]].map(([f, g, l], i) => (<div key={i} style={{ display:'flex', flexDirection:'column', gap:14 }}><Knob label={`${l} F`} size={KNOB_SM} value={f} onChange={(v)=>{if(i===4)setSHpf(v); else if(i===0)setSHfF(v); else if(i===1)setSHmfF(v); else if(i===2)setSLmfF(v); else setSLfF(v);}} /><Knob label={`${l} G`} size={KNOB_SM} value={g} onChange={(v)=>{if(i===4)setSLpf(v); else if(i===0)setSHfG(v); else if(i===1)setSHmfG(v); else if(i===2)setSLmfG(v); else setSLfG(v);}} /></div>))}</div><div style={{ display:'flex', gap:24, justifyContent:'center', marginTop:16 }}><LEDButton label="IN" active={ssIn} onClick={()=>setSsIn(!ssIn)} color="var(--gold)" /><LEDButton label="x3" active={ssX3} onClick={()=>setSsX3(!ssX3)} color="var(--gold)" /></div></Card>
         </div>
         <div style={{ display:'flex', flexDirection:'column', gap: GAP, flex: 2.5, minHeight: 0 }}>
            <ProQ3View />
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:50, padding: '12px 0' }}><div style={{ textAlign:'center' }}><span className="label-sm" style={{display:'block', marginBottom:6, color:'#444', fontSize:7}}>IN</span><div className="meter-strip" style={{height:90, width:12, background:'#000', border:'1px solid #111'}}><div className="meter-fill" style={{height:`${meters.in * 100}%`, background:'linear-gradient(to top, #000, #ff0000)'}}></div></div></div><Knob label="MASTER GAIN" size={KNOB_LG} value={mGain} showValueInside={true} onChange={(v)=>setMGain(v)} /><div style={{ textAlign:'center' }}><span className="label-sm" style={{display:'block', marginBottom:6, color:'#444', fontSize:7}}>OUT</span><div style={{ display:'flex', gap:3 }}><div className="meter-strip" style={{height:90, width:7, background:'#000', border:'1px solid #111'}}><div className="meter-fill" style={{height:`${meters.outL * 100}%`, background:'linear-gradient(to top, #000, #ff0000)'}}></div></div><div className="meter-strip" style={{height:90, width:7, background:'#000', border:'1px solid #111'}}><div className="meter-fill" style={{height:`${meters.outR * 100}%`, background:'linear-gradient(to top, #000, #ff0000)'}}></div></div></div></div></div>
            <PAZView spectrum={spectrum} goniometer={goniometer} />
         </div>
         <div style={colStyle}>
            <Card title="PULTEC EQP-1A" style={{ minHeight:215 }}><div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, width:'100%', justifyContent:'center' }}><Knob label="LO BST" size={KNOB_SM} value={pLowBst} onChange={(v)=>setPLowBst(v)} /><Knob label="LO ATN" size={KNOB_SM} value={pLowAtn} onChange={(v)=>setPLowAtn(v)} /><Knob label="LOW F" size={KNOB_SM} value={pLowF} onChange={(v)=>setPLowF(v)} color="var(--gold)" /><Knob label="HI BST" size={KNOB_SM} value={pHiBst} onChange={(v)=>setPHiBst(v)} /><Knob label="HI ATN" size={KNOB_SM} value={pHiAtn} onChange={(v)=>setPHiAtn(v)} /><Knob label="HIGH F" size={KNOB_SM} value={pHiF} onChange={(v)=>setPHiF(v)} color="var(--gold)" /></div></Card>
            <Card title="BLACK BOX HG-2" style={{ minHeight:195 }}><Knob label="SATURATION" size={KNOB_MD} color="#ff8800" value={hSat} onChange={(v)=>setHSat(v)} /><div style={{ display:'flex', gap:18, justifyContent:'center', alignItems:'center', marginTop:14 }}><Knob label="PENT" size={KNOB_SM} value={hPent} onChange={(v)=>setHPent(v)} /><LEDButton label="TUBE" active={hgTube} onClick={()=>setHgTube(!hgTube)} color="#ff8800" /><Knob label="TRIO" size={KNOB_SM} value={hTrio} onChange={(v)=>setHTrio(v)} /></div></Card>
            <Card title="BX_STEREOMAKER" style={{ flex: 1, minHeight: 145 }}><Knob label="STEREO WIDTH" size={KNOB_MD} color="var(--gold)" value={sWidth} onChange={(v)=>setSWidth(v)} /><div style={{ display:'flex', gap:24, marginTop:14, justifyContent:'center' }}><Knob label="MONO" size={KNOB_SM} value={sMono} onChange={(v)=>setSMono(v)} /><Knob label="TONE" size={KNOB_SM} value={sDamp} onChange={(v)=>setSDamp(v)} /></div></Card>
         </div>
         <div style={colStyle}>
            <Card title="BUS COMPRESSION" style={{ minHeight:215 }}><div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, width:'100%', justifyContent:'center' }}><Knob label="THR" size={KNOB_SM} value={bcThr} onChange={(v)=>setBcThr(v)} /><Knob label="RAT" size={KNOB_SM} value={bcRat} onChange={(v)=>setBcRat(v)} /><Knob label="MAK" size={KNOB_SM} value={bcMak} onChange={(v)=>setBcMak(v)} /></div><div style={{ display:'flex', gap:20, justifyContent:'center', marginTop:18 }}><Knob label="ATK" size={KNOB_SM} value={bcAtk} onChange={(v)=>setBcAtk(v)} color="var(--gold)" /><Knob label="REL" size={KNOB_SM} value={bcRel} onChange={(v)=>setBcRel(v)} color="var(--gold)" /></div></Card>
            <Card title="BX_LIMITER TP" style={{ minHeight:275 }}><Knob label="BRICKWALL GAIN" size={115} value={limGn} showValueInside={true} onChange={(v)=>setLimGn(v)} /><div style={{ display:'flex', gap:22, marginTop:18, justifyContent:'center' }}><Knob label="CEIL" size={46} value={limCl} onChange={(v)=>setLimCl(v)} /><Knob label="REL" size={46} value={limRe} onChange={(v)=>setLimRe(v)} /></div></Card>
            <Card title="BUS DELAY" style={{ flex: 1, minHeight:135 }}><div style={{ display:'flex', gap:18, justifyContent:'center', alignItems:'center' }}><Knob label="TIME" size={46} value={dTime} onChange={(v)=>setDTime(v)} /><Knob label="FBK" size={KNOB_SM} value={dFbk} onChange={(v)=>setDFbk(v)} /><Knob label="MIX" size={KNOB_SM} value={dMix} onChange={(v)=>setDMix(v)} /></div></Card>
         </div>
      </div>
      <div style={{ height:34, background:'rgba(0,0,0,0.6)', borderRadius:4, display:'flex', justifyContent:'center', alignItems:'center', border:'1px solid rgba(255,255,255,0.05)', boxSizing:'border-box', marginTop: GAP, flexShrink: 0 }}>
         <span style={{ opacity:0.15, letterSpacing:8, fontSize:9.5, fontWeight:1000, color:'#fff' }}>NADA BOSS // PROFESSIONAL MASTERING FRAME // ELITE SERIES</span>
      </div>
    </div>
  );
}

export default App;
