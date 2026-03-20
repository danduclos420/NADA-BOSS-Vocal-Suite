import React, { useState, useEffect, useRef } from 'react';

const Knob = ({ label, size = 'standard', active = false, initialValue = 0.5, suffix = "" }) => {
  const [value, setValue] = useState(initialValue);
  const knobRef = useRef(null);
  
  const handleMouseDown = (e) => {
    const startY = e.clientY;
    const startValue = value;
    
    const handleMouseMove = (moveEvent) => {
      const delta = (startY - moveEvent.clientY) / 200;
      setValue(Math.min(1, Math.max(0, startValue + delta)));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="knob-container">
      <div 
        ref={knobRef}
        onMouseDown={handleMouseDown}
        className={`knob-outer ${size} ${active ? 'active' : ''}`}
      >
        <div className="knob-inner-cap"></div>
        <div className="knob-indicator" style={{ transform: `rotate(${value * 240 - 120}deg) translateX(-50%)`, transformOrigin: 'bottom center' }}></div>
      </div>
      <span className="label-param">{label}</span>
      <span className="label-value">{(value * 10).toFixed(1)}{suffix}</span>
    </div>
  );
};

const Meter = ({ value, warningAt = 8 }) => (
  <div className="meter-v">
    {Array.from({ length: 14 }).map((_, i) => (
      <div key={i} className={`led ${14-i <= value * 14 ? 'on' : ''}`}></div>
    ))}
  </div>
);

const Module = ({ title, children, status = 'ACTIVE' }) => (
  <div className="module-card">
    <div className="screw tl"></div><div className="screw tr"></div>
    <div className="screw bl"></div><div className="screw br"></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <h2>{title}</h2>
      <div className="toggle-btn on"></div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '8px' }}>
      {children}
    </div>
  </div>
);

function App() {
  return (
    <div className="rack-canvas">
      {/* COLUMN 1: PITCH & ENTRY */}
      <div className="rack-column">
        <Module title="01. AUTOTUNE ELITE">
          <Knob label="SPEED" initialValue={0.8} size="big" />
          <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
            <div className="label-param">KEY</div>
            <div className="label-value" style={{color:'#ffd700'}}>C# MAJ</div>
            <div className="toggle-btn on"></div>
          </div>
          <Knob label="HUMAN" initialValue={0.2} size="small" />
        </Module>

        <Module title="09. DE-ESSER">
          <Knob size="small" label="FREQ" initialValue={0.6} suffix="kHz" />
          <Meter value={0.4} />
          <Knob size="small" label="THRESHOLD" initialValue={0.7} />
        </Module>

        <Module title="02. REDUCTIVE EQ (MUD)">
           <div style={{ width:'80px', height:'100px', background:'#000', border:'1px solid #333', borderRadius:'4px', overflow:'hidden', position:'relative' }}>
              <div style={{ position:'absolute', bottom:'20%', left:'0', width:'100%', height:'2px', background:'var(--neon-red)', boxShadow:'var(--neon-glow)' }}></div>
              <div style={{ fontSize:'8px', color:'#444', position:'absolute', top:'5px', left:'5px' }}>ANALYZER</div>
           </div>
           <Knob size="small" label="FREQ" initialValue={0.2} />
           <Knob size="small" label="CUT" initialValue={0.5} />
        </Module>
      </div>

      {/* COLUMN 2: DYNAMICS */}
      <div className="rack-column">
        <Module title="03. 1176 FET COMP">
          <Knob label="INPUT" initialValue={0.4} />
          <Meter value={0.7} />
          <Knob label="OUTPUT" initialValue={0.5} />
          <div style={{display:'grid', gridTemplateColumns:'12px 12px', gap:'4px'}}>
             <div className="toggle-btn on"></div><div className="toggle-btn"></div>
             <div className="toggle-btn"></div><div className="toggle-btn"></div>
          </div>
        </Module>

        <Module title="04. LA-2A OPTO">
          <Knob label="PEAK RED" initialValue={0.8} size="big" active={true} />
          <Knob label="GAIN" initialValue={0.3} />
        </Module>

        <Module title="08. MODERN COMP">
          <Knob size="small" label="THR" initialValue={0.3} />
          <Knob size="small" label="RAT" initialValue={0.6} />
          <Knob size="small" label="ATT" initialValue={0.1} />
        </Module>
      </div>

      {/* COLUMN 3: TONAL COLOR */}
      <div className="rack-column">
        <Module title="05. EQP-1A PULTEC">
          <Knob size="small" label="LF" initialValue={0.4} />
          <Knob label="AIR BOOST" initialValue={0.9} active={true} />
          <Knob size="small" label="HF" initialValue={0.2} />
        </Module>

        <Module title="06. SSL BUS CONSOLE">
           <Knob label="SSL DRIVE" initialValue={0.4} />
           <Knob size="small" label="WIDTH" initialValue={0.6} />
        </Module>

        <Module title="07. HARMONIC SAT">
          <Knob label="DRIVE" initialValue={0.6} />
          <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
             <div className="toggle-btn on"></div>
             <div className="label-param">TUBE</div>
          </div>
        </Module>

        <Module title="11. STEREO WIDTH">
          <Knob label="FIELD" initialValue={1.0} size="big" />
        </Module>
      </div>

      {/* COLUMN 4: MASTER & FX */}
      <div className="rack-column">
        <Module title="10. FINAL TONE EQ">
           <Knob label="COLOR" initialValue={0.5} />
           <Knob size="small" label="GLOSS" initialValue={0.3} />
        </Module>

        <Module title="13. BUS REVERB">
          <Knob size="small" label="MIX" initialValue={0.3} />
          <Knob size="small" label="TIME" initialValue={0.7} />
        </Module>

        <Module title="14. BUS DELAY">
          <Knob size="small" label="TIME" initialValue={0.4} />
          <Knob size="small" label="MIX" initialValue={0.2} />
        </Module>

        <Module title="12. TP LIMITER v1.0">
          <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
             <div className="label-value" style={{fontSize:'12px', marginBottom:'5px'}}>-10.0 LUFS</div>
             <Knob size="big" label="CEILING" initialValue={0.9} active={true} />
          </div>
          <Meter value={0.2} />
        </Module>
      </div>
    </div>
  );
}

export default App;
