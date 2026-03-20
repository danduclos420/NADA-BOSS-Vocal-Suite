import React, { useState, useRef } from 'react';

const Knob = ({ label, size = 'standard', initialValue = 0.5, suffix = "", active = false }) => {
  const [value, setValue] = useState(initialValue);
  const sizePx = size === 'big' ? 100 : (size === 'small' ? 42 : 70);
  
  const handleMouseDown = (e) => {
    const startY = e.clientY;
    const startValue = value;
    const move = (moveEvent) => {
      const delta = (startY - moveEvent.clientY) / 200;
      setValue(Math.min(1, Math.max(0, startValue + delta)));
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  // SVG Red Ring Calculation
  const radius = sizePx / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value * 0.75) * circumference;

  return (
    <div className="knob-container" style={{ width: sizePx, height: sizePx + 40 }}>
      {/* Red Glow Ring */}
      <svg className="knob-ring-svg" width={sizePx} height={sizePx}>
        <circle 
          cx={sizePx/2} cy={sizePx/2} r={radius}
          fill="none" stroke="#222" strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          transform={`rotate(135 ${sizePx/2} ${sizePx/2})`}
        />
        <circle 
          cx={sizePx/2} cy={sizePx/2} r={radius}
          fill="none" stroke="var(--neon-red)" strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (value * 0.75 * circumference)}
          strokeLinecap="round"
          transform={`rotate(135 ${sizePx/2} ${sizePx/2})`}
          style={{ filter: 'drop-shadow(0 0 5px var(--neon-red))' }}
        />
      </svg>
      
      <div onMouseDown={handleMouseDown} className={`knob-outer ${size}`}>
        <div className="knob-indicator" style={{ transform: `rotate(${value * 270 - 135}deg) translateX(-50%)`, transformOrigin: 'bottom center' }}></div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <div className="label-param">{label}</div>
        <div className="label-value">{(value * 100).toFixed(0)}{suffix}</div>
      </div>
    </div>
  );
};

const DualMeter = ({ left = 0.6, right = 0.5 }) => (
  <div className="meter-v-dual">
    <div className="meter-v">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className={`led ${20-i <= left * 20 ? 'on' : ''} ${20-i > 16 ? 'warn' : ''}`}></div>
      ))}
    </div>
    <div className="meter-v">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className={`led ${20-i <= right * 20 ? 'on' : ''} ${20-i > 16 ? 'warn' : ''}`}></div>
      ))}
    </div>
  </div>
);

const Module = ({ title, children, width = "100%" }) => (
  <div className="module-card" style={{ width }}>
    <div className="screw tl"></div><div className="screw tr"></div>
    <div className="screw bl"></div><div className="screw br"></div>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px' }}>
      <span className="label-plugin">{title}</span>
      <div className="toggle-btn on"></div>
    </div>
    <div style={{ display:'flex', justifyContent:'space-around', alignItems:'center', gap:'20px' }}>
      {children}
    </div>
  </div>
);

