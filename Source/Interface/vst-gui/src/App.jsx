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
  <div className="section-zone" style={{ background:'rgba(255,255,255,0.01)', border:'1px solid rgba(255,255,255,0.03)', borderRadius:4, padding:15, display:'flex', flexDirection:'column', position:'relative', ...style }}>
     <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, borderBottom:'1px solid rgba(255,255,255,0.03)', paddingBottom:5 }}>
        <span className="label-sm" style={{ fontWeight:1000, color:'#555', fontSize:'9px' }}>{title}</span>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--gold)', opacity:0.3 }}></div>
     </div>
     <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
        {children}
     </div>
  </div>
);

const ProQ3View = () => (
  <div style={{ width:'100%', height:'200px', background:'#0a0b0e', border:'1px solid #222', borderRadius:4, position:'relative', overflow:'hidden', boxShadow:'inset 0 0 50px #000' }}>
     <div style={{ position:'absolute', top:8, left:12, color:'#444', fontSize:10, fontWeight:700, letterSpacing:1 }}>FABFILTER PRO-Q 3</div>
     <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0.1, backgroundImage:'linear-gradient(#1a1c22 1px, transparent 1px), linear-gradient(90deg, #1a1c22 1px, transparent 1px)', backgroundSize:'20px 20px' }}></div>
     <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}>
        <path d="M 0 140 Q 40 140 60 70 Q 100 80 140 110 Q 180 60 220 90 Q 260 40 300 130 Q 360 145 400 145" fill="none" stroke="var(--neon-red)" strokeWidth="3" style={{ filter:'drop-shadow(0 0 8px var(--neon-red))' }} />
        {[60, 100, 140, 180, 220, 300].map((x, i) => {
           const colors = ["#ff0000", "#00ff00", "#0088ff", "#ffff00", "#ff00ff", "#00ffff"];
           const y = [70, 80, 110, 60, 90, 130][i];
           return <circle key={i} cx={x} cy={y} r="4" fill={colors[i]} />;
        })}
     </svg>
     <div style={{ position:'absolute', bottom:10, width:'100%', display:'flex', justifyContent:'center', gap:10 }}>
        {["L-CUT", "B1", "B2", "B3", "B4", "H-CUT"].map(b => (
           <div key={b} style={{ fontSize:7, color:'#555', border:'1px solid #333', padding:'3px 5px', background:'#000', borderRadius:1 }}>{b}</div>
        ))}
     </div>
  </div>
);

const PAZView = () => (
  <div style={{ width:'100%', height:'200px', background:'#0a0b0e', border:'1px solid #222', borderRadius:4, position:'relative', display:'flex', flexDirection:'column', padding:15, boxSizing:'border-box', boxShadow:'inset 0 0 50px #000' }}>
     <div className="label-sm" style={{ marginBottom:8 }}>WAVES PAZ ANALYZER</div>
     <div style={{ flex:1.2, display:'flex', gap:2, alignItems:'flex-end', borderBottom:'1px solid #1a1c22', paddingBottom:15 }}>
        {Array.from({length:32}).map((_,i) => <div key={i} style={{ flex:1, height: `${15 + Math.random()*70}%`, background: i > 25 ? 'var(--neon-red)' : '#1a1c22', borderRadius:1 }}></div>)}
     </div>
     <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', position:'relative', marginTop:15 }}>
        <div style={{ width:120, height:60, border:'2px solid #1a1c22', borderBottom:'none', borderRadius:'60px 60px 0 0', position:'relative' }}>
           <div style={{ position:'absolute', bottom:0, left:'50%', height:55, width:1, background:'var(--neon-red)', transform:'rotate(20deg)', transformOrigin:'bottom', boxShadow:'0 0 15px red' }}></div>
           <div style={{ position:'absolute', bottom:0, left:'50%', height:50, width:1, background:'#444', transform:'rotate(-30deg)', transformOrigin:'bottom' }}></div>
        </div>
     </div>
  </div>
);

