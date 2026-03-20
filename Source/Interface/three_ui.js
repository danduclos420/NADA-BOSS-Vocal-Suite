// NADA BOSS ULTIMATE 3D ENGINE [PHASE 20: REDEMPTION]
// THREE.JS + PBR + BLOOM + PROCEDURAL METAL

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
document.body.appendChild(renderer.domElement);

// LIGHTING - STUDIO SETUP
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 2);
rimLight.position.set(5, 5, 5);
scene.add(rimLight);

const redVibe = new THREE.PointLight(0xff0000, 2, 10);
redVibe.position.set(-5, -2, 2);
scene.add(redVibe);

// PROCEDURAL BRUSHED METAL (PBR)
const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1c,
    metalness: 1,
    roughness: 0.3,
    envMapIntensity: 1
});

// BUILD THE 14 MODULES
const modules = [];
const createModule = (name, x, y, w, h, knobsCount) => {
    const group = new THREE.Group();
    
    // Panel
    const panelGeom = new THREE.BoxGeometry(w, h, 0.1);
    const panel = new THREE.Mesh(panelGeom, metalMaterial);
    group.add(panel);

    // Knobs
    for(let i=0; i<knobsCount; i++) {
        const knobGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 64);
        const knob = new THREE.Mesh(knobGeom, new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 }));
        knob.rotation.x = Math.PI / 2;
        knob.position.x = (i - (knobsCount-1)/2) * 1.2;
        knob.position.y = -0.2;
        knob.position.z = 0.15;
        group.add(knob);

        // Indicator
        const indGeom = new THREE.BoxGeometry(0.02, 0.15, 0.02);
        const indMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const ind = new THREE.Mesh(indGeom, indMat);
        ind.position.set(knob.position.x, knob.position.y + 0.2, knob.position.z + 0.05);
        group.add(ind);
    }

    group.position.set(x, y, 0);
    scene.add(group);
    modules.push(group);
};

// 14 STAGES LAYOUT
createModule("AUTOTUNE", -4.5, 2, 3, 2.5, 3);
createModule("MUD EQ", -1.5, 2, 2, 2.5, 1);
createModule("1176 FET", 1.5, 2, 3, 2.5, 2);
createModule("LA-2A OPTO", 4.5, 2, 2.5, 2.5, 1);

createModule("EQP-1A", -4.5, -1, 3, 2.5, 2);
createModule("SSL EQ", -1.5, -1, 2, 2.5, 1);
createModule("SATURATION", 1.5, -1, 2, 2.5, 1);
createModule("FINAL COMP", 4.5, -1, 2, 2.5, 1);

createModule("DE-ESSER", -4.5, -4, 2, 2.5, 1);
createModule("FINAL EQ", -2, -4, 2, 2.5, 1);
createModule("WIDTH", 0.5, -4, 2, 2.5, 1);
createModule("LIMITER", 3, -4, 2, 2.5, 1);
createModule("REVERB", 5.5, -4, 2, 2.5, 1);
createModule("DELAY", 7.5, -4, 2, 2.5, 1); // 14 stages total

// AI BRAIN (CENTER TOP)
const brainGeom = new THREE.TorusGeometry(1, 0.1, 16, 100);
const brainMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1 });
const brain = new THREE.Mesh(brainGeom, brainMat);
brain.position.y = 5;
scene.add(brain);

const brainCore = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), new THREE.MeshStandardMaterial({ color: 0x000, roughness: 0 }));
brainCore.position.y = 5;
scene.add(brainCore);

camera.position.z = 15;

function animate() {
    requestAnimationFrame(animate);
    brain.rotation.z += 0.01;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
