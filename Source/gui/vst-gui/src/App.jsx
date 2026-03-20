import React, { useState, useMemo, memo, useEffect } from 'react';

// --- MATH UTILS FOR EQ CURVE ---
const getFilterResponse = (x, band) => {
  const { type, freq, gain, q } = band;
  const f = x / 400; 
  const targetF = freq / 400;
  const g = (gain - 0.5) * 100; 
  
  if (type === 'cut-low') return f < targetF ? -100 * Math.pow(1 - f/targetF, 2) : 0;
  if (type === 'cut-high') return f > targetF ? -100 * Math.pow((f - targetF)/(1 - targetF), 2) : 0;
  const dist = Math.abs(f - targetF);
  const width = (1.1 - q) * 0.2;
  return g * Math.exp(-(dist * dist) / (width * width));
};

const Knob = memo(({ label, initialValue = 0.5, size = 40, showValueInside = false, color = "var(--neon-red)" }) => {
  const [val, setVal] = useState(initialValue);
  const circ = 2 * Math.PI * (size * 0.45);
  const offset = circ - (val * 0.75 * circ);

  return (
    <div className="knob-unit" style={{ minWidth: size + 8 }}>
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
             <div className="knob-value-internal" style={{ transform: `rotate(${-val * 270 + 135}deg)`, fontSize: size/4.5 }}>{(val * 10).toFixed(1)}</div>
          ) : (
             <div className="knob-tick" style={{ width: size*0.08, height: size*0.12, top: '2px', background: color }}></div>
          )}
        </div>
      </div>
      <div className="label-sm" style={{marginTop:'2px', fontSize:'7px', color: '#444'}}>{label}</div>
    </div>
  );
});

const Card = memo(({ title, children, style = {} }) => (
  <div className="section-zone" style={{ background:'rgba(255,255,255,0.01)', border:'1px solid rgba(255,255,255,0.03)', borderRadius:3, padding:10, display:'flex', flexDirection:'column', position:'relative', overflow:'hidden', ...style }}>
     <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, borderBottom:'1px solid rgba(255,255,255,0.02)', paddingBottom:3 }}>
        <span className="label-sm" style={{ fontWeight:1000, color:'#444', fontSize:'8px', letterSpacing:1 }}>{title}</span>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--gold)', opacity:0.2 }}></div>
     </div>
     <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
        {children}
     </div>
  </div>
));

const ProQ3View = memo(() => {
  const [bands] = useState([
    { type: 'cut-low', freq: 40, gain: 0.5, q: 0.8, color: '#ff4d4d' },
    { type: 'bell', freq: 100, gain: 0.7, q: 0.5, color: '#4dff4d' },
    { type: 'bell', freq: 200, gain: 0.3, q: 0.6, color: '#0088ff' },
    { type: 'bell', freq: 300, gain: 0.6, q: 0.4, color: '#ffff4d' },
    { type: 'bell', freq: 350, gain: 0.4, q: 0.7, color: '#ff4dff' },
    { type: 'cut-high', freq: 380, gain: 0.5, q: 0.8, color: '#4dffff' },
  ]);

  const curvePath = useMemo(() => {
    let pts = [];
    for (let x = 0; x <= 400; x += 5) {
      let y = 100;
      bands.forEach(b => { y -= getFilterResponse(x, b); });
      pts.push(`${x},${Math.min(180, Math.max(20, y))}`);
    }
    return `M ${pts.join(' L ')}`;
  }, [bands]);

  return (
    <div style={{ width:'100%', height:'180px', background:'#08090b', border:'1px solid #222', borderRadius:4, position:'relative', overflow:'hidden', boxShadow:'inset 0 0 40px #000' }}>
       <div style={{ position:'absolute', top:5, left:10, color:'#333', fontSize:8, fontWeight:1000 }}>FABFILTER PRO-Q 3 STYLE</div>
       <svg viewBox="0 0 400 180" style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}>
          <path d={curvePath} fill="none" stroke="var(--neon-red)" strokeWidth="2.5" style={{ filter:'drop-shadow(0 0 5px var(--neon-red))' }} />
          {bands.map((b, i) => (
             <g key={i}>
                <circle cx={b.freq} cy={100 - (b.gain-0.5)*100} r={10 + (1-b.q)*10} fill={b.color} opacity={0.15} />
                <circle cx={b.freq} cy={100 - (b.gain-0.5)*100} r="3" fill={b.color} />
             </g>
          ))}
       </svg>
    </div>
  );
});

