import React, { useState } from 'react';

const Knob = ({ label, initialValue = 0.5, size = 50, showValueInside = false, color = "var(--neon-red)", suffix = "" }) => {
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
             <div className="knob-value-internal" style={{ transform: `rotate(${-val * 270 + 135}deg)`, fontSize: size/4.5 }}>{(val * 10).toFixed(1)}{suffix}</div>
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

const Switch = ({ label, options = ["OFF", "ON"], activeIndex = 0 }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
    <div style={{ display:'flex', background:'#000', padding:'2px', borderRadius:'10px', border:'1px solid #333' }}>
       {options.map((opt, i) => (
         <div key={opt} style={{ padding:'2px 6px', fontSize:'8px', borderRadius:'8px', background: i === activeIndex ? 'var(--neon-red)' : 'transparent', color: i === activeIndex ? '#fff' : '#444', cursor:'pointer' }}>{opt}</div>
       ))}
    </div>
    <div className="label-sm">{label}</div>
  </div>
);

function App() {
  return (
    <div className="rack-chassis">
      {/* TIER 1: THE BRAIN & DYNAMICS */}
      <div style={{ display:'flex', gap:'20px', height:'45%' }}>
        
        {/* 01. CRISPY TUNER (AUTOTUNE) */}
        <div style={{ width:'25%', display:'flex', flexDirection:'column', gap:'10px' }}>
           <div className="label-sm" style={{color:'var(--gold)'}}>01. AUTOTUNE (CRISPY)</div>
           <div style={{ display:'flex', justifyContent:'center', gap:'15px', alignItems:'center' }}>
              <Knob label="SPEED" size={80} initialValue={0.8} />
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                 <div style={{ background:'#000', padding:'4px', border:'1px solid #333', color:'var(--neon-red)', fontSize:'12px', textAlign:'center', fontFamily:'monospace' }}>C# MIN</div>
                 <Switch label="SCALE" options={["MAJ", "MIN"]} activeIndex={1} />
              </div>
              <Knob label="HUMAN" size={45} />
           </div>
           <div style={{ display:'flex', justifyContent:'space-around', marginTop:'20px' }}>
              <Knob label="TIGHT" size={40} />
              <Knob label="VIB" size={40} />
           </div>
        </div>

        {/* CENTER METER BRIDGE (1176 / LA-2A HYBRID) */}
        <div style={{ width:'40%', background:'#121417', border:'1px solid #222', borderRadius:4, padding:15 }}>
           <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <div className="label-sm">BALANCE</div>
              <div className="label-sm">CORRELATION</div>
           </div>
           <div className="horiz-meter-bg"><div className="horiz-meter-fill" style={{ left:'50%', width:'25%' }}></div></div>
           
           <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', height:'160px', marginTop:15 }}>
              <div style={{ textAlign:'center' }}>
                 <span className="label-sm">GR</span>
                 <div className="meter-strip" style={{height:'100px'}}><div className="meter-fill" style={{height:'40%'}}></div></div>
              </div>
              <Knob label="1. VOLUME dB" size={140} initialValue={0.6} showValueInside={true} />
              <div style={{ textAlign:'center' }}>
                 <span className="label-sm">OUT</span>
                 <div className="meter-strip" style={{height:'100px'}}><div className="meter-fill" style={{height:'80%'}}></div></div>
              </div>
           </div>
           <div style={{ display:'flex', justifyContent:'center', gap:30, marginTop:10 }}>
              <div className="ai-gold-btn" style={{width:24, height:24}}></div>
              <div className="label-sm" style={{color:'var(--gold)', alignSelf:'center'}}>AI ENGAGED</div>
           </div>
        </div>

        {/* 03/04. DYNAMICS (1176 & LA-2A) */}
        <div style={{ width:'35%', display:'flex', flexDirection:'column', gap:10 }}>
           <div className="label-sm">03. 1176 / 04. LA-2A</div>
           <div style={{ display:'flex', justifyContent:'space-around', alignItems:'center' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                 <div className="label-sm">RATIO</div>
                 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
                    {[4, 8, 12, 20].map(r => <div key={r} style={{ background: r===4 ? 'var(--neon-red)' : '#111', fontSize:8, padding:'2px 4px', border:'1px solid #333' }}>{r}</div>)}
                 </div>
              </div>
              <Knob label="INPUT" size={55} />
              <Knob label="PEAK RED" size={85} initialValue={0.7} showValueInside={true} />
              <Knob label="GAIN" size={55} />
           </div>
           <div style={{ display:'flex', justifyContent:'space-around', marginTop:20 }}>
              <Knob label="ATTACK" size={40} />
              <Knob label="RELEASE" size={40} />
              <Switch label="MODE" options={["COMP", "LIMIT"]} activeIndex={0} />
           </div>
        </div>
      </div>

      <div style={{ height:'1px', background:'rgba(255,255,255,0.05)', margin:'10px 0' }}></div>

      {/* TIER 2: TONE (PULTEC / SSL / BLACK BOX) */}
      <div style={{ display:'flex', gap:'20px', height:'25%' }}>
        {/* EQP-1A PULTEC */}
        <div style={{ width:'30%', display:'flex', gap:15, alignItems:'center' }}>
           <div className="label-sm" style={{ writingMode:'vertical-rl', transform:'rotate(180deg)', borderRight:'1px solid #333', paddingLeft:5 }}>PULTEC EQP-1A</div>
           <Knob label="LOW BOOST" size={45} />
           <Knob label="LOW FREQ" size={45} />
           <Knob label="HIGH ATTEN" size={45} />
           <Knob label="AIR" size={60} color="var(--gold)" />
        </div>
        <div className="separator-v"></div>
        {/* SSL 4000 & BLACK BOX */}
        <div style={{ flex:1, display:'flex', justifyContent:'space-around', alignItems:'center' }}>
           <div style={{ display:'flex', gap:10 }}>
              <div className="label-sm">SSL EQ</div>
              <Knob label="LF" size={35} /> <Knob label="LMF" size={35} /> <Knob label="HMF" size={35} /> <Knob label="HF" size={35} />
           </div>
           <div className="separator-v"></div>
           <div style={{ display:'flex', gap:15, alignItems:'center' }}>
              <div className="label-sm">BLACK BOX</div>
              <Knob label="PENTODE" size={50} />
              <Knob label="TRIODE" size={50} />
              <Knob label="SAT" size={50} color="#ff8800" />
           </div>
        </div>
      </div>

      <div style={{ height:'1px', background:'rgba(255,255,255,0.05)', margin:'10px 0' }}></div>

      {/* TIER 3: SURGERY / SPACE / MASTER */}
      <div style={{ display:'flex', gap:'20px', height:'25%' }}>
         {/* PRO-Q3 ANALYZER */}
         <div style={{ width:'25%', background:'#000', border:'1px solid #222', borderRadius:2, position:'relative' }}>
            <div className="label-sm" style={{ position:'absolute', top:5, left:5 }}>SURGICAL EQ (PRO-Q3)</div>
            <svg width="100%" height="100%" viewBox="0 0 200 100">
               <path d="M 0 80 Q 50 20 100 80 T 200 80" fill="none" stroke="var(--neon-red)" strokeWidth="1" />
               <path d="M 0 90 Q 70 80 100 70 T 200 90" fill="none" stroke="#222" strokeWidth="1" />
            </svg>
            <div style={{ position:'absolute', bottom:5, right:5, display:'flex', gap:10 }}>
               <Knob label="MUD" size={30} /> <Knob label="DE-ESS" size={30} />
            </div>
         </div>

         {/* FX BUS (HITVILLE / H-DELAY) */}
         <div style={{ width:'35%', display:'flex', justifyContent:'space-around', alignItems:'center' }}>
            <div style={{ display:'flex', gap:10 }}>
               <div className="label-sm">HITVILLE REV</div>
               <Knob label="MIX" size={40} /> <Knob label="ROOM" size={40} />
            </div>
            <div className="separator-v"></div>
            <div style={{ display:'flex', gap:10 }}>
               <div className="label-sm">H-DELAY</div>
               <Knob label="TIME" size={40} /> <Knob label="FB" size={40} /> <Knob label="MIX" size={40} />
            </div>
         </div>

         {/* BX_LIMITER / STEREO MAKER */}
         <div style={{ flex:1, display:'flex', justifyContent:'flex-end', gap:20, alignItems:'center' }}>
            <div style={{ textAlign:'center' }}>
               <Knob label="WIDTH %" size={60} initialValue={0.8} />
               <div className="label-sm">STEREO MAKER</div>
            </div>
            <div className="separator-v"></div>
            <div style={{ textAlign:'center' }}>
               <Knob label="2. FOUNDATION" size={120} initialValue={0.9} showValueInside={true} />
               <div className="label-sm">BX_LIMITER</div>
            </div>
         </div>
      </div>

      {/* FINAL LOGO */}
      <div style={{ position:'absolute', bottom:10, left:20, opacity:0.2, fontSize:10, letterSpacing:2 }}>NADA BOSS // ULTIMATE RACK V14.2</div>
      <div style={{ position:'absolute', bottom:10, right:20, opacity:0.2, fontSize:10 }}>DESIGNED BY BRAINWORX ENGINEERS</div>
    </div>
  );
}

export default App;
