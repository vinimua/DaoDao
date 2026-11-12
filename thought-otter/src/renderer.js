import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

const container = document.getElementById("otter-container");
const stage = document.getElementById("jacob-stage");
const TEXTURE_SATURATION = 1.0;
const OUTLINE_COLOR = 0x22150d;
const OUTLINE_OPACITY = 0.92;

let currentState = "idle";
let modelRoot = null;
let modelShell = null;
let mixer = null;
let mixerAction = null;
let animationPaused = false;
let animationElapsed = 0;
let loadFailed = false;
let lastFrameTime = performance.now();
let shellBaseY = 0; // base Y offset for modelShell (set after framing)
let userYaw = 0;
let userPitch = 0;
let isUserRotating = false;

const JACOB_ASSET_ROOT = "../assets/Jacob/";
const JACOB_TEXTURE_ROOT = "../assets/Jacob/textures/";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
camera.position.set(0, 1.0, 5.5);
camera.lookAt(0, 0.8, 0);

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1;
stage.appendChild(renderer.domElement);

// Neutral lighting only. Colored side lights make Jacob's left and right
// sides look like different materials.
const ambientLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.6);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 0.45);
keyLight.position.set(0, 5, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
fillLight.position.set(0, 3, -5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.25);
rimLight.position.set(0, 2, -3);
scene.add(rimLight);


function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildAdjustedTexture(image, saturation = TEXTURE_SATURATION) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = r * 0.299 + g * 0.587 + b * 0.114;
    data[i] = Math.round(luma + (r - luma) * saturation);
    data[i + 1] = Math.round(luma + (g - luma) * saturation);
    data[i + 2] = Math.round(luma + (b - luma) * saturation);
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function createOutlineMaterial(name = "Outline") {
  const material = new THREE.MeshBasicMaterial({
    color: OUTLINE_COLOR,
    transparent: true,
    opacity: OUTLINE_OPACITY,
    side: THREE.BackSide,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  material.name = name;
  return material;
}

function resolveStateTraits(state) {
  const traits = {
    scale: 1,
    yaw: 0,
    bob: 0.035,
    bobSpeed: 2.8,
    roll: 0,
    glow: 0,
  };

  if (state === "hover") {
    traits.scale = 1.05;
    traits.yaw = 0.14;
  } else if (state === "input_open") {
    traits.scale = 1.05;
    traits.yaw = -0.18;
    traits.glow = 0.15;
  } else if (state === "receiving") {
    traits.scale = 1.1;
    traits.bob = 0.075;
    traits.bobSpeed = 5.5;
    traits.glow = 0.4;
  } else if (state === "storing") {
    traits.scale = 0.93;
    traits.bob = 0.02;
    traits.yaw = 0.2;
  } else if (state === "reviewing") {
    traits.roll = 0.08;
    traits.bobSpeed = 4.2;
  } else if (state === "quiet") {
    traits.scale = 0.82;
    traits.bob = 0.012;
  } else if (state === "error_hint") {
    traits.roll = 0.16;
    traits.bobSpeed = 7;
    traits.glow = 0.35;
  } else if (state === "hidden") {
    traits.scale = 0.4;
    traits.bob = 0;
  }

  return traits;
}

function resizeRenderer() {
  const width = Math.max(1, stage.clientWidth);
  const height = Math.max(1, stage.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function frameModel(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Use model HEIGHT (y) for scaling, not the largest dimension.
  const targetHeight = 1.8;
  const scale = size.y > 0 ? targetHeight / size.y : 1;

  // Apply scale to the model geometry, NOT to its position.
  // (Three.js applies scale→rotation→translation, so a position
  //  offset of 100+ units would NOT be scaled and would push the
  //  model way outside the camera frustum.)
  object.scale.setScalar(scale);

  // Compute the offset in SCALED space for modelShell to apply.
  // Move the model so its geometric center sits at world origin,
  // then lift it so it sits nicely in frame.
  const offsetY = -center.y * scale + targetHeight * 0.45;

  console.log("[renderer] Jacob model framed", JSON.stringify({
    originalSize: { x: Number(size.x.toFixed(1)), y: Number(size.y.toFixed(1)), z: Number(size.z.toFixed(1)) },
    scale: Number(scale.toFixed(4)),
    offsetY: Number(offsetY.toFixed(3)),
  }));

  return { scale, offsetY };
}

function loadJacobModel() {
  const loader = new FBXLoader();
  loader.setPath(JACOB_ASSET_ROOT);
  loader.setResourcePath(JACOB_TEXTURE_ROOT);

  loader.load(
    "Jacob.fbx",
    (object) => {
      modelRoot = object;
      modelShell = new THREE.Group();
      modelShell.add(modelRoot);
      scene.add(modelShell);

      const framing = frameModel(modelRoot);
      shellBaseY = framing.offsetY;
      modelShell.position.set(0, shellBaseY, 0);

      // ── Per-material-type differentiation ──
      const texLoader = new THREE.TextureLoader();
      texLoader.setPath(JACOB_TEXTURE_ROOT);
      function resolveTextureFile(materialName, meshName) {
        const key = `${materialName || ""} ${meshName || ""}`.toLowerCase();
        const bodyHints = [
          "jacob_body",
          "jacobbody",
          "body",
          "fur",
          "torso",
          "chest",
          "shoulder",
          "upperarm",
          "upper_arm",
          "arm_l",
          "arm_r",
          "arm.l",
          "arm.r",
          "leftarm",
          "rightarm",
          "head",
          "ear",
          "tail",
          "leg",
        ];
        if (bodyHints.some((hint) => key.includes(hint))) return "T_JacobColor.png";
        if (key.includes("scene")) return "Scene.png";
        if (key.includes("props") || key.includes("atlas")) return "T_PropsAtlas.png";
        if (key.includes("jacob")) return "T_JacobColor.png";
        return null;
      }

      // 4-step grayscale gradient for toon shading
      const gradCanvas = document.createElement("canvas");
      gradCanvas.width = 4; gradCanvas.height = 1;
      const gctx = gradCanvas.getContext("2d");
      gctx.fillStyle = "rgb(70,70,70)";   gctx.fillRect(0, 0, 1, 1);
      gctx.fillStyle = "rgb(130,130,130)"; gctx.fillRect(1, 0, 1, 1);
      gctx.fillStyle = "rgb(200,200,200)"; gctx.fillRect(2, 0, 1, 1);
      gctx.fillStyle = "rgb(255,255,255)"; gctx.fillRect(3, 0, 1, 1);
      const gradientMap = new THREE.CanvasTexture(gradCanvas);
      gradientMap.minFilter = THREE.NearestFilter;
      gradientMap.magFilter = THREE.NearestFilter;

      // Diagnostic: log all mesh names & material assignments
      const meshNames = new Set();
      const matDebug = [];
      object.traverse((c) => {
        if (!c.isMesh) return;
        const mats = Array.isArray(c.material) ? c.material : [c.material];
        meshNames.add(c.name || "(unnamed)");
        matDebug.push(`${c.name || "?"}: [${mats.map(m => m ? m.name : "null").join(",")}] geo=${c.geometry ? c.geometry.index ? c.geometry.index.count/3 : c.geometry.attributes.position.count/3 : "?"} tris`);
      });
      console.log(`[renderer] mesh names: ${[...meshNames].join(", ")}`);
      matDebug.forEach(m => console.log(`[renderer]   ${m}`));

      let outlineCount = 0;
      let stats = { toon: 0, sword: 0, leather: 0 };
      const untexturedMaterials = new Set();

      object.traverse((child) => {
        if (!child.isMesh) return;

        // Hide outline hull and environment meshes (keep character only)
        const name = (child.name || "").toLowerCase();
        if (name === "jacoboutline" || name === "rocks" || name === "ground" || name === "grass") {
          child.visible = false;
          outlineCount++;
          return;
        }

        const materials = Array.isArray(child.material) ? child.material : [child.material];

        for (let i = 0; i < materials.length; i++) {
          const oldMat = materials[i];
          if (!oldMat) continue;

          if (oldMat.name === "Outline") {
            oldMat.transparent = true;
            oldMat.opacity = 0;
            oldMat.depthWrite = false;
            oldMat.needsUpdate = true;
            outlineCount++;
            continue;
          }

          // Detect material type from mesh name + material name
          const matKey = ((oldMat.name || "") + " " + (child.name || "")).toLowerCase();
          const isPauldron = matKey.includes("pauldron");
          const texFile = resolveTextureFile(oldMat.name, child.name);
          let newMat;

          if (matKey.includes("sword") || matKey.includes("blade") || matKey.includes("metal") || matKey.includes("claymore")) {
            // Sword blade — reflective metal
            const m = new THREE.MeshStandardMaterial();
            m.name = oldMat.name;
            m.color.set(0xc8c8c8);
            m.roughness = 0.35;
            m.metalness = 0.8;
            newMat = m;
            stats.sword++;
          } else if (isPauldron) {
            const m = new THREE.MeshStandardMaterial();
            m.name = oldMat.name;
            m.color.set(0x8f9297);
            m.roughness = 0.52;
            m.metalness = 0.18;
            newMat = m;
            stats.leather++;
          } else if (matKey.includes("belt") || matKey.includes("glove") ||
                     matKey.includes("boot") || matKey.includes("leather") ||
                     matKey.includes("armor")) {
            // Leather & armor — slight sheen
            const m = new THREE.MeshStandardMaterial();
            m.name = oldMat.name;
            m.color.set(0xffffff);
            m.roughness = 0.6;
            m.metalness = 0;
            newMat = m;
            stats.leather++;
          } else if (matKey.includes("jacob_body")) {
            // Body/face/fur — matte
            const m = new THREE.MeshStandardMaterial();
            m.name = oldMat.name;
            m.color.set(0xffffff);
            m.roughness = 0.88;
            m.metalness = 0;
            newMat = m;
            stats.toon++;
          } else if (matKey.includes("jacob_propsatlas")) {
            // Cloth/clothing from props atlas — rougher fabric
            const m = new THREE.MeshStandardMaterial();
            m.name = oldMat.name;
            m.color.set(0xffffff);
            m.roughness = 0.92;
            m.metalness = 0;
            newMat = m;
            stats.toon++;
          } else {
            // Scene/other — matte
            const m = new THREE.MeshStandardMaterial();
            m.name = oldMat.name;
            m.color.set(0xffffff);
            m.roughness = 0.9;
            m.metalness = 0;
            newMat = m;
            stats.toon++;
          }

          newMat.transparent = false;
          newMat.opacity = 1;
          newMat.depthTest = true;
          newMat.depthWrite = true;
          // Use DoubleSide because the original FBX has several
          // thin/single-sided painted surfaces; preserving FBX side
          // flags can make one half of the body disappear.
          newMat.side = THREE.DoubleSide;

          if (!isPauldron && texFile) {
            const tex = texLoader.load(texFile, (loadedTexture) => {
              loadedTexture.colorSpace = THREE.SRGBColorSpace;
              loadedTexture.flipY = true;
              loadedTexture.wrapS = THREE.RepeatWrapping;
              loadedTexture.wrapT = THREE.RepeatWrapping;
              loadedTexture.needsUpdate = true;
              newMat.map = loadedTexture;
              newMat.needsUpdate = true;
            });
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.flipY = true;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            newMat.map = tex;
          } else if (!isPauldron && oldMat.map) {
            oldMat.map.colorSpace = THREE.SRGBColorSpace;
            oldMat.map.wrapS = THREE.RepeatWrapping;
            oldMat.map.wrapT = THREE.RepeatWrapping;
            if (oldMat.map.image) oldMat.map.needsUpdate = true;
            newMat.map = oldMat.map;
          } else if (!isPauldron) {
            untexturedMaterials.add(`${child.name || "?"}:${oldMat.name || "?"}`);
          }

          newMat.needsUpdate = true;

          if (Array.isArray(child.material)) {
            child.material[i] = newMat;
          } else {
            child.material = newMat;
          }
          oldMat.dispose();
        }
      });
      console.log(`[renderer] ${outlineCount} outline hidden, toon=${stats.toon} sword=${stats.sword} leather=${stats.leather}`);
      if (untexturedMaterials.size > 0) {
        console.log(`[renderer] untextured materials: ${[...untexturedMaterials].join("; ")}`);
      }

      console.log(`[renderer] model loaded: ${object.children.length} children, ${object.animations?.length || 0} animations`);

      if (object.animations && object.animations.length > 0) {
        mixer = new THREE.AnimationMixer(object);
        mixerAction = mixer.clipAction(object.animations[0]);
        mixerAction.play();
      }

      loadFailed = false;
      resizeRenderer();
    },
    undefined,
    (error) => {
      console.error("[renderer] failed to load Jacob FBX:", error);
      loadFailed = true;
    },
  );
}

function applyState(state) {
  currentState = state || "idle";
  container.dataset.state = currentState;
}

let frameCount = 0;
let lastLogTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  frameCount++;

  try {
    const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;
    if (!animationPaused) animationElapsed += delta;
    const elapsed = animationElapsed;

    if (mixer) mixer.update(delta);

    if (modelShell) {
      const traits = resolveStateTraits(currentState);
      const pulse = Math.sin(elapsed * traits.bobSpeed);
      const wobble = currentState === "error_hint"
        ? Math.sin(elapsed * 24) * traits.roll
        : Math.sin(elapsed * 3) * traits.roll;
      const targetScale = traits.scale + pulse * 0.018;

      modelShell.scale.setScalar(targetScale);
      modelShell.position.y = shellBaseY + pulse * traits.bob;
      const idleYaw = isUserRotating ? 0 : Math.sin(elapsed * 0.9) * 0.08;
      modelShell.rotation.x = userPitch;
      modelShell.rotation.y = userYaw + traits.yaw + idleYaw;
      modelShell.rotation.z = wobble;

      const boost = 1 + traits.glow;
      keyLight.intensity = 0.45 * boost;
      fillLight.intensity = 0.45 * boost;
    }

    if (!loadFailed) {
      renderer.render(scene, camera);
    }

    // Log status every 3 seconds for debugging
    if (now - lastLogTime > 3000) {
      lastLogTime = now;
      console.log(`[renderer] alive frame=${frameCount} state=${currentState} hasModel=${!!modelShell} loadFailed=${loadFailed} stageSize=${stage.clientWidth}x${stage.clientHeight}`);
    }
  } catch (err) {
    console.error("[renderer] animate error:", err.message || err);
  }
}

window.addEventListener("resize", resizeRenderer);

if (window.otterAPI && typeof window.otterAPI.onOtterStateChanged === "function") {
  window.otterAPI.onOtterStateChanged((payload) => {
    if (!payload || !payload.state) return;
    applyState(payload.state);
  });
}

if (window.otterAPI && typeof window.otterAPI.onModelRotate === "function") {
  window.otterAPI.onModelRotate((payload) => {
    if (!payload || typeof payload.phase !== "string") return;

    if (payload.phase === "start") {
      isUserRotating = true;
      return;
    }

    if (payload.phase === "end") {
      isUserRotating = false;
      return;
    }

    if (payload.phase === "move") {
      userYaw += (Number(payload.deltaX) || 0) * 0.012;
      userPitch = clamp(userPitch + (Number(payload.deltaY) || 0) * 0.006, -0.55, 0.35);
    }
  });
}

if (window.otterAPI && typeof window.otterAPI.onAnimationToggle === "function") {
  window.otterAPI.onAnimationToggle(() => {
    if (!mixerAction) return;
    animationPaused = !animationPaused;
    mixerAction.paused = animationPaused;
    console.log(`[renderer] animation ${animationPaused ? "paused" : "resumed"}`);
  });
}

console.log("[renderer] Jacob 3D render window loaded");
resizeRenderer();
loadJacobModel();
requestAnimationFrame(animate);