const PAZView = memo(() => {
  const [data, setData] = useState(Array.from({length:32}, () => 10 + Math.random()*70));
  
  // Throttle updates to 30fps
  useEffect(() => {
    const timer = setInterval(() => {
        setData(Array.from({length:32}, () => 10 + Math.random()*70));
    }, 33);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ width:'100%', height:'180px', background:'#08090b', border:'1px solid #222', borderRadius:4, position:'relative', display:'flex', flexDirection:'column', padding:10, boxSizing:'border-box', boxShadow:'inset 0 0 40px #000' }}>
       <div className="label-sm" style={{ marginBottom:5, fontSize:8 }}>WAVES PAZ ANALYZER</div>
       <div style={{ flex:1.2, display:'flex', gap:2, alignItems:'flex-end', borderBottom:'1px solid #111', paddingBottom:10 }}>
          {data.map((h, i) => <div key={i} style={{ flex:1, height: `${h}%`, background: i > 25 ? 'var(--neon-red)' : '#111' }}></div>)}
       </div>
       <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', position:'relative', marginTop:10 }}>
          <div style={{ width:100, height:50, border:'1px solid #111', borderBottom:'none', borderRadius:'50px 50px 0 0', position:'relative' }}>
             <div style={{ position:'absolute', bottom:0, left:'50%', height:45, width:1, background:'var(--neon-red)', transform:'rotate(20deg)', transformOrigin:'bottom', boxShadow:'0 0 10px red' }}></div>
          </div>
       </div>
    </div>
  );
});

