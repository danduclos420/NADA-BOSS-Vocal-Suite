// NADA BOSS ULTIMATE 3D ENGINE [V2]
// PHOTOREALISTIC HARDWARE RENDERING FOR 14 STAGES

const container = document.getElementById('rack-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// --- PROCEDURAL TEXTURE GENERATOR ---
const generateMetalMap = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#222';
    ctx.fillRect(0,0,1024,1024);
    for(let i=0; i<5000; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
        ctx.fillRect(Math.random()*1024, Math.random()*1024, Math.random()*100, 1);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
};

const metalTex = generateMetalMap();

// --- LIGHTING ---
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

const topDown = new THREE.DirectionalLight(0xffffff, 2);
topDown.position.set(0, 5, 2);
topDown.castShadow = true;
scene.add(topDown);

const redBacklight = new THREE.PointLight(0xff1111, 20, 15);
redBacklight.position.set(-5, -2, 3);
scene.add(redBacklight);

// --- MATERIALS ---
const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x151618,
    metalness: 0.9,
    roughness: 0.4,
    bumpMap: metalTex,
    bumpScale: 0.005
});

const knobMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 1,
    roughness: 0.2,
    envMapIntensity: 1
});

// --- RACK SYSTEM ---
// Create Chassis
const chassisGeom = new THREE.BoxGeometry(18, 10, 0.5);
const chassis = new THREE.Mesh(chassisGeom, chassisMat);
chassis.receiveShadow = true;
scene.add(chassis);

// Rack Ears
const createEar = (x) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(1.5, 10, 0.6), chassisMat);
    ear.position.x = x;
    scene.add(ear);
    
    // Bolts
    for(let y of [-4, 0, 4]) {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16), new THREE.MeshStandardMaterial({color: 0x444, metalness:1}));
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(x, y, 0.35);
        scene.add(bolt);
    }
};
createEar(-9.5);
createEar(9.5);

// Modules (14 Stages)
const stages = [
    { n: "AUTOTUNE", x: -6, y: 3, ks: [1.2, 0.6, 0.6] },
    { n: "MUD EQ", x: -2.5, y: 3, ks: [1] },
    { n: "1176 FET", x: 1, y: 3, ks: [0.8, 0.8, 0.6] },
    { n: "LA-2A OPTO", x: 4.5, y: 3, ks: [1.5] },
    
    { n: "EQP-1A", x: -6, y: 0, ks: [0.8, 0.8] },
    { n: "SSL CONSOLE", x: -3.5, y: 0, ks: [0.6] },
    { n: "SATURATION", x: -1.5, y: 0, ks: [0.7] },
    { n: "FINAL COMP", x: 1, y: 0, ks: [0.8, 0.8] },
    { n: "DE-ESSER", x: 4, y: 0, ks: [0.8] },
    { n: "FINAL EQ", x: 6, y: 0, ks: [0.7] },
    
    { n: "WIDTH", x: -6, y: -3, ks: [1] },
    { n: "LIMITER", x: -3, y: -3, ks: [1.5] },
    { n: "REVERB", x: 1, y: -3, ks: [1, 1] },
    { n: "DELAY", x: 5, y: -3, ks: [1, 1] }
];

stages.forEach(s => {
    s.ks.forEach((sc, i) => {
        const group = new THREE.Group();
        const kGeom = new THREE.CylinderGeometry(0.4*sc, 0.42*sc, 0.25*sc, 32);
        const k = new THREE.Mesh(kGeom, knobMat);
        k.rotation.x = Math.PI / 2;
        group.add(k);
        
        const indPos = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2*sc, 0.05*sc), new THREE.MeshBasicMaterial({color: 0xff0000}));
        indPos.position.y = 0.3 * sc;
        indPos.position.z = 0.15 * sc;
        group.add(indPos);
        
        group.position.set(s.x + (i*1.2), s.y, 0.3);
        group.castShadow = true;
        scene.add(group);
    });
});

// AI BRAIN GIGA-LIGHT
const brain = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), new THREE.MeshStandardMaterial({color: 0x000, roughness:0, metalness:1}));
brain.position.y = 6;
scene.add(brain);

const halo = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.1, 16, 100), new THREE.MeshStandardMaterial({color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 2}));
halo.position.y = 6;
scene.add(halo);

camera.position.set(0, 0, 18);

function animate() {
    requestAnimationFrame(animate);
    halo.rotation.z += 0.01;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
