// NADA BOSS ULTIMATE 3D ENGINE [V4: THE DIVINE]
// FEATURES: ANISOTROPIC SHADERS, BAKED LABELS, UNREALBLOOM

const container = document.getElementById('rack-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

// --- 1. STUDIO LIGHTING ---
const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

const pointLight = new THREE.PointLight(0xffffff, 2, 20);
pointLight.position.set(2, 5, 5);
scene.add(pointLight);

const redBloom = new THREE.PointLight(0xff0000, 10, 10);
redBloom.position.set(-5, -3, 2);
scene.add(redBloom);

// --- 2. TEXTURE BAKING (LABELS) ---
const createLabelTexture = (text, width=512, height=128) => {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0,0,width,height);
    ctx.font = 'bold 64px "Bebas Neue"';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText(text, width/2, height/2 + 20);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
};

// --- 3. ANISOTROPIC SPUN METAL SHADER ---
const spunMetalMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 1.0,
    roughness: 0.25,
    flatShading: false
});

// --- 4. THE GIGA-RACK (14 MODULES) ---
const chassisMat = new THREE.MeshStandardMaterial({ color: 0x111113, metalness: 0.9, roughness: 0.5 });

const addModule = (name, x, y, w, h, knobs) => {
    const group = new THREE.Group();
    
    // Faceplate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), chassisMat);
    group.add(plate);

    // Baked Label
    const labelTex = createLabelTexture(name);
    const labelPlane = new THREE.Mesh(new THREE.PlaneGeometry(w*0.8, h*0.2), new THREE.MeshBasicMaterial({map: labelTex, transparent: true, opacity: 0.6}));
    labelPlane.position.y = h/2 - 0.25;
    labelPlane.position.z = 0.11;
    group.add(labelPlane);

    // Knobs
    knobs.forEach((k, i) => {
        const knob = new THREE.Group();
        const kg = new THREE.Mesh(new THREE.CylinderGeometry(0.35*k, 0.36*k, 0.2*k, 64), spunMetalMat);
        kg.rotation.x = Math.PI/2;
        knob.add(kg);
        
        const needle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2*k, 0.05), new THREE.MeshBasicMaterial({color:0xff0000}));
        needle.position.y = 0.25*k; needle.position.z = 0.12*k;
        knob.add(needle);
        
        knob.position.set((i - (knobs.length-1)/2) * 1.2, -0.2, 0.15);
        group.add(knob);
    });

    group.position.set(x, y, 0);
    scene.add(group);
};

// DEFINE 14 STAGES 1:1
addModule("AUTOTUNE", -5, 3.5, 3.5, 2.5, [1.5, 0.7, 0.7, 0.7]);
addModule("MUD EQ", -2, 3.5, 2, 2.5, [1.2]);
addModule("1176 FET", 1.5, 3.5, 4, 2.5, [1.0, 1.0, 0.8, 0.8]);
addModule("LA-2A OPTO", 5, 3.5, 2.5, 2.5, [1.8]);

addModule("EQP-1A", -5, 0.5, 3, 2.5, [1.2, 1.2]);
addModule("SSL EQ", -2.5, 0.5, 1.8, 2.5, [1.0]);
addModule("SATURATION", -0.5, 0.5, 2, 2.5, [1.1]);
addModule("FINAL COMP", 2, 0.5, 2.5, 2.5, [1.0, 1.0]);
addModule("DE-ESSER", 4.5, 0.5, 2.2, 2.5, [1.1]);
addModule("FINAL EQ", 6.8, 0.5, 2.0, 2.5, [1.0]);

addModule("STEREO WIDTH", -5, -2.5, 2.5, 2.5, [1.3]);
addModule("LIMITER", -2, -2.5, 3.0, 2.5, [2.0]);
addModule("BUS REVERB", 1.5, -2.5, 3.5, 2.5, [1.2, 1.2]);
addModule("BUS DELAY", 5.5, -2.5, 3.5, 2.5, [1.2, 1.2]);

// 5. THE CENTERPIECE
const eyeGroup = new THREE.Group();
const goldEye = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.1, 16, 100), new THREE.MeshStandardMaterial({color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 2}));
eyeGroup.add(goldEye);
const blackGem = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), new THREE.MeshStandardMaterial({color: 0x000, roughness: 0.1, metalness: 1}));
eyeGroup.add(blackGem);
eyeGroup.position.y = 6.5;
scene.add(eyeGroup);

camera.position.z = 18;

function animate() {
    requestAnimationFrame(animate);
    eyeGroup.rotation.z += 0.01;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
