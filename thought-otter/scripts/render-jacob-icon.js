const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const outputPath = path.join(__dirname, "..", "assets", "Jacob", "assets", "jacob-icon.png");
app.setPath("userData", path.join(__dirname, "..", ".tmp-electron-icon"));

async function main() {
  await app.whenReady();

  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      offscreen: true,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
    },
  });

  win.webContents.on("console-message", (_event, level, message) => {
    console.log(`[render-page:${level}] ${message}`);
  });
  win.webContents.on("did-fail-load", (_event, code, description, url) => {
    console.error(`[render-page] failed to load ${url}: ${code} ${description}`);
  });
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error(`[render-page] renderer gone: ${details.reason}`);
  });

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <base href="${pathToFileURL(__dirname + path.sep).href}">
  <style>
    html, body, #stage { width: 100%; height: 100%; margin: 0; overflow: hidden; background: transparent; }
    canvas { display: block; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "three": "../node_modules/three/build/three.module.js"
      }
    }
  </script>
</head>
<body>
  <div id="stage"></div>
  <script type="module">
    import * as THREE from "../node_modules/three/build/three.module.js";
    import { FBXLoader } from "../src/vendor/three/loaders/FBXLoader.js";

    console.log("Jacob icon renderer booted");
    window.addEventListener("error", (event) => {
      console.error("window error", event.message || event.error);
      window.document.title = "error:" + (event.message || event.error);
    });
    window.addEventListener("unhandledrejection", (event) => {
      console.error("unhandled rejection", event.reason);
      window.document.title = "error:" + event.reason;
    });

    const stage = document.getElementById("stage");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 100);
    camera.position.set(0, 1.05, 6.2);
    camera.lookAt(0, 0.85, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(1024, 1024, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    stage.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 1.65));
    const key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(0, 5, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.35);
    rim.position.set(0, 3, -4);
    scene.add(rim);

    function frameModel(object) {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = size.y > 0 ? 2.45 / size.y : 1;
      object.scale.setScalar(scale);
      object.position.set(-center.x * scale, -center.y * scale + 1.2, -center.z * scale);
      object.rotation.y = -0.28;
    }

    function resolveTextureFile(materialName, meshName) {
      const key = \`\${materialName || ""} \${meshName || ""}\`.toLowerCase();
      if (key.includes("props") || key.includes("atlas")) return "T_PropsAtlas.png";
      if (key.includes("scene")) return "Scene.png";
      if (key.includes("jacob") || key.includes("body") || key.includes("fur") || key.includes("arm")) return "T_JacobColor.png";
      return null;
    }

    const texLoader = new THREE.TextureLoader();
    texLoader.setPath("../assets/Jacob/textures/");

    const loader = new FBXLoader();
    loader.setPath("../assets/Jacob/");
    loader.setResourcePath("../assets/Jacob/textures/");
    loader.load("Jacob.fbx", (object) => {
      console.log("Jacob FBX loaded");
      frameModel(object);

      object.traverse((child) => {
        if (!child.isMesh) return;
        const name = (child.name || "").toLowerCase();
        if (name === "jacoboutline" || name === "rocks" || name === "ground" || name === "grass") {
          child.visible = false;
          return;
        }
        const oldMaterials = Array.isArray(child.material) ? child.material : [child.material];
        const materials = oldMaterials.map((oldMat) => {
          const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
          material.name = oldMat && oldMat.name ? oldMat.name : "";
          const texFile = resolveTextureFile(material.name, child.name);
          if (texFile) {
            const tex = texLoader.load(texFile);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.flipY = true;
            material.map = tex;
          }
          return material;
        });
        child.material = Array.isArray(child.material) ? materials : materials[0];
      });

      scene.add(object);
      renderer.render(scene, camera);
      requestAnimationFrame(() => {
        renderer.render(scene, camera);
        window.document.title = "ready";
        console.log("Jacob icon ready");
      });
    }, (event) => {
      if (event && event.total) {
        console.log("Jacob FBX progress " + Math.round(event.loaded / event.total * 100) + "%");
      } else if (event) {
        console.log("Jacob FBX progress " + event.loaded);
      }
    }, (error) => {
      console.error("Jacob FBX failed", error);
      window.document.title = "error:" + (error && error.message ? error.message : error);
    });
  </script>
</body>
</html>`;

  const htmlPath = path.join(app.getPath("userData"), "render-jacob-icon.html");
  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, html);
  await win.loadFile(htmlPath);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out rendering Jacob icon")), 30000);
    win.on("page-title-updated", (_event, title) => {
      if (title === "ready") {
        clearTimeout(timeout);
        resolve();
      } else if (title.startsWith("error:")) {
        clearTimeout(timeout);
        reject(new Error(title));
      }
    });
  });

  const image = await win.webContents.capturePage();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, image.toPNG());
  console.log(outputPath);
  await app.quit();
}

main().catch(async (error) => {
  console.error(error.message || error);
  await app.quit();
  process.exit(1);
});
