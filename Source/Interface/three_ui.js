// NADA BOSS ULTIMATE 3D ENGINE [PHASE 20: REDEMPTION]
// THREE.JS + PBR MATERIALS + BLOOM POST-PROCESSING

const container = document.getElementById('rack-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

// LIGHTING: THE STUDIO SETUP
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 2);
spotLight.position.set(5, 10, 7);
spotLight.angle = 0.5;
spotLight.penumbra = 1;
spotLight.decay = 2;
spotLight.distance = 200;
scene.add(spotLight);

const redVibe = new THREE.PointLight(0xff3c3c, 5, 20);
redVibe.position.set(-5, -3, 2);
scene.add(redVibe);

// PBR MATERIALS (PHYSICALLY BASED)
const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1c,
    metalness: 1,
    roughness: 0.3,
    roughnessMap: null // Will simulate with procedural noise later if needed
});

const knobMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.9,
    roughness: 0.2
});

const goldEmissive = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 1,
    roughness: 0.1,
    emissive: 0xffd700,
    emissiveIntensity: 1.2
});

// GEOMETRY HELPERS
const createModuleUnit = (x, y, w, h, name) => {
    const group = new THREE.Group();
    
    // Sunken Panel (The Relief)
    const panelGeom = new THREE.BoxGeometry(w, h, 0.1);
    const panel = new THREE.Mesh(panelGeom, metalMaterial);
    group.add(panel);

    // Bezel Border
    const borderGeom = new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.05);
    const border = new THREE.Mesh(borderGeom, new THREE.MeshStandardMaterial({ color: 0x000, roughness: 0.5 }));
    border.position.z = -0.04;
    group.add(border);

    group.position.set(x, y, 0);
    scene.add(group);
    return group;
};

const createKnob3D = (parent, x, y, scale = 1) => {
    const knobGroup = new THREE.Group();
    
    // Knob Body
    const bodyGeom = new THREE.CylinderGeometry(0.5 * scale, 0.52 * scale, 0.3 * scale, 64);
    const body = new THREE.Mesh(bodyGeom, knobMaterial);
    body.rotation.x = Math.PI / 2;
    knobGroup.add(body);

    // Red Indicator (Glow)
    const indGeom = new THREE.BoxGeometry(0.04 * scale, 0.2 * scale, 0.05 * scale);
    const indMat = new THREE.MeshBasicMaterial({ color: 0xff3c3c });
    const indicator = new THREE.Mesh(indGeom, indMat);
    indicator.position.y = 0.25 * scale;
    indicator.position.z = 0.15 * scale;
    knobGroup.add(indicator);

    knobGroup.position.set(x, y, 0.1);
    parent.add(knobGroup);
    return knobGroup;
};

// --- BUILDING THE 14-STAGE GIGA RACK ---
// 1. AUTOTUNE
const autotune = createModuleUnit(-5, 3.5, 4, 2.5, "AUTOTUNE");
createKnob3D(autotune, -1, 0, 1.5); // Main Pitch
createKnob3D(autotune, 1, 0.5, 0.8); // Speed
createKnob3D(autotune, 1, -0.5, 0.8); // Tune

// 2. MUD EQ
const mudEq = createModuleUnit(-1.5, 3.5, 2, 2.5, "MUD EQ");
createKnob3D(mudEq, 0, 0, 1.2);

// 3. 1176 FET
const fet = createModuleUnit(2, 3.5, 4, 2.5, "1176 FET");
createKnob3D(fet, -1.2, 0, 1);
createKnob3D(fet, 0, 0, 1);
createKnob3D(fet, 1.2, 0, 1);

// 4. LA-2A OPTO
const opto = createModuleUnit(5.5, 3.5, 2.5, 2.5, "LA-2A");
createKnob3D(opto, 0, 0, 1.8);

// MID ROW (5-10)
const eqp = createModuleUnit(-5, 0.5, 3, 2.5, "EQP-1A");
createKnob3D(eqp, -0.6, 0, 1); createKnob3D(eqp, 0.6, 0, 1);

const ssl = createModuleUnit(-2.2, 0.5, 1.8, 2.5, "SSL");
createKnob3D(ssl, 0, 0, 0.9);

const sat = createModuleUnit(-0.2, 0.5, 1.8, 2.5, "SAT");
createKnob3D(sat, 0, 0, 1);

const finalComp = createModuleUnit(2, 0.5, 2.2, 2.5, "FINAL COMP");
createKnob3D(finalComp, -0.4, 0, 0.8); createKnob3D(finalComp, 0.4, 0, 0.8);

const deesser = createModuleUnit(4.5, 0.5, 2.2, 2.5, "DEESSER");
createKnob3D(deesser, 0, 0, 1);

const finalEq = createModuleUnit(7, 0.5, 1.8, 2.5, "FINAL EQ");
createKnob3D(finalEq, 0, 0, 1);

// BOTTOM ROW (11-14)
const width = createModuleUnit(-5, -2.5, 2, 2.5, "WIDTH");
createKnob3D(width, 0, 0, 1.2);

const limiter = createModuleUnit(-2.5, -2.5, 2.5, 2.5, "LIMITER");
createKnob3D(limiter, 0, 0, 1.8);

const reverb = createModuleUnit(0.5, -2.5, 2.5, 2.5, "REVERB");
createKnob3D(reverb, -0.5, 0, 1); createKnob3D(reverb, 0.5, 0, 1);

const delay = createModuleUnit(3.5, -2.5, 2.5, 2.5, "DELAY");
createKnob3D(delay, -0.5, 0, 1); createKnob3D(delay, 0.5, 0, 1);

// THE MASTER AI BRAIN (TOP CENTER)
const brainCore = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.15, 32, 100), goldEmissive);
brainCore.position.y = 6.5;
scene.add(brainCore);

const brainSphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), new THREE.MeshStandardMaterial({ color: 0x000, metalness: 1, roughness: 0.1 }));
brainSphere.position.y = 6.5;
scene.add(brainSphere);

camera.position.z = 15;

function animate() {
    requestAnimationFrame(animate);
    
    // Subtle float
    brainCore.rotation.z += 0.01;
    brainCore.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.05);

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
