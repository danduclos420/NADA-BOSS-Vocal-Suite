// NADA BOSS ULTIMATE 3D ENGINE
// 14-Stage Hardware Simulation with Three.js

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// LIGHTING: THE 'SECRET' TO HARDWARE REALISM
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 50);
spotLight.position.set(5, 10, 7);
spotLight.castShadow = true;
scene.add(spotLight);

const redPointLight = new THREE.PointLight(0xff3c3c, 20, 10);
redPointLight.position.set(-2, -2, 2);
scene.add(redPointLight);

// MATERIALS
const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.9,
    roughness: 0.2,
});

const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 1,
    roughness: 0.1,
    emissive: 0xffd700,
    emissiveIntensity: 0.5
});

// GENERATE 14 KNOBS
const knobs = [];
const createKnob = (x, y, scale = 1, label = "") => {
    const group = new THREE.Group();
    
    // Knob Base
    const geometry = new THREE.CylinderGeometry(0.5 * scale, 0.5 * scale, 0.3 * scale, 64);
    const knob = new THREE.Mesh(geometry, metalMaterial);
    knob.rotation.x = Math.PI / 2;
    group.add(knob);

    // Indicator Needle
    const needleGeom = new THREE.BoxGeometry(0.05 * scale, 0.2 * scale, 0.05 * scale);
    const needleMat = new THREE.MeshBasicMaterial({ color: 0xff3c3c });
    const needle = new THREE.Mesh(needleGeom, needleMat);
    needle.position.y = 0.25 * scale;
    needle.position.z = 0.15 * scale;
    group.add(needle);

    group.position.set(x, y, 0);
    scene.add(group);
    knobs.push({ group, label });
};

// LAYOUT ACCORDING TO MOCKUP
// Top Row: Autotune, OPTO, FX Bus
createKnob(-4, 2, 1.5, "AUTOTUNE");
createKnob(0, 2, 1.5, "OPTO LEVELER");
createKnob(4, 2, 1, "REVERB");
createKnob(4, 0.5, 1, "DELAY");

// Mid Row: FET, Mud EQ, EQP-1A, SSL, Sat
createKnob(-4, -1, 1, "FET 1176");
createKnob(-2, -1, 0.8, "MUD EQ");
createKnob(0, -1, 1, "EQP-1A");
createKnob(2, -1, 0.6, "SSL EQ");
createKnob(3.5, -1, 0.6, "SATURATION");

// Bottom Row: Final Comp, De-esser, Final EQ, Width, Limiter
createKnob(-4, -3, 0.8, "FINAL COMP");
createKnob(-2, -3, 0.6, "DE-ESSER");
createKnob(0, -3, 0.8, "FINAL EQ");
createKnob(2, -3, 1, "STEREO WIDTH");
createKnob(4, -3, 1.5, "LIMITER");

// AI CENTER BUTTON
const aiGeom = new THREE.SphereGeometry(1.2, 32, 32);
const aiButton = new THREE.Mesh(aiGeom, goldMaterial);
aiButton.scale.z = 0.2;
aiButton.position.y = 4;
scene.add(aiButton);

camera.position.z = 10;

function animate() {
    requestAnimationFrame(animate);
    
    // Subtle float animation
    knobs.forEach((k, i) => {
        k.group.rotation.z = Math.sin(Date.now() * 0.001 + i) * 0.2;
    });
    
    aiButton.rotation.y += 0.01;
    
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
