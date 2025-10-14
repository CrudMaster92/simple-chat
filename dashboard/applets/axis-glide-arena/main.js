const canvas = document.getElementById("arena");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0b12);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(12, 14, 18);
camera.lookAt(0, 0, 0);

const ambient = new THREE.AmbientLight(0xfff2dd, 0.3);
scene.add(ambient);

const mainLight = new THREE.DirectionalLight(0xb7f31a, 0.9);
mainLight.position.set(8, 15, 6);
scene.add(mainLight);

const coralLight = new THREE.PointLight(0xff6f4c, 0.6, 60);
coralLight.position.set(-10, 12, -6);
scene.add(coralLight);

const floorGeometry = new THREE.PlaneGeometry(32, 32, 32, 32);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x1f1b24,
  metalness: 0.1,
  roughness: 0.7,
  side: THREE.DoubleSide,
  wireframe: false
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const grid = new THREE.GridHelper(32, 32, 0xb7f31a, 0x362f48);
scene.add(grid);

const playerGeometry = new THREE.SphereGeometry(1, 32, 32);
const playerMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd7ba,
  emissive: 0x231f27,
  metalness: 0.3,
  roughness: 0.4
});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.castShadow = true;
player.position.y = 1;
scene.add(player);

const hoverRingGeometry = new THREE.TorusGeometry(1.4, 0.08, 12, 48);
const hoverRingMaterial = new THREE.MeshBasicMaterial({ color: 0xb7f31a });
const hoverRing = new THREE.Mesh(hoverRingGeometry, hoverRingMaterial);
hoverRing.rotation.x = Math.PI / 2;
player.add(hoverRing);

const orbGeometry = new THREE.SphereGeometry(0.6, 24, 24);
const orbMaterial = new THREE.MeshStandardMaterial({
  color: 0xb7f31a,
  emissive: 0x4f6d0f,
  emissiveIntensity: 0.8,
  metalness: 0.2,
  roughness: 0.2
});

const obstacles = [];
const orbGroup = new THREE.Group();
scene.add(orbGroup);

function createObstacles() {
  const pillarGeometry = new THREE.CylinderGeometry(0.7, 0.7, 6, 12);
  const pillarMaterial = new THREE.MeshStandardMaterial({
    color: 0x272331,
    metalness: 0.15,
    roughness: 0.6
  });

  const placements = [
    [-6, -4],
    [7, -5],
    [-4, 6],
    [5, 5]
  ];

  placements.forEach(([x, z]) => {
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.set(x, 3, z);
    scene.add(pillar);
    obstacles.push(pillar);
  });
}

createObstacles();

const orbPositions = [
  new THREE.Vector3(-8, 1.2, -6),
  new THREE.Vector3(8, 1.5, -7),
  new THREE.Vector3(-6, 1.2, 8),
  new THREE.Vector3(5, 1.4, 5),
  new THREE.Vector3(0, 1.7, 0),
  new THREE.Vector3(9, 1.3, 2),
  new THREE.Vector3(-3, 1.6, -1)
];

const ui = {
  orbCount: document.getElementById("orb-count"),
  orbTotal: document.getElementById("orb-total"),
  timer: document.getElementById("timer"),
  start: document.getElementById("start-button"),
  overlay: document.getElementById("overlay"),
  overlayContent: document.getElementById("overlay-content"),
  restart: document.getElementById("restart-button")
};

const state = {
  running: false,
  collected: 0,
  total: orbPositions.length,
  timeLeft: 60,
  velocity: new THREE.Vector3(),
  maxBounds: 15
};

ui.orbTotal.textContent = state.total.toString();
ui.orbCount.textContent = "0";
ui.timer.textContent = state.timeLeft.toFixed(1);

const keys = new Set();
window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
});
window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

