// NADA BOSS ULTIMATE 3D ENGINE [V3: THE REDEMPTION]
// THREE.JS + PBR + POST-PROCESSING / UNREALBLOOM

// 1. SCENE SETUP
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// 2. PROCEDURAL TEXTURE ENGINE
const createBrushedMetalNormal = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8080ff'; // Flat normal
    ctx.fillRect(0,0,1024,1024);
    for(let i=0; i<8000; i++) {
        const val = 128 + (Math.random()-0.5) * 40;
        ctx.fillStyle = `rgb(${val},128,255)`;
        ctx.fillRect(Math.random()*1024, Math.random()*1024, Math.random()*200, 1);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
};

const brushedNormal = createBrushedMetalNormal();

// 3. LIGHTING (STUDIO PANELS)
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const lightPanel1 = new THREE.RectAreaLight(0xffffff, 2, 10, 2);
lightPanel1.position.set(0, 5, 2);
scene.add(lightPanel1);

const redNeon = new THREE.PointLight(0xff0000, 10, 10);
redNeon.position.set(-5, -3, 2);
scene.add(redNeon);

// 4. MATERIALS (HARDWARE QUALITY)
const chassisMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1b1e,
    metalness: 1,
    roughness: 0.4,
    normalMap: brushedNormal,
    normalScale: new THREE.Vector2(0.5, 0.5),
    reflectivity: 1,
    clearcoat: 0.1
});

const indicatorMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

// 5. THE GIGA-RACK ARCHITECTURE (14 STAGES)
const buildModule = (x, y, w, h, stageName) => {
    const group = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), chassisMat);
    group.add(panel);
    
    // Bezel Cutout (Inner Shadow Simulation)
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(w-0.1, h-0.1, 0.05), new THREE.MeshStandardMaterial({color: 0x000, roughness: 1}));
    bezel.position.z = -0.1;
    group.add(bezel);

    group.position.set(x, y, 0);
    scene.add(group);
    return group;
};

const buildKnob = (parent, x, y, scale=1) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4*scale, 0.4*scale, 0.3*scale, 64), new THREE.MeshStandardMaterial({color: 0x111, metalness:1, roughness:0.2}));
    body.rotation.x = Math.PI/2;
    g.add(body);
    
    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.03*scale, 0.2*scale, 0.05*scale), indicatorMat);
    needle.position.y = 0.25*scale;
    needle.position.z = 0.15*scale;
    g.add(needle);
    
    g.position.set(x, y, 0.15);
    parent.add(g);
};

// 14 STAGES PLACEMENT
const row1 = 3.5; const row2 = 0.5; const row3 = -2.5;

// Unit 01-04
const u1 = buildModule(-5.5, row1, 3.5, 2.5); buildKnob(u1, -1, 0, 1.5); buildKnob(u1, 0.8, 0.5, 0.7); buildKnob(u1, 0.8, -0.5, 0.7); // AUTOTUNE
const u2 = buildModule(-2.5, row1, 2, 2.5); buildKnob(u2, 0, 0, 1.2); // MUD EQ
const u3 = buildModule(0.5, row1, 3.5, 2.5); buildKnob(u3, -1, 0, 1); buildKnob(u3, 0.2, 0, 1); buildKnob(u3, 1.2, 0, 0.8); // 1176
const u4 = buildModule(4, row1, 3, 2.5); buildKnob(u4, 0, 0, 1.8); // LA-2A

// Unit 05-10
const u5 = buildModule(-5.5, row2, 3, 2.5); buildKnob(u5, -0.5, 0, 1); buildKnob(u5, 0.8, 0, 1); // EQP-1A
const u6 = buildModule(-3, row2, 1.5, 2.5); buildKnob(u6, 0, 0, 0.8); // SSL
const u7 = buildModule(-1.2, row2, 1.5, 2.5); buildKnob(u7, 0, 0, 0.9); // SAT
const u8 = buildModule(1, row2, 2.5, 2.5); buildKnob(u8, -0.4, 0, 0.8); buildKnob(u8, 0.4, 0, 0.8); // FINAL COMP
const u9 = buildModule(3.5, row2, 2, 2.5); buildKnob(u9, 0, 0, 1); // DEESSER
const u10 = buildModule(5.5, row2, 1.5, 2.5); buildKnob(u10, 0, 0, 0.8); // FINAL EQ

// Unit 11-14
const u11 = buildModule(-5.5, row3, 2, 2.5); buildKnob(u11, 0, 0, 1.2); // WIDTH
const u12 = buildModule(-3, row3, 2.5, 2.5); buildKnob(u12, 0, 0, 1.8); // LIMITER
const u13 = buildModule(0, row3, 3, 2.5); buildKnob(u13, -0.6, 0, 1.2); buildKnob(u13, 0.6, 0, 1.2); // REVERB
const u14 = buildModule(3.5, row3, 3, 2.5); buildKnob(u14, -0.6, 0, 1.2); buildKnob(u14, 0.6, 0, 1.2); // DELAY

// 6. MASTER AI GEM
const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), new THREE.MeshStandardMaterial({color: 0x000, metalness:1, roughness:0}));
gem.position.set(0, 6.5, 0);
scene.add(gem);

const core = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.1, 16, 100), new THREE.MeshStandardMaterial({color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 2}));
core.position.set(0, 6.5, 0);
scene.add(core);

camera.position.z = 15;

function animate() {
    requestAnimationFrame(animate);
    core.rotation.z += 0.01;
    gem.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
