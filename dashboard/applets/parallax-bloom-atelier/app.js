const rendererRoot = document.getElementById("rendererRoot");
const accentInput = document.getElementById("accentColor");
const bloomInput = document.getElementById("bloomColor");
const layerCountInput = document.getElementById("layerCount");
const trailLengthInput = document.getElementById("trailLength");
const orbitSpeedInput = document.getElementById("orbitSpeed");
const driftInput = document.getElementById("driftIntensity");
const layerCountValue = document.getElementById("layerCountValue");
const trailValue = document.getElementById("trailValue");
const speedValue = document.getElementById("speedValue");
const driftValue = document.getElementById("driftValue");
const hudDepth = document.getElementById("hudDepth");
const hudLayers = document.getElementById("hudLayers");
const hudTrail = document.getElementById("hudTrail");
const notesEntry = document.getElementById("notesEntry");
const reshuffleButton = document.getElementById("reshuffle");

const state = {
  accent: accentInput.value,
  bloom: bloomInput.value,
  layerCount: Number(layerCountInput.value),
  trailLength: Number(trailLengthInput.value),
  orbitSpeed: Number(orbitSpeedInput.value),
  driftIntensity: Number(driftInput.value),
  seeds: [],
};

const noteLibrary = [
  "Spectral flares braided into the bloom's halo.",
  "Orbit resonance stable. Parallax depth expanding.",
  "Peripheral petals syncing to cadence.",
  "Trail echoes stitched with amber sparks.",
  "Vector drift steady. Depthloom humming softly.",
  "Layer tension tuned for prism bloom response.",
];

let scene, camera, renderer;
let bloomGroup;
let lastTimestamp = 0;

init();
animate(0);

function init() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04121f, 0.045);

  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.8, 8);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(rendererRoot.clientWidth, rendererRoot.clientHeight);
  renderer.setClearColor(0x02070c, 0);
  rendererRoot.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xbddcff, 0.65);
  const keyLight = new THREE.DirectionalLight(0xffd0a3, 1.2);
  keyLight.position.set(3, 6, 4);
  const rimLight = new THREE.DirectionalLight(0x7ad9ff, 0.9);
  rimLight.position.set(-4, -3, -6);

  scene.add(ambient, keyLight, rimLight);

  bloomGroup = new THREE.Group();
  scene.add(bloomGroup);

  rebuildLayers();
  attachEventListeners();
  handleResize();
}

function attachEventListeners() {
  window.addEventListener("resize", handleResize);

  accentInput.addEventListener("input", () => {
    state.accent = accentInput.value;
    recolorLayers();
    updateNote("Accent hue infused.");
  });

  bloomInput.addEventListener("input", () => {
    state.bloom = bloomInput.value;
    recolorLayers();
    updateNote("Bloom hue synchronized.");
  });

  layerCountInput.addEventListener("input", () => {
    state.layerCount = Number(layerCountInput.value);
    layerCountValue.textContent = `${state.layerCount} layers`;
    hudLayers.textContent = state.layerCount;
    rebuildLayers();
    updateNote("Layer lattice rebalanced.");
  });

  trailLengthInput.addEventListener("input", () => {
    state.trailLength = Number(trailLengthInput.value);
    trailValue.textContent = `${state.trailLength} frames`;
    hudTrail.textContent = state.trailLength;
    bloomGroup.children.forEach((child) => {
      if (child.userData && child.userData.trailPositions) {
        const { trailPositions, trailGeometry } = child.userData;
        const newPositions = new Float32Array(state.trailLength * 3);
        newPositions.set(trailPositions.slice(0, newPositions.length));
        child.userData.trailPositions = newPositions;
        trailGeometry.setAttribute(
          "position",
          new THREE.BufferAttribute(newPositions, 3)
        );
        if (trailGeometry.attributes.position) {
          trailGeometry.attributes.position.needsUpdate = true;
        }
        trailGeometry.computeBoundingSphere();
      }
    });
    updateNote("Trail depth recalibrated.");
  });

  orbitSpeedInput.addEventListener("input", () => {
    state.orbitSpeed = Number(orbitSpeedInput.value);
    speedValue.textContent = `${state.orbitSpeed}\u00b0/s`;
    updateHudDepth();
  });

  driftInput.addEventListener("input", () => {
    state.driftIntensity = Number(driftInput.value);
    driftValue.textContent = `${state.driftIntensity}%`;
    updateHudDepth();
  });

  reshuffleButton.addEventListener("click", () => {
    reseedLayers();
    updateNote(randomNote());
  });
}

function rebuildLayers() {
  while (bloomGroup.children.length) {
    const child = bloomGroup.children[0];
    bloomGroup.remove(child);
    child.traverse((node) => {
      if (node.geometry) node.geometry.dispose();
      if (node.material) {
        if (Array.isArray(node.material)) {
          node.material.forEach((mat) => mat.dispose());
        } else {
          node.material.dispose();
        }
      }
    });
  }
  bloomGroup.clear();
  state.seeds = Array.from({ length: state.layerCount }, () => Math.random() * 1000);

  for (let i = 0; i < state.layerCount; i += 1) {
    const layer = createLayer(i, state.layerCount);
    bloomGroup.add(layer);
  }

  updateHudDepth();
}

