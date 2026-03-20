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
             <div className="knob-value-internal" style={{ transform: `rotate(${-val * 270 + 135}deg)`, fontSize: size/4 }}>{(val * 10).toFixed(1)}</div>
          ) : (
             <div className="knob-tick" style={{ width: size*0.08, height: size*0.12, top: '2px', background: color }}></div>
          )}
        </div>
      </div>
      <div className="label-sm" style={{marginTop:'4px', color: '#555'}}>{label}</div>
    </div>
  );
};

const DualMeter = ({ left = 0.6, right = 0.5, height = 60 }) => (
  <div style={{ display:'flex', gap:2, background:'#000', padding:2, border:'1px solid #222', borderRadius:1 }}>
    <div className="meter-strip" style={{height, width:3}}><div className="meter-fill" style={{height:`${left*100}%`}}></div></div>
    <div className="meter-strip" style={{height, width:3}}><div className="meter-fill" style={{height:`${right*100}%`}}></div></div>
  </div>
);

const ProQ3View = () => (
  <div style={{ width:'100%', height:'150px', background:'#08080a', border:'1px solid #333', borderRadius:4, position:'relative', overflow:'hidden', boxShadow:'inset 0 0 20px #000' }}>
     <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0.1, backgroundImage:'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize:'20px 20px' }}></div>
     <svg width="100%" height="100%" style={{ position:'absolute' }}>
        <path d="M 0 120 Q 50 100 80 40 T 150 60 T 400 120" fill="none" stroke="var(--neon-red)" strokeWidth="2" style={{ filter:'drop-shadow(0 0 5px var(--neon-red))' }} />
        <path d="M 0 130 Q 80 110 120 90 T 250 110 T 400 130" fill="none" stroke="#2a2c32" strokeWidth="1" />
     </svg>
     <div className="label-sm" style={{ position:'absolute', top:5, left:10, color:'#444' }}>MASTER EQ ANALYSIS (PRO-Q3)</div>
  </div>
);

