/**
 * NADA BOSS V3 - Web Connector
 */

const knobs = document.querySelectorAll('.knob');
const needles = {
    in: document.getElementById('needle-in'),
    gr: document.getElementById('needle-gr'),
    out: document.getElementById('needle-out')
};

// Handle Knob Rotation (Visual Only for now)
knobs.forEach(knob => {
    let rotation = 0;
    knob.addEventListener('mousedown', (e) => {
        const startY = e.clientY;
        const onMouseMove = (moveE) => {
            const dy = startY - moveE.clientY;
            rotation = Math.min(150, Math.max(-150, rotation + dy));
            knob.querySelector('.indicator').style.transform = `rotate(${rotation}deg)`;
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
});

const canvas = document.getElementById('canvas-analyzer');
const ctx = canvas.getContext('2d');

function updateSpectrum(fftData) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    
    const sliceWidth = canvas.width / fftData.length;
    let x = 0;

    for(let i = 0; i < fftData.length; i++) {
        const v = fftData[i] * canvas.height;
        const y = canvas.height - v;

        if(i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
    }
    ctx.stroke();
    
    // Add red glow area beneath
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.fill();
}

function updateMeters(input, gr, output) {
    needles.in.style.transform = `rotate(${(input - 0.5) * 90}deg)`;
    needles.gr.style.transform = `rotate(${(gr - 0.5) * 90}deg)`;
    needles.out.style.transform = `rotate(${(output - 0.5) * 90}deg)`;
}

// Notify C++ of parameter changes
function setParameter(id, value) {
    // This will be called via the JUCE Native Bridge
    if (window.juce) {
        window.juce.setParam(id, value);
    }
}