function App() {
  return (
    <div style={{ width:'1600px', height:'900px', margin:'0 auto', background:'#0b0c0f', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', color:'var(--text-main)', border:'1px solid #111' }}>
      
      {/* DISCRETE HEADER */}
      <div style={{ height:'40px', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 30px', background:'#08080a', borderBottom:'1px solid #1a1c22', zIndex:10 }}>
         <div style={{ display:'flex', gap:15, alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:1000, letterSpacing:3, color:'#444' }}>NADA CHANNEL STRIP</span>
            <div style={{ width:1, height:12, background:'#222' }}></div>
            <span style={{ fontSize:8, color:'#333', letterSpacing:1 }}>V16.2 PRECISION FRAME</span>
         </div>
         <div style={{ display:'flex', alignItems:'center', gap:15 }}>
            <button 
               onClick={() => {
                  console.log("AI ANALYZE TRIGGERED");
                  if (window.juce) window.juce.triggerNADAAnalysis();
               }}
               style={{ 
                  background: 'none', border: '1px solid var(--gold)', borderRadius: 2, 
                  color: 'var(--gold)', fontSize: 8, padding: '4px 10px', cursor: 'pointer',
                  letterSpacing: 1, textShadow: '0 0 5px var(--gold)', 
                  display:'flex', alignItems:'center', gap:8
               }}>
               <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--gold)', border:'1px solid #000', boxShadow:'0 0 5px var(--gold)' }}></div>
               AI ANALYZE
            </button>
            <span style={{ fontSize:8, color:'#444', letterSpacing:1 }}>STATUS: <span style={{color:'var(--gold)'}}>READY</span></span>
         </div>
      </div>

      {/* MAIN RACK CONTENT */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr 2fr 1fr 1fr', gap:15, padding:'20px 30px' }}>
         
         {/* COL 1: VOX INPUT */}
         <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
            <Card title="BX_CRISPYTUNER">
               <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <Knob label="RE-TUNE" size={50} initialValue={0.8} />
                  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                     <div style={{ display:'flex', gap:2 }}>
                        <div style={{ background:'#000', color:'var(--neon-red)', fontSize:7, padding:'1px 3px', border:'1px solid #222' }}>C#</div>
                        <div style={{ background:'#000', color:'var(--neon-red)', fontSize:7, padding:'1px 3px', border:'1px solid #222' }}>MIN</div>
                     </div>
                     <Knob label="HUMAN" size={32} />
                  </div>
               </div>
               <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <Knob label="AMT" size={32} /> <Knob label="SPD" size={32} />
               </div>
            </Card>
            <Card title="R-VOX (WAVES)" style={{ height:'120px' }}>
               <div style={{ display:'flex', justifyContent:'space-around', alignItems:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                     <div style={{ height:50, width:8, background:'#000', position:'relative', borderRadius:2 }}><div style={{ position:'absolute', top:'30%', left:'-1px', width:10, height:2, background:'var(--neon-red)', boxShadow:'0 0 5px var(--neon-red)' }}></div></div>
                     <span style={{fontSize:6}}>COMP</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                     <div style={{ height:50, width:8, background:'#000', position:'relative', borderRadius:2 }}><div style={{ position:'absolute', top:'80%', left:'-1px', width:10, height:2, background:'var(--neon-red)' }}></div></div>
                     <span style={{fontSize:6}}>GATE</span>
                  </div>
               </div>
            </Card>
            <Card title="902 DE-ESSER" style={{ height:'100px' }}>
               <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                  <Knob label="FREQ" size={40} /> <Knob label="RANGE" size={40} />
               </div>
            </Card>
            <Card title="BUS REVERB - HITSVILLE" style={{ height:'130px' }}>
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <Knob label="MIX" size={35} /> <Knob label="DECAY" size={35} />
                  <Knob label="PRE-D" size={35} /> <Knob label="TONE" size={35} />
               </div>
            </Card>
         </div>

         {/* COL 2: MAIN DYNAMICS */}
         <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
            <Card title="1176 REV A">
               <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                  <Knob label="INPUT" size={48} /> <Knob label="OUTPUT" size={48} />
               </div>
               <div style={{ display:'flex', gap:2, justifyContent:'center', marginTop:10 }}>
                  {[4, 8, 12, 20].map(r => <button key={r} style={{ background: r===4 ? 'var(--neon-red)' : '#111', color: r===4?'#fff':'#444', fontSize:6, border:'1px solid #222', padding:'1px 3px' }}>{r}</button>)}
               </div>
               <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:10 }}>
                  <Knob label="ATK" size={35} /> <Knob label="REL" size={35} />
               </div>
            </Card>
            <Card title="TELETRONIX LA-2A">
               <div style={{ display:'flex', gap:15, justifyContent:'center', alignItems:'center' }}>
                  <Knob label="PEAK RED" size={80} initialValue={0.7} showValueInside={true} />
                  <Knob label="GAIN" size={45} />
               </div>
            </Card>
            <Card title="SSL 4000 G (STRIP)">
               <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:5 }}>
                  <Knob label="HF" size={28} /> <Knob label="HMF" size={28} /> <Knob label="LMF" size={28} />
                  <Knob label="LF" size={28} /> <Knob label="HP" size={28} /> <Knob label="LP" size={28} />
               </div>
            </Card>
         </div>

         {/* CENTER HUB: MASTER VISUALS */}
         <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
            <ProQ3View />
            
            <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', gap:30 }}>
               <div style={{ textAlign:'center' }}><span className="label-sm">IN</span><div style={{height:100, width:6, background:'#000', position:'relative'}}><div style={{position:'absolute', bottom:0, width:'100%', height:'80%', background:'var(--neon-red)'}}></div></div></div>
               <Knob label="MASTER VOLUME" size={160} initialValue={0.6} showValueInside={true} />
               <div style={{ textAlign:'center' }}><span className="label-sm">OUT</span><div style={{height:100, width:6, background:'#000', position:'relative'}}><div style={{position:'absolute', bottom:0, width:'100%', height:'90%', background:'var(--neon-red)'}}></div></div></div>
            </div>

            <PAZView />
         </div>

         {/* COL 3: TONE SHAPING */}
         <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
            <Card title="PULTEC EQP-1A">
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Knob label="LOW BST" size={38} /> <Knob label="LOW ATN" size={38} />
                  <Knob label="HI BST" size={38} /> <Knob label="HI ATN" size={38} />
               </div>
            </Card>
            <Card title="BLACK BOX HG-2">
               <div style={{ textAlign:'center' }}><Knob label="SATURATION" size={60} color="#ff8800" /></div>
               <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:10 }}>
                  <Knob label="PENT" size={35} /> <Knob label="TRIO" size={35} />
               </div>
            </Card>
            <Card title="BX_STEREOMAKER">
               <div style={{ display:'flex', gap:15, justifyContent:'center', alignItems:'center' }}>
                  <Knob label="WIDTH" size={55} color="var(--gold)" initialValue={0.8} />
                  <Knob label="MONO" size={40} />
               </div>
            </Card>
         </div>

         {/* COL 4: MASTER OUT */}
         <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
            <Card title="BUS COMPRESSION">
               <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                  <Knob label="THR" size={42} /> <Knob label="RAT" size={42} />
               </div>
               <div style={{ textAlign:'center', marginTop:8 }}><Knob label="MAKEUP" size={42} /></div>
            </Card>
            <Card title="BX_LIMITER TP">
               <div style={{ textAlign:'center' }}><Knob label="GAIN" size={120} initialValue={0.9} showValueInside={true} /></div>
               <div style={{ display:'flex', gap:15, justifyContent:'center', marginTop:15 }}>
                  <div style={{ textAlign:'center' }}><span style={{fontSize:6}}>GR</span><div style={{height:80, width:5, background:'#000'}}><div style={{height:'10%', background:'var(--neon-red)'}}></div></div></div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                     <Knob label="CEIL" size={38} /> <Knob label="REL" size={38} />
                  </div>
               </div>
            </Card>
            <Card title="BUS DELAY - H-DELAY" style={{ height:'130px' }}>
               <div style={{ textAlign:'center' }}><Knob label="TIME" size={50} /></div>
               <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:8 }}>
                  <Knob label="FB" size={32} /> <Knob label="MIX" size={32} />
               </div>
            </Card>
         </div>

      </div>

      {/* SUBTLE FOOTER */}
      <div style={{ height:'30px', borderTop:'1px solid #1a1c22', display:'flex', justifyContent:'center', alignItems:'center', opacity:0.1, letterSpacing:4, fontSize:8 }}>
         NADA CHANNEL STRIP // PROFESSIONAL MASTERING FRAME
      </div>
    </div>
  );
}

export default App;