function recolorLayers() {
  bloomGroup.children.forEach((child, index) => {
    const tint = getLayerColor(index, state.layerCount);
    if (child.userData && child.userData.material) {
      child.userData.material.color.set(tint);
      child.userData.material.emissive.set(tint.clone().multiplyScalar(0.3));
    }
    if (child.userData && child.userData.trailMaterial) {
      child.userData.trailMaterial.color.set(tint.clone().lerp(new THREE.Color("#ffffff"), 0.4));
    }
  });
}

function reseedLayers() {
  state.seeds = state.seeds.map(() => Math.random() * 1000);
  bloomGroup.children.forEach((child, index) => {
    const phase = state.seeds[index];
    child.userData.phase = phase;
    child.userData.spin = 0.4 + Math.random() * 1.3;
    child.userData.driftPhase = Math.random() * Math.PI * 2;
  });
}

function createLayer(index, total) {
  const radius = 1.6 + index * 0.55;
  const group = new THREE.Group();
  const tint = getLayerColor(index, total);

  const geometryFactory = pickGeometryFactory(index);
  const meshGeometry = geometryFactory(radius);
  const meshMaterial = new THREE.MeshStandardMaterial({
    color: tint,
    emissive: tint.clone().multiplyScalar(0.3),
    roughness: 0.35,
    metalness: 0.4,
    transparent: true,
    opacity: 0.95,
  });
  const mesh = new THREE.Mesh(meshGeometry, meshMaterial);
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  const trailGeometry = new THREE.BufferGeometry();
  const trailPositions = new Float32Array(state.trailLength * 3);
  trailGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(trailPositions, 3)
  );
  trailGeometry.computeBoundingSphere();
  const trailMaterial = new THREE.LineBasicMaterial({
    color: tint.clone().lerp(new THREE.Color("#ffffff"), 0.4),
    transparent: true,
    opacity: 0.75,
    linewidth: 2,
  });
  const trailLine = new THREE.Line(trailGeometry, trailMaterial);

  group.add(trailLine);
  group.add(mesh);

  group.userData = {
    mesh,
    material: meshMaterial,
    trailGeometry,
    trailMaterial,
    trailPositions,
    radius,
    spin: 0.4 + Math.random() * 1.3,
    phase: state.seeds[index],
    driftPhase: Math.random() * Math.PI * 2,
    geometryFactory,
  };

  return group;
}

function pickGeometryFactory(index) {
  const factories = [
    (radius) => new THREE.IcosahedronGeometry(radius * 0.32, 1),
    (radius) => new THREE.TorusKnotGeometry(radius * 0.22, radius * 0.06, 120, 8),
    (radius) => new THREE.CapsuleGeometry(radius * 0.2, radius * 0.55, 6, 16),
    (radius) => new THREE.OctahedronGeometry(radius * 0.28, 1),
  ];
  return factories[index % factories.length];
}

function getLayerColor(index, total) {
  const accent = new THREE.Color(state.accent);
  const bloom = new THREE.Color(state.bloom);
  const t = total <= 1 ? 0 : index / (total - 1);
  const color = accent.clone().lerp(bloom, t);
  return color;
}

function animate(timestamp) {
  requestAnimationFrame(animate);
  const delta = (timestamp - lastTimestamp) / 1000 || 0.016;
  lastTimestamp = timestamp;

  const baseSpeed = (state.orbitSpeed / 45) * delta;
  const driftScale = state.driftIntensity / 100;

  bloomGroup.children.forEach((group, index) => {
    const data = group.userData;
    if (!data) return;

    data.phase += baseSpeed * data.spin;
    data.driftPhase += delta * 0.25 * (index + 1);

    const offset = Math.sin(data.driftPhase) * driftScale;
    const yOffset = Math.cos(data.driftPhase * 0.7) * driftScale * 1.5;

    const x = Math.cos(data.phase + index * 0.4) * data.radius * (1 + offset);
    const y = yOffset * data.radius * 0.6;
    const z = Math.sin(data.phase + index * 0.4) * data.radius * (1 - offset * 0.6);

    data.mesh.position.set(x, y, z);
    data.mesh.rotation.x += delta * 0.6;
    data.mesh.rotation.y += delta * 0.5;

    const positions = data.trailPositions;
    if (positions.length >= 6) {
      positions.copyWithin(3, 0, positions.length - 3);
    }
    positions[0] = x;
    positions[1] = y;
    positions[2] = z;
    data.trailGeometry.attributes.position.needsUpdate = true;
  });

  bloomGroup.rotation.y += delta * 0.1;
  bloomGroup.rotation.x = Math.sin(timestamp * 0.0001) * 0.12;

  renderer.render(scene, camera);
}

function handleResize() {
  const { clientWidth, clientHeight } = rendererRoot;
  const parent = rendererRoot.parentElement || rendererRoot;
  const width = clientWidth || parent.clientWidth || 1;
  const height = clientHeight || parent.clientHeight || Math.max(1, width * 0.6);
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const aspect = safeWidth / safeHeight;

  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(safeWidth, safeHeight);
}

function updateHudDepth() {
  const depth = 1 + state.driftIntensity / 80 + state.orbitSpeed / 120;
  hudDepth.textContent = `${depth.toFixed(2)}x`;
  hudLayers.textContent = state.layerCount;
  hudTrail.textContent = state.trailLength;
}

function updateNote(text) {
  notesEntry.textContent = text;
}

function randomNote() {
  return noteLibrary[Math.floor(Math.random() * noteLibrary.length)];
}
