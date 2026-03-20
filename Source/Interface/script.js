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

// Update Meters from C++ (Timer Callback)
function updateMeters(input, gr, output) {
    needles.in.style.transform = `rotate(${input * 40}deg)`;
    needles.gr.style.transform = `rotate(${gr * 40}deg)`;
    needles.out.style.transform = `rotate(${output * 40}deg)`;
}

// AI Button Trigger
document.getElementById('btn-activate').addEventListener('click', () => {
    // Call Native JUCE function via window.external or custom bridge
    console.log("AI Analysis Requested");
});
