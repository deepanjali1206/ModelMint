import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const EXAMPLES = [
  "A tiny futuristic sports car",
  "A cute little penguin",
  "An old wooden treasure chest",
  "A rocket ready for takeoff",
  "A cozy wooden chair",
];

function Viewer({ modelUrl }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x10131a);

    const camera = new THREE.PerspectiveCamera(
      45,
      Math.max(mount.clientWidth, 1) /
        Math.max(mount.clientHeight, 1),
      0.01,
      1000
    );

    camera.position.set(2.8, 2.2, 4.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
      mount.clientWidth,
      mount.clientHeight
    );

    renderer.outputColorSpace = THREE.SRGBColorSpace;

    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(
      camera,
      renderer.domElement
    );

    controls.enableDamping = true;
    controls.minDistance = 0.8;
    controls.maxDistance = 12;
    controls.target.set(0, 0.7, 0);

    const hemisphereLight = new THREE.HemisphereLight(
      0xffffff,
      0x303540,
      2.2
    );

    scene.add(hemisphereLight);

    const keyLight = new THREE.DirectionalLight(
      0xffffff,
      3.2
    );

    keyLight.position.set(4, 6, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(
      0x9fb8ff,
      1.4
    );

    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(
      10,
      20,
      0x39404d,
      0x252a33
    );

    grid.position.y = -1.05;
    scene.add(grid);

    sceneRef.current = scene;

    const resize = () => {
      const width = Math.max(
        mount.clientWidth,
        1
      );

      const height = Math.max(
        mount.clientHeight,
        1
      );

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    const observer = new ResizeObserver(resize);

    observer.observe(mount);

    let animationFrame;

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);

      observer.disconnect();
      controls.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(
          renderer.domElement
        );
      }

      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach((material) => {
            if (material.map) {
              material.map.dispose();
            }

            material.dispose();
          });
        }
      });
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;

    if (!scene || !modelUrl) {
      return;
    }

    if (modelRef.current) {
      scene.remove(modelRef.current);

      modelRef.current.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach((material) => {
            if (material.map) {
              material.map.dispose();
            }

            material.dispose();
          });
        }
      });

      modelRef.current = null;
    }

    const loader = new GLTFLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(
          model
        );

        const size = box.getSize(
          new THREE.Vector3()
        );

        const center = box.getCenter(
          new THREE.Vector3()
        );

        const largestSide = Math.max(
          size.x,
          size.y,
          size.z
        );

        const scale =
          largestSide > 0
            ? 2.2 / largestSide
            : 1;

        model.scale.setScalar(scale);

        model.position.sub(
          center.multiplyScalar(scale)
        );

        model.position.y += 0.15;

        scene.add(model);

        modelRef.current = model;
      },
      undefined,
      (error) => {
        console.error(
          "Could not load the 3D model:",
          error
        );
      }
    );
  }, [modelUrl]);

  return (
    <div className="viewer-wrap">
      {!modelUrl && (
        <div className="viewer-empty">
          <div className="cube-icon">◇</div>

          <h3>Your 3D canvas is waiting</h3>

          <p>
            Start with a simple idea and watch it
            take shape right here.
          </p>
        </div>
      )}

      <div
        ref={mountRef}
        className="viewer"
      />

      {modelUrl && (
        <div className="viewer-hint">
          <span>🖱 Drag to explore</span>
          <span>↕ Scroll to zoom</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [modelUrl, setModelUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const generate = async (event) => {
    if (event) {
      event.preventDefault();
    }

    const cleanPrompt = prompt.trim();

    if (!cleanPrompt) {
      setError(
        "Describe something you'd like to bring into 3D."
      );

      return;
    }

    setLoading(true);
    setError("");

    setStatus(
      "Your idea is taking shape. Creating the 3D model..."
    );

    setModelUrl("");
    setDownloadUrl("");

    try {
      const response = await fetch(
        API_URL + "/api/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: cleanPrompt,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Something went wrong while creating your model."
        );
      }

      const generatedUrl =
        API_URL + data.model_url;

      setModelUrl(generatedUrl);
      setDownloadUrl(generatedUrl);

      setStatus(
        "It's ready. Rotate it, zoom in and explore your creation."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "I couldn't create the model this time. Please try again."
      );

      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const useExample = (text) => {
    setPrompt(text);
    setError("");
    setStatus("");
  };

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            MM
          </div>

          <div>
            <strong>ModelMint</strong>

            <span>
              Ideas shaped in 3D
            </span>
          </div>
        </div>

      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            TEXT → AI → 3D
          </p>

          <h1>
            Give your idea
            <br />
            <span>a shape.</span>
          </h1>

          <p className="subtitle">
            Describe an object in your own words.
            ModelMint turns your description into
            a 3D model that you can rotate, inspect
            and download.
          </p>

          <form
            className="prompt-card"
            onSubmit={generate}
          >
            <label htmlFor="prompt">
              What would you like to create?
            </label>

            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) =>
                setPrompt(event.target.value)
              }
              placeholder="A small futuristic coffee machine with rounded edges..."
              rows="3"
              maxLength="500"
              disabled={loading}
            />

            <div className="prompt-footer">
              <span>
                {prompt.length}/500
              </span>

              <button
                className="generate-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Building...
                  </>
                ) : (
                  <>
                    Create my model
                    <span>↗</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="examples">
            <span>
              Try an idea
            </span>

            {EXAMPLES.map((example) => (
              <button
                type="button"
                key={example}
                onClick={() =>
                  useExample(example)
                }
                disabled={loading}
              >
                {example}
              </button>
            ))}
          </div>

          <div
            className="status-area"
            aria-live="polite"
          >
            {status && (
              <div className="status">
                {status}
              </div>
            )}

            {error && (
              <div className="error">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="viewer-card">
          <Viewer modelUrl={modelUrl} />

          <div className="viewer-toolbar">
            <div>
              <strong>
                Your 3D canvas
              </strong>

              <span>
                Drag, rotate and zoom to explore
                your creation.
              </span>
            </div>

            {downloadUrl ? (
              <a
                className="download-btn"
                href={downloadUrl}
                download="shapeforge-model.glb"
              >
                Download GLB ↓
              </a>
            ) : (
              <button
                className="download-btn disabled"
                disabled
              >
                Download GLB ↓
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="how">
        <div>
          <span className="step">
            01
          </span>

          <h3>
            Describe
          </h3>

          <p>
            Put your idea into simple words.
            You don't need to know 3D software.
          </p>
        </div>

        <div>
          <span className="step">
            02
          </span>

          <h3>
            Generate
          </h3>

          <p>
            AI interprets your description and
            creates a 3D asset from it.
          </p>
        </div>

        <div>
          <span className="step">
            03
          </span>

          <h3>
            Explore
          </h3>

          <p>
            Move around your model, see it from
            different angles and save the result.
          </p>
        </div>
      </section>

      <footer className="creative-footer">
        <div className="footer-grid"></div>

        <div className="footer-orb footer-orb-one"></div>
        <div className="footer-orb footer-orb-two"></div>

        <div className="footer-top">
          <div className="footer-brand-block">
            <div className="footer-logo">
              MM
            </div>

            <div>
              <h3>ModelMint</h3>
              <p>
                From a thought to a 3D form.
              </p>
            </div>
          </div>

          <div className="footer-heading">
            <span>
              THE IDEA IS YOURS.
            </span>

            <h2>
              We just give it
              <br />
              <em>a shape.</em>
            </h2>
          </div>

          <div className="footer-note">
            <p>
              Describe something you've imagined,
              then explore it from every angle.
            </p>

            <button
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
            >
              Create something
              <span>↗</span>
            </button>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <span>
            ModelMint · AI assisted 3D creation
          </span>

          <span>
            Built with React + Three.js
          </span>

          <span>
            © 2026
          </span>
        </div>
      </footer>
    </main>
  );
}