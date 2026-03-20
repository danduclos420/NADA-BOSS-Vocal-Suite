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
  <div className="section-zone" style={{ background:'rgba(255,255,255,0.01)', border:'1px solid rgba(255,255,255,0.03)', borderRadius:4, padding:10, ...style }}>
     <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
        <span className="label-sm" style={{ fontWeight:900, color:'#444' }}>{title}</span>
        <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--gold)', opacity:0.3 }}></div>
     </div>
     {children}
  </div>
);

function App() {
  return (
    <div className="rack-chassis" style={{ padding: '20px 40px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
         <div>
            <div style={{ fontSize:24, fontWeight:900, letterSpacing:2 }}>NADA BOSS</div>
            <div style={{ fontSize:9, color:'#444', letterSpacing:4 }}>PRO CONSOLE // 14-STAGE ULTIMATE</div>
         </div>
         <div className="ai-gold-btn" style={{ width:32, height:32, marginRight:20 }}></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.6fr 1fr 1fr', gap:20, height:'90%' }}>
         
         {/* COL 1: PITCH & VOX */}
         <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
            <Card title="BX_CRISPYTUNER">
               <div style={{ textAlign:'center' }}><Knob label="RE-TUNE" size={60} initialValue={0.8} /></div>
               <div style={{ display:'flex', gap:5, justifyContent:'center', marginTop:10 }}>
                  <Knob label="KEY" size={35} /> <Knob label="SCALE" size={35} /> <Knob label="HUMAN" size={35} />
               </div>
            </Card>
            <Card title="R-VOX">
               <div style={{ display:'flex', gap:15, justifyContent:'center' }}>
                  <div style={{ height:60, width:15, background:'#000', position:'relative' }}><div style={{ position:'absolute', bottom:'40%', width:'100%', height:2, background:'var(--neon-red)' }}></div></div>
                  <Knob label="GAIN" size={40} /> <Knob label="GATE" size={40} />
               </div>
            </Card>
            <Card title="902 DE-ESSER">
               <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                  <Knob label="FREQ" size={45} /> <Knob label="RANGE" size={45} />
               </div>
            </Card>
            <Card title="HITSVILLE CHAMBERS">
               <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
                  <Knob label="MIX" size={35} /> <Knob label="DECAY" size={35} /> <Knob label="PRE-D" size={35} />
               </div>
            </Card>
         </div>

         {/* COL 2: MAIN DYNAMICS */}
         <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
            <Card title="1176 REV A">
               <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                  <Knob label="IN" size={45} /> <Knob label="OUT" size={45} />
               </div>
               <div style={{ display:'flex', gap:5, justifyContent:'center', marginTop:10 }}>
                  {[4, 8, 12, 20].map(r => <button key={r} style={{ background:'#111', border:'1px solid #333', fontSize:7, padding:2 }}>{r}</button>)}
               </div>
               <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:10 }}>
                  <Knob label="ATTACK" size={35} /> <Knob label="RELEASE" size={35} />
               </div>
            </Card>
            <Card title="LA-2A OPTO">
                <div style={{ display:'flex', gap:20, justifyContent:'center', alignItems:'center' }}>
                   <Knob label="PEAK RED" size={75} showValueInside={true} />
                   <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                      <Knob label="GAIN" size={45} /> <DualMeter height={40} />
                   </div>
                </div>
            </Card>
            <Card title="SSL 4000 G">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                   <Knob label="LF" size={30} /> <Knob label="LMF" size={30} />
                   <Knob label="HMF" size={30} /> <Knob label="HF" size={30} />
                </div>
            </Card>
         </div>

         {/* CENTER: THE MASTER VISUALIZERS */}
         <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
            <div style={{ height:'40%', background:'#08080a', border:'1px solid #333', borderRadius:4, position:'relative' }}>
               <div className="label-sm" style={{ position:'absolute', top:5, left:10 }}>PRO-Q 3 ANALYZER</div>
               <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}>
                  <path d="M 0 100 Q 50 80 100 20 T 200 80 T 400 120" fill="none" stroke="var(--neon-red)" strokeWidth="2" style={{ filter:'drop-shadow(0 0 5px var(--neon-red))' }} />
               </svg>
            </div>
            
            <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', gap:30 }}>
               <DualMeter height={120} left={0.7} right={0.8} />
               <Knob label="VOLUME" size={150} initialValue={0.6} showValueInside={true} />
               <DualMeter height={120} left={0.9} right={0.9} />
            </div>

            <div style={{ height:'35%', background:'#08080a', border:'1px solid #333', borderRadius:4, position:'relative', display:'flex', justifyContent:'center', alignItems:'center' }}>
               <div className="label-sm" style={{ position:'absolute', top:5, left:10 }}>PAZ STEREO FIELD</div>
               <div style={{ width:100, height:50, border:'1px solid #222', borderBottom:'none', borderRadius:'50px 50px 0 0', position:'relative' }}>
                  <div style={{ position:'absolute', bottom:0, left:'50%', height:45, width:1, background:'var(--neon-red)', transform:'rotate(20deg)', transformOrigin:'bottom' }}></div>
               </div>
            </div>
         </div>

         {/* COL 3: TONE & COLOR */}
         <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
            <Card title="PULTEC EQP-1A">
               <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <Knob label="LOW BST" size={35} /> <Knob label="LOW FRQ" size={35} />
                  <Knob label="HI BST" size={35} /> <Knob label="HI FRQ" size={35} />
               </div>
            </Card>
            <Card title="BLACK BOX HG-2">
               <div style={{ textAlign:'center' }}><Knob label="SAT" size={60} color="#ff8800" /></div>
               <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:10 }}>
                  <Knob label="PENT" size={40} /> <Knob label="TRIO" size={40} />
               </div>
            </Card>
            <Card title="BX_STEREOMAKER">
               <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                  <Knob label="WIDTH" size={50} color="var(--gold)" />
                  <Knob label="MONO" size={50} />
               </div>
            </Card>
         </div>

         {/* COL 4: MASTER OUT */}
         <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
            <Card title="H-DELAY (WAVES)">
               <div style={{ textAlign:'center' }}><Knob label="TIME" size={55} /></div>
               <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:10 }}>
                  <Knob label="FB" size={35} /> <Knob label="MIX" size={35} />
               </div>
            </Card>
            <Card title="BX_LIMITER TP" style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
               <div style={{ textAlign:'center' }}><Knob label="FOUNDATION" size={120} initialValue={0.9} showValueInside={true} /></div>
               <div style={{ display:'flex', gap:20, justifyContent:'center', marginTop:20 }}>
                  <DualMeter height={100} />
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                     <Knob label="CEIL" size={40} /> <Knob label="REL" size={40} />
                  </div>
               </div>
            </Card>
         </div>

      </div>

      {/* FOOTER */}
      <div style={{ display:'flex', justifyContent:'space-between', opacity:0.1, marginTop:10, fontSize:8 }}>
         <span>NADA BOSS // MASTERING CONSOLE V15 PRO</span>
         <span>BRAINWORX / UAD / WAVES / FABFILTER AUTHORIZED LAYOUT</span>
      </div>
    </div>
  );
}

export default App;