function resetOrbs() {
  orbGroup.clear();
  state.collected = 0;
  ui.orbCount.textContent = "0";
  orbPositions.forEach((pos) => {
    const orb = new THREE.Mesh(orbGeometry, orbMaterial.clone());
    orb.position.copy(pos);
    orb.userData.angle = Math.random() * Math.PI * 2;
    orbGroup.add(orb);
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function startGame() {
  resetOrbs();
  state.running = true;
  state.timeLeft = 60;
  state.velocity.set(0, 0, 0);
  player.position.set(0, 1, 12);
  camera.position.set(12, 14, 18);
  camera.lookAt(player.position);
  ui.overlay.hidden = true;
  ui.timer.textContent = state.timeLeft.toFixed(1);
  clock.getDelta();
}

function endGame(win) {
  state.running = false;
  const headline = win ? "Stabilized!" : "Arena Overload";
  const message = win
    ? "You collected every energy cell before the field fractured."
    : "The energy matrix collapsed before you could gather every cell.";
  ui.overlayContent.innerHTML = `<strong>${headline}</strong><br>${message}`;
  ui.overlay.hidden = false;
}

ui.start.addEventListener("click", startGame);
ui.restart.addEventListener("click", startGame);

const clock = new THREE.Clock();

function update(delta) {
  if (!state.running) {
    return;
  }

  const acceleration = 22;
  const damping = 0.88;
  const input = new THREE.Vector3();

  if (keys.has("arrowup") || keys.has("w")) input.z -= 1;
  if (keys.has("arrowdown") || keys.has("s")) input.z += 1;
  if (keys.has("arrowleft") || keys.has("a")) input.x -= 1;
  if (keys.has("arrowright") || keys.has("d")) input.x += 1;

  if (input.lengthSq() > 0) {
    input.normalize();
    state.velocity.x += input.x * acceleration * delta;
    state.velocity.z += input.z * acceleration * delta;
  }

  state.velocity.multiplyScalar(damping);
  state.velocity.x = clamp(state.velocity.x, -12, 12);
  state.velocity.z = clamp(state.velocity.z, -12, 12);

  player.position.x += state.velocity.x * delta;
  player.position.z += state.velocity.z * delta;

  player.position.x = clamp(player.position.x, -state.maxBounds, state.maxBounds);
  player.position.z = clamp(player.position.z, -state.maxBounds, state.maxBounds);

  hoverRing.rotation.z += delta * 2;

  orbGroup.children.forEach((orb) => {
    orb.userData.angle += delta * 1.6;
    orb.position.y = 1.2 + Math.sin(orb.userData.angle) * 0.4;
    orb.rotation.y += delta * 1.2;
  });

  const collectedThisFrame = [];
  orbGroup.children.forEach((orb) => {
    if (orb.userData.collected) return;
    const distance = orb.position.distanceTo(player.position);
    if (distance < 1.5) {
      orb.userData.collected = true;
      collectedThisFrame.push(orb);
    }
  });

  if (collectedThisFrame.length > 0) {
    collectedThisFrame.forEach((orb) => {
      orb.material.emissive.setHex(0xff6f4c);
      orb.material.color.setHex(0xffb08f);
      orb.material.needsUpdate = true;
      orb.scale.setScalar(0.2);
    });
    state.collected += collectedThisFrame.length;
    ui.orbCount.textContent = state.collected.toString();
  }

  for (let i = orbGroup.children.length - 1; i >= 0; i -= 1) {
    const orb = orbGroup.children[i];
    if (!orb.userData.collected) continue;
    orb.scale.multiplyScalar(0.86);
    orb.position.y += delta * 2;
    if (orb.scale.x < 0.02) {
      orbGroup.remove(orb);
    }
  }

  state.timeLeft -= delta;
  ui.timer.textContent = Math.max(state.timeLeft, 0).toFixed(1);

  if (state.collected >= state.total) {
    endGame(true);
  } else if (state.timeLeft <= 0) {
    endGame(false);
  }

  camera.position.lerp(
    new THREE.Vector3(player.position.x + 12, 14, player.position.z + 18),
    0.08
  );
  const lookTarget = new THREE.Vector3(player.position.x, 0, player.position.z);
  camera.lookAt(lookTarget);
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener("resize", onWindowResize);

function animate() {
  const delta = clock.getDelta();
  update(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
