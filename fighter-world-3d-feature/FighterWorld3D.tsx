import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FIGHTER_WORLD_NODES_3D, type FighterWorldNode3D } from "./fighterWorld3DData";

type Props = {
  initialFighterId?: string;
  onSelectFighter: (fighterId: string) => void;
  onBack?: () => void;
};

type MarkerRecord = {
  fighter: FighterWorldNode3D;
  root: THREE.Group;
  ring: THREE.Mesh;
  beacon: THREE.Mesh;
};

const EARTH_RADIUS = 2.5;

function latLonToVector3(lat: number, lon: number, radius = EARTH_RADIUS) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function createWorldTexture(renderer: THREE.WebGLRenderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  const ocean = ctx.createLinearGradient(0, 0, 0, canvas.height);
  ocean.addColorStop(0, "#12324b");
  ocean.addColorStop(0.52, "#082238");
  ocean.addColorStop(1, "#061622");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stylized continent silhouettes, intentionally painterly rather than geographic GIS.
  const continents: [string, [number, number][]][] = [
    ["#5a6542", [[110,215],[180,145],[310,120],[415,165],[470,235],[420,330],[345,375],[280,330],[240,390],[175,345],[135,280]]],
    ["#6d7042", [[320,390],[385,410],[420,485],[405,610],[350,760],[300,700],[270,590],[285,495]]],
    ["#74734a", [[915,170],[1030,130],[1155,165],[1260,155],[1380,205],[1460,260],[1430,335],[1310,340],[1220,300],[1130,335],[1065,305],[1000,270]]],
    ["#626b3f", [[1005,345],[1090,340],[1165,395],[1190,510],[1150,655],[1080,725],[1010,665],[965,560],[960,445]]],
    ["#757047", [[1390,255],[1515,215],[1640,245],[1760,325],[1775,405],[1690,455],[1615,425],[1550,475],[1485,430],[1435,355]]],
    ["#6d6841", [[1660,650],[1750,620],[1825,675],[1790,740],[1715,755],[1655,720]]],
    ["#8a8253", [[920,110],[970,75],[1020,95],[1000,130],[950,145]]],
  ];

  for (const [color, points] of continents) {
    ctx.beginPath();
    points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "rgba(205,190,125,.22)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Terrain noise and old-map scratches.
  const rand = (seed: number) => {
    let x = Math.sin(seed * 999) * 43758.5453;
    return x - Math.floor(x);
  };
  for (let i = 0; i < 900; i++) {
    const x = rand(i * 3 + 1) * canvas.width;
    const y = rand(i * 3 + 2) * canvas.height;
    const r = 1 + rand(i * 3 + 3) * 4;
    ctx.fillStyle = `rgba(255,230,170,${0.015 + rand(i) * 0.035})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Latitude/longitude lines.
  ctx.strokeStyle = "rgba(225,205,150,.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += canvas.width / 24) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += canvas.height / 12) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function makeLabelSprite(text: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 96;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.font = "700 34px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = Math.min(475, ctx.measureText(text).width + 48);
  ctx.fillStyle = "rgba(4,6,10,.82)";
  ctx.roundRect((512-width)/2, 12, width, 66, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(242,185,76,.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#f7e6c0";
  ctx.fillText(text, 256, 47);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.85, .35, 1);
  return sprite;
}

function createPedestal() {
  const g = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x2c2119, roughness: .55, metalness: .45 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x9a6a2a, roughness: .42, metalness: .72 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.6, .38, 96), baseMat);
  base.position.y = -3.02;
  g.add(base);
  const trim1 = new THREE.Mesh(new THREE.TorusGeometry(3.22, .08, 12, 96), trimMat);
  trim1.rotation.x = Math.PI / 2;
  trim1.position.y = -2.82;
  g.add(trim1);
  const trim2 = trim1.clone();
  trim2.scale.set(1.06,1.06,1.06);
  trim2.position.y = -3.16;
  g.add(trim2);
  return g;
}

export function FighterWorld3D({ initialFighterId = "roman", onSelectFighter, onBack }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const selectRef = useRef(onSelectFighter);
  const backRef = useRef(onBack);
  const [selectedId, setSelectedId] = useState(initialFighterId);
  const selected = useMemo(
    () => FIGHTER_WORLD_NODES_3D.find(f => f.id === selectedId) ?? FIGHTER_WORLD_NODES_3D[0],
    [selectedId],
  );

  useEffect(() => { selectRef.current = onSelectFighter; }, [onSelectFighter]);
  useEffect(() => { backRef.current = onBack; }, [onBack]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x03050a, 0.055);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, .25, 9.7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x9cc8ff, 0x120a05, 1.5));
    const key = new THREE.DirectionalLight(0xffddb0, 4.0);
    key.position.set(-5, 6, 7);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x4d80ff, 2.2);
    rim.position.set(6, 2, -5);
    scene.add(rim);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(2200 * 3);
    for (let i=0; i<2200; i++) {
      const r = 18 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2*Math.random()-1);
      positions[i*3] = r*Math.sin(phi)*Math.cos(theta);
      positions[i*3+1] = r*Math.cos(phi);
      positions[i*3+2] = r*Math.sin(phi)*Math.sin(theta);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xaebed1, size: .035, transparent:true, opacity:.7 }));
    scene.add(stars);

    const globeRoot = new THREE.Group();
    scene.add(globeRoot);

    const worldTexture = createWorldTexture(renderer);
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: worldTexture,
      roughness: .68,
      metalness: .04,
      bumpScale: .02,
    });

    // Prefer the bundled offline Earth texture. If it cannot load for any reason,
    // the procedural canvas texture above remains in place, so the menu never fails.
    const textureUrl = new URL("./earth-map.png", import.meta.url).href;
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      textureUrl,
      (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        earthMaterial.map = loaded;
        earthMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        // Keep the procedural texture already assigned to the material.
      },
    );

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS, 112, 72),
      earthMaterial,
    );
    globeRoot.add(earth);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS * 1.025, 64, 48),
      new THREE.MeshBasicMaterial({
        color: 0x4da4ff,
        transparent: true,
        opacity: .075,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      }),
    );
    globeRoot.add(atmosphere);

    scene.add(createPedestal());

    const markerGroup = new THREE.Group();
    globeRoot.add(markerGroup);
    const markerRecords: MarkerRecord[] = [];

    FIGHTER_WORLD_NODES_3D.forEach((fighter) => {
      const p = latLonToVector3(fighter.lat, fighter.lon, EARTH_RADIUS + .07);
      const normal = p.clone().normalize();
      const root = new THREE.Group();
      root.position.copy(p);
      root.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), normal);

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(.015, .025, .22, 8),
        new THREE.MeshStandardMaterial({ color: 0xb78a47, metalness: .7, roughness:.32 }),
      );
      stem.position.y = .1;
      root.add(stem);

      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(.07, 18, 14),
        new THREE.MeshBasicMaterial({ color: 0xffc24d }),
      );
      beacon.position.y = .24;
      root.add(beacon);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(.13, .022, 10, 28),
        new THREE.MeshBasicMaterial({ color: 0xff8a2a }),
      );
      ring.rotation.x = Math.PI/2;
      ring.position.y = .015;
      root.add(ring);

      const label = makeLabelSprite(fighter.name);
      label.position.copy(p.clone().add(normal.clone().multiplyScalar(.34)));
      label.scale.multiplyScalar(.7);
      globeRoot.add(label);

      markerGroup.add(root);
      markerRecords.push({ fighter, root, ring, beacon });
    });

    let selectedIndex = Math.max(0, FIGHTER_WORLD_NODES_3D.findIndex(f => f.id === initialFighterId));
    let targetQuat = globeRoot.quaternion.clone();
    let userDragging = false;
    let lastX = 0, lastY = 0;
    let dragYaw = 0, dragPitch = 0;
    const clock = new THREE.Clock();

    function focusFighter(index: number) {
      selectedIndex = (index + FIGHTER_WORLD_NODES_3D.length) % FIGHTER_WORLD_NODES_3D.length;
      const fighter = FIGHTER_WORLD_NODES_3D[selectedIndex];
      setSelectedId(fighter.id);

      // Rotate selected lat/lon point toward camera (+Z).
      const p = latLonToVector3(fighter.lat, fighter.lon, 1).normalize();
      const target = new THREE.Vector3(0, .03, 1).normalize();
      targetQuat = new THREE.Quaternion().setFromUnitVectors(p, target);
      dragYaw = 0;
      dragPitch = 0;
    }

    focusFighter(selectedIndex);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function onClick(ev: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(markerRecords.map(m => m.beacon), false);
      if (!hits.length) return;
      const hit = hits[0].object;
      const idx = markerRecords.findIndex(m => m.beacon === hit);
      if (idx >= 0) focusFighter(idx);
    }

    function onPointerDown(ev: PointerEvent) {
      userDragging = true; lastX = ev.clientX; lastY = ev.clientY;
      renderer.domElement.setPointerCapture(ev.pointerId);
    }
    function onPointerMove(ev: PointerEvent) {
      if (!userDragging) return;
      dragYaw += (ev.clientX-lastX)*.004;
      dragPitch += (ev.clientY-lastY)*.003;
      dragPitch = THREE.MathUtils.clamp(dragPitch, -.55, .55);
      lastX = ev.clientX; lastY = ev.clientY;
    }
    function onPointerUp() { userDragging = false; }

    function moveSelection(delta: number) { focusFighter(selectedIndex + delta); }
    function onKeyDown(ev: KeyboardEvent) {
      if (["ArrowRight","ArrowDown","d","D","s","S"].includes(ev.key)) { ev.preventDefault(); moveSelection(1); }
      if (["ArrowLeft","ArrowUp","a","A","w","W"].includes(ev.key)) { ev.preventDefault(); moveSelection(-1); }
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); selectRef.current(FIGHTER_WORLD_NODES_3D[selectedIndex].id); }
      if (ev.key === "Escape" || ev.key === "Backspace") { backRef.current?.(); }
    }

    let previousButtons: boolean[] = [];
    let navCooldown = 0;
    function pollGamepad(dt: number) {
      navCooldown = Math.max(0, navCooldown-dt);
      const gp = navigator.getGamepads?.()[0];
      if (!gp) return;
      const pressed = gp.buttons.map(b => b.pressed);
      const left = gp.buttons[14]?.pressed || gp.axes[0] < -.55;
      const right = gp.buttons[15]?.pressed || gp.axes[0] > .55;
      const up = gp.buttons[12]?.pressed || gp.axes[1] < -.55;
      const down = gp.buttons[13]?.pressed || gp.axes[1] > .55;
      if (navCooldown <= 0 && (right || down)) { moveSelection(1); navCooldown = .18; }
      if (navCooldown <= 0 && (left || up)) { moveSelection(-1); navCooldown = .18; }
      if (pressed[0] && !previousButtons[0]) selectRef.current(FIGHTER_WORLD_NODES_3D[selectedIndex].id);
      if (pressed[1] && !previousButtons[1]) backRef.current?.();
      previousButtons = pressed;
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);

    function resize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let raf = 0;
    function animate() {
      const dt = Math.min(.05, clock.getDelta());
      pollGamepad(dt);
      stars.rotation.y += dt * .006;

      const dragQ = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(dragPitch, dragYaw, 0, "YXZ"));
      const desired = targetQuat.clone().multiply(dragQ);
      globeRoot.quaternion.slerp(desired, 1 - Math.pow(.0008, dt));

      const t = performance.now() * .001;
      markerRecords.forEach((m, i) => {
        const active = i === selectedIndex;
        const pulse = 1 + Math.sin(t*4 + i*.65) * (active ? .18 : .05);
        m.ring.scale.setScalar(active ? 1.45*pulse : pulse);
        (m.ring.material as THREE.MeshBasicMaterial).color.setHex(active ? 0xff3b20 : 0xc78332);
        (m.beacon.material as THREE.MeshBasicMaterial).color.setHex(active ? 0xffd36a : 0xd89a42);
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.dispose();
      worldTexture.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat?.dispose?.();
      });
    };
  }, [initialFighterId]);

  return (
    <div className="relative h-full min-h-[640px] overflow-hidden bg-[#04050a] text-white">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,.58)_100%)]" />

      <header className="pointer-events-none absolute left-5 top-5 z-10 sm:left-8 sm:top-7">
        <div className="text-xs font-bold uppercase tracking-[.42em] text-amber-300/75">Plank Fighter</div>
        <h1 className="mt-1 text-3xl font-black uppercase italic tracking-tight sm:text-5xl">Fighter World</h1>
        <div className="mt-2 h-[2px] w-40 bg-gradient-to-r from-amber-400 to-transparent" />
      </header>

      <aside className="absolute bottom-20 left-4 z-20 w-[min(360px,calc(100%-2rem))] rounded-xl border border-amber-300/25 bg-black/75 p-4 shadow-2xl backdrop-blur-md sm:bottom-8 sm:left-8">
        <div className="text-[10px] font-bold uppercase tracking-[.28em] text-amber-300/70">{selected.region}</div>
        <div className="mt-1 text-2xl font-black uppercase italic">{selected.name}</div>
        <div className="text-sm font-semibold text-amber-200">{selected.title}</div>
        <div className="mt-4 grid grid-cols-[72px_1fr] gap-y-1 text-xs">
          <span className="uppercase tracking-widest text-white/40">Location</span><span className="text-white/80">{selected.location}</span>
          <span className="uppercase tracking-widest text-white/40">Era</span><span className="text-white/80">{selected.era}</span>
        </div>

        <button
          type="button"
          onClick={() => onSelectFighter(selected.id)}
          className="mt-4 w-full rounded-md border border-amber-300/50 bg-gradient-to-r from-red-900/80 to-amber-900/60 px-4 py-3 text-sm font-black uppercase tracking-[.18em] text-amber-100 transition hover:border-amber-200 hover:brightness-125"
        >
          Choose fighter
        </button>
      </aside>

      <div className="absolute bottom-3 right-4 z-20 flex gap-3 text-[10px] font-semibold uppercase tracking-wider text-white/55 sm:bottom-6 sm:right-8">
        <span>← → / Stick Navigate</span>
        <span>A / Enter Select</span>
        <span>B / Esc Back</span>
      </div>
    </div>
  );
}
