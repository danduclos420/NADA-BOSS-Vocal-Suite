import React, { useState, useEffect, useRef } from 'react';

const Knob = ({ label, initialValue = 0.5, size = 60, unit = "" }) => {
  const [value, setValue] = useState(initialValue);
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (value * 0.75 * circumference);

  const handleDrag = (e) => {
    const startY = e.clientY;
    const startVal = value;
    const move = (me) => {
      const d = (startY - me.clientY) / 200;
      setValue(Math.min(1, Math.max(0, startVal + d)));
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  return (
    <div className="knob-unit">
      <div className="knob-bezel" style={{ width: size, height: size }}>
        <svg className="glow-ring" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="28" fill="none" stroke="#000" strokeWidth="2" strokeDasharray={circumference} strokeDashoffset={circumference * 0.25} transform="rotate(135 40 40)" />
          <circle cx="40" cy="40" r="28" fill="none" stroke="var(--neon-red)" strokeWidth="2" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(135 40 40)" style={{ filter: 'drop-shadow(0 0 3px var(--neon-red))', opacity: 0.8 }} />
        </svg>
        <div className="knob-body" onMouseDown={handleDrag} style={{ transform: `rotate(${value * 270 - 135}deg)` }}>
          <div className="knob-tick"></div>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div className="label-sm">{label}</div>
        <div className="value-sm">{(value * 100).toFixed(0)}{unit}</div>
      </div>
    </div>
  );
};

const Section = ({ title, children, showLine = true }) => (
  <div className="section-zone">
    <div className="section-header">{title}</div>
    <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', alignItems: 'flex-start' }}>
      {children}
    </div>
    {showLine && <div className="separator-h" style={{ marginTop: '20px' }}></div>}
  </div>
);

function App() {
  return (
    <div className="rack-chassis">
      {/* TOP HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
             <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#444' }}>NB</span>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '1px' }}>NADA AUDIO</div>
            <div style={{ fontSize: '10px', color: '#444', letterSpacing: '2px' }}>PRO VOCALIST SUITE</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
           <div className="label-sm">AI ANALYSIS</div>
           <div className="ai-gold-btn"></div>
           <div className="label-sm" style={{ color: 'var(--gold)' }}>ACTIVE</div>
        </div>
      </div>

      <div className="separator-h"></div>

      {/* CORE RACK GRID */}
      <div className="main-grid">
        {/* COLUMN 1: CORRECTION */}
        <div className="section-zone" style={{ borderRight: '1px solid rgba(255,255,255,0.03)', paddingRight: '20px' }}>
           <Section title="PITCH CORRECTION">
              <Knob label="RETUNE" size={80} initialValue={0.8} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                 <Knob label="KEY" size={40} initialValue={0.3} />
                 <Knob label="HMN" size={40} initialValue={0.4} />
              </div>
           </Section>
           <Section title="SURGERY">
              <Knob label="SSSH" size={50} />
              <Knob label="MUD" size={50} />
           </Section>
        </div>

        {/* COLUMN 2: DYNAMICS */}
        <div className="section-zone" style={{ borderRight: '1px solid rgba(255,255,255,0.03)', paddingRight: '20px' }}>
           <Section title="1176 FET">
              <Knob label="IN" initialValue={0.4} />
              <div className="meter-strip"><div className="meter-fill" style={{ height: '60%' }}></div></div>
              <Knob label="OUT" initialValue={0.5} />
           </Section>
           <Section title="LA-2A OPTO">
              <Knob label="PEAK" size={80} initialValue={0.7} />
              <Knob label="GAIN" size={50} initialValue={0.3} />
           </Section>
        </div>

        {/* COLUMN 3: TONE */}
        <div className="section-zone" style={{ borderRight: '1px solid rgba(255,255,255,0.03)', paddingRight: '20px' }}>
           <Section title="TONE COLOR">
              <Knob label="AIR" initialValue={0.9} />
              <Knob label="SSL" size={50} initialValue={0.2} />
           </Section>
           <Section title="HARMONICS">
              <Knob label="SAT" size={70} initialValue={0.6} />
              <Knob label="STERE" size={50} initialValue={0.8} />
           </Section>
        </div>

        {/* COLUMN 4: MASTER */}
        <div className="section-zone">
           <Section title="SPACE">
              <Knob label="REV" size={50} />
              <Knob label="DLY" size={50} />
           </Section>
           <Section title="MASTERING" showLine={false}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                 <div className="label-sm" style={{ color: 'var(--neon-red)' }}>TP LIMITER</div>
                 <Knob label="CEIL" size={90} initialValue={0.9} />
                 <div style={{ fontSize: '12px', fontWeight: '900', color: '#333' }}>-10.0 LUFS</div>
              </div>
           </Section>
        </div>
      </div>

      {/* FOOTER */}
      <div className="separator-h"></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
         <div className="label-sm">S-VERSION 12.55</div>
         <div className="label-sm">PLUGIN ALLIANCE GRADE</div>
      </div>
    </div>
  );
}

export default App;
