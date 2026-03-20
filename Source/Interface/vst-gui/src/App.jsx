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
  <div className="section-zone" style={{ background:'rgba(255,255,255,0.01)', border:'1px solid rgba(255,255,255,0.03)', borderRadius:4, padding:12, flex:1, display:'flex', flexDirection:'column', position:'relative', ...style }}>
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
  <div style={{ width:'100%', height:'180px', background:'#0a0b0e', border:'1px solid #222', borderRadius:4, position:'relative', overflow:'hidden', boxShadow:'inset 0 0 50px #000' }}>
     <div style={{ position:'absolute', top:8, left:12, color:'#444', fontSize:10, fontWeight:700, letterSpacing:1 }}>FABFILTER PRO-Q 3</div>
     <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0.1, backgroundImage:'linear-gradient(#1a1c22 1px, transparent 1px), linear-gradient(90deg, #1a1c22 1px, transparent 1px)', backgroundSize:'20px 20px' }}></div>
     <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}>
        {/* EQ Points & Curve */}
        <path d="M 0 140 Q 40 140 60 70 Q 100 80 140 100 Q 180 60 220 90 Q 260 40 300 120 Q 360 140 400 140" fill="none" stroke="var(--neon-red)" strokeWidth="2.5" style={{ filter:'drop-shadow(0 0 8px var(--neon-red))' }} />
        {[60, 100, 140, 180, 220, 300].map((x, i) => {
           const colors = ["#ff0000", "#00ff00", "#0088ff", "#ffff00", "#ff00ff", "#00ffff"];
           const y = [70, 80, 100, 60, 90, 120][i];
           return <circle key={i} cx={x} cy={y} r="3" fill={colors[i]} />;
        })}
     </svg>
     <div style={{ position:'absolute', bottom:10, width:'100%', display:'flex', justifyContent:'center', gap:10 }}>
        {["L-CUT", "B1", "B2", "B3", "B4", "H-CUT"].map(b => (
           <div key={b} style={{ fontSize:7, color:'#555', border:'1px solid #222', padding:'2px 4px', background:'#000' }}>{b}</div>
        ))}
     </div>
  </div>
);

const PAZView = () => (
  <div style={{ width:'100%', height:'180px', background:'#0a0b0e', border:'1px solid #222', borderRadius:4, position:'relative', display:'flex', flexDirection:'column', padding:10, boxSizing:'border-box', boxShadow:'inset 0 0 50px #000' }}>
     <div className="label-sm" style={{ marginBottom:5 }}>WAVES PAZ ANALYZER</div>
     {/* Freq Spectrum */}
     <div style={{ flex:1.2, display:'flex', gap:3, alignItems:'flex-end', borderBottom:'1px solid #1a1c22', paddingBottom:10 }}>
        {Array.from({length:25}).map((_,i) => <div key={i} style={{ flex:1, height: `${20 + Math.random()*60}%`, background: i > 20 ? 'var(--neon-red)' : '#1a1c22', borderRadius:1 }}></div>)}
     </div>
     {/* Stereo Field */}
     <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', position:'relative', marginTop:10 }}>
        <div style={{ width:100, height:50, border:'2px solid #1a1c22', borderBottom:'none', borderRadius:'50px 50px 0 0', position:'relative' }}>
           <div style={{ position:'absolute', bottom:0, left:'50%', height:45, width:1, background:'var(--neon-red)', transform:'rotate(15deg)', transformOrigin:'bottom', boxShadow:'0 0 10px red' }}></div>
           <div style={{ position:'absolute', bottom:0, left:'50%', height:40, width:1, background:'#444', transform:'rotate(-25deg)', transformOrigin:'bottom' }}></div>
        </div>
     </div>
  </div>
);

