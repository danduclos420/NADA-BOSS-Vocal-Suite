import React, { useState } from 'react';

const Knob = ({ label, initialValue = 0.5, size = 45, showValueInside = false, color = "var(--neon-red)", unit = "" }) => {
  const [val, setVal] = useState(initialValue);
  const circ = 2 * Math.PI * (size * 0.45);
  const offset = circ - (val * 0.75 * circ);

  return (
    <div className="knob-unit" style={{ minWidth: size + 15 }}>
      <div className="knob-bezel" style={{ width: size, height: size }}>
        <svg style={{ position:'absolute', top:'-2px', left:'-2px', width:size+4, height:size+4 }}>
           <circle cx={(size+4)/2} cy={(size+4)/2} r={size*0.45} fill="none" stroke="#000" strokeWidth="1.5" strokeDasharray={circ} strokeDashoffset={circ*0.25} transform={`rotate(135 ${(size+4)/2} ${(size+4)/2})`} />
           <circle cx={(size+4)/2} cy={(size+4)/2} r={size*0.45} fill="none" stroke={color} strokeWidth="2" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(135 ${(size+4)/2} ${(size+4)/2})`} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        </svg>
        <div className="knob-body" 
          onMouseDown={(e) => {
            const sY = e.clientY; const sV = val;
            const mv = (me) => setVal(Math.min(1, Math.max(0, sV + (sY-me.clientY)/200)));
            const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
            document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
          }} 
          style={{ width: size*0.75, height: size*0.75, transform: `rotate(${val * 270 - 135}deg)` }}>
          {showValueInside ? (
             <div className="knob-value-internal" style={{ transform: `rotate(${-val * 270 + 135}deg)`, fontSize: size/4.5 }}>{(val * 10).toFixed(1)}</div>
          ) : (
             <div className="knob-tick" style={{ width: size*0.08, height: size*0.12, top: '2px', background: color }}></div>
          )}
        </div>
      </div>
      <div className="label-sm" style={{marginTop:'4px', color: '#444'}}>{label}</div>
    </div>
  );
};

const DualMeter = ({ left = 0.6, right = 0.5, height = 65 }) => (
  <div style={{ display:'flex', gap:3, background:'#000', padding:2, border:'1px solid #222', borderRadius:1 }}>
    <div className="meter-strip" style={{height, width:4}}><div className="meter-fill" style={{height:`${left*100}%`}}></div></div>
    <div className="meter-strip" style={{height, width:4}}><div className="meter-fill" style={{height:`${right*100}%`}}></div></div>
  </div>
);

const ProQ3View = () => (
  <div style={{ width:'100%', height:'160px', background:'#0b0c0f', border:'1px solid #333', borderRadius:4, position:'relative', overflow:'hidden', boxShadow:'inset 0 0 30px #000' }}>
     <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0.05, backgroundImage:'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize:'25px 25px' }}></div>
     <svg width="100%" height="100%" preserveAspectRatio="none" style={{ position:'absolute' }}>
        <path d="M 0 130 Q 80 40 150 100 T 300 30 T 450 140" fill="none" stroke="var(--neon-red)" strokeWidth="2" style={{ filter:'drop-shadow(0 0 8px var(--neon-red))' }} />
        <path d="M 0 145 Q 100 120 200 135 T 450 145" fill="none" stroke="#2a2c32" strokeWidth="1" />
     </svg>
     <div className="label-sm" style={{ position:'absolute', top:5, left:10, color:'#444' }}>01. SURGICAL SPECTRUM (PRO-Q3)</div>
  </div>
);

const PAZView = () => (
  <div style={{ width:'100%', height:'160px', background:'#0b0c0f', border:'1px solid #333', borderRadius:4, position:'relative', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', boxShadow:'inset 0 0 30px #000' }}>
     <div style={{ width:'160px', height:'80px', border:'2px solid #222', borderBottom:'none', borderRadius:'80px 80px 0 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', bottom:0, left:'50%', width:1, height:70, background:'#444', transformOrigin:'bottom', transform:'rotate(-45deg)' }}></div>
        <div style={{ position:'absolute', bottom:0, left:'50%', width:1, height:75, background:'var(--neon-red)', transformOrigin:'bottom', transform:'rotate(15deg)', boxShadow:'var(--neon-glow)' }}></div>
        <div style={{ position:'absolute', bottom:0, left:'50%', width:1, height:65, background:'#ffd700', transformOrigin:'bottom', transform:'rotate(-20deg)', opacity:0.5 }}></div>
     </div>
     <div style={{ display:'flex', gap:5, marginTop:10, height:40, alignItems:'flex-end' }}>
        {Array.from({length:18}).map((_,i) => <div key={i} style={{ width:7, height: 10 + Math.random()*30, background: i > 14 ? 'var(--neon-red)' : (i < 3 ? '#ffd700' : '#2a2c32') }}></div>)}
     </div>
     <div className="label-sm" style={{ position:'absolute', bottom:5, color:'#444' }}>02. PAZ ANALYZER (STEREO FIELD)</div>
  </div>
);

function App() {
  return (
    <div className="rack-chassis">
      <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'url(https://www.transparenttextures.com/patterns/black-felt.png)', opacity:0.02, pointerEvents:'none' }}></div>
      
      {/* HEADER SECTION (ELEGANT) */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:20 }}>
         <div style={{ display:'flex', gap:20, alignItems:'center' }}>
            <div style={{ fontSize:28, fontWeight:900, letterSpacing:4, color:'#444' }}>NADA BOSS</div>
            <div style={{ width:1, height:20, background:'#333' }}></div>
            <div style={{ fontSize:10, color:'#555', letterSpacing:2 }}>PRO MASTERING SUITE // 14-STAGE</div>
         </div>
         <div style={{ display:'flex', gap:25, alignItems:'center' }}>
            <div style={{ textAlign:'right' }}>
               <div className="label-sm" style={{ color: 'var(--gold)', letterSpacing:2 }}>AI ENGINE ACTIVE</div>
               <div style={{ fontSize:8, opacity:0.3 }}>NADA CORE v15.0</div>
            </div>
            <div className="ai-gold-btn" style={{ width:28, height:28 }}></div>
         </div>
      </div>

      <div style={{ display:'grid', gridTemplateRows:'1.5fr 1fr 1fr', gap:25, height:'100%' }}>
         
         {/* TIER 1: THE CORE (PRO-Q3 + DYNAMICS) */}
         <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr 1fr', gap:25 }}>
            {/* LEFT: AUTOTUNE & DE-ESSER */}
            <div style={{ display:'flex', gap:25, background:'rgba(0,0,0,0.1)', padding:15, borderRadius:4 }}>
               <div style={{ textAlign:'center' }}>
                  <Knob label="RE-TUNE" size={75} initialValue={0.8} />
                  <div style={{ fontSize:10, color:'var(--neon-red)', marginTop:8 }}>C# MIN</div>
               </div>
               <div className="separator-v"></div>
               <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <Knob label="HUMAN" size={40} />
                  <div style={{ display:'flex', gap:10 }}>
                     <Knob label="DE-ESS" size={40} /> <DualMeter left={0.4} />
                  </div>
               </div>
            </div>

            {/* CENTER: THE MASTER EQ (PRO-Q3) */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:15 }}>
               <ProQ3View />
               <div style={{ display:'flex', justifyContent:'center', gap:30 }}>
                  <div style={{ textAlign:'center' }}>
                     <Knob label="VOLUME" size={110} initialValue={0.6} showValueInside={true} />
                  </div>
                  <div style={{ alignSelf:'center' }}>
                     <div className="label-sm">TP PEAKS</div>
                     <DualMeter height={80} left={0.9} right={0.8} />
                  </div>
               </div>
            </div>

            {/* RIGHT: UA DYNAMICS (1176 / LA-2A) */}
            <div style={{ display:'flex', gap:25, background:'rgba(0,0,0,0.1)', padding:15, borderRadius:4, justifyContent:'flex-end' }}>
               <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', gap:10 }}>
                     <Knob label="IN" size={45} /> <DualMeter left={0.5} />
                  </div>
                  <Knob label="RATIO" size={40} />
               </div>
               <div className="separator-v"></div>
               <div style={{ textAlign:'center' }}>
                  <Knob label="PEAK RED" size={85} initialValue={0.7} showValueInside={true} />
                  <Knob label="GAIN" size={45} style={{marginTop:10}} />
               </div>
            </div>
         </div>

         {/* TIER 2: TONE & ANALYZER (PAZ) */}
         <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr 1fr', gap:25 }}>
            {/* LEFT: ANALOG STACKS (PULTEC / SSL) */}
            <div style={{ display:'flex', gap:20, alignItems:'center' }}>
               <div style={{ textAlign:'center' }}>
                  <div className="label-sm" style={{marginBottom:10}}>PULTEC</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                     <Knob label="LOW" size={40} /> <Knob label="HIGH" size={40} />
                  </div>
               </div>
               <div className="separator-v"></div>
               <div style={{ textAlign:'center' }}>
                  <div className="label-sm" style={{marginBottom:10}}>SSL 4K</div>
                  <Knob label="DRIVE" size={45} color="var(--gold)" />
               </div>
            </div>

            {/* CENTER: THE MASTER ANALYZER (PAZ) */}
            <PAZView />

            {/* RIGHT: COLOR (BLACK BOX / COMP) */}
            <div style={{ display:'flex', gap:20, alignItems:'center', justifyContent:'flex-end' }}>
               <div style={{ textAlign:'center' }}>
                  <div className="label-sm" style={{marginBottom:10}}>BLACK BOX</div>
                  <Knob label="SAT" size={50} color="#ff8800" />
               </div>
               <div className="separator-v"></div>
               <div style={{ textAlign:'center' }}>
                  <div className="label-sm" style={{marginBottom:10}}>BUS COMP</div>
                  <div style={{ display:'flex', gap:10 }}>
                     <Knob label="THR" size={40} /> <Knob label="RAT" size={40} />
                  </div>
               </div>
            </div>
         </div>

         {/* TIER 3: FX & MASTERING (STEREO / LIMITER) */}
         <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:25 }}>
            {/* LEFT: SURGERY */}
            <div style={{ display:'flex', gap:25, alignItems:'center' }}>
               <Knob label="MUD CUT" size={55} color="#333" />
               <div style={{ borderLeft:'1px solid #333', paddingLeft:15 }}>
                  <div className="label-sm">RESONANCE</div>
                  <Knob label="HI" size={35} color="#333" />
               </div>
            </div>

            {/* CENTER: FX BUS */}
            <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:4, padding:10, display:'flex', justifyContent:'center', gap:30 }}>
               <div style={{ textAlign:'center' }}>
                  <Knob label="DLY MIX" size={45} />
               </div>
               <div style={{ height:30, width:1, background:'#333', alignSelf:'center' }}></div>
               <div style={{ textAlign:'center' }}>
                  <Knob label="REV MIX" size={45} />
               </div>
            </div>

            {/* RIGHT: THE FINISHER (LIMITER) */}
            <div style={{ display:'flex', gap:25, alignItems:'center', justifyContent:'flex-end' }}>
               <div style={{ textAlign:'center' }}>
                  <Knob label="WIDTH" size={60} color="var(--gold)" />
               </div>
               <div className="separator-v"></div>
               <div style={{ textAlign:'center' }}>
                  <Knob label="2. FOUNDATION" size={120} initialValue={0.9} showValueInside={true} />
               </div>
            </div>
         </div>

      </div>

      {/* FOOTER */}
      <div style={{ display:'flex', justifyContent:'space-between', opacity:0.1, marginTop:20, fontSize:9, letterSpacing:2 }}>
         <span>(C) 2026 NADA BOSS // ULTIMATE RACK V14.55</span>
         <span>BRAINWORX / CAPITOL STUDIOS / FABFILTER / UA COMPONENT SIMULATION</span>
      </div>
    </div>
  );
}

export default App;
