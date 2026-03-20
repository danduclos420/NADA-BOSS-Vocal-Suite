import React, { useState } from 'react';

const Knob = ({ label, initialValue = 0.5, size = 42, showValueInside = false, color = "var(--neon-red)" }) => {
  const [val, setVal] = useState(initialValue);
  const circ = 2 * Math.PI * (size * 0.45);
  const offset = circ - (val * 0.75 * circ);

  return (
    <div className="knob-unit" style={{ minWidth: size + 10 }}>
      <div className="knob-bezel" style={{ width: size, height: size }}>
        <div className="knob-holes">
          {[0, 60, 120, 180, 240, 300].map(deg => (
            <div key={deg} className="knob-hole" style={{ top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-${size*0.55}px)` }}></div>
          ))}
        </div>
        <svg style={{ position:'absolute', top:'-2px', left:'-2px', width:size+4, height:size+4 }}>
           <circle cx={(size+4)/2} cy={(size+4)/2} r={size*0.45} fill="none" stroke="#000" strokeWidth="1.5" strokeDasharray={circ} strokeDashoffset={circ*0.25} transform={`rotate(135 ${(size+4)/2} ${(size+4)/2})`} />
           <circle cx={(size+4)/2} cy={(size+4)/2} r={size*0.45} fill="none" stroke={color} strokeWidth="2" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(135 ${(size+4)/2} ${(size+4)/2})`} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
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
      <div className="label-sm" style={{marginTop:'3px', fontSize:'8px', color: '#555'}}>{label}</div>
    </div>
  );
};

const DualMeter = ({ left = 0.6, right = 0.5, height = 50, label = "" }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
    <div style={{ display:'flex', gap:2, background:'#000', padding:1, border:'1px solid #222' }}>
      <div className="meter-strip" style={{height, width:3}}><div className="meter-fill" style={{height:`${left*100}%`}}></div></div>
      <div className="meter-strip" style={{height, width:3}}><div className="meter-fill" style={{height:`${right*100}%`}}></div></div>
    </div>
    {label && <span className="label-sm" style={{fontSize:6.5}}>{label}</span>}
  </div>
);

const Card = ({ title, children, style = {} }) => (
  <div className="section-zone" style={{ background:'rgba(255,255,255,0.01)', border:'1px solid rgba(255,255,255,0.03)', borderRadius:4, padding:12, minHeight:'fit-content', position:'relative', boxSizing:'border-box', ...style }}>
     <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, borderBottom:'1px solid rgba(255,255,255,0.03)', paddingBottom:5 }}>
        <span className="label-sm" style={{ fontWeight:1000, color:'#555', fontSize:'9px', letterSpacing:1 }}>{title}</span>
        <div style={{ width:8, height:8, borderRadius:'100%', padding:1, background:'#000', border:'1px solid #222' }}><div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'var(--gold)', opacity:0.6 }}></div></div>
     </div>
     {children}
  </div>
);

const VerticalFader = ({ label }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
     <div style={{ width:8, height:70, background:'#000', position:'relative', borderRadius:4, border:'1px solid #222' }}>
        <div style={{ position:'absolute', top:'40%', left:'-4px', width:16, height:4, background: 'linear-gradient(#444, #111)', border:'1px solid var(--neon-red)', borderRadius:1, boxShadow:'0 0 5px var(--neon-red)' }}></div>
     </div>
     <span className="label-sm" style={{fontSize:7, fontWeight:900, color:'#444'}}>{label}</span>
  </div>
);

