const STORAGE_KEY = "darkFocusReactionStats";

const gameArea = document.querySelector("#game-area");
const gameStatus = document.querySelector("#game-status");
const gameMessage = document.querySelector("#game-message");
const startButton = document.querySelector("#start-button");
const resetButton = document.querySelector("#reset-button");
const soundToggle = document.querySelector("#sound-toggle");
const musicToggle = document.querySelector("#music-toggle");
const instructionsPanel = document.querySelector("#instructions-panel");
const showInstructionsButton = document.querySelector("#show-instructions-button");
const hideInstructionsButton = document.querySelector("#hide-instructions-button");
const liveStatus = document.querySelector("#live-status");

const bestTimeElement = document.querySelector("#best-time");
const averageTimeElement = document.querySelector("#average-time");
const attemptCountElement = document.querySelector("#attempt-count");
const latestTimeElement = document.querySelector("#latest-time");
const ratingElement = document.querySelector("#rating");
const currentCategory = document.querySelector("#current-category");
const guideLightning = document.querySelector("#guide-lightning");
const guideSharp = document.querySelector("#guide-sharp");
const guideAverage = document.querySelector("#guide-average");
const guideFocus = document.querySelector("#guide-focus");

const gameStates = {
  IDLE: "idle",
  WAITING: "waiting",
  ACTIVE: "active",
  RESULT: "result",
  TOO_SOON: "too-soon"
};

let currentState = gameStates.IDLE;
let waitTimeoutId = null;
let targetShownAt = 0;
let soundEnabled = false;
let musicEnabled = false;
let audioContext = null;
let musicMasterGain = null;
let musicIntervalId = null;
let musicStep = 0;
let stats = loadStats();

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let THREE = null;
let scene = null;
let camera = null;
let renderer = null;
let visualGroup = null;
let centralShape = null;
let pointLight = null;
let floatingShapes = [];
let visualPresets = {};
let activeVisualPreset = null;
let threeSceneReady = false;
let shakeUntil = 0;

function loadStats() {
  const fallbackStats = {
    bestTime: null,
    totalTime: 0,
    validAttempts: 0,
    latestTime: null
  };

  try {
    const savedStats = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return savedStats ? { ...fallbackStats, ...savedStats } : fallbackStats;
  } catch {
    return fallbackStats;
  }
}

function saveStats() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    console.warn("Stats could not be saved in this browser.");
  }
}

function resetStats() {
  clearPendingRound();

  stats = {
    bestTime: null,
    totalTime: 0,
    validAttempts: 0,
    latestTime: null
  };

  saveStats();
  updateStatsUI();
  setGameState(gameStates.IDLE);
}

function getRandomDelay() {
  const minimumDelay = 2000;
  const maximumDelay = 5000;
  return Math.floor(Math.random() * (maximumDelay - minimumDelay + 1)) + minimumDelay;
}

function startRound() {
  clearPendingRound();
  targetShownAt = 0;
  setGameState(gameStates.WAITING);
  gameArea.focus();

  waitTimeoutId = window.setTimeout(() => {
    targetShownAt = performance.now();
    setGameState(gameStates.ACTIVE);
    playTone(680, 0.06);
  }, getRandomDelay());
}

function clearPendingRound() {
  if (waitTimeoutId) {
    clearTimeout(waitTimeoutId);
    waitTimeoutId = null;
  }
}

function handlePlayerAction() {
  if (currentState === gameStates.WAITING) {
    handleTooSoon();
    return;
  }

  if (currentState === gameStates.ACTIVE) {
    recordReactionTime();
  }
}

function handleTooSoon() {
  clearPendingRound();
  targetShownAt = 0;
  setGameState(gameStates.TOO_SOON);
  playTone(180, 0.12);
}

function recordReactionTime() {
  if (!targetShownAt) return;

  const clickedAt = performance.now();
  const reactionTime = Math.round(clickedAt - targetShownAt);

  targetShownAt = 0;
  stats.latestTime = reactionTime;
  stats.validAttempts += 1;
  stats.totalTime += reactionTime;

  if (stats.bestTime === null || reactionTime < stats.bestTime) {
    stats.bestTime = reactionTime;
  }

  saveStats();
  updateStatsUI();
  setGameState(gameStates.RESULT, reactionTime);
  playTone(420, 0.08);
}

