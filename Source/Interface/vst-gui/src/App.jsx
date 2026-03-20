import React, { useState } from 'react';

const Knob = ({ label, initialValue = 0.5, size = 50, showValueInside = false, color = "var(--neon-red)" }) => {
  const [val, setVal] = useState(initialValue);
  const bezelSize = size;
  const bodySize = size * 0.75;
  const circ = 2 * Math.PI * (bezelSize * 0.45);
  const offset = circ - (val * 0.75 * circ);

  return (
    <div className="knob-unit" style={{ minWidth: size + 20 }}>
      <div className="knob-bezel" style={{ width: bezelSize, height: bezelSize }}>
        <svg style={{ position:'absolute', top:'-2px', left:'-2px', width:bezelSize+4, height:bezelSize+4 }}>
           <circle cx={(bezelSize+4)/2} cy={(bezelSize+4)/2} r={bezelSize*0.45} fill="none" stroke="#000" strokeWidth="1.5" strokeDasharray={circ} strokeDashoffset={circ*0.25} transform={`rotate(135 ${(bezelSize+4)/2} ${(bezelSize+4)/2})`} />
           <circle cx={(bezelSize+4)/2} cy={(bezelSize+4)/2} r={bezelSize*0.45} fill="none" stroke={color} strokeWidth="2" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(135 ${(bezelSize+4)/2} ${(bezelSize+4)/2})`} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        </svg>
        <div className="knob-body" 
          onMouseDown={(e) => {
            const sY = e.clientY; const sV = val;
            const mv = (me) => setVal(Math.min(1, Math.max(0, sV + (sY-me.clientY)/200)));
            const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
            document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
          }} 
          style={{ width: bodySize, height: bodySize, transform: `rotate(${val * 270 - 135}deg)` }}>
          {showValueInside ? (
             <div className="knob-value-internal" style={{ transform: `rotate(${-val * 270 + 135}deg)`, fontSize: size/4 }}>{(val * 10).toFixed(1)}</div>
          ) : (
             <div className="knob-tick" style={{ width: bezelSize*0.08, height: bezelSize*0.12, top: '2px', background: color }}></div>
          )}
        </div>
      </div>
      {!showValueInside && <div className="label-sm" style={{marginTop:'4px', color: '#555'}}>{label}</div>}
      {showValueInside && <div className="label-sm" style={{marginTop:'8px', color:'#777', fontWeight: 900}}>{label}</div>}
    </div>
  );
};

const SectionHeader = ({ title }) => (
  <div className="section-title-line">
    <div className="line"></div>
    <span>{title}</span>
    <div className="line"></div>
  </div>
);

const MeterBridge = () => (
  <div className="bridge-container" style={{ height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
     <div style={{ display:'flex', justifyContent:'space-around', fontSize:'8px', color:'#444' }}>
        <span>L -1</span><span>BALANCE</span><span>R +1</span>
        <span>-1</span><span>CORRELATION</span><span>+1</span>
     </div>
     <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
        <div className="horiz-meter-bg"><div className="horiz-meter-fill" style={{ left:'50%', width:'15%', opacity:0.8 }}></div><div className="correlation-marker"></div></div>
        <div className="horiz-meter-bg"><div className="horiz-meter-fill" style={{ left:'70%', width:'25%', background:'#ffd700', boxShadow:'0 0 5px #ffd700' }}></div><div className="correlation-marker"></div></div>
     </div>
     <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flex:1, marginTop:'10px' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
           <span className="label-sm">TP</span>
           <div className="meter-strip" style={{height:'100px'}}><div className="meter-fill" style={{height:'70%'}}></div></div>
        </div>
        
        <Knob label="1. VOLUME dB" size={150} initialValue={0.49} showValueInside={true} />

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
           <span className="label-sm">RMS</span>
           <div className="meter-strip" style={{height:'100px'}}><div className="meter-fill" style={{height:'85%', background:'#ffd700', boxShadow:'0 0 5px #ffd700'}}></div></div>
        </div>
     </div>
     <div style={{ display:'flex', justifyContent:'space-around', marginTop:'10px' }}>
        <div style={{ padding:'2px 8px', background:'#222', borderRadius:'2px', fontSize:'9px' }}>-10 LUFS ▼</div>
     </div>
  </div>
);

function App() {
  return (
    <div className="rack-chassis">
      <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'url(https://www.transparenttextures.com/patterns/carbon-fibre.png)', opacity:0.02, pointerEvents:'none' }}></div>
      
      {/* HEADER SECTION */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
         <div style={{ display:'flex', gap:'15px' }}>
            <div style={{ width:40, height:40, background:'#000', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', border:'1px solid #333' }}>
               <div style={{ width:20, height:20, borderRadius:'50%', background:'var(--text-dim)' }}></div>
            </div>
            <div>
               <div style={{ fontSize:18, fontWeight:900, letterSpacing:1 }}>NADA BOSS</div>
               <div style={{ fontSize:10, color:'#444', letterSpacing:2 }}>PRO MASTERDESK SUITE</div>
            </div>
         </div>
         <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
            <div style={{ textAlign:'right' }}>
               <div className="label-sm" style={{ color: 'var(--gold)' }}>AI MASTER CORE</div>
               <div style={{ fontSize:8, color:'#333' }}>VERSION 13.5 [ELITE]</div>
            </div>
            <div className="ai-gold-btn" style={{ width:32, height:32 }}></div>
         </div>
      </div>

      {/* TOP TIER: DYNAMICS & BRIDGE */}
      <div style={{ display:'flex', gap:'30px', height:'45%' }}>
         {/* LEFT: TMT COMP */}
         <div style={{ flex:1, position:'relative' }}>
            <div className="label-sm" style={{ marginBottom:10 }}>01. TMT COMP (FET)</div>
            <div style={{ display:'flex', justifyContent:'center', gap:'20px', alignItems:'center' }}>
               <div style={{ color:'var(--neon-red)', fontFamily:'monospace', fontSize:26, border:'2px solid #333', padding:'2px 8px', borderRadius:2, background:'#000' }}>01</div>
               <div style={{ width:50, height:50, borderRadius:'50%', background:'#111', border:'2px solid #333', position:'relative' }}>
                  <div style={{ position:'absolute', width:30, height:6, background:'#333', top:'50%', left:'50%', transform:'translate(-50%, -50%) rotate(45deg)' }}></div>
               </div>
               <div style={{ color:'var(--neon-red)', fontFamily:'monospace', fontSize:26, border:'2px solid #333', padding:'2px 8px', borderRadius:2, background:'#000' }}>01</div>
            </div>
            <div style={{ display:'flex', gap:'15px', justifyContent:'center', marginTop:30 }}>
               <Knob label="RATIO" size={50} />
               <Knob label="RELEASE ms" size={50} />
            </div>
            <div style={{ display:'flex', gap:'15px', justifyContent:'center', marginTop:20 }}>
               <Knob label="GLUE" size={60} />
               <Knob label="CLIPPER" size={60} />
            </div>
         </div>

         {/* CENTER: BRIDGE */}
         <div style={{ flex:1.5 }}>
            <MeterBridge />
         </div>

         {/* RIGHT: LIMITER SECTION */}
         <div style={{ flex:1 }}>
            <div className="label-sm" style={{ textAlign:'right', marginBottom:10 }}>02. TP LIMITER</div>
            <div style={{ display:'flex', gap:'20px', justifyContent:'flex-end' }}>
               <Knob label="XL %" size={65} />
               <Knob label="THD" size={65} />
            </div>
            <div style={{ marginTop:20, display:'flex', justifyContent:'center' }}>
               <Knob label="2. FOUNDATION" size={140} initialValue={0.5} showValueInside={true} />
            </div>
         </div>
      </div>

      {/* MID TIER: TONAL COLOR */}
      <div style={{ flex:1 }}>
         <SectionHeader title="TONE & PRESENCE (STAGE 03-11)" />
         <div style={{ display:'flex', justifyContent:'space-around' }}>
            <div style={{ display:'flex', gap:20 }}>
               <div className="label-sm" style={{ alignSelf:'center', color:'#333' }}>DE-ESSER</div>
               <Knob label="FREQ kHz" size={55} />
               <Knob label="DE-ESSER" size={55} />
            </div>
            <div className="separator-v"></div>
            <div style={{ display:'flex', gap:10 }}>
               <div className="label-sm" style={{ alignSelf:'center', color:'#333' }}>3. TONE</div>
               <Knob label="BASS" size={50} /> <Knob label="MID" size={50} /> <Knob label="HIGH" size={50} /> <Knob label="AIR" size={50} />
            </div>
            <div className="separator-v"></div>
            <div style={{ display:'flex', gap:10 }}>
               <div className="label-sm" style={{ alignSelf:'center', color:'#333' }}>M / S</div>
               <Knob label="WIDTH %" size={50} color="var(--gold)" /> <Knob label="PAN" size={50} /> <Knob label="MONO" size={50} />
            </div>
         </div>
      </div>

      {/* BOTTOM TIER: SURGERY & FX */}
      <div style={{ flex:1 }}>
         <SectionHeader title="SURGICAL EQUALIZER & FX (STAGE 12-14)" />
         <div style={{ display:'flex', justifyContent:'space-around' }}>
            <div style={{ display:'flex', gap:15 }}>
               <Knob label="LO-RES" size={55} color="#444" />
               <Knob label="HI-RES" size={55} color="#444" />
            </div>
            <div className="separator-v"></div>
            <div style={{ display:'flex', gap:8 }}>
               <Knob label="F1" size={35} /> <Knob label="G1" size={35} />
               <Knob label="F2" size={35} /> <Knob label="G2" size={35} />
               <Knob label="F3" size={35} /> <Knob label="G3" size={35} />
               <Knob label="F4" size={35} /> <Knob label="G4" size={35} />
            </div>
            <div className="separator-v"></div>
            <div style={{ display:'flex', gap:15 }}>
               <div className="label-sm" style={{ alignSelf:'center', color:'#333' }}>FX BUS</div>
               <Knob label="REV" size={45} />
               <Knob label="DLY" size={45} />
            </div>
         </div>
      </div>
      
      {/* FINAL LOGO SHINE */}
      <div style={{ textAlign:'center', marginTop:'auto', opacity:0.1, letterSpacing:15, fontSize:10, fontWeight:900 }}>
         MASTERING GRADE COMPONENT // (C) 2026 NADA BOSS
      </div>
    </div>
  );
}

export default App;
