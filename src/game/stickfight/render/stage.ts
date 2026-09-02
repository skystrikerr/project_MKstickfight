/**
 * Arena backdrops. Each theme is a handful of parallax layers built from flat
 * shapes - cheap to draw, and they read instantly at a glance - plus an
 * optional ambient weather system (rain, snow, embers, petals, dust).
 *
 * Adding a stage: add a key to StageTheme, an entry to STAGE_THEMES, and a
 * build method. Nothing else needs to change - the select screen reads the
 * registry.
 */
import type { Platform } from "../types";

import * as THREE from "three";
import { STAGE_HALF_WIDTH } from "../constants";

export type StageTheme =
  | "colosseum"
  | "deck"
  | "frontier"
  | "dojo"
  | "neon"
  | "tundra"
  | "forge"
  | "skyward"
  | "delta"
  // Painted backdrop rather than built shapes.
  | "postroad"
  // Stages with ledges to fight on as well as a floor.
  | "aqueduct"
  | "terraces"
  | "siegeworks";

export type AmbientKind = "none" | "rain" | "snow" | "petal" | "ember" | "dust";

export interface AmbientDef {
  kind: AmbientKind;
  /** Number of particles alive at once. */
  count: number;
  colors: string[];
  /** Fall speed in units per frame (negative rises). */
  speed: number;
  /** Horizontal drift per frame. */
  wind: number;
  size: [number, number];
  opacity: number;
}

export interface StageDef {
  name: string;
  blurb: string;
  sky: [string, string];
  ground: string;
  accent: string;
  ambient: AmbientDef;
  /** Ledges to stand on. Absent means a flat stage, which most of them are. */
  platforms?: Platform[];
}

/** Use for a stage with clear skies. */
export const NO_WEATHER: AmbientDef = {
  kind: "none",
  count: 0,
  colors: [],
  speed: 0,
  wind: 0,
  size: [1, 1],
  opacity: 1,
};