function setGameState(nextState, reactionTime = null) {
  currentState = nextState;
  gameArea.className = `game-area ${nextState}`;
  updateThreeVisualState(nextState);

  const stateContent = {
    [gameStates.IDLE]: {
      status: "Ready?",
      message: "Press Start Game when you are ready.",
      buttonText: "Start Game",
      buttonDisabled: false
    },
    [gameStates.WAITING]: {
      status: "Wait...",
      message: "Wait for green. Do not click yet.",
      buttonText: "Waiting...",
      buttonDisabled: true
    },
    [gameStates.ACTIVE]: {
      status: "Click now!",
      message: "Click, tap, or press Space immediately.",
      buttonText: "React!",
      buttonDisabled: true
    },
    [gameStates.RESULT]: {
      status: `${reactionTime}ms`,
      message: getResultMessage(reactionTime),
      buttonText: "Play Again",
      buttonDisabled: false
    },
    [gameStates.TOO_SOON]: {
      status: "Too soon!",
      message: "You clicked before the signal. Wait for green next time.",
      buttonText: "Try Again",
      buttonDisabled: false
    }
  };

  const content = stateContent[nextState];

  gameStatus.textContent = content.status;
  gameMessage.textContent = content.message;
  liveStatus.textContent = `${content.status}. ${content.message}`;
  startButton.textContent = content.buttonText;
  startButton.disabled = content.buttonDisabled;
}

function getResultMessage(time) {
  if (time <= 180) return "Lightning fast. Elite reaction speed.";
  if (time <= 250) return "Sharp reaction. Very strong result.";
  if (time <= 350) return "Solid reaction. Keep pushing for faster timing.";
  return "Good attempt. Stay relaxed and focused.";
}

function getRatingData(time) {
  if (time === null || time === undefined) {
    return {
      label: "No attempts yet",
      color: "#22c55e"
    };
  }

  if (time <= 180) {
    return {
      label: "Lightning Fast",
      color: "#22c55e"
    };
  }

  if (time <= 250) {
    return {
      label: "Sharp",
      color: "#38bdf8"
    };
  }

  if (time <= 350) {
    return {
      label: "Average",
      color: "#f59e0b"
    };
  }

  return {
    label: "Needs Focus",
    color: "#ef4444"
  };
}

function formatTime(time) {
  return time === null ? "--" : `${time}ms`;
}

function getAverageTime() {
  if (stats.validAttempts === 0) return null;
  return Math.round(stats.totalTime / stats.validAttempts);
}

function updateStatsUI() {
  bestTimeElement.textContent = formatTime(stats.bestTime);
  averageTimeElement.textContent = formatTime(getAverageTime());
  attemptCountElement.textContent = stats.validAttempts;
  latestTimeElement.textContent = formatTime(stats.latestTime);

  const ratingData = getRatingData(stats.latestTime);
  ratingElement.textContent = ratingData.label;
  ratingElement.style.color = ratingData.color;

  updateReactionGuide(stats.latestTime);
}

function updateReactionGuide(time) {
  const guideCards = [guideLightning, guideSharp, guideAverage, guideFocus];
  guideCards.forEach((card) => card.classList.remove("active"));

  if (time === null || time === undefined) {
    currentCategory.textContent = "No attempts yet";
    currentCategory.style.color = "var(--accent)";
    currentCategory.style.borderColor = "rgba(34, 197, 94, 0.28)";
    currentCategory.style.background = "rgba(34, 197, 94, 0.08)";
    return;
  }

  const ratingData = getRatingData(time);
  let activeCard = guideFocus;

  if (time <= 180) activeCard = guideLightning;
  else if (time <= 250) activeCard = guideSharp;
  else if (time <= 350) activeCard = guideAverage;

  activeCard.classList.add("active");
  currentCategory.textContent = `${ratingData.label} • ${time}ms`;
  currentCategory.style.color = ratingData.color;
  currentCategory.style.borderColor = `${ratingData.color}66`;
  currentCategory.style.background = `${ratingData.color}14`;
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.textContent = soundEnabled ? "Sound On" : "Sound Off";

  if (soundEnabled) {
    prepareAudioContext();
    playTone(520, 0.06);
  }
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  musicToggle.setAttribute("aria-pressed", String(musicEnabled));
  musicToggle.textContent = musicEnabled ? "Music On" : "Music Off";

  if (musicEnabled) {
    prepareAudioContext();

    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().then(startBackgroundMusic);
    } else {
      startBackgroundMusic();
    }
  } else {
    stopBackgroundMusic();
  }
}

function prepareAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  if (!musicMasterGain) {
    musicMasterGain = audioContext.createGain();
    musicMasterGain.gain.value = 0.36;
    musicMasterGain.connect(audioContext.destination);
  }
}

function startBackgroundMusic() {
  if (!musicEnabled || !audioContext || musicIntervalId) return;

  musicStep = 0;
  musicIntervalId = window.setInterval(playMusicStep, 260);
  playMusicStep();
}

function stopBackgroundMusic() {
  if (musicIntervalId) {
    clearInterval(musicIntervalId);
    musicIntervalId = null;
  }
}

function playMusicStep() {
  if (!musicEnabled || !audioContext || !musicMasterGain) return;

  const melody = [246.94, 293.66, 329.63, 392, 329.63, 293.66, 261.63, 329.63];
  const bass = [123.47, 123.47, 146.83, 146.83, 164.81, 164.81, 130.81, 130.81];
  const step = musicStep % melody.length;
  const isAccentStep = step === 0 || step === 4;

  playTone(melody[step], 0.24, "triangle", isAccentStep ? 0.14 : 0.1, musicMasterGain, "music");

  if (isAccentStep) {
    playTone(bass[step], 0.5, "sine", 0.11, musicMasterGain, "music");
  }

  musicStep += 1;
}

function playTone(frequency, duration, type = "sine", volume = 0.08, destination = null, category = "sfx") {
  const isMusicTone = category === "music";

  if (!audioContext) return;
  if (isMusicTone && !musicEnabled) return;
  if (!isMusicTone && !soundEnabled) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const output = destination || audioContext.destination;
  const startTime = audioContext.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(output);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

function showInstructions() {
  instructionsPanel.classList.remove("hidden");
  showInstructionsButton.classList.remove("visible");
}

function hideInstructions() {
  instructionsPanel.classList.add("hidden");
  showInstructionsButton.classList.add("visible");
}

startButton.addEventListener("click", () => {
  prepareAudioContext();
  startRound();
});

resetButton.addEventListener("click", resetStats);
soundToggle.addEventListener("click", toggleSound);
musicToggle.addEventListener("click", toggleMusic);
gameArea.addEventListener("click", handlePlayerAction);
showInstructionsButton.addEventListener("click", showInstructions);
hideInstructionsButton.addEventListener("click", hideInstructions);

window.addEventListener("keydown", (event) => {
  const validKeys = [" ", "Enter"];
  const interactiveElements = ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"];

  if (!validKeys.includes(event.key) || event.repeat) return;

  if (interactiveElements.includes(document.activeElement.tagName)) {
    return;
  }

  event.preventDefault();

  if (
    currentState === gameStates.IDLE ||
    currentState === gameStates.RESULT ||
    currentState === gameStates.TOO_SOON
  ) {
    prepareAudioContext();
    startRound();
  } else {
    handlePlayerAction();
  }
});

async function initThreeScene() {
  const canvas = document.querySelector("#three-canvas");

  try {
    THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
  } catch (error) {
    console.warn("Three.js could not load. The game still works without the background visuals.", error);
    canvas.style.display = "none";
    return;
  }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 7;

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  visualGroup = new THREE.Group();
  scene.add(visualGroup);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  pointLight = new THREE.PointLight(0x22c55e, 2.2, 18);
  pointLight.position.set(3, 4, 5);
  scene.add(pointLight);

  const centralGeometry = new THREE.TorusKnotGeometry(1.15, 0.28, 120, 16);
  const centralMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0f172a,
    metalness: 0.45,
    roughness: 0.24,
    wireframe: true
  });

  centralShape = new THREE.Mesh(centralGeometry, centralMaterial);
  visualGroup.add(centralShape);

  floatingShapes = createFloatingShapes();
  floatingShapes.forEach((shape) => scene.add(shape));

  visualPresets = {
    [gameStates.IDLE]: {
      color: 0x38bdf8,
      emissive: 0x0f172a,
      light: 0x38bdf8,
      speed: 0.004,
      scale: 1
    },
    [gameStates.WAITING]: {
      color: 0xf59e0b,
      emissive: 0x3b2605,
      light: 0xf59e0b,
      speed: 0.008,
      scale: 1.08
    },
    [gameStates.ACTIVE]: {
      color: 0x22c55e,
      emissive: 0x063b1b,
      light: 0x22c55e,
      speed: 0.016,
      scale: 1.18
    },
    [gameStates.RESULT]: {
      color: 0x38bdf8,
      emissive: 0x082f49,
      light: 0x38bdf8,
      speed: 0.006,
      scale: 1.04
    },
    [gameStates.TOO_SOON]: {
      color: 0xef4444,
      emissive: 0x3b0808,
      light: 0xef4444,
      speed: 0.02,
      scale: 1.14
    }
  };

  activeVisualPreset = visualPresets[gameStates.IDLE];
  threeSceneReady = true;
  updateThreeVisualState(currentState);

  window.addEventListener("resize", resizeThreeScene);
  animateThreeScene();
}

