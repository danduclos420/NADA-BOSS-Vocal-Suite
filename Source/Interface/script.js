/**
 * NADA BOSS V3 MASTER DESK COMMAND
 */

const knobs = document.querySelectorAll('.knob');
const canvasSpec = document.getElementById('paz-spectrum');
const ctxSpec = canvasSpec.getContext('2d');

const canvasStereo = document.getElementById('paz-goniometer');
const ctxStereo = canvasStereo.getContext('2d');

// --- 1. KNOB INTERACTION (High Resolution) ---
knobs.forEach(knob => {
    let rotation = 0;
    knob.addEventListener('mousedown', (e) => {
        const startY = e.clientY;
        const currentId = knob.id.replace('knob-', '').toUpperCase();
        
        const onMouseMove = (moveE) => {
            const dy = startY - moveE.clientY;
            rotation = Math.min(150, Math.max(-150, rotation + dy));
            knob.querySelector('.indicator').style.transform = `rotate(${rotation}deg)`;
            
            // Normalize for JUCE (0.0 to 1.0)
            const normValue = (rotation + 150) / 300;
            if (window.juce) window.juce.setParam(currentId, normValue);
        };
        
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
});

// --- 2. PAZ REAL-TIME RENDERER ---
function updateSpectrum(fftData) {
    ctxSpec.clearRect(0, 0, canvasSpec.width, canvasSpec.height);
    
    // Grid lines
    ctxSpec.strokeStyle = '#111';
    for(let i=0; i<canvasSpec.width; i+=40) {
        ctxSpec.beginPath(); ctxSpec.moveTo(i, 0); ctxSpec.lineTo(i, canvasSpec.height); ctxSpec.stroke();
    }

    ctxSpec.beginPath();
    ctxSpec.strokeStyle = '#ff3c3c';
    ctxSpec.lineWidth = 1.5;
    
    const sliceWidth = canvasSpec.width / fftData.length;
    let x = 0;

    for(let i = 0; i < fftData.length; i++) {
        const y = canvasSpec.height - (fftData[i] * canvasSpec.height);
        if(i === 0) ctxSpec.moveTo(x, y);
        else ctxSpec.lineTo(x, y);
        x += sliceWidth;
    }
    ctxSpec.stroke();
    
    // Fill glow
    ctxSpec.lineTo(canvasSpec.width, canvasSpec.height);
    ctxSpec.lineTo(0, canvasSpec.height);
    ctxSpec.fillStyle = 'rgba(255, 60, 60, 0.05)';
    ctxSpec.fill();
}

function updateMeters(input, gr, output) {
    // Top-tier needle physics handled in CSS transitions
    document.getElementById('needle-master').style.transform = `rotate(${(output - 0.5) * 80}deg)`;
}

function updateGoniometer(samples) {
    ctxStereo.clearRect(0, 0, canvasStereo.width, canvasStereo.height);
    ctxStereo.strokeStyle = 'rgba(255, 60, 60, 0.4)';
    ctxStereo.beginPath();
    
    const centerX = canvasStereo.width / 2;
    const centerY = canvasStereo.height / 2;
    const scale = canvasStereo.width / 2.2;
    
    for (let i = 0; i < samples.length; i += 2) {
        const l = samples[i];
        const r = samples[i+1];
        
        const x = centerX + (l - r) * scale;
        const y = centerY - (l + r) * scale;
        
        if (i === 0) ctxStereo.moveTo(x, y);
        else ctxStereo.lineTo(x, y);
    }
    ctxStereo.stroke();
}

function updateLedDisplay(id, text) {
    const el = document.getElementById('display-' + id);
    if(el) el.innerText = text;
}

window.updateSpectrum = updateSpectrum;
window.updateMeters = updateMeters;
window.updateGoniometer = updateGoniometer;
window.updateLedDisplay = updateLedDisplay;