export const STAGE_THEMES: Record<StageTheme, StageDef> = {
  colosseum: {
    name: "The Colosseum",
    blurb: "Fifty thousand Romans, one patch of sand.",
    sky: ["#2b1b3d", "#c8643c"],
    ground: "#c9a267",
    accent: "#e0b13a",
    ambient: { kind: "dust", count: 26, colors: ["#e8d4a8", "#c9a267"], speed: -0.12, wind: 0.16, size: [2, 5], opacity: 0.4 },
  },
  deck: {
    name: "Storm Deck",
    blurb: "Wet planking, a rolling sea, nowhere to run.",
    sky: ["#0d1b2a", "#3f6b8a"],
    ground: "#6b4b32",
    accent: "#4fd1c5",
    ambient: { kind: "rain", count: 90, colors: ["#9fc7e8", "#cfe4f5"], speed: 13, wind: -2.6, size: [1.4, 22], opacity: 0.5 },
  },
  frontier: {
    name: "Perdition Flats",
    blurb: "A dead main street at sundown.",
    sky: ["#3a1f2b", "#e2925a"],
    ground: "#c98d5a",
    accent: "#ffcf6b",
    ambient: { kind: "dust", count: 34, colors: ["#e8c9a0", "#c98d5a"], speed: -0.08, wind: 0.9, size: [2, 6], opacity: 0.45 },
  },
  dojo: {
    name: "Blossom Dojo",
    blurb: "Paper screens, old timber, falling petals.",
    sky: ["#2a2140", "#e79fa8"],
    ground: "#8a6b45",
    accent: "#ff9db4",
    ambient: { kind: "petal", count: 40, colors: ["#ffc0cf", "#ff9db4", "#ffe1e8"], speed: 1.3, wind: 0.9, size: [5, 8], opacity: 0.9 },
  },
  neon: {
    name: "Neon Bazaar",
    blurb: "Rain, signage and a crowd that never looks up.",
    sky: ["#080a18", "#2b1b4d"],
    ground: "#1c2030",
    accent: "#ff3ea5",
    ambient: { kind: "rain", count: 110, colors: ["#7ad7ff", "#ff6ec7"], speed: 15, wind: -1.4, size: [1.2, 26], opacity: 0.4 },
  },
  tundra: {
    name: "Frozen Pass",
    blurb: "Above the treeline, under the aurora.",
    sky: ["#0b1630", "#7099c6"],
    ground: "#b9cde0",
    accent: "#8fd0ff",
    ambient: { kind: "snow", count: 70, colors: ["#ffffff", "#dbeaff"], speed: 1.1, wind: 0.55, size: [3, 5], opacity: 0.85 },
  },
  forge: {
    name: "Ember Forge",
    blurb: "Cut into a volcano. Mind the drop.",
    sky: ["#1a0a0e", "#8a2f1e"],
    ground: "#3b2b2b",
    accent: "#ff8a3c",
    ambient: { kind: "ember", count: 46, colors: ["#ffb648", "#ff6a2c", "#ffe6a8"], speed: -1.5, wind: 0.5, size: [3, 6], opacity: 0.9 },
  },
  delta: {
    name: "Monsoon Delta",
    blurb: "Flooded paddy, low cloud, and the treeline too close.",
    sky: ["#1d2a24", "#7f8f66"],
    ground: "#4a5340",
    accent: "#a7d16a",
    ambient: { kind: "rain", count: 80, colors: ["#b7cfa8", "#dfe9cf"], speed: 12, wind: -1.8, size: [1.3, 20], opacity: 0.42 },
  },
  aqueduct: {
    name: "The Aqueduct",
    blurb: "Two tiers of Roman arches over a dry channel.",
    sky: ["#241a2e", "#b9784a"],
    ground: "#b9a17e",
    accent: "#d8a24a",
    ambient: { kind: "dust", count: 22, colors: ["#e6d6b4", "#b9a17e"], speed: -0.1, wind: 0.14, size: [2, 5], opacity: 0.36 },
    // Two side spans and a high centre - the classic three-ledge shape.
    platforms: [
      { x: -320, y: 66, w: 200 },
      { x: 120, y: 66, w: 200 },
      { x: -100, y: 116, w: 200 },
    ],
  },

  terraces: {
    name: "Temple Terraces",
    blurb: "Cut stone steps above the cloud line.",
    sky: ["#132330", "#5c8fa6"],
    ground: "#8f9aa2",
    accent: "#cfe3ea",
    ambient: { kind: "petal", count: 20, colors: ["#e8f2f6", "#b9d4de"], speed: -0.14, wind: 0.2, size: [3, 6], opacity: 0.5 },
    // One wide pair, low enough to fight on rather than hide on.
    platforms: [
      { x: -350, y: 74, w: 250 },
      { x: 100, y: 74, w: 250 },
    ],
  },

  siegeworks: {
    name: "The Siege Works",
    blurb: "Scaffolding thrown up against a wall that has not fallen yet.",
    sky: ["#1d1a24", "#8a5638"],
    ground: "#6f5a44",
    accent: "#c08a44",
    ambient: { kind: "ember", count: 24, colors: ["#e8a34a", "#c07a30"], speed: 0.18, wind: 0.1, size: [2, 4], opacity: 0.5 },
    // Deliberately lopsided: a stack on the left, one long run on the right.
    platforms: [
      { x: -430, y: 58, w: 210 },
      { x: -280, y: 108, w: 175 },
      { x: 140, y: 70, w: 260 },
    ],
  },

  postroad: {
    name: "The Post Road",
    blurb: "A staging post on the mountain highway: inn, teahouse, and the pass beyond.",
    // Sampled off the painting so the haze, ground and select-screen swatch
    // all sit in the same light as the backdrop they are standing in front of.
    sky: ["#8fb2d0", "#deded6"],
    ground: "#c9a771",
    accent: "#a65f41",
    ambient: {
      kind: "petal",
      count: 34,
      // Maple first, blossom last - the painting has both, and it is mostly
      // autumn, so the leaves should outnumber the petals.
      colors: ["#a65f41", "#c2542f", "#d8913a", "#f0c0cd"],
      speed: 1.05,
      wind: 0.8,
      size: [5, 8],
      opacity: 0.85,
    },
  },

  skyward: {
    name: "Cloudbreak Temple",
    blurb: "A stone platform floating in clear morning air.",
    sky: ["#2f6fb5", "#a9d3f0"],
    ground: "#cfc3a8",
    accent: "#ffe9a8",
    ambient: { kind: "petal", count: 22, colors: ["#ffffff", "#e6f3ff"], speed: 0.7, wind: 1.4, size: [4, 6], opacity: 0.6 },
  },
};

export const STAGE_LIST = Object.keys(STAGE_THEMES) as StageTheme[];

interface Layer {
  group: THREE.Group;
  /** 0 = fixed to camera, 1 = fixed to world. */
  parallax: number;
}

/** Stage layers sit behind the fighters at negative z (see layerZ). */
function mat(color: THREE.ColorRepresentation, opacity = 1) {
  const translucent = opacity < 1;
  return new THREE.MeshBasicMaterial({
    color,
    transparent: translucent,
    opacity,
    depthTest: true,
    depthWrite: !translucent,
  });
}

/** Stage draw order 0..9 maps to z -120..-30, all behind the fighters. */
const layerZ = (order: number) => -120 + order * 10;

function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  color: THREE.ColorRepresentation,
  order: number,
  opacity = 1,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(color, opacity));
  m.position.set(x, y + h / 2, layerZ(order));
  m.renderOrder = order;
  return m;
}

function tri(
  x: number,
  y: number,
  w: number,
  h: number,
  color: THREE.ColorRepresentation,
  order: number,
  opacity = 1,
): THREE.Mesh {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, h);
  s.closePath();
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), mat(color, opacity));
  m.position.set(x, y, layerZ(order));
  m.renderOrder = order;
  return m;
}

