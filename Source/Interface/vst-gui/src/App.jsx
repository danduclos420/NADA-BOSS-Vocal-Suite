import React, { useState } from 'react';

const Knob = ({ label, initialValue = 0.5, size = 50, color = "var(--neon-red)" }) => {
  const [val, setVal] = useState(initialValue);
  const circ = 2 * Math.PI * (size * 0.4);
  const offset = circ - (val * 0.75 * circ);

  return (
    <div className="knob-unit" style={{ width: size + 20 }}>
      <div className="knob-bezel" style={{ width: size, height: size }}>
        <svg style={{ position:'absolute', top:'-5px', left:'-5px', width:size+10, height:size+10 }}>
          <circle cx={(size+10)/2} cy={(size+10)/2} r={size*0.4} fill="none" stroke="#000" strokeWidth="2" strokeDasharray={circ} strokeDashoffset={circ*0.25} transform={`rotate(135 ${(size+10)/2} ${(size+10)/2})`} />
          <circle cx={(size+10)/2} cy={(size+10)/2} r={size*0.4} fill="none" stroke={color} strokeWidth="2" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(135 ${(size+10)/2} ${(size+10)/2})`} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
        </svg>
        <div className="knob-body" onMouseDown={(e) => {
           const startY = e.clientY; const startV = val;
           const move = (me) => setVal(Math.min(1, Math.max(0, startV + (startY-me.clientY)/200)));
           const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
           document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
        }} style={{ width: size*0.75, height: size*0.75, transform: `rotate(${val * 270 - 135}deg)` }}>
          <div className="knob-tick" style={{ width: size*0.1, height: size*0.1 }}></div>
        </div>
      </div>
      <div className="label-sm">{label}</div>
    </div>
  );
};

const LEDDisplay = ({ value }) => (
  <div style={{ background:'#000', padding:'2px 4px', border:'1px solid #333', borderRadius:'2px', fontFamily:'monospace', color:'var(--neon-red)', fontSize:'14px', letterSpacing:'2px', boxShadow:'inset 0 0 5px #f00', display:'inline-block' }}>
    {value}
  </div>
);

function App() {
  return (
    <div className="rack-chassis">
      {/* TIER 1: THE MASTER BRIDGE */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', height:'35%' }}>
        
        {/* TOP LEFT: TMT COMP (1176 Style) */}
        <div style={{ width:'25%', display:'flex', flexWrap:'wrap', gap:'15px', justifyContent:'center' }}>
           <div style={{ width:'100%', textAlign:'center', marginBottom:'10px' }} className="label-sm">TMT COMP (FET)</div>
           <LEDDisplay value="01" /> <Knob label="RATIO" size={40} /> <LEDDisplay value="01" />
           <Knob label="INPUT" size={60} /> <Knob label="OUTPUT" size={60} />
        </div>

        {/* CENTER: THE GIGA METER PANEL */}
        <div style={{ width:'40%', height:'100%', background:'rgba(0,0,0,0.2)', borderLeft:'1px solid #333', borderRight:'1px solid #333', position:'relative', padding:'10px' }}>
           <div style={{ textAlign:'center' }} className="label-sm">AI MASTER CORE</div>
           <div style={{ display:'flex', justifyContent:'center', marginTop:'10px' }}>
              <div className="ai-gold-btn" style={{ width:'40px', height:'40px' }}></div>
           </div>
           <div style={{ display:'flex', justifyContent:'space-between', flex:1, marginTop:'20px' }}>
              <div className="meter-strip" style={{height:'120px'}}><div className="meter-fill" style={{height:'80%'}}></div></div>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', width:'70%' }}>
                 <div style={{ height:'2px', background:'#333' }}></div>
                 <div style={{ height:'2px', background:'#333' }}></div>
                 <div style={{ height:'2px', background:'var(--neon-red)', boxShadow:'var(--neon-glow)' }}></div>
              </div>
              <div className="meter-strip" style={{height:'120px'}}><div className="meter-fill" style={{height:'90%'}}></div></div>
           </div>
        </div>

        {/* TOP RIGHT: LIMITER */}
        <div style={{ width:'25%', textAlign:'center' }}>
           <div className="label-sm">TP LIMITER</div>
           <Knob label="FOUNDATION" size={100} initialValue={0.9} />
           <div style={{marginTop:'10px'}} className="value-sm">-10.0 LUFS</div>
        </div>
      </div>

      <div className="separator-h"></div>

      {/* TIER 2: TONE & SURGERY */}
      <div style={{ display:'flex', justifyContent:'center', gap:'40px', padding:'20px 0' }}>
         <div style={{ display:'flex', gap:'20px' }}>
            <div className="label-sm" style={{ alignSelf:'center' }}>DE-ESSER</div>
            <Knob label="FREQ" size={45} /> <Knob label="REDUX" size={45} />
         </div>
         <div className="separator-v"></div>
         <div style={{ display:'flex', gap:'15px' }}>
            <div className="label-sm" style={{ alignSelf:'center' }}>TONE EQ</div>
            <Knob label="LOW" size={40} /> <Knob label="MID" size={40} /> <Knob label="HIGH" size={40} /> <Knob label="AIR" size={40} />
         </div>
         <div className="separator-v"></div>
         <div style={{ display:'flex', gap:'20px' }}>
            <div className="label-sm" style={{ alignSelf:'center' }}>STEREO</div>
            <Knob label="WIDTH" size={50} color="var(--gold)" />
         </div>
      </div>

      <div className="separator-h"></div>

      {/* TIER 3: FINAL EQ & FX BUS */}
      <div style={{ display:'flex', justifyContent:'center', gap:'30px', padding:'20px 0' }}>
         <div style={{ display:'flex', gap:'15px' }}>
            <div className="label-sm" style={{ alignSelf:'center' }}>HARMONICS</div>
            <Knob label="SSL-E" size={40} /> <Knob label="SAT" size={40} />
         </div>
         <div className="separator-v"></div>
         <div style={{ display:'flex', gap:'10px' }}>
            <div className="label-sm" style={{ alignSelf:'center' }}>BUS FX</div>
            <Knob label="REV" size={35} /> <Knob label="DLY" size={35} />
         </div>
         <div className="separator-v"></div>
         <div style={{ display:'flex', gap:'10px' }}>
            <div className="label-sm" style={{ alignSelf:'center' }}>SURGERY</div>
            <Knob label="MUD" size={35} color="#444" />
         </div>
      </div>

      {/* FOOTER BRANDS */}
      <div style={{ position:'absolute', bottom:'20px', left:'40px', display:'flex', gap:'20px' }}>
         <div style={{ fontSize:'24px', fontWeight:'900', color:'#444', fontFamily:'Bebas Neue' }}>NADA BOSS</div>
         <div className="label-sm" style={{ alignSelf:'flex-end' }}>V12.0 // ULTIMATE RACK</div>
      </div>
      <div style={{ position:'absolute', bottom:'20px', right:'40px' }} className="label-sm">
         PLUGIN ALLIANCE / BRAINWORX GRADE
      </div>
    </div>
  );
}

export default App;
