import React, { useState } from 'react';

const Knob = ({ label, initialValue = 0.5, size = 42, showValueInside = false, color = "var(--neon-red)", unit = "" }) => {
  const [val, setVal] = useState(initialValue);
  const circ = 2 * Math.PI * (size * 0.45);
  const offset = circ - (val * 0.75 * circ);

  return (
    <div className="knob-unit" style={{ minWidth: size + 10 }}>
      <div className="knob-bezel" style={{ width: size, height: size }}>
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

const DualMeter = ({ left = 0.6, right = 0.5, height = 50 }) => (
  <div style={{ display:'flex', gap:2, background:'#000', padding:1, border:'1px solid #222' }}>
    <div className="meter-strip" style={{height, width:3}}><div className="meter-fill" style={{height:`${left*100}%`}}></div></div>
    <div className="meter-strip" style={{height, width:3}}><div className="meter-fill" style={{height:`${right*100}%`}}></div></div>
  </div>
);

const Card = ({ title, children, style = {} }) => (
  <div className="section-zone" style={{ background:'rgba(255,255,255,0.01)', border:'1px solid rgba(255,255,255,0.03)', borderRadius:4, padding:10, minHeight:'fit-content', ...style }}>
     <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
        <span className="label-sm" style={{ fontWeight:900, color:'#555', fontSize:'9px' }}>{title}</span>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--gold)', opacity:0.3, boxShadow:'0 0 5px var(--gold)' }}></div>
     </div>
     {children}
  </div>
);

const VerticalFader = ({ label }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
     <div style={{ width:6, height:60, background:'#000', position:'relative', borderRadius:3 }}>
        <div style={{ position:'absolute', top:'30%', left:'-4px', width:14, height:3, background:'var(--neon-red)', borderRadius:1, boxShadow:'0 0 5px var(--neon-red)' }}></div>
     </div>
     <span className="label-sm" style={{fontSize:7}}>{label}</span>
  </div>
);

function App() {
  return (
    <div className="rack-chassis" style={{ padding: '30px 40px' }}>
      
      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:25 }}>
         <div style={{ display:'flex', gap:20, alignItems:'center' }}>
            <div style={{ fontSize:28, fontWeight:1000, letterSpacing:4, color:'#333' }}>NADA BOSS</div>
            <div style={{ width:2, height:24, background:'#222' }}></div>
            <div style={{ fontSize:10, color:'#444', letterSpacing:3, fontWeight:700 }}>ULTIMATE CHANNEL STRIP // V15 PRO</div>
         </div>
         <div className="ai-gold-btn" style={{ width:36, height:36, marginRight:10 }}></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.8fr 1fr 1fr', gap:24, height:'88%' }}>
         
         {/* COL 1: VOX FRONTEND */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="BX_CRISPYTUNER">
               <div style={{ display:'flex', justifyContent:'center', gap:10 }}>
                  <Knob label="RE-TUNE" size={65} initialValue={0.8} />
                  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                     <div style={{ padding:3, background:'#000', color:'var(--neon-red)', fontSize:9, textAlign:'center' }}>C# MIN</div>
                     <Knob label="HUMAN" size={35} />
                  </div>
               </div>
               <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:10 }}>
                  <Knob label="AMOUNT" size={35} /> <Knob label="SPEED" size={35} />
               </div>
            </Card>
            <Card title="R-VOX (WAVES)">
               <div style={{ display:'flex', justifyContent:'space-around', alignItems:'center' }}>
                  <VerticalFader label="COMP" />
                  <VerticalFader label="GATE" />
                  <VerticalFader label="GAIN" />
               </div>
            </Card>
            <Card title="902 DE-ESSER">
               <div style={{ display:'flex', gap:15, justifyContent:'center' }}>
                  <Knob label="FREQ" size={45} /> <Knob label="RANGE" size={45} />
                  <div style={{ display:'flex', flexDirection:'column', gap:4, justifyContent:'center' }}>
                     <div style={{width:6, height:6, borderRadius:'50%', background:'#111', border:'1px solid #333'}}></div>
                     <span style={{fontSize:6}}>AIR</span>
                  </div>
               </div>
            </Card>
            <Card title="HITSVILLE REVERB">
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Knob label="MIX" size={38} /> <Knob label="PRE-D" size={38} />
                  <Knob label="DECAY" size={38} /> <Knob label="TONE" size={38} />
               </div>
            </Card>
         </div>

         {/* COL 2: CLASSIC DYNAMICS */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="1176 REV A">
               <div style={{ display:'flex', gap:15, justifyContent:'center' }}>
                  <Knob label="INPUT" size={50} /> <Knob label="OUTPUT" size={50} />
               </div>
               <div style={{ display:'flex', gap:3, justifyContent:'center', marginTop:12 }}>
                  {[4, 8, 12, 20].map(r => <button key={r} style={{ background: r===4 ? 'var(--neon-red)' : '#111', color: r===4 ? '#fff' : '#444', border:'1px solid #333', fontSize:8, padding:'2px 5px' }}>{r}</button>)}
               </div>
               <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:12 }}>
                  <Knob label="ATTACK" size={40} /> <Knob label="RELEASE" size={40} />
               </div>
            </Card>
            <Card title="TELETRONIX LA-2A">
               <div style={{ display:'flex', gap:25, justifyContent:'center', alignItems:'center' }}>
                  <Knob label="PEAK RED" size={80} initialValue={0.7} showValueInside={true} />
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                     <Knob label="GAIN" size={45} />
                     <div style={{ padding:'2px 4px', background:'#000', fontSize:7, border:'1px solid #333' }}>COMP</div>
                  </div>
               </div>
            </Card>
            <Card title="SSL 4000 G (STRIP)">
               <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8 }}>
                  <Knob label="HF" size={32} /> <Knob label="HMF" size={32} />
                  <Knob label="LMF" size={32} /> <Knob label="LF" size={32} />
                  <Knob label="H-FLT" size={32} /> <Knob label="L-FLT" size={32} />
               </div>
            </Card>
         </div>

         {/* CENTER HUB: MASTER ANALYZERS */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ height:'45%', background:'#0a0b0e', border:'1px solid #222', borderRadius:4, position:'relative', overflow:'hidden', boxShadow:'inset 0 0 40px #000' }}>
               <div style={{ position:'absolute', top:8, left:12, color:'#444', fontSize:10, fontWeight:700 }}>FABFILTER PRO-Q 3</div>
               <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}>
                  <path d="M 0 120 Q 50 100 100 30 T 150 70 T 300 120" fill="none" stroke="var(--neon-red)" strokeWidth="2.5" style={{ filter:'drop-shadow(0 0 8px var(--neon-red))' }} />
                  <path d="M 0 135 L 300 135" stroke="#1a1c22" strokeWidth="1" strokeDasharray="5,5" />
               </svg>
               <div style={{ position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)', display:'flex', gap:15 }}>
                  <Knob label="GAIN" size={40} /> <Knob label="Q" size={40} /> <Knob label="FREQ" size={40} />
               </div>
            </div>

            <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', gap:40 }}>
               <div style={{ textAlign:'center' }}><span className="label-sm">IN</span><DualMeter height={100} left={0.8} right={0.8} /></div>
               <Knob label="MASTER VOLUME" size={160} initialValue={0.6} showValueInside={true} />
               <div style={{ textAlign:'center' }}><span className="label-sm">OUT</span><DualMeter height={100} left={0.9} right={0.9} /></div>
            </div>

            <div style={{ height:'35%', background:'#0a0b0e', border:'1px solid #222', borderRadius:4, position:'relative', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', boxShadow:'inset 0 0 40px #000' }}>
               <div style={{ position:'absolute', top:8, left:12, color:'#444', fontSize:10, fontWeight:700 }}>WAVES PAZ ANALYZER</div>
               <div style={{ width:120, height:60, border:'2px solid #1a1c22', borderBottom:'none', borderRadius:'60px 60px 0 0', position:'relative' }}>
                  <div style={{ position:'absolute', bottom:0, left:'50%', height:55, width:1, background:'var(--neon-red)', transform:'rotate(15deg)', transformOrigin:'bottom', boxShadow:'0 0 10px red' }}></div>
               </div>
               <div style={{ display:'flex', gap:4, marginTop:10 }}>
                  {Array.from({length:15}).map((_,i) => <div key={i} style={{ width:6, height: 10 + Math.random()*25, background: i > 12 ? 'var(--neon-red)' : '#1a1c22' }}></div>)}
               </div>
            </div>
         </div>

         {/* COL 3: TONE SHAPING */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="PULTEC EQP-1A">
               <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 }}>
                  <Knob label="LOW BST" size={38} /> <Knob label="LOW ATN" size={38} />
                  <Knob label="HI BST" size={38} /> <Knob label="HI ATN" size={38} />
                  <div style={{ gridColumn:'span 2', textAlign:'center', fontSize:8, border:'1px solid #333', background:'#000', padding:2 }}>30 - 60 - 100 Hz</div>
               </div>
            </Card>
            <Card title="BLACK BOX HG-2">
               <div style={{ textAlign:'center' }}><Knob label="SATURATION" size={65} color="#ff8800" initialValue={0.4} /></div>
               <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:15 }}>
                  <Knob label="PENT" size={42} /> <Knob label="TRIO" size={42} />
               </div>
               <div style={{ textAlign:'center', marginTop:10 }}><Knob label="AIR" size={35} color="var(--gold)" /></div>
            </Card>
            <Card title="BX_STEREOMAKER">
               <div style={{ display:'flex', gap:15, justifyContent:'center', alignItems:'center' }}>
                  <Knob label="WIDTH %" size={55} initialValue={0.8} color="var(--gold)" />
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                     <Knob label="MONO" size={35} /> <Knob label="DAMP" size={35} />
                  </div>
               </div>
            </Card>
         </div>

         {/* COL 4: MASTER OUT */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="WAVES H-DELAY">
               <div style={{ textAlign:'center' }}><Knob label="TIME" size={60} /></div>
               <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center', marginTop:12 }}>
                  <Knob label="FDBK" size={38} /> <Knob label="MIX" size={38} />
                  <Knob label="LO-FI" size={32} /> <Knob label="TAP" size={32} />
               </div>
            </Card>
            <Card title="BX_LIMITER TP" style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
               <div style={{ textAlign:'center' }}><Knob label="GAIN" size={130} initialValue={0.9} showValueInside={true} /></div>
               <div style={{ display:'flex', gap:25, justifyContent:'center', marginTop:25 }}>
                  <div style={{ textAlign:'center' }}><span style={{fontSize:7}}>GR</span><DualMeter height={100} left={0.2} right={0.2} /></div>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                     <Knob label="CEILING" size={42} /> <Knob label="RELEASE" size={42} />
                  </div>
               </div>
            </Card>
         </div>

      </div>

      {/* SUBTLE BRANDING */}
      <div style={{ textAlign:'center', marginTop:15, opacity:0.1, letterSpacing:4, fontSize:9 }}>
         DEVELOPED FOR NADA BOSS // EMULATING CAPITOL / BRAINWORX / UAD SIGNAL PATHS
      </div>
    </div>
  );
}

export default App;
