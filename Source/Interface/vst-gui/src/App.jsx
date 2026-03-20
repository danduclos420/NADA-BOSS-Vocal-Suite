import React, { useState } from 'react';

const Knob = ({ label, initialValue = 0.5, size = 50, showValueInside = false, color = "var(--neon-red)" }) => {
  const [val, setVal] = useState(initialValue);
  const bezelSize = size;
  const bodySize = size * 0.75;
  const circ = 2 * Math.PI * (bezelSize * 0.45);
  const offset = circ - (val * 0.75 * circ);

  return (
    <div className="knob-unit">
      <div className="knob-bezel" style={{ width: bezelSize, height: bezelSize }}>
        <svg style={{ position:'absolute', top:'-2px', left:'-2px', width:bezelSize+4, height:bezelSize+4 }}>
           <circle cx={(bezelSize+4)/2} cy={(bezelSize+4)/2} r={bezelSize*0.45} fill="none" stroke="#000" strokeWidth="1.5" strokeDasharray={circ} strokeDashoffset={circ*0.25} transform={`rotate(135 ${(bezelSize+4)/2} ${(bezelSize+4)/2})`} />
           <circle cx={(bezelSize+4)/2} cy={(bezelSize+4)/2} r={bezelSize*0.45} fill="none" stroke={color} strokeWidth="2" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(135 ${(bezelSize+4)/2} ${(bezelSize+4)/2})`} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
        </svg>
        <div className="knob-body" onMouseDown={(e) => {
           const sY = e.clientY; const sV = val;
           const mv = (me) => setVal(Math.min(1, Math.max(0, sV + (sY-me.clientY)/200)));
           const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
           document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
        }} style={{ width: bodySize, height: bodySize, transform: `rotate(${val * 270 - 135}deg)` }}>
          {showValueInside ? (
             <div className="knob-value-internal" style={{ transform: `rotate(${-val * 270 + 135}deg)` }}>{(val * 10).toFixed(1)}</div>
          ) : (
             <div className="knob-tick" style={{ width: bezelSize*0.1, height: bezelSize*0.1 }}></div>
          )}
        </div>
      </div>
      {!showValueInside && <div className="label-sm" style={{marginTop:'5px'}}>{label}</div>}
      {showValueInside && <div className="label-sm" style={{marginTop:'15px', color:'var(--text-dim)'}}>{label}</div>}
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

function App() {
  return (
    <div className="rack-chassis">
      {/* TIER 1: TOP SECTION (COMP / METER / LIMITER) */}
      <div style={{ display:'flex', justifyContent:'space-between', height:'40%' }}>
         {/* TMT COMP (01 01) */}
         <div style={{ width:'25%', padding:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
               <div className="label-sm">TMT COMP</div>
               <div className="ai-gold-btn" style={{ width:'16px', height:'16px' }}></div>
            </div>
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
               <div style={{ color:'var(--neon-red)', fontFamily:'monospace', fontSize:'24px', background:'#000', padding:'4px' }}>01</div>
               <Knob size={50} label="RATIO" />
               <div style={{ color:'var(--neon-red)', fontFamily:'monospace', fontSize:'24px', background:'#000', padding:'4px' }}>01</div>
            </div>
            <div style={{ display:'flex', gap:'20px', marginTop:'30px' }}>
               <Knob label="GLUE" size={55} />
               <Knob label="CLIPPER" size={55} />
            </div>
         </div>

         {/* CENTER BRIDGE */}
         <div style={{ width:'45%', padding:'0 20px' }}>
            <div className="bridge-container" style={{ height:'100%', display:'flex', flexDirection:'column', gap:'10px' }}>
               <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div className="label-sm">BALANCE</div>
                  <div className="label-sm">CORRELATION</div>
               </div>
               <div className="horiz-meter-bg"><div className="horiz-meter-fill" style={{ left:'50%', width:'20%' }}></div><div className="correlation-marker"></div></div>
               <div style={{ flex:1, display:'flex', justifyContent:'space-between', marginTop:'10px' }}>
                  <div className="meter-strip" style={{height:'100%'}}><div className="meter-fill" style={{height:'60%'}}></div></div>
                  {/* MAIN VOLUME KNOB */}
                  <Knob label="VOLUME dB" size={140} initialValue={0.6} showValueInside={true} />
                  <div className="meter-strip" style={{height:'100%'}}><div className="meter-fill" style={{height:'80%'}}></div></div>
               </div>
            </div>
         </div>

         {/* LIMITER SECTION */}
         <div style={{ width:'25%', padding:'20px' }}>
            <div className="label-sm" style={{ textAlign:'right' }}>LIMITER</div>
            <div style={{ display:'flex', gap:'20px', justifyContent:'flex-end', marginTop:'10px' }}>
               <Knob label="XL %" size={60} />
               <Knob label="THD" size={60} />
            </div>
            <div style={{ marginTop:'20px', textAlign:'center' }}>
               <Knob label="FOUNDATION" size={120} initialValue={0.8} showValueInside={true} />
            </div>
         </div>
      </div>

      {/* TIER 2: MID SECTION (DE-ESSER / TONE / M-S) */}
      <div style={{ height:'30%' }}>
         <SectionHeader title="TONE & PRESENCE" />
         <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1.5fr', gap:'20px', height:'100%' }}>
            <div style={{ display:'flex', gap:'30px', borderRight:'1px solid rgba(255,255,255,0.03)' }}>
               <div className="label-sm" style={{ alignSelf:'center' }}>DE-ESSER</div>
               <Knob size={60} label="FREQ" initialValue={0.6} />
               <Knob size={60} label="REDUX" initialValue={0.4} />
            </div>
            <div style={{ display:'flex', gap:'15px', justifyContent:'center' }}>
               <div className="label-sm" style={{ alignSelf:'center' }}>3. TONE</div>
               <Knob label="BASS" /> <Knob label="MID" /> <Knob label="HIGH" /> <Knob label="AIR" />
            </div>
            <div style={{ display:'flex', gap:'15px', justifyContent:'flex-end' }}>
               <div className="label-sm" style={{ alignSelf:'center' }}>M / S</div>
               <Knob label="WIDTH" color="var(--gold)" /> <Knob label="PAN" /> <Knob label="MONO" size={40} />
            </div>
         </div>
      </div>

      {/* TIER 3: BOTTOM SECTION (RESONANCE / EGALIZER / FILTERS) */}
      <div style={{ height:'30%' }}>
         <SectionHeader title="SURGICAL EQUALIZER" />
         <div style={{ display:'flex', justifyContent:'space-between', height:'100%' }}>
            <div style={{ display:'flex', gap:'20px' }}>
               <Knob label="LO-RES" size={60} color="#444" />
               <Knob label="HI-RES" size={60} color="#444" />
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
               <Knob label="F1" size={40} /> <Knob label="G1" size={40} />
               <Knob label="F2" size={40} /> <Knob label="G2" size={40} />
               <Knob label="F3" size={40} /> <Knob label="G3" size={40} />
               <Knob label="F4" size={40} /> <Knob label="G4" size={40} />
            </div>
            <div style={{ display:'flex', gap:'20px' }}>
               <Knob label="HP-FLT" size={45} />
               <Knob label="LP-FLT" size={45} />
            </div>
         </div>
      </div>

      {/* SUPER SUBTLE BRANDING FOOTER */}
      <div style={{ display:'flex', justifyContent:'space-between', opacity:0.3, marginTop:'auto' }}>
         <div style={{ fontSize:'18px', fontWeight:'900', letterSpacing:'2px' }}>NADA BOSS</div>
         <div className="label-sm">V13.0 // MASTERING GRADE</div>
      </div>
    </div>
  );
}

export default App;