function App() {
  return (
    <div className="rack-canvas">
      {/* HEADER SECTION WITH AI BUTTON */}
      <div style={{ position:'absolute', top:'24px', left:'50%', transform:'translateX(-50%)', textAlign:'center', zIndex:10 }}>
         <div className="ai-master-btn">
            <span className="ai-text">NADA AI</span>
            <span className="ai-sub">MASTER CORE</span>
         </div>
      </div>

      <div style={{ position:'absolute', top:'30px', left:'30px' }}>
         <h1 style={{ fontFamily:'"Bebas Neue"', fontSize:'40px', margin:0, color:'#888' }}>NADA AUDIO</h1>
         <span style={{ fontSize:'10px', letterSpacing:'4px', color:'#444' }}>PRO VOCALIST SUITE // 14-STAGE RACK</span>
      </div>

      <div style={{ display:'flex', gap:'24px', marginTop:'160px', width:'100%' }}>
        {/* COL 1: PITCH & SURGERY */}
        <div className="rack-column" style={{ width:'400px' }}>
           <Module title="AUTOTUNE PRO">
              <Knob label="RE-TUNE" size="big" initialValue={0.8} />
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                 <div className="label-value" style={{ color:'#ffd700' }}>C# MIN</div>
                 <Knob label="HUMAN" size="small" initialValue={0.3} />
              </div>
              <DualMeter left={0.8} right={0.8} />
           </Module>
           
           <Module title="DE-ESSER">
              <Knob label="FREQ" size="small" initialValue={0.6} />
              <DualMeter left={0.3} right={0.3} />
              <Knob label="THRESHOLD" size="small" initialValue={0.7} />
           </Module>

           <Module title="REDUCTIVE EQ (PRO-Q3)">
              <div style={{ width:'120px', height:'80px', background:'#000', border:'1px solid #333', borderRadius:'4px', position:'relative' }}>
                 <div style={{ position:'absolute', bottom:'20%', left:'10%', width:'80%', height:'2px', background:'var(--neon-red)', boxShadow:'var(--neon-glow)' }}></div>
              </div>
              <Knob label="GAIN" size="small" initialValue={0.4} />
           </Module>
        </div>

        {/* COL 2: DYNAMICS */}
        <div className="rack-column" style={{ width:'400px' }}>
           <Module title="1176 FET LIMITER">
              <Knob label="INPUT" initialValue={0.4} />
              <DualMeter left={0.5} right={0.5} />
              <Knob label="OUTPUT" initialValue={0.6} />
           </Module>
           
           <Module title="LA-2A OPTO">
              <Knob label="PEAK RED" size="big" initialValue={0.7} />
              <Knob label="GAIN" size="small" initialValue={0.4} />
              <DualMeter left={0.7} right={0.7} />
           </Module>

           <Module title="MODERN BUS COMP">
              <Knob size="small" label="THR" initialValue={0.2} />
              <Knob size="small" label="RAT" initialValue={0.6} />
              <DualMeter left={0.2} right={0.2} />
           </Module>
        </div>

        {/* COL 3: ANALOG COLOR */}
        <div className="rack-column" style={{ width:'400px' }}>
           <Module title="EQP-1A TONE">
              <Knob size="small" label="LOW" initialValue={0.5} />
              <Knob label="AIR BOOST" initialValue={0.9} />
              <Knob size="small" label="HIGH" initialValue={0.3} />
           </Module>

           <Module title="SSL 4000E CONSOLE">
              <Knob label="DRIVE" initialValue={0.3} />
              <Knob label="ANALOG" size="small" initialValue={1.0} />
           </Module>

           <Module title="BLACK BOX SAT">
              <Knob label="DRIVE" size="big" initialValue={0.6} />
              <div className="toggle-btn on"></div>
           </Module>
           
           <Module title="STEREO MAKER">
              <Knob label="WIDTH" initialValue={0.8} />
           </Module>
        </div>

        {/* COL 4: MASTER & SPACE */}
        <div className="rack-column" style={{ width:'400px' }}>
           <Module title="MASTER EQ">
              <Knob label="TONE" initialValue={0.5} />
           </Module>

           <Module title="HITVILLE REVERB">
              <Knob size="small" label="MIX" initialValue={0.3} />
              <Knob label="DECAY" initialValue={0.7} />
           </Module>

           <Module title="WAVES H-DELAY">
              <Knob size="small" label="TIME" initialValue={0.4} />
              <Knob size="small" label="FB" initialValue={0.6} />
           </Module>

           <Module title="BX_LIMITER TRUE PEAK">
              <div style={{ textAlign:'center' }}>
                 <div className="label-value" style={{ fontSize:'14px' }}>-9.5 LUFS</div>
                 <Knob label="THRESHOLD" size="big" initialValue={0.9} />
              </div>
              <DualMeter left={0.9} right={0.9} />
           </Module>
        </div>
      </div>
    </div>
  );
}

export default App;