function App() {
  return (
    <div className="rack-chassis" style={{ padding: '30px 40px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', position:'relative', marginBottom:35 }}>
         <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:32, fontWeight:1000, letterSpacing:8, color:'#444', textShadow:'2px 2px 4px #000' }}>NADA CHANNEL STRIP</div>
            <div style={{ fontSize:10, color:'#555', letterSpacing:4, fontWeight:700, marginTop:5 }}>ULTIMATE VOCAL PRODUCTION // V16.0</div>
         </div>
         <div className="ai-gold-btn" style={{ position:'absolute', right:10, width:36, height:36, borderRadius:'50%', border:'2px solid var(--gold)', boxShadow:'0 0 15px var(--gold)' }}></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.8fr 1fr 1fr', gap:20, height:'85%' }}>
         
         {/* COL 1: LEFT STACK */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="BX_CRISPYTUNER">
               <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <Knob label="RE-TUNE" size={55} initialValue={0.8} />
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                     <div style={{ display:'flex', gap:4 }}>
                        <div style={{ background:'#000', border:'1px solid #333', color:'var(--neon-red)', fontSize:8, padding:'2px 4px' }}>C#</div>
                        <div style={{ background:'#000', border:'1px solid #333', color:'var(--neon-red)', fontSize:8, padding:'2px 4px' }}>MIN</div>
                     </div>
                     <Knob label="HUMAN" size={35} />
                  </div>
               </div>
               <div style={{ display:'flex', gap:10, marginTop:10 }}>
                  <Knob label="AMOUNT" size={35} /> <Knob label="SPEED" size={35} />
               </div>
            </Card>
            <Card title="R-VOX (WAVES)">
               <div style={{ display:'flex', justifyContent:'space-around' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                     <div style={{ height:60, width:8, background:'#000', position:'relative', borderRadius:4 }}><div style={{ position:'absolute', top:'30%', width:'110%', height:3, background:'var(--neon-red)' }}></div></div>
                     <span style={{fontSize:7}}>COMP</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                     <div style={{ height:60, width:8, background:'#000', position:'relative', borderRadius:4 }}><div style={{ position:'absolute', top:'80%', width:'110%', height:3, background:'var(--neon-red)' }}></div></div>
                     <span style={{fontSize:7}}>GATE</span>
                  </div>
               </div>
            </Card>
            <Card title="902 DE-ESSER">
               <div style={{ display:'flex', gap:15, justifyContent:'center' }}>
                  <Knob label="FREQ" size={45} /> <Knob label="RANGE" size={45} />
               </div>
            </Card>
            <Card title="BUS REVERB - HITSVILLE">
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Knob label="MIX" size={35} /> <Knob label="DECAY" size={35} />
               </div>
            </Card>
         </div>

         {/* COL 2: MID-LEFT STACK */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="1176 REV A">
               <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                  <Knob label="INPUT" size={48} /> <Knob label="OUTPUT" size={48} />
               </div>
               <div style={{ display:'flex', gap:3, justifyContent:'center', marginTop:10 }}>
                  {[4, 8, 12, 20].map(r => <button key={r} style={{ background: r===4 ? 'var(--neon-red)' : '#111', color: r===4? '#fff':'#444', fontSize:7, padding:1 }}>{r}</button>)}
               </div>
            </Card>
            <Card title="TELETRONIX LA-2A">
               <div style={{ display:'flex', gap:15, justifyContent:'center', alignItems:'center' }}>
                  <Knob label="PEAK RED" size={80} initialValue={0.7} showValueInside={true} />
                  <Knob label="GAIN" size={45} />
               </div>
            </Card>
            <Card title="SSL 4000 G">
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5 }}>
                  <Knob label="HF" size={30} /> <Knob label="HMF" size={30} /> <Knob label="LMF" size={30} />
                  <Knob label="LF" size={30} /> <Knob label="HPF" size={30} /> <Knob label="LPF" size={30} />
               </div>
            </Card>
         </div>

         {/* CENTER HUB: MASTER ANALYZERS */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <ProQ3View />

            <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', gap:40 }}>
               <DualMeter height={100} left={0.8} right={0.8} label="IN" />
               <Knob label="MASTER VOLUME" size={150} initialValue={0.6} showValueInside={true} />
               <DualMeter height={100} left={0.9} right={0.9} label="OUT" />
            </div>

            <PAZView />
         </div>

         {/* COL 3: MID-RIGHT STACK */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="PULTEC EQP-1A">
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Knob label="LOW BST" size={38} /> <Knob label="LOW ATN" size={38} />
                  <Knob label="HI BST" size={38} /> <Knob label="HI ATN" size={38} />
               </div>
            </Card>
            <Card title="BLACK BOX HG-2">
               <div style={{ textAlign:'center' }}><Knob label="SATURATION" size={65} color="#ff8800" /></div>
               <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:10 }}>
                  <Knob label="PENTODE" size={40} /> <Knob label="TRIODE" size={40} />
               </div>
            </Card>
            <Card title="BX_STEREOMAKER">
               <div style={{ display:'flex', gap:15, justifyContent:'center' }}>
                  <Knob label="WIDTH" size={55} color="var(--gold)" />
                  <Knob label="MONO" size={55} />
               </div>
            </Card>
         </div>

         {/* COL 4: RIGHT STACK */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Card title="BUS COMPRESSION">
               <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                  <Knob label="THR" size={45} /> <Knob label="RAT" size={45} />
               </div>
               <div style={{ textAlign:'center', marginTop:10 }}><Knob label="MAKEUP" size={45} /></div>
            </Card>
            <Card title="BUS DELAY - H-DELAY">
               <div style={{ textAlign:'center' }}><Knob label="TIME" size={55} /></div>
               <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:10 }}>
                  <Knob label="FB" size={35} /> <Knob label="MIX" size={35} />
               </div>
            </Card>
            <Card title="BX_LIMITER TP" style={{ flex:1 }}>
               <div style={{ textAlign:'center' }}><Knob label="GAIN" size={120} initialValue={0.9} showValueInside={true} /></div>
               <div style={{ display:'flex', gap:20, justifyContent:'center', marginTop:20 }}>
                  <DualMeter height={80} label="GR" />
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                     <Knob label="CEIL" size={40} /> <Knob label="REL" size={40} />
                  </div>
               </div>
            </Card>
         </div>

      </div>

      {/* FOOTER */}
      <div style={{ textAlign:'center', marginTop:20, opacity:0.1, letterSpacing:4, fontSize:9, fontWeight:700 }}>
         MASTERING CONSOLE V16 // BRAINWORX & FABFILTER & UAD & WAVES AUTHENTICATED SIGNAL PATHS
      </div>
    </div>
  );
}

export default App;