function disc(
  x: number,
  y: number,
  r: number,
  color: THREE.ColorRepresentation,
  order: number,
  opacity = 1,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), mat(color, opacity));
  m.position.set(x, y, layerZ(order));
  m.renderOrder = order;
  return m;
}

/** Irregular skyline / rock silhouette built from one polygon. */
function ridge(
  points: [number, number][],
  color: THREE.ColorRepresentation,
  order: number,
  opacity = 1,
): THREE.Mesh {
  const s = new THREE.Shape();
  s.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) s.lineTo(x, y);
  s.closePath();
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), mat(color, opacity));
  m.position.z = layerZ(order);
  m.renderOrder = order;
  return m;
}

/** Vertical gradient backdrop built from a two-colour vertex-coloured quad. */
function skyQuad(top: string, bottom: string, order: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(2400, 1300);
  const top3 = new THREE.Color(top);
  const bot3 = new THREE.Color(bottom);
  const colors: number[] = [];
  // PlaneGeometry vertex order: top-left, top-right, bottom-left, bottom-right.
  for (const c of [top3, top3, bot3, bot3]) colors.push(c.r, c.g, c.b);
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  m.renderOrder = order;
  return m;
}

// ---------------------------------------------------------------------------
// Ambient weather
// ---------------------------------------------------------------------------

interface AmbientParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  spin: number;
  /** Horizontal band the particle lives in, relative to the camera. */
  phase: number;
}

const AMBIENT_SPAN = 1400;
const AMBIENT_TOP = 460;

class Ambient {
  readonly group = new THREE.Group();
  private particles: AmbientParticle[] = [];
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  constructor(private def: AmbientDef) {
    if (def.kind === "none" || def.count === 0) return;

    const [w, h] = def.size;
    const geo =
      def.kind === "rain"
        ? new THREE.PlaneGeometry(w, h)
        : def.kind === "petal"
          ? new THREE.PlaneGeometry(w, h * 0.6)
          : new THREE.CircleGeometry(Math.max(w, h) / 2, 8);
    this.disposables.push(geo);

    for (let i = 0; i < def.count; i++) {
      const color = def.colors[i % def.colors.length];
      const material = mat(color, def.opacity);
      this.disposables.push(material);
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(
        (Math.random() - 0.5) * AMBIENT_SPAN,
        Math.random() * AMBIENT_TOP,
        layerZ(7) + 4,
      );
      mesh.renderOrder = 7;
      if (def.kind === "rain") mesh.rotation.z = Math.atan2(-def.speed, def.wind) + Math.PI / 2;
      else mesh.rotation.z = Math.random() * Math.PI;
      this.group.add(mesh);
      this.particles.push({
        mesh,
        vx: def.wind * (0.7 + Math.random() * 0.6),
        vy: -def.speed * (0.75 + Math.random() * 0.5),
        spin: def.kind === "petal" ? (Math.random() - 0.5) * 0.14 : 0,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  update(frame: number, cameraX: number) {
    if (this.particles.length === 0) return;
    for (const p of this.particles) {
      const m = p.mesh;
      m.position.x += p.vx;
      m.position.y += p.vy;
      if (p.spin) {
        m.rotation.z += p.spin;
        // Petals and snow sway as they fall.
        m.position.x += Math.sin(frame * 0.03 + p.phase) * 0.35;
      }

      // Wrap around the camera so the field always covers the view.
      const left = cameraX - AMBIENT_SPAN / 2;
      const right = cameraX + AMBIENT_SPAN / 2;
      if (m.position.x < left) m.position.x = right;
      if (m.position.x > right) m.position.x = left;
      if (p.vy < 0 && m.position.y < -20) {
        m.position.y = AMBIENT_TOP;
        m.position.x = left + Math.random() * AMBIENT_SPAN;
      }
      if (p.vy > 0 && m.position.y > AMBIENT_TOP) {
        m.position.y = -10;
        m.position.x = left + Math.random() * AMBIENT_SPAN;
      }
    }
  }

  dispose() {
    for (const d of this.disposables) d.dispose();
  }
}

// ---------------------------------------------------------------------------

export class Stage {
  readonly group = new THREE.Group();
  private layers: Layer[] = [];
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];
  /** Backdrop bitmaps, which arrive after construction and free separately. */
  private textures: THREE.Texture[] = [];
  private ambient: Ambient;
  private frame = 0;
  readonly theme: StageTheme;

  constructor(theme: StageTheme) {
    this.theme = theme;
    const cfg = STAGE_THEMES[theme];

    const sky = new THREE.Group();
    const skyMesh = skyQuad(cfg.sky[0], cfg.sky[1], 0);
    skyMesh.position.set(0, 380, layerZ(0) - 10);
    sky.add(skyMesh);
    this.addLayer(sky, 0);

    switch (theme) {
      case "colosseum":
        this.buildColosseum();
        break;
      case "deck":
        this.buildDeck();
        break;
      case "frontier":
        this.buildFrontier();
        break;
      case "dojo":
        this.buildDojo();
        break;
      case "neon":
        this.buildNeon();
        break;
      case "tundra":
        this.buildTundra();
        break;
      case "forge":
        this.buildForge();
        break;
      case "skyward":
        this.buildSkyward();
        break;
      case "delta":
        this.buildDelta();
        break;
      case "postroad":
        this.buildPostRoad();
        break;
    }

    // A painted backdrop brings its own aerial perspective - the mountains in
    // it are already fading on their own. Veiling it again in flat horizon
    // colour only makes it muddy, so the haze is for built stages.
    if (theme !== "postroad") this.buildHaze(cfg.sky[1]);
    this.buildGround(cfg.ground, theme);
    if (cfg.platforms?.length) this.buildPlatforms(cfg.platforms, cfg.ground, cfg.accent);

    this.ambient = new Ambient(cfg.ambient);
    this.group.add(this.ambient.group);
  }

  private addLayer(group: THREE.Group, parallax: number) {
    this.layers.push({ group, parallax });
    this.group.add(group);
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) this.disposables.push(m.geometry);
      if (m.material) this.disposables.push(m.material as THREE.Material);
    });
  }

