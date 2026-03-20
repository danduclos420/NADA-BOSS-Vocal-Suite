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
  <div className="section-zone" style={{ background:'rgba(255,255,255,0.01)', border:'1px solid rgba(255,255,255,0.03)', borderRadius:4, padding:15, display:'flex', flexDirection:'column', position:'relative', boxSizing:'border-box', ...style }}>
     <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, borderBottom:'1px solid rgba(255,255,255,0.03)', paddingBottom:5 }}>
        <span className="label-sm" style={{ fontWeight:1000, color:'#555', fontSize:'9px', letterSpacing:1 }}>{title}</span>
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
        <path d="M 0 145 Q 40 145 60 70 Q 100 85 140 110 Q 180 65 220 95 Q 260 45 300 135 Q 360 145 400 145" fill="none" stroke="var(--neon-red)" strokeWidth="3" style={{ filter:'drop-shadow(0 0 8px var(--neon-red))' }} />
        {[60, 100, 140, 180, 220, 300].map((x, i) => {
           const colors = ["#ff4d4d", "#4dff4d", "#0088ff", "#ffff4d", "#ff4dff", "#4dffff"];
           const y = [70, 85, 110, 65, 95, 135][i];
           return <circle key={i} cx={x} cy={y} r="4" fill={colors[i]} />;
        })}
     </svg>
     <div style={{ position:'absolute', bottom:10, width:'100%', display:'flex', justifyContent:'center', gap:10 }}>
        {["L-CUT", "B1", "B2", "B3", "B4", "H-CUT"].map(b => (
           <div key={b} style={{ fontSize:7, color:'#555', border:'1px solid #333', padding:'3px 6px', background:'#000', borderRadius:1, fontWeight:900 }}>{b}</div>
        ))}
     </div>
  </div>
);