const PAZView = () => (
  <div style={{ width:'100%', height:'140px', background:'#08080a', border:'1px solid #333', borderRadius:4, position:'relative', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', boxShadow:'inset 0 0 20px #000' }}>
     <div style={{ width:'120px', height:'60px', border:'2px solid #222', borderBottom:'none', borderRadius:'60px 60px 0 0', position:'relative' }}>
        <div style={{ position:'absolute', bottom:0, left:'50%', width:2, height:40, background:'#444', transformOrigin:'bottom', transform:'rotate(-30deg)' }}></div>
        <div style={{ position:'absolute', bottom:0, left:'50%', width:2, height:45, background:'var(--neon-red)', transformOrigin:'bottom', transform:'rotate(10deg)', boxShadow:'var(--neon-glow)' }}></div>
     </div>
     <div style={{ display:'flex', gap:4, marginTop:10 }}>
        {Array.from({length:15}).map((_,i) => <div key={i} style={{ width:6, height: 10 + Math.random()*30, background: i > 12 ? 'var(--neon-red)' : '#2a2c32' }}></div>)}
     </div>
     <div className="label-sm" style={{ position:'absolute', bottom:5, color:'#444' }}>PAZ STEREO ANALYZER</div>
  </div>
);

function App() {
  return (
    <div className="rack-chassis">
      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:15, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
         <div style={{ display:'flex', gap:15, alignItems:'center' }}>
            <div style={{ width:32, height:32, background:'var(--gold)', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', boxShadow:'0 0 10px var(--gold)' }}><span style={{ color:'#000', fontWeight:900, fontSize:12 }}>NB</span></div>
            <div>
               <div style={{ fontSize:16, fontWeight:900, letterSpacing:1 }}>NADA BOSS</div>
               <div style={{ fontSize:8, color:'#444', letterSpacing:2 }}>ELITE ANALOG MASTER CHANNEL</div>
            </div>
         </div>
         <div style={{ display:'flex', gap:20, alignItems:'center' }}>
            <div className="label-sm" style={{ color:'var(--gold)' }}>AI CORE ENGAGED</div>
            <div className="ai-gold-btn" style={{ width:24, height:24 }}></div>
         </div>
      </div>

      <div className="main-grid" style={{ height:'100%', gridTemplateRows:'1.5fr 1fr 1fr', gap:20 }}>
         
         {/* TIER 1: THE BRAIN ZONE */}
         <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr 1fr', gap:20 }}>
            {/* LEFT: PITCH & DE-ESSER */}
            <div style={{ display:'flex', flexDirection:'column', gap:15, borderRight:'1px solid rgba(255,255,255,0.03)', paddingRight:15 }}>
               <div style={{ display:'flex', gap:15, alignItems:'center' }}>
                  <Knob label="SPEED" size={70} initialValue={0.8} />
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                     <div style={{ background:'#000', padding:4, color:'var(--neon-red)', fontSize:10, textAlign:'center' }}>C# MIN</div>
                     <Knob label="HUMAN" size={35} />
                  </div>
               </div>
               <div className="separator-h"></div>
               <div style={{ display:'flex', gap:20 }}>
                  <Knob label="ESS" size={50} /> <DualMeter left={0.4} right={0.3} /> <Knob label="FREQ" size={40} />
               </div>
            </div>

            {/* CENTER: PRO-Q 3 VISUALIZER */}
            <div style={{ display:'flex', flexDirection:'column' }}>
               <ProQ3View />
               <div style={{ display:'flex', justifyContent:'center', gap:20, marginTop:10 }}>
                  <Knob label="VOLUME" size={100} initialValue={0.6} showValueInside={true} />
               </div>
            </div>

            {/* RIGHT: DYNAMICS UA STYLE */}
            <div style={{ display:'flex', flexDirection:'column', gap:15, borderLeft:'1px solid rgba(255,255,255,0.03)', paddingLeft:15 }}>
               <div style={{ display:'flex', gap:15, alignItems:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                     {[4, 8, 12, 20].map(r => <div key={r} style={{ background:'#111', fontSize:8, padding:'2px 4px', border:'1px solid #333' }}>{r}</div>)}
                  </div>
                  <Knob label="INPUT" size={55} />
                  <Knob label="PEAK RED" size={80} initialValue={0.7} showValueInside={true} />
               </div>
               <div className="separator-h"></div>
               <div style={{ display:'flex', gap:20 }}>
                  <Knob label="GAIN" size={50} /> <DualMeter left={0.7} right={0.6} /> <Knob label="ATTACK" size={40} />
               </div>
            </div>
         </div>

         {/* TIER 2: TONE & ANALYZER */}
         <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr 1fr', gap:20 }}>
            {/* LEFT: PULTEC / SSL */}
            <div style={{ display:'flex', gap:15, borderRight:'1px solid rgba(255,255,255,0.03)', paddingRight:15 }}>
               <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div className="label-sm">EQP-1A</div>
                  <Knob label="LOW" size={40} /> <Knob label="HIGH" size={40} />
               </div>
               <div className="separator-v"></div>
               <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div className="label-sm">SSL-4K</div>
                  <Knob label="LF" size={35} /> <Knob label="HF" size={35} />
               </div>
            </div>

            {/* CENTER: PAZ ANALYZER */}
            <PAZView />

            {/* RIGHT: BLACK BOX / SAT */}
            <div style={{ display:'flex', gap:15, borderLeft:'1px solid rgba(255,255,255,0.03)', paddingLeft:15, justifyContent:'flex-end' }}>
               <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
                  <div className="label-sm">HG-2 SAT</div>
                  <div style={{ display:'flex', gap:10 }}>
                     <Knob label="PENT" size={45} /> <Knob label="TRIO" size={45} />
                  </div>
               </div>
               <div className="separator-v"></div>
               <Knob label="SAT" size={70} color="#ff8800" />
            </div>
         </div>

         {/* TIER 3: FX & MASTERING */}
         <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>
            {/* LEFT: SURGERY */}
            <div style={{ display:'flex', gap:20 }}>
               <Knob label="MUD CUT" size={50} color="#444" />
               <div className="label-sm" style={{ alignSelf:'center' }}>RESONANCE FILTER</div>
               <Knob label="HI-RES" size={50} color="#444" />
            </div>

            {/* CENTER: FX BUS */}
            <div style={{ display:'flex', gap:20, justifyContent:'center' }}>
               <div style={{ textAlign:'center' }}>
                  <Knob label="TIME" size={45} /> <span className="label-sm">H-DELAY</span>
               </div>
               <div style={{ textAlign:'center' }}>
                  <Knob label="MIX" size={45} /> <span className="label-sm">CHAMBER</span>
               </div>
            </div>

            {/* RIGHT: FINAL MASTER */}
            <div style={{ display:'flex', gap:20, justifyContent:'flex-end', alignItems:'center' }}>
               <div style={{ textAlign:'center' }}>
                  <Knob label="WIDTH" size={60} color="var(--gold)" />
               </div>
               <div className="separator-v"></div>
               <div style={{ textAlign:'center' }}>
                  <Knob label="FOUNDATION" size={100} showValueInside={true} />
                  <span className="label-sm">BX_LIMITER</span>
               </div>
            </div>
         </div>

      </div>

      {/* FOOTER */}
      <div style={{ display:'flex', justifyContent:'space-between', opacity:0.2, marginTop:10 }}>
         <div className="label-sm">V14.55 MASTERING CONSOLE</div>
         <div className="label-sm">BRAINWORX & CAPITOL STUDIOS GRADE</div>
      </div>
    </div>
  );
}

export default App;