function App() {
  return (
    <div className="rack-chassis" style={{ padding: '40px 60px' }}>
      
      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', position:'relative', marginBottom:40 }}>
         <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:36, fontWeight:1000, letterSpacing:10, color:'#444', textShadow:'2px 3px 6px #000' }}>NADA CHANNEL STRIP</div>
            <div style={{ fontSize:11, color:'#666', letterSpacing:5, fontWeight:700, marginTop:8 }}>ULTIMATE VOCAL PRODUCTION SUITE // V16.05</div>
         </div>
         <div style={{ position:'absolute', right:10, display:'flex', gap:20, alignItems:'center' }}>
            <span style={{ fontSize:10, color:'var(--gold)', letterSpacing:2, opacity:0.5 }}>CORE AI ACTIVE</span>
            <div className="ai-gold-btn" style={{ width:36, height:36, borderRadius:'50%', border:'2px solid var(--gold)', boxShadow:'0 0 20px var(--gold)' }}></div>
         </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.8fr 1fr 1fr', gap:20, height:'82%' }}>
         
         {/* COL 1: FRONTEND */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="BX_CRISPYTUNER">
               <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <Knob label="RE-TUNE" size={55} initialValue={0.8} />
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                     <div style={{ display:'flex', gap:5 }}>
                        <div style={{ background:'#000', border:'1px solid #333', color:'var(--neon-red)', fontSize:9, padding:'2px 5px', fontWeight:900 }}>C#</div>
                        <div style={{ background:'#000', border:'1px solid #333', color:'var(--neon-red)', fontSize:9, padding:'2px 5px', fontWeight:900 }}>MIN</div>
                     </div>
                     <Knob label="HUMAN" size={35} />
                  </div>
               </div>
               <div style={{ display:'flex', gap:10, marginTop:12 }}>
                  <Knob label="AMOUNT" size={35} /> <Knob label="SPEED" size={35} />
               </div>
            </Card>
            <Card title="R-VOX (WAVES)">
               <div style={{ display:'flex', justifyContent:'space-around', padding:'5px 0' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                     <div style={{ height:70, width:10, background:'#000', position:'relative', borderRadius:4, border:'1px solid #222' }}><div style={{ position:'absolute', top:'25%', width:'110%', height:3, background:'var(--neon-red)', boxShadow:'0 0 5px var(--neon-red)' }}></div></div>
                     <span style={{fontSize:7, fontWeight:900}}>COMP</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                     <div style={{ height:70, width:10, background:'#000', position:'relative', borderRadius:4, border:'1px solid #222' }}><div style={{ position:'absolute', top:'85%', width:'110%', height:3, background:'var(--neon-red)' }}></div></div>
                     <span style={{fontSize:7, fontWeight:900}}>GATE</span>
                  </div>
               </div>
            </Card>
            <Card title="902 DE-ESSER">
               <div style={{ display:'flex', gap:20, justifyContent:'center' }}>
                  <Knob label="FREQ" size={48} /> <Knob label="RANGE" size={48} />
               </div>
            </Card>
            <Card title="BUS REVERB - HITSVILLE" style={{ height:'140px' }}>
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Knob label="MIX" size={38} /> <Knob label="DECAY" size={38} />
                  <Knob label="PRE-D" size={38} /> <Knob label="TONE" size={38} />
               </div>
            </Card>
         </div>

         {/* COL 2: DYNAMICS */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="1176 REV A">
               <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                  <Knob label="INPUT" size={50} /> <Knob label="OUTPUT" size={50} />
               </div>
               <div style={{ display:'flex', gap:4, justifyContent:'center', marginTop:15 }}>
                  {[4, 8, 12, 20].map(r => <button key={r} style={{ background: r===4 ? 'var(--neon-red)' : '#111', color: r===4?'#fff':'#666', fontSize:8, border:'1px solid #333', padding:'2px 4px', fontWeight:900 }}>{r}</button>)}
               </div>
               <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:15 }}>
                  <Knob label="ATTACK" size={38} /> <Knob label="RELEASE" size={38} />
               </div>
            </Card>
            <Card title="TELETRONIX LA-2A">
               <div style={{ display:'flex', gap:20, justifyContent:'center', alignItems:'center' }}>
                  <Knob label="PEAK RED" size={85} initialValue={0.7} showValueInside={true} />
                  <Knob label="GAIN" size={48} />
               </div>
            </Card>
            <Card title="SSL 4000 G (STRIP)">
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                  <Knob label="HF" size={32} /> <Knob label="HMF" size={32} /> <Knob label="LMF" size={32} />
                  <Knob label="LF" size={32} /> <Knob label="HP-F" size={32} /> <Knob label="LP-F" size={32} />
               </div>
            </Card>
         </div>

         {/* CENTER: MASTER VISUALS */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <ProQ3View />
            
            <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', gap:40 }}>
               <DualMeter height={120} left={0.8} right={0.8} label="INPUT" />
               <Knob label="MASTER VOLUME" size={160} initialValue={0.6} showValueInside={true} />
               <DualMeter height={120} left={0.9} right={0.9} label="OUTPUT" />
            </div>

            <PAZView />
         </div>

         {/* COL 3: TONE */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="PULTEC EQP-1A">
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:15 }}>
                  <Knob label="LOW BST" size={42} /> <Knob label="LOW ATN" size={42} />
                  <Knob label="HI BST" size={42} /> <Knob label="HI ATN" size={42} />
               </div>
               <div style={{ textAlign:'center', fontSize:8, color:'#555', marginTop:10, fontWeight:900 }}>20 - 60 - 100 HZ</div>
            </Card>
            <Card title="BLACK BOX HG-2">
               <div style={{ textAlign:'center' }}><Knob label="SATURATION" size={75} color="#ff8800" /></div>
               <div style={{ display:'flex', gap:15, justifyContent:'center', marginTop:15 }}>
                  <Knob label="PENT" size={42} /> <Knob label="TRIO" size={42} />
               </div>
            </Card>
            <Card title="BX_STEREOMAKER">
               <div style={{ display:'flex', gap:20, justifyContent:'center' }}>
                  <Knob label="WIDTH %" size={60} color="var(--gold)" initialValue={0.8} />
                  <Knob label="MONO" size={50} />
               </div>
            </Card>
         </div>

         {/* COL 4: MASTER OUT */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="BUS COMPRESSION">
               <div style={{ display:'flex', gap:15, justifyContent:'center' }}>
                  <Knob label="THRESHOLD" size={45} /> <Knob label="RATIO" size={45} />
               </div>
               <div style={{ textAlign:'center', marginTop:15 }}><Knob label="MAKEUP" size={45} /></div>
            </Card>
            <Card title="BX_LIMITER TP">
               <div style={{ textAlign:'center' }}><Knob label="GAIN" size={130} initialValue={0.9} showValueInside={true} /></div>
               <div style={{ display:'flex', gap:20, justifyContent:'center', marginTop:20 }}>
                  <DualMeter height={80} label="GR" />
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                     <Knob label="CEILING" size={40} /> <Knob label="RELEASE" size={40} />
                  </div>
               </div>
            </Card>
            <Card title="BUS DELAY - H-DELAY" style={{ height:'140px' }}>
               <div style={{ textAlign:'center' }}><Knob label="TIME" size={55} /></div>
               <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:12 }}>
                  <Knob label="FB" size={38} /> <Knob label="MIX" size={38} />
               </div>
            </Card>
         </div>

      </div>

      <div style={{ textAlign:'center', marginTop:30, opacity:0.1, letterSpacing:6, fontSize:10, fontWeight:900 }}>
         NADA CHANNEL STRIP // EMULATING ANALOG SIGNAL PATHS V16.05
      </div>
    </div>
  );
}

export default App;