function App() {
  return (
    <div className="rack-chassis" style={{ padding: '30px 40px' }}>
      
      {/* HEADER SECTION (CLEANER) */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30 }}>
         <div style={{ display:'flex', gap:25, alignItems:'center' }}>
            <div style={{ fontSize:32, fontWeight:1000, letterSpacing:6, color:'#444', textShadow:'1px 1px 2px #000' }}>NADA BOSS</div>
            <div style={{ width:1, height:30, background:'#222' }}></div>
            <div>
               <div style={{ fontSize:10, color:'#555', letterSpacing:3, fontWeight:700 }}>ULTIMATE CHANNEL STRIP</div>
               <div style={{ fontSize:8, color:'#333', letterSpacing:1 }}>EMULATED ANALOG SIGNAL PATH V15.8</div>
            </div>
         </div>
         <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <span style={{ fontSize:9, color:'var(--gold)', letterSpacing:2, opacity:0.6 }}>AI ENGINE ENGAGED</span>
            <div className="ai-gold-btn" style={{ width:32, height:32, borderRadius:'50%', border:'2px solid var(--gold)', boxShadow:'0 0 15px var(--gold)' }}></div>
         </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr 1fr 1fr', gap:25, height:'85%' }}>
         
         {/* COL 1: VOX FRONTEND */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="BX_CRISPYTUNER">
               <div style={{ display:'flex', justifyContent:'center', gap:15, alignItems:'center' }}>
                  <Knob label="RE-TUNE" size={60} initialValue={0.8} />
                  <div style={{ textAlign:'center' }}>
                     <div style={{ padding:3, background:'#000', color:'var(--neon-red)', fontSize:10, fontWeight:700, borderRadius:2, border:'1px solid #222' }}>C# MIN</div>
                     <Knob label="HUMAN" size={38} />
                  </div>
               </div>
               <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:15 }}>
                  <Knob label="AMOUNT" size={38} /> <Knob label="SPEED" size={38} />
               </div>
            </Card>
            <Card title="R-VOX (WAVES)">
               <div style={{ display:'flex', justifyContent:'space-around', alignItems:'center', padding:'5px 0' }}>
                  <VerticalFader label="COMP" />
                  <VerticalFader label="GATE" />
                  <VerticalFader label="GAIN" />
               </div>
            </Card>
            <Card title="902 DE-ESSER">
               <div style={{ display:'flex', gap:15, justifyContent:'center', alignItems:'center' }}>
                  <Knob label="FREQ" size={45} /> <DualMeter left={0.3} right={0.3} height={40} label="REDUX" /> <Knob label="RANGE" size={45} />
               </div>
            </Card>
            <Card title="HITSVILLE REVERB">
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Knob label="MIX" size={38} /> <Knob label="DECAY" size={38} />
                  <Knob label="PRE-D" size={38} /> <Knob label="TONE" size={38} />
               </div>
            </Card>
         </div>

         {/* COL 2: MAIN DYNAMICS */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="1176 REV A">
               <div style={{ display:'flex', gap:15, justifyContent:'center', alignItems:'center' }}>
                  <Knob label="INPUT" size={50} /> <DualMeter height={45} left={0.2} label="GR" /> <Knob label="OUTPUT" size={50} />
               </div>
               <div style={{ display:'flex', gap:4, justifyContent:'center', marginTop:12 }}>
                  {[4, 8, 12, 20].map(r => <button key={r} style={{ background: r===4 ? 'var(--neon-red)' : '#111', color: r===4 ? '#fff' : '#444', border:'1px solid #333', fontSize:8, padding:'2px 6px', fontWeight:900 }}>{r}</button>)}
               </div>
               <div style={{ display:'flex', gap:15, justifyContent:'center', marginTop:12 }}>
                  <Knob label="ATTACK" size={38} /> <Knob label="RELEASE" size={38} />
               </div>
            </Card>
            <Card title="TELETRONIX LA-2A">
               <div style={{ display:'flex', gap:25, justifyContent:'center', alignItems:'center' }}>
                  <Knob label="PEAK RED" size={85} initialValue={0.7} showValueInside={true} />
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                     <Knob label="GAIN" size={45} />
                     <DualMeter height={35} label="METER" />
                  </div>
               </div>
            </Card>
            <Card title="SSL 4000 G (STRIP)">
               <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 }}>
                  <Knob label="HF" size={32} /> <Knob label="HMF" size={32} />
                  <Knob label="LMF" size={32} /> <Knob label="LF" size={32} />
                  <Knob label="H-FLT" size={32} /> <Knob label="L-FLT" size={32} />
               </div>
            </Card>
         </div>

         {/* CENTER HUB: MASTER ANALYZERS */}
         <div style={{ display:'flex', flexDirection:'column', gap:25 }}>
            <div style={{ height:'45%', background:'#0a0b0e', border:'1px solid #222', borderRadius:4, position:'relative', overflow:'hidden', boxShadow:'inset 0 0 50px #000' }}>
               <div style={{ position:'absolute', top:10, left:15, color:'#444', fontSize:11, fontWeight:1000, letterSpacing:1 }}>FABFILTER PRO-Q 3</div>
               <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}>
                  <path d="M 0 130 Q 80 110 130 40 T 200 80 T 400 130" fill="none" stroke="var(--neon-red)" strokeWidth="3" style={{ filter:'drop-shadow(0 0 8px var(--neon-red))' }} />
                  <path d="M 0 145 L 400 145" stroke="#1a1c22" strokeWidth="1" strokeDasharray="6,6" />
               </svg>
               <div style={{ position:'absolute', bottom:10, width:'100%', display:'flex', justifyContent:'center', gap:20 }}>
                  <Knob label="GAIN" size={40} /> <Knob label="Q" size={40} /> <Knob label="FREQ" size={40} />
               </div>
            </div>

            <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', gap:45 }}>
               <DualMeter height={120} left={0.8} right={0.8} label="INPUT" />
               <div style={{ textAlign:'center' }}>
                  <Knob label="MASTER VOLUME" size={170} initialValue={0.6} showValueInside={true} />
               </div>
               <DualMeter height={120} left={0.9} right={0.9} label="OUTPUT" />
            </div>

            <div style={{ height:'35%', background:'#0a0b0e', border:'1px solid #222', borderRadius:4, position:'relative', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', boxShadow:'inset 0 0 50px #000' }}>
               <div style={{ position:'absolute', top:10, left:15, color:'#444', fontSize:11, fontWeight:1000, letterSpacing:1 }}>WAVES PAZ ANALYZER</div>
               <div style={{ width:140, height:70, border:'2px solid #1a1c22', borderBottom:'none', borderRadius:'70px 70px 0 0', position:'relative' }}>
                  <div style={{ position:'absolute', bottom:0, left:'50%', height:65, width:1, background:'var(--neon-red)', transform:'rotate(20deg)', transformOrigin:'bottom', boxShadow:'0 0 15px red' }}></div>
               </div>
               <div style={{ display:'flex', gap:6, marginTop:15 }}>
                  {Array.from({length:18}).map((_,i) => <div key={i} style={{ width:7, height: 10 + Math.random()*30, background: i > 15 ? 'var(--neon-red)' : '#1a1c22' }}></div>)}
               </div>
            </div>
         </div>

         {/* COL 3: TONE SHAPING */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="PULTEC EQP-1A">
               <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 }}>
                  <Knob label="LOW BST" size={40} /> <Knob label="LOW ATN" size={40} />
                  <Knob label="HI BST" size={40} /> <Knob label="HI ATN" size={40} />
                  <div style={{ gridColumn:'span 2', textAlign:'center', fontSize:8, border:'1px solid #333', background:'#000', padding:3, color:'#555', fontWeight:900, borderRadius:2 }}>SELECT FREQ: 30 - 60 - 100 Hz</div>
               </div>
            </Card>
            <Card title="BLACK BOX HG-2">
               <div style={{ textAlign:'center' }}><Knob label="SATURATION" size={70} color="#ff8800" initialValue={0.4} /></div>
               <div style={{ display:'flex', gap:15, justifyContent:'center', marginTop:15 }}>
                  <Knob label="PENTODE" size={42} /> <Knob label="TRIODE" size={42} />
               </div>
               <div style={{ textAlign:'center', marginTop:12 }}><Knob label="AIR" size={38} color="var(--gold)" /></div>
            </Card>
            <Card title="BX_STEREOMAKER">
               <div style={{ display:'flex', gap:20, justifyContent:'center', alignItems:'center' }}>
                  <Knob label="WIDTH %" size={60} initialValue={0.8} color="var(--gold)" />
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                     <Knob label="MONO" size={35} /> <Knob label="DAMP" size={35} />
                  </div>
               </div>
            </Card>
         </div>

         {/* COL 4: MASTER OUT */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="WAVES H-DELAY">
               <div style={{ textAlign:'center' }}><Knob label="TIME" size={65} /></div>
               <div style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center', marginTop:15 }}>
                  <Knob label="FDBK" size={40} /> <Knob label="MIX" size={40} />
                  <Knob label="LO-FI" size={35} /> <Knob label="TAP" size={35} />
               </div>
            </Card>
            <Card title="BX_LIMITER TP" style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
               <div style={{ textAlign:'center' }}><Knob label="GAIN" size={140} initialValue={0.9} showValueInside={true} /></div>
               <div style={{ display:'flex', gap:30, justifyContent:'center', marginTop:30 }}>
                  <DualMeter height={110} left={0.2} right={0.2} label="GR" />
                  <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
                     <Knob label="CEILING" size={45} /> <Knob label="RELEASE" size={45} />
                  </div>
               </div>
            </Card>
         </div>

      </div>

      {/* FINAL FOOTER */}
      <div style={{ textAlign:'center', marginTop:25, opacity:0.1, letterSpacing:6, fontSize:10, fontWeight:700 }}>
         (C) 2026 NADA BOSS // EMULATING CAPITOL / BRAINWORX / UAD / WAVES / FABFILTER
      </div>
    </div>
  );
}

export default App;