const PAZView = () => (
  <div style={{ width:'100%', height:'200px', background:'#0a0b0e', border:'1px solid #222', borderRadius:4, position:'relative', display:'flex', flexDirection:'column', padding:15, boxSizing:'border-box', boxShadow:'inset 0 0 50px #000' }}>
     <div className="label-sm" style={{ marginBottom:8 }}>WAVES PAZ ANALYZER</div>
     <div style={{ flex:1.2, display:'flex', gap:2.5, alignItems:'flex-end', borderBottom:'1px solid #1a1c22', paddingBottom:15 }}>
        {Array.from({length:32}).map((_,i) => <div key={i} style={{ flex:1, height: `${20 + Math.random()*70}%`, background: i > 25 ? 'var(--neon-red)' : '#1a1c22', borderRadius:1 }}></div>)}
     </div>
     <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', position:'relative', marginTop:15 }}>
        <div style={{ width:140, height:70, border:'2px solid #1a1c22', borderBottom:'none', borderRadius:'70px 70px 0 0', position:'relative' }}>
           <div style={{ position:'absolute', bottom:0, left:'50%', height:65, width:1, background:'var(--neon-red)', transform:'rotate(20deg)', transformOrigin:'bottom', boxShadow:'0 0 15px red' }}></div>
           <div style={{ position:'absolute', bottom:0, left:'50%', height:55, width:1, background:'#444', transform:'rotate(-35deg)', transformOrigin:'bottom' }}></div>
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
            <div style={{ fontSize:38, fontWeight:1000, letterSpacing:12, color:'#444', textShadow:'2px 4px 8px #000' }}>NADA CHANNEL STRIP</div>
            <div style={{ fontSize:12, color:'#666', letterSpacing:6, fontWeight:700, marginTop:10 }}>ULTIMATE VOCAL PRODUCTION SUITE // V16.1</div>
         </div>
         <div style={{ position:'absolute', right:10, display:'flex', gap:25, alignItems:'center' }}>
            <span style={{ fontSize:10, color:'var(--gold)', letterSpacing:3, opacity:0.6, fontWeight:900 }}>AI CORE ACTIVE</span>
            <div className="ai-gold-btn" style={{ width:38, height:38, borderRadius:'100%', border:'2px solid var(--gold)', boxShadow:'0 0 20px var(--gold)' }}></div>
         </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr 1fr 1fr', gap:24, height:'82%' }}>
         
         {/* COL 1: LEFT FRONTEND */}
         <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title="BX_CRISPYTUNER">
               <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <Knob label="RE-TUNE" size={55} initialValue={0.8} />
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                     <div style={{ display:'flex', gap:6 }}>
                        <div style={{ background:'#000', border:'1px solid #333', color:'var(--neon-red)', fontSize:9, padding:'2px 6px', fontWeight:1000 }}>C#</div>
                        <div style={{ background:'#000', border:'1px solid #333', color:'var(--neon-red)', fontSize:9, padding:'2px 6px', fontWeight:1000 }}>MIN</div>
                     </div>
                     <Knob label="HUMAN" size={38} />
                  </div>
               </div>
               <div style={{ display:'flex', gap:12, marginTop:15 }}>
                  <Knob label="AMOUNT" size={38} /> <Knob label="SPEED" size={38} />
               </div>
            </Card>
            <Card title="R-VOX (WAVES)">
               <div style={{ display:'flex', justifyContent:'space-around', padding:'10px 0' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                     <div style={{ height:80, width:12, background:'#000', position:'relative', borderRadius:6, border:'1px solid #222' }}><div style={{ position:'absolute', top:'30%', width:'110%', height:4, background: 'linear-gradient(#444, #111)', border:'1px solid var(--neon-red)', boxShadow:'0 0 10px var(--neon-red)' }}></div></div>
                     <span style={{fontSize:8, fontWeight:1000, color:'#444'}}>COMP</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                     <div style={{ height:80, width:12, background:'#000', position:'relative', borderRadius:6, border:'1px solid #222' }}><div style={{ position:'absolute', top:'80%', width:'110%', height:4, background:'linear-gradient(#444, #111)', border:'1px solid #333' }}></div></div>
                     <span style={{fontSize:8, fontWeight:1000, color:'#444'}}>GATE</span>
                  </div>
               </div>
            </Card>
            <Card title="902 DE-ESSER">
               <div style={{ display:'flex', gap:25, justifyContent:'center' }}>
                  <Knob label="FREQ" size={50} /> <Knob label="RANGE" size={50} />
               </div>
            </Card>
            <Card title="BUS REVERB - HITSVILLE" style={{ height:'150px' }}>
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <Knob label="MIX" size={38} /> <Knob label="DECAY" size={38} />
                  <Knob label="PRE-D" size={38} /> <Knob label="TONE" size={38} />
               </div>
            </Card>
         </div>

         {/* COL 2: CORE DYNAMICS */}
         <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title="1176 REV A">
               <div style={{ display:'flex', gap:15, justifyContent:'center' }}>
                  <Knob label="INPUT" size={52} /> <Knob label="OUTPUT" size={52} />
               </div>
               <div style={{ display:'flex', gap:5, justifyContent:'center', marginTop:15 }}>
                  {[4, 8, 12, 20].map(r => <button key={r} style={{ background: r===4 ? 'var(--neon-red)' : '#000', color: r===4?'#fff':'#555', fontSize:9, border:'1px solid #333', padding:'3px 8px', fontWeight:1000 }}>{r}</button>)}
               </div>
               <div style={{ display:'flex', gap:15, justifyContent:'center', marginTop:15 }}>
                  <Knob label="ATTACK" size={40} /> <Knob label="RELEASE" size={40} />
               </div>
            </Card>
            <Card title="TELETRONIX LA-2A">
               <div style={{ display:'flex', gap:25, justifyContent:'center', alignItems:'center' }}>
                  <Knob label="PEAK RED" size={90} initialValue={0.7} showValueInside={true} />
                  <Knob label="GAIN" size={50} />
               </div>
            </Card>
            <Card title="SSL 4000 G (STRIP)">
               <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
                  <Knob label="HF" size={32} /> <Knob label="HMF" size={32} /> <Knob label="LMF" size={32} />
                  <Knob label="LF" size={32} /> <Knob label="HP-F" size={32} /> <Knob label="LP-F" size={32} />
               </div>
            </Card>
         </div>

         {/* CENTER: MASTER VISUALS */}
         <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <ProQ3View />
            
            <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', gap:50 }}>
               <DualMeter height={140} left={0.8} right={0.8} label="INPUT" />
               <Knob label="MASTER VOLUME" size={180} initialValue={0.6} showValueInside={true} />
               <DualMeter height={140} left={0.9} right={0.9} label="OUTPUT" />
            </div>

            <PAZView />
         </div>

         {/* COL 3: TONE SHAPING */}
         <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title="PULTEC EQP-1A">
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:15 }}>
                  <Knob label="LOW BST" size={42} /> <Knob label="LOW ATN" size={42} />
                  <Knob label="HI BST" size={42} /> <Knob label="HI ATN" size={42} />
               </div>
               <div style={{ textAlign:'center', fontSize:8, color:'#777', marginTop:15, fontWeight:1000, letterSpacing:1 }}>SELECT: 20 - 60 - 100 HZ</div>
            </Card>
            <Card title="BLACK BOX HG-2">
               <div style={{ textAlign:'center' }}><Knob label="SATURATION" size={75} color="#ff8800" /></div>
               <div style={{ display:'flex', gap:20, justifyContent:'center', marginTop:20 }}>
                  <Knob label="PENTODE" size={45} /> <Knob label="TRIODE" size={45} />
               </div>
            </Card>
            <Card title="BX_STEREOMAKER">
               <div style={{ display:'flex', gap:25, justifyContent:'center', alignItems:'center' }}>
                  <Knob label="WIDTH %" size={65} color="var(--gold)" initialValue={0.8} />
                  <Knob label="MONO" size={45} />
               </div>
            </Card>
         </div>

         {/* COL 4: MASTER OUT */}
         <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <Card title="BUS COMPRESSION">
               <div style={{ display:'flex', gap:15, justifyContent:'center' }}>
                  <Knob label="THRESHOLD" size={48} /> <Knob label="RATIO" size={48} />
               </div>
               <div style={{ textAlign:'center', marginTop:15 }}><Knob label="MAKEUP" size={48} /></div>
            </Card>
            <Card title="BX_LIMITER TP">
               <div style={{ textAlign:'center' }}><Knob label="GAIN" size={140} initialValue={0.9} showValueInside={true} /></div>
               <div style={{ display:'flex', gap:30, justifyContent:'center', marginTop:20 }}>
                  <DualMeter height={100} label="GR" />
                  <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
                     <Knob label="CEILING" size={45} /> <Knob label="RELEASE" size={45} />
                  </div>
               </div>
            </Card>
            <Card title="BUS DELAY - H-DELAY" style={{ height:'150px' }}>
               <div style={{ textAlign:'center' }}><Knob label="TIME" size={55} /></div>
               <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:12 }}>
                  <Knob label="FDBK" size={38} /> <Knob label="MIX" size={38} />
               </div>
            </Card>
         </div>

      </div>

      <div style={{ textAlign:'center', marginTop:40, opacity:0.1, letterSpacing:8, fontSize:11, fontWeight:1000 }}>
         NADA CHANNEL STRIP // DESIGNED BY BRAINWORX / FABFILTER / UAD / WAVES
      </div>
    </div>
  );
}

export default App;