function createFloatingShapes() {
  const shapes = [];
  const geometries = [
    new THREE.BoxGeometry(0.38, 0.38, 0.38),
    new THREE.OctahedronGeometry(0.34),
    new THREE.TorusGeometry(0.26, 0.08, 10, 24),
    new THREE.IcosahedronGeometry(0.32)
  ];

  for (let index = 0; index < 26; index += 1) {
    const material = new THREE.MeshStandardMaterial({
      color: index % 2 === 0 ? 0x334155 : 0x1f2937,
      emissive: 0x020617,
      metalness: 0.35,
      roughness: 0.45,
      wireframe: true
    });

    const mesh = new THREE.Mesh(geometries[index % geometries.length], material);

    mesh.position.set(
      THREE.MathUtils.randFloatSpread(11),
      THREE.MathUtils.randFloatSpread(7),
      THREE.MathUtils.randFloat(-4, 2)
    );

    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    mesh.userData = {
      rotationSpeed: THREE.MathUtils.randFloat(0.002, 0.008),
      floatSpeed: THREE.MathUtils.randFloat(0.001, 0.004),
      startY: mesh.position.y,
      phase: Math.random() * Math.PI * 2
    };

    shapes.push(mesh);
  }

  return shapes;
}

function updateThreeVisualState(state) {
  if (!threeSceneReady) return;

  activeVisualPreset = visualPresets[state];
  centralShape.material.color.setHex(activeVisualPreset.color);
  centralShape.material.emissive.setHex(activeVisualPreset.emissive);
  pointLight.color.setHex(activeVisualPreset.light);

  if (state === gameStates.TOO_SOON) {
    shakeUntil = performance.now() + 450;
  }
}

function animateThreeScene() {
  requestAnimationFrame(animateThreeScene);

  if (!renderer || !scene || !camera || !centralShape || !activeVisualPreset) return;

  const now = performance.now();
  const elapsed = now * 0.001;

  if (!prefersReducedMotion) {
    centralShape.rotation.x += activeVisualPreset.speed * 0.7;
    centralShape.rotation.y += activeVisualPreset.speed;
  }

  const pulseAmount = prefersReducedMotion ? 0 : currentState === gameStates.ACTIVE ? 0.055 : 0.025;
  const pulseScale = activeVisualPreset.scale + Math.sin(elapsed * 3.2) * pulseAmount;
  centralShape.scale.setScalar(pulseScale);

  if (now < shakeUntil) {
    visualGroup.position.x = Math.sin(now * 0.09) * 0.08;
  } else {
    visualGroup.position.x = 0;
  }

  floatingShapes.forEach((shape) => {
    if (!prefersReducedMotion) {
      shape.rotation.x += shape.userData.rotationSpeed;
      shape.rotation.y += shape.userData.rotationSpeed * 0.75;
      shape.position.y = shape.userData.startY + Math.sin(elapsed + shape.userData.phase) * shape.userData.floatSpeed * 90;
    }
  });

  renderer.render(scene, camera);
}

function resizeThreeScene() {
  if (!camera || !renderer) return;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

updateStatsUI();
setGameState(gameStates.IDLE);
initThreeScene();