  /**
   * Aerial perspective. Two scrims of the horizon colour, one over the far
   * layer and a thinner one over the mid layer, so distance reads as distance
   * instead of every backdrop sitting in the same plane as the fighters. Each
   * one is a single quad, and each parallaxes with the layer it is veiling.
   */
  private buildHaze(horizon: string) {
    const veil = (order: number, opacity: number, parallax: number) => {
      const g = new THREE.Group();
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2600, 1400), mat(horizon, opacity));
      m.position.set(0, 380, layerZ(order));
      m.renderOrder = order;
      g.add(m);
      this.addLayer(g, parallax);
    };
    veil(2.6, 0.3, 0.3);
    veil(5.6, 0.12, 0.62);
  }

  private buildGround(color: string, theme: StageTheme) {
    const g = new THREE.Group();
    g.add(rect(0, -420, 1800, 420, color, 8));
    g.add(rect(0, -6, 1800, 7, "#000000", 9, 0.35));
    // Floor markings, spaced along the fighting area.
    for (let x = -STAGE_HALF_WIDTH; x <= STAGE_HALF_WIDTH; x += 130) {
      g.add(rect(x, -34, 6, 34, "#000000", 9, 0.18));
    }
    if (theme === "skyward") {
      // The platform has an edge instead of running off-screen.
      g.add(rect(0, -180, 1240, 180, "#8d8064", 8));
      g.add(rect(0, -30, 1300, 30, "#b3a486", 8));
    }
    this.addLayer(g, 1);
  }

  /**
   * Draws the ledges the physics already knows about, from the same numbers -
   * so what you can stand on is exactly what you can see.
   *
   * Only the top edge is solid, so the slab is drawn hanging below its surface
   * with a bright lip along the top. That lip is the whole contract with the
   * player: land on the light line, pass through everything under it.
   */
  private buildPlatforms(platforms: Platform[], ground: string, accent: string) {
    const g = new THREE.Group();
    const THICK = 15;
    for (const p of platforms) {
      const cx = p.x + p.w / 2;
      // Body, hanging below the surface.
      g.add(rect(cx, p.y - THICK, p.w, THICK, ground, 7));
      g.add(rect(cx, p.y - THICK - 3, p.w - 10, 3, "#000000", 7, 0.28));
      // The lip you actually land on.
      g.add(rect(cx, p.y - 3.5, p.w, 3.5, accent, 8));
      // Stone ends, so it reads as built rather than floating.
      for (const side of [-1, 1]) {
        g.add(rect(cx + (side * (p.w / 2 - 7)), p.y - THICK, 14, THICK, ground, 8, 0.85));
      }
    }
    this.addLayer(g, 1);
  }

  // ------------------------------------------------------------------ stages

  private buildColosseum() {
    const far = new THREE.Group();
    far.add(disc(240, 300, 90, "#f6c46a", 1, 0.85));
    for (let i = -4; i <= 4; i++) {
      far.add(rect(i * 190, 40, 120, 240, "#4a2f42", 2, 0.9));
      far.add(rect(i * 190, 260, 150, 30, "#5c3a52", 2, 0.9));
    }
    this.addLayer(far, 0.25);

    const mid = new THREE.Group();
    mid.add(rect(0, 96, 1800, 90, "#3a2434", 3));
    for (let i = -8; i <= 8; i++) {
      mid.add(rect(i * 150, 110, 26, 70, "#2b1a28", 4, 0.9));
    }
    mid.add(rect(0, 60, 1800, 40, "#553751", 4));
    for (let i = -6; i <= 6; i++) {
      mid.add(rect(i * 170, 0, 34, 70, "#d8c39a", 5));
      mid.add(rect(i * 170, 66, 46, 12, "#efe0bd", 5));
    }
    mid.add(rect(0, 0, 1800, 10, "#8a744f", 6));
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    near.add(rect(-STAGE_HALF_WIDTH - 40, 0, 40, 150, "#2a1c26", 7, 0.85));
    near.add(rect(STAGE_HALF_WIDTH + 40, 0, 40, 150, "#2a1c26", 7, 0.85));
    this.addLayer(near, 0.9);
  }

  private buildDeck() {
    const far = new THREE.Group();
    far.add(disc(-260, 340, 66, "#dfe7ef", 1, 0.5));
    for (let i = -3; i <= 3; i++) {
      far.add(disc(i * 260 + 40, 330 + (i % 2) * 40, 90, "#1b2c3f", 2, 0.75));
      far.add(disc(i * 260 - 60, 300 + (i % 2) * 30, 70, "#22374d", 2, 0.7));
    }
    this.addLayer(far, 0.2);

    const mid = new THREE.Group();
    mid.add(rect(-320, 40, 320, 60, "#20303f", 3));
    mid.add(rect(-320, 100, 12, 190, "#2b3f52", 3));
    mid.add(tri(-320, 110, 130, 150, "#41586d", 3, 0.9));
    mid.add(rect(0, 0, 1800, 46, "#2b4a63", 4));
    mid.add(rect(0, 34, 1800, 8, "#43698a", 5, 0.8));
    this.addLayer(mid, 0.5);

    const near = new THREE.Group();
    near.add(rect(0, 0, 1800, 16, "#4d3521", 6));
    for (let i = -8; i <= 8; i++) {
      near.add(rect(i * 140, 16, 10, 60, "#5c4029", 6, 0.9));
    }
    near.add(rect(0, 74, 1800, 8, "#5c4029", 6, 0.9));
    near.add(rect(210, 0, 22, 320, "#6b4b32", 5, 0.95));
    near.add(rect(210, 250, 200, 14, "#7d5a3c", 5, 0.95));
    this.addLayer(near, 0.85);
  }

  private buildFrontier() {
    const far = new THREE.Group();
    far.add(disc(-200, 250, 120, "#ffd9a0", 1, 0.75));
    far.add(tri(-380, 0, 620, 250, "#5b3446", 2, 0.85));
    far.add(tri(180, 0, 520, 190, "#6b3d4a", 2, 0.8));
    far.add(tri(560, 0, 440, 230, "#4d2b3c", 2, 0.85));
    this.addLayer(far, 0.25);

    const mid = new THREE.Group();
    const buildings = [
      { x: -470, w: 180, h: 150 },
      { x: -250, w: 150, h: 120 },
      { x: 260, w: 200, h: 165 },
      { x: 490, w: 160, h: 130 },
    ];
    for (const b of buildings) {
      mid.add(rect(b.x, 0, b.w, b.h, "#6a4630", 3));
      mid.add(rect(b.x, b.h, b.w + 22, 16, "#4f3323", 4));
      mid.add(rect(b.x, b.h * 0.45, b.w * 0.32, b.h * 0.3, "#2a1a14", 4, 0.9));
      mid.add(rect(b.x - b.w * 0.28, 0, b.w * 0.22, b.h * 0.42, "#33201a", 4, 0.9));
    }
    mid.add(rect(-60, 0, 12, 70, "#4a6b3a", 3));
    mid.add(rect(-72, 40, 26, 10, "#4a6b3a", 3));
    mid.add(rect(80, 0, 8, 90, "#5b3f28", 3));
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    near.add(rect(0, 0, 1800, 12, "#a9713f", 6, 0.8));
    this.addLayer(near, 0.9);
  }

  private buildDojo() {
    const far = new THREE.Group();
    far.add(disc(-220, 320, 78, "#ffe9f0", 1, 0.7));
    far.add(ridge(
      [
        [-900, 0],
        [-620, 190],
        [-380, 60],
        [-120, 230],
        [180, 80],
        [430, 210],
        [760, 70],
        [900, 150],
        [900, 0],
      ],
      "#4a3560",
      2,
      0.85,
    ));
    this.addLayer(far, 0.22);

    const mid = new THREE.Group();
    // Cherry trees: trunks and blossom clouds.
    for (const x of [-360, 340]) {
      mid.add(rect(x, 0, 14, 120, "#59402f", 3));
      mid.add(rect(x + (x < 0 ? 28 : -28), 78, 50, 10, "#59402f", 3));
      for (let i = 0; i < 4; i++) {
        mid.add(
          disc(x + (i - 1.5) * 34 + (x < 0 ? 16 : -16), 148 + (i % 2) * 24, 36 + (i % 3) * 8, i % 2 ? "#ff9db4" : "#ffb6c8", 3, 0.95),
        );
      }
    }
    // Dojo hall behind the fighters.
    mid.add(rect(0, 0, 430, 116, "#c9b48f", 4));
    for (let i = -1; i <= 1; i++) {
      mid.add(rect(i * 128, 14, 96, 84, "#f0e6d2", 5));
      mid.add(rect(i * 128, 14, 5, 84, "#8a6b45", 5));
      mid.add(rect(i * 128, 54, 96, 5, "#8a6b45", 5));
    }
    mid.add(rect(0, 114, 490, 16, "#4a3324", 5));
    mid.add(tri(0, 130, 520, 62, "#5c3f2c", 5));
    mid.add(rect(0, 172, 84, 10, "#8a6b45", 6));
    // Stone lanterns flanking the hall.
    for (const x of [-260, 260]) {
      mid.add(rect(x, 0, 16, 34, "#9c9384", 5));
      mid.add(rect(x, 34, 30, 20, "#ffe9a8", 5, 0.9));
      mid.add(tri(x, 54, 40, 20, "#7d7466", 5));
    }
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    near.add(rect(0, 0, 1800, 14, "#a8845a", 6, 0.9));
    for (let i = -6; i <= 6; i++) near.add(rect(i * 160, 0, 8, 14, "#8a6b45", 7, 0.8));
    this.addLayer(near, 0.9);
  }

  private buildNeon() {
    const far = new THREE.Group();
    // Distant towers with lit windows.
    for (let i = -6; i <= 6; i++) {
      const h = 220 + ((i * 97) % 160);
      far.add(rect(i * 165, 0, 110, h, "#232c4a", 2));
      for (let w = 0; w < 6; w++) {
        const lit = (i * 7 + w * 3) % 4 !== 0;
        far.add(rect(i * 165 - 28 + (w % 2) * 56, 40 + Math.floor(w / 2) * 56, 22, 26, lit ? "#7f9ae0" : "#161d33", 3, 0.9));
      }
    }
    this.addLayer(far, 0.25);

    const mid = new THREE.Group();
    mid.add(rect(0, 0, 1800, 190, "#1b2138", 4));
    // Neon signs.
    const signs: [number, number, number, number, string][] = [
      [-420, 130, 70, 26, "#ff3ea5"],
      [-260, 80, 24, 90, "#7ad7ff"],
      [-80, 150, 96, 22, "#ffe066"],
      [180, 96, 26, 110, "#7cff9e"],
      [330, 160, 84, 24, "#ff6ec7"],
      [520, 110, 22, 84, "#7ad7ff"],
    ];
    for (const [x, y, w, h, color] of signs) {
      mid.add(rect(x, y, w + 8, h + 8, "#0b0e1a", 5));
      mid.add(rect(x, y, w, h, color, 5, 0.92));
      mid.add(rect(x, y - 10, w * 1.5, h * 1.6, color, 5, 0.12));
    }
    // Awnings over the street.
    for (let i = -4; i <= 4; i++) {
      mid.add(rect(i * 210, 60, 150, 12, i % 2 ? "#8a2450" : "#1f5f6b", 6));
    }
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    near.add(rect(0, 0, 1800, 18, "#12162a", 6));
    near.add(rect(0, 16, 1800, 4, "#ff3ea5", 7, 0.55));
    // Wet reflections on the road.
    for (let i = -7; i <= 7; i++) {
      near.add(rect(i * 130 + 30, 0, 40, 12, i % 2 ? "#ff3ea5" : "#7ad7ff", 7, 0.16));
    }
    this.addLayer(near, 0.9);
  }

  private buildTundra() {
    const far = new THREE.Group();
    // Aurora bands.
    for (let i = 0; i < 4; i++) {
      far.add(rect(-140 + i * 90, 300 + i * 26, 620 - i * 60, 26, i % 2 ? "#5fe0b8" : "#8fd0ff", 1, 0.16));
    }
    far.add(disc(300, 360, 40, "#eaf4ff", 1, 0.85));
    far.add(ridge(
      [
        [-900, 0],
        [-700, 300],
        [-520, 140],
        [-300, 340],
        [-60, 120],
        [200, 380],
        [470, 160],
        [720, 320],
        [900, 90],
        [900, 0],
      ],
      "#22345a",
      2,
      0.95,
    ));
    this.addLayer(far, 0.22);

    const mid = new THREE.Group();
    mid.add(ridge(
      [
        [-800, 0],
        [-560, 190],
        [-330, 70],
        [-90, 210],
        [160, 90],
        [420, 200],
        [700, 80],
        [800, 0],
      ],
      "#3b5c86",
      3,
    ));
    // Snow caps.
    mid.add(tri(-560, 150, 150, 52, "#e8f2ff", 4, 0.95));
    mid.add(tri(-90, 168, 140, 48, "#e8f2ff", 4, 0.95));
    mid.add(tri(420, 158, 130, 48, "#e8f2ff", 4, 0.95));
    // Pines.
    for (let i = -7; i <= 7; i++) {
      const x = i * 130 + ((i * 37) % 40);
      const h = 70 + ((i * 53) % 40);
      mid.add(rect(x, 0, 9, h * 0.4, "#3a2d24", 5));
      mid.add(tri(x, h * 0.3, 54, h, "#20402f", 5));
      mid.add(tri(x, h * 0.62, 40, h * 0.7, "#2b5540", 5));
    }
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    near.add(rect(0, 0, 1800, 16, "#d5e4f2", 6));
    for (let i = -6; i <= 6; i++) near.add(disc(i * 170, 6, 26, "#c6d8ea", 6, 0.9));
    this.addLayer(near, 0.9);
  }

  private buildForge() {
    const far = new THREE.Group();
    far.add(ridge(
      [
        [-900, 0],
        [-640, 260],
        [-420, 120],
        [-160, 300],
        [140, 150],
        [420, 280],
        [700, 130],
        [900, 220],
        [900, 0],
      ],
      "#2a1216",
      2,
    ));
    // Lava glow behind the rock.
    far.add(rect(0, 0, 1800, 60, "#ff6a2c", 1, 0.5));
    far.add(rect(0, 40, 1800, 120, "#8a2f1e", 1, 0.35));
    this.addLayer(far, 0.25);

    const mid = new THREE.Group();
    // Lava river.
    mid.add(rect(0, 0, 1800, 40, "#ff8a3c", 3, 0.95));
    mid.add(rect(0, 26, 1800, 16, "#ffd06b", 4, 0.9));
    for (let i = -8; i <= 8; i++) {
      mid.add(disc(i * 120 + ((i * 31) % 50), 30, 16 + ((i * 17) % 12), "#ffe6a8", 4, 0.7));
    }
    // Cavern walls and hanging chains.
    mid.add(rect(-560, 0, 300, 260, "#241417", 5));
    mid.add(rect(560, 0, 300, 300, "#241417", 5));
    for (const x of [-430, 430]) {
      mid.add(rect(x, 140, 8, 160, "#4a3a33", 5));
      mid.add(disc(x, 130, 16, "#6b5348", 5));
    }
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    // Forge platform with glowing cracks.
    near.add(rect(0, 0, 1800, 24, "#2f2323", 6));
    for (let i = -7; i <= 7; i++) {
      near.add(rect(i * 128 + 20, 0, 5, 18, "#ff6a2c", 7, 0.75));
    }
    near.add(rect(0, 22, 1800, 5, "#ff8a3c", 7, 0.4));
    this.addLayer(near, 0.9);
  }

  private buildSkyward() {
    const far = new THREE.Group();
    // Kept off pure white deliberately: bloom picks out effects, and a sky
    // full of #ffffff clouds would flare the whole frame instead.
    far.add(disc(-260, 380, 62, "#f7edcf", 1, 0.9));
    for (let i = -4; i <= 4; i++) {
      const y = 220 + ((i * 61) % 150);
      far.add(disc(i * 240, y, 70, "#e9f1fb", 2, 0.6));
      far.add(disc(i * 240 + 60, y - 16, 52, "#e3ecf8", 2, 0.55));
      far.add(disc(i * 240 - 66, y - 20, 46, "#d8e6f6", 2, 0.5));
    }
    this.addLayer(far, 0.18);

    const mid = new THREE.Group();
    // Floating islands.
    for (const [x, y, w] of [
      [-620, 150, 150],
      [580, 200, 120],
      [-330, 215, 90],
    ] as [number, number, number][]) {
      mid.add(rect(x, y, w, 26, "#b3a486", 3));
      mid.add(tri(x, y, w * 0.8, -70, "#8d8064", 3));
      mid.add(rect(x, y + 26, w * 0.9, 8, "#6f9c5a", 4));
    }
    // Temple columns and roof behind the platform.
    for (let i = -2; i <= 2; i++) {
      mid.add(rect(i * 96, 0, 22, 128, "#cbbfa2", 4));
      mid.add(rect(i * 96, 124, 32, 10, "#b3a486", 5));
    }
    mid.add(rect(0, 132, 500, 14, "#b3a486", 5));
    mid.add(tri(0, 146, 520, 58, "#9c8f72", 5));
    this.addLayer(mid, 0.38);

    const near = new THREE.Group();
    near.add(rect(0, 0, 1300, 14, "#c7b795", 6));
    this.addLayer(near, 0.9);
  }

  private buildDelta() {
    const far = new THREE.Group();
    // Low monsoon cloud over a flat horizon.
    for (let i = -4; i <= 4; i++) {
      far.add(disc(i * 230, 300 + ((i * 53) % 60), 88, "#2c3a2f", 2, 0.8));
      far.add(disc(i * 230 + 70, 270 + ((i * 37) % 40), 64, "#354535", 2, 0.7));
    }
    far.add(ridge(
      [
        [-900, 0],
        [-700, 130],
        [-420, 90],
        [-140, 150],
        [180, 100],
        [470, 160],
        [760, 96],
        [900, 130],
        [900, 0],
      ],
      "#22301f",
      2,
    ));
    this.addLayer(far, 0.22);

    const mid = new THREE.Group();
    // Treeline: trunks with heavy fronds.
    for (let i = -7; i <= 7; i++) {
      const x = i * 128 + ((i * 41) % 36);
      const h = 96 + ((i * 61) % 54);
      mid.add(rect(x, 0, 9, h, "#3c3324", 3));
      for (let f = 0; f < 5; f++) {
        const a = -60 + f * 30;
        const frond = tri(x + Math.sin((a * Math.PI) / 180) * 26, h - 6, 62, 20, f % 2 ? "#2f5333" : "#3a6b3c", 4, 0.95);
        frond.rotation.z = (a * Math.PI) / 180;
        mid.add(frond);
      }
    }
    // Flooded paddy behind the fighting line.
    mid.add(rect(0, 0, 1800, 34, "#3f5344", 5));
    mid.add(rect(0, 24, 1800, 6, "#6e8a68", 6, 0.75));
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    // Sandbag berm and a few reeds at the camera line.
    near.add(rect(0, 0, 1800, 14, "#5b6248", 6));
    for (let i = -8; i <= 8; i++) {
      near.add(disc(i * 110, 12, 13, "#6b7355", 6));
      near.add(rect(i * 110 + 46, 0, 3, 34, "#57683f", 7, 0.85));
      near.add(rect(i * 110 + 52, 0, 3, 26, "#4c5c36", 7, 0.85));
    }
    this.addLayer(near, 0.9);
  }

  /**
   * The one painted stage. Every other backdrop here is assembled out of flat
   * shapes; this one is a single texture on a single quad.
   *
   * It is deliberately hung far back and left alone. The temptation with a
   * painting is to build shapes in front of it to "tie it in", which only
   * ever produces two art styles arguing in the same frame - so the only
   * things drawn over it are the floor every stage needs and the falling
   * leaves, both of which the painting already contains and so agrees with.
   *
   * Sizing is the whole job here, and it is a squeeze between two limits.
   * Too large and the camera only ever frames a patch of village: the pagoda
   * and the mountain, which are the reason to use this picture at all, sit
   * off the top of the screen. Too small and the edge of the quad walks into
   * shot at the corners. The camera tops out at 980 units wide and this layer
   * slides about 68 either way, so 1150 clears the edge with room spare, and
   * the height that falls out of the painting's own aspect happens to land
   * the mountain just under the ceiling of a zoomed-out shot.
   */
  private buildPostRoad() {
    const g = new THREE.Group();
    const W = 1150;
    const H = W / 2.1358; // the painting's own aspect - never letterbox it
    const geo = new THREE.PlaneGeometry(W, H);
    const material = new THREE.MeshBasicMaterial({ toneMapped: false });
    // Held blank until the bitmap arrives rather than flashing white: the
    // texture decode is async even when the file is inlined as a data URI.
    material.transparent = true;
    material.opacity = 0;

    // Imported here rather than at the top of the file on purpose. The
    // self-tests import this module under Node to read STAGE_THEMES, and Node
    // cannot parse a .jpg import - but it never builds a Stage, so keeping the
    // asset behind the one method that needs it keeps the tests running.
    void import("../../../assets/post-road.jpg").then(({ default: url }) => {
      new THREE.TextureLoader().load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        // The quad is bigger than the source and the art is pixel work, so it
        // is left crisp rather than smoothed back into mush.
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.generateMipmaps = true;
        material.map = tex;
        material.opacity = 1;
        material.transparent = false;
        material.needsUpdate = true;
        this.textures.push(tex);
      });
    });

    const m = new THREE.Mesh(geo, material);
    // Sunk 150 so the painted foreground - rocks, stream, the near verge -
    // runs under the floor the fighters stand on. That buries the part of the
    // picture that would otherwise argue with the arena, and lands the village
    // itself at head height behind them rather than under their feet.
    m.position.set(0, H / 2 - 150, layerZ(1));
    m.renderOrder = 1;
    g.add(m);
    this.addLayer(g, 0.25);
  }

  // ------------------------------------------------------------------ update

  /** Applies parallax and advances ambient weather. */
  update(cameraX: number, cameraY: number) {
    this.frame++;
    for (const layer of this.layers) {
      layer.group.position.x = cameraX * (1 - layer.parallax);
      layer.group.position.y = cameraY * (1 - layer.parallax) * 0.4;
    }
    this.ambient.update(this.frame, cameraX);
  }

  dispose() {
    for (const d of this.disposables) d.dispose();
    for (const t of this.textures) t.dispose();
    this.ambient.dispose();
  }
}

export function themeForFighter(id: string): StageTheme {
  switch (id) {
    case "roman":
      return "colosseum";
    case "pirate":
      return "deck";
    case "western":
      return "frontier";
    case "samurai":
      return "dojo";
    case "viking":
      return "tundra";
    case "soldier":
      return "delta";
    case "spartan":
      return "colosseum";
    case "muaythai":
      return "delta";
    case "ninja":
      return "dojo";
    case "mongol":
      return "tundra";
    case "knight":
      return "forge";
    case "jaguar":
      return "delta";
    case "zulu":
      return "frontier";
    case "shaolin":
      return "skyward";
    case "nihang":
      return "forge";
    default:
      return "colosseum";
  }
}

/** Picks a random stage, optionally avoiding one. */
export function randomTheme(exclude?: StageTheme): StageTheme {
  const options = STAGE_LIST.filter((t) => t !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}
