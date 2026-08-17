/**
 * Particle and impact effects. A fixed pool of flat meshes is recycled, so a
 * long combo never allocates mid-fight.
 */

import * as THREE from "three";
import type { FxEvent } from "../engine/match";

type Shape = "dot" | "shard" | "ring" | "arc" | "star" | "puff" | "glow";

/** Shapes drawn with the soft radial falloff instead of a hard edge. */
const SOFT: ReadonlySet<Shape> = new Set<Shape>(["dot", "puff", "glow"]);

interface Particle {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  gravity: number;
  spin: number;
  scaleRate: number;
  fade: number;
  baseScaleX: number;
  baseScaleY: number;
  active: boolean;
}

const POOL_SIZE = 260;
/** How many of the pool carry the soft glow texture. */
const SOFT_POOL_SIZE = 150;

function shardShape(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0);
  s.lineTo(0, 0.16);
  s.lineTo(0.5, 0);
  s.lineTo(0, -0.16);
  s.closePath();
  return new THREE.ShapeGeometry(s);
}

function starShape(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const spikes = 4;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 0.5 : 0.14;
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return new THREE.ShapeGeometry(s);
}

function arcShape(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.5, -Math.PI * 0.42, Math.PI * 0.42, false);
  s.absarc(0, 0, 0.3, Math.PI * 0.42, -Math.PI * 0.42, true);
  s.closePath();
  return new THREE.ShapeGeometry(s, 20);
}

function ringShape(): THREE.BufferGeometry {
  return new THREE.RingGeometry(0.38, 0.5, 28);
}

/**
 * A radial alpha falloff drawn once into a canvas. Sparks, smoke and embers
 * lose their hard polygon edge, and because the centre stays bright it is the
 * bloom pass that turns them into actual light.
 */
function glowTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.42, "rgba(255,255,255,0.86)");
  g.addColorStop(0.72, "rgba(255,255,255,0.3)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class FxSystem {
  readonly group = new THREE.Group();
  /**
   * Two pools, because whether a particle samples the glow texture is baked
   * into its material: swapping a map on a live material recompiles the
   * shader, which is not something to do sixty times a second.
   */
  private hard: Particle[] = [];
  private soft: Particle[] = [];
  /** Both pools in one array, built once - update() must not allocate. */
  private pool: Particle[] = [];
  private hardCursor = 0;
  private softCursor = 0;
  private glow = glowTexture();
  private geos: Record<Shape, THREE.BufferGeometry>;

  constructor() {
    this.geos = {
      dot: new THREE.PlaneGeometry(1, 1),
      shard: shardShape(),
      ring: ringShape(),
      arc: arcShape(),
      star: starShape(),
      puff: new THREE.PlaneGeometry(1, 1),
      glow: new THREE.PlaneGeometry(1, 1),
    };

    const build = (count: number, map: THREE.Texture | null, into: Particle[]) => {
      for (let i = 0; i < count; i++) {
        const material = new THREE.MeshBasicMaterial({
          color: "#ffffff",
          map,
          transparent: true,
          opacity: 0,
          depthTest: true,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(map ? this.geos.glow : this.geos.shard, material);
        mesh.visible = false;
        mesh.renderOrder = 60;
        this.group.add(mesh);
        into.push({
          mesh,
          material,
          life: 0,
          maxLife: 1,
          vx: 0,
          vy: 0,
          gravity: 0,
          spin: 0,
          scaleRate: 1,
          fade: 1,
          baseScaleX: 1,
          baseScaleY: 1,
          active: false,
        });
      }
    };
    build(POOL_SIZE - SOFT_POOL_SIZE, null, this.hard);
    build(SOFT_POOL_SIZE, this.glow, this.soft);
    this.pool = [...this.hard, ...this.soft];
  }

  private take(soft: boolean): Particle {
    const pool = soft ? this.soft : this.hard;
    const cursor = soft ? this.softCursor : this.hardCursor;
    for (let i = 0; i < pool.length; i++) {
      const p = pool[(cursor + i) % pool.length];
      if (!p.active) {
        const next = (cursor + i + 1) % pool.length;
        if (soft) this.softCursor = next;
        else this.hardCursor = next;
        return p;
      }
    }
    // All busy: recycle the oldest slot.
    const p = pool[cursor];
    if (soft) this.softCursor = (cursor + 1) % pool.length;
    else this.hardCursor = (cursor + 1) % pool.length;
    return p;
  }

  private spawn(opts: {
    shape: Shape;
    x: number;
    y: number;
    color: string;
    size: number;
    life: number;
    vx?: number;
    vy?: number;
    gravity?: number;
    rot?: number;
    spin?: number;
    scaleRate?: number;
    stretch?: number;
    opacity?: number;
    order?: number;
  }) {
    const p = this.take(SOFT.has(opts.shape));
    p.mesh.geometry = this.geos[opts.shape];
    p.mesh.visible = true;
    p.mesh.position.set(opts.x, opts.y, 0);
    p.mesh.rotation.z = opts.rot ?? 0;
    p.baseScaleX = opts.size * (opts.stretch ?? 1);
    p.baseScaleY = opts.size;
    p.mesh.scale.set(p.baseScaleX, p.baseScaleY, 1);
    p.mesh.renderOrder = opts.order ?? 60;
    p.material.color.set(opts.color);
    p.material.opacity = opts.opacity ?? 1;
    p.life = opts.life;
    p.maxLife = opts.life;
    p.vx = opts.vx ?? 0;
    p.vy = opts.vy ?? 0;
    p.gravity = opts.gravity ?? 0;
    p.spin = opts.spin ?? 0;
    p.scaleRate = opts.scaleRate ?? 1;
    p.fade = opts.opacity ?? 1;
    p.active = true;
  }

  private burst(x: number, y: number, count: number, color: string, speed: number, size: number, life: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.9);
      this.spawn({
        shape: Math.random() < 0.5 ? "shard" : "dot",
        x,
        y,
        color,
        size: size * (0.5 + Math.random()),
        life: life * (0.6 + Math.random() * 0.6),
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        gravity: 0.42,
        rot: a,
        spin: (Math.random() - 0.5) * 0.4,
        scaleRate: 0.96,
        stretch: 2.2,
      });
    }
  }

  /** Converts one simulation effect event into particles. */
  emit(e: FxEvent) {
    const x = e.x;
    const y = e.y;
    const s = e.scale ?? 1;
    const dir = e.facing ?? 1;

    switch (e.kind) {
      case "slash":
        this.spawn({
          shape: "arc",
          x,
          y,
          color: "#ffffff",
          size: 92 * s,
          life: 9,
          rot: (e.angle ?? 0) + (Math.random() - 0.5) * 0.5,
          scaleRate: 1.1,
          stretch: 1.15,
        });
        this.spawn({ shape: "star", x, y, color: "#fff3c4", size: 46 * s, life: 7, scaleRate: 1.12 });
        this.burst(x, y, 8, "#ffe9a8", 3.4, 7, 16);
        break;

      case "pierce":
        this.spawn({
          shape: "shard",
          x,
          y,
          color: "#ffffff",
          size: 40 * s,
          life: 8,
          rot: e.angle ?? 0,
          stretch: 3.4,
          scaleRate: 1.16,
        });
        this.burst(x, y, 7, "#cfe9ff", 3.8, 6, 14);
        break;

      case "blunt":
        this.spawn({ shape: "star", x, y, color: "#ffffff", size: 54 * s, life: 8, scaleRate: 1.14 });
        this.spawn({ shape: "ring", x, y, color: "#ffd06b", size: 40 * s, life: 10, scaleRate: 1.22 });
        this.burst(x, y, 9, "#ffd06b", 3.2, 7, 16);
        break;

      case "shot":
        this.spawn({
          shape: "star",
          x: x + dir * 6,
          y,
          color: e.color ?? "#ffe9a8",
          size: 34 * s,
          life: 6,
          scaleRate: 1.2,
          stretch: 1.6,
        });
        this.burst(x, y, 5, e.color ?? "#ffcf6b", 3.6, 5, 10);
        break;

      case "explode":
        this.spawn({ shape: "ring", x, y, color: "#ffd06b", size: 70 * s, life: 14, scaleRate: 1.2 });
        this.spawn({ shape: "dot", x, y, color: "#fff1c9", size: 60 * s, life: 8, scaleRate: 1.18 });
        for (let i = 0; i < 10; i++) {
          this.spawn({
            shape: "puff",
            x: x + (Math.random() - 0.5) * 40 * s,
            y: y + (Math.random() - 0.5) * 40 * s,
            color: i % 2 ? "#7a5a44" : "#c2703a",
            size: (26 + Math.random() * 26) * s,
            life: 22 + Math.random() * 14,
            vx: (Math.random() - 0.5) * 2.4,
            vy: 0.6 + Math.random() * 1.6,
            scaleRate: 1.03,
            opacity: 0.85,
          });
        }
        this.burst(x, y, 14, "#ffb648", 5.5, 9, 24);
        break;

      case "burn":
        this.burst(x, y, 10, "#ff8a3c", 3, 8, 20);
        break;

      // A body vanishing: a bright ring at the point of departure, then a
      // cloud of puffs that grows and drifts up where they used to be.
      case "smoke": {
        const tint = e.color ?? "#8f97a8";
        this.spawn({ shape: "ring", x, y, color: tint, size: 44 * s, life: 12, scaleRate: 1.14, opacity: 0.7 });
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2 + Math.random();
          this.spawn({
            shape: "puff",
            x: x + Math.cos(a) * 12 * s,
            y: y + Math.sin(a) * 14 * s,
            color: i % 3 === 0 ? tint : "#d8dde6",
            size: (16 + Math.random() * 18) * s,
            life: 20 + Math.random() * 12,
            vx: Math.cos(a) * 1.4,
            vy: Math.sin(a) * 1.1 + 0.6,
            scaleRate: 1.05,
            opacity: 0.55,
          });
        }
        break;
      }

      case "block":
        this.spawn({
          shape: "arc",
          x,
          y,
          color: "#8fd0ff",
          size: 74 * s,
          life: 9,
          rot: (e.angle ?? 0) + Math.PI,
          scaleRate: 1.08,
        });
        this.burst(x, y, 5, "#bde4ff", 2.4, 5, 12);
        break;

      case "parry":
        this.spawn({ shape: "ring", x, y, color: "#ffe9a8", size: 60 * s, life: 16, scaleRate: 1.16 });
        this.spawn({ shape: "star", x, y, color: "#ffffff", size: 70 * s, life: 12, scaleRate: 1.08 });
        this.burst(x, y, 12, "#ffd06b", 4, 7, 22);
        break;

      case "spark":
        this.burst(x, y, 8, "#fff0b8", 4.2, 6, 16);
        break;

      case "dust":
        for (let i = 0; i < 4; i++) {
          this.spawn({
            shape: "puff",
            x: x + (Math.random() - 0.5) * 16,
            y: y + Math.random() * 6,
            color: "#c9b28a",
            size: (10 + Math.random() * 14) * s,
            life: 16 + Math.random() * 10,
            vx: (Math.random() - 0.5) * 1.6,
            vy: 0.3 + Math.random() * 0.7,
            scaleRate: 1.04,
            opacity: 0.5,
          });
        }
        break;

      case "spawn":
        this.spawn({ shape: "ring", x, y, color: "#ffffff", size: 26 * s, life: 7, scaleRate: 1.2, opacity: 0.8 });
        break;

      case "trail":
        this.spawn({
          shape: "dot",
          x,
          y,
          color: e.color ?? "#ffffff",
          size: 7 * (e.scale ?? 1),
          life: 9,
          scaleRate: 0.9,
          opacity: 0.7,
        });
        break;

      case "super":
        this.spawn({ shape: "ring", x, y, color: e.color ?? "#ffd06b", size: 90, life: 26, scaleRate: 1.14 });
        this.spawn({ shape: "ring", x, y, color: "#ffffff", size: 50, life: 20, scaleRate: 1.2, opacity: 0.8 });
        for (let i = 0; i < 18; i++) {
          this.spawn({
            shape: "shard",
            x: x + (Math.random() - 0.5) * 40,
            y: y - 40 + Math.random() * 20,
            color: e.color ?? "#ffd06b",
            size: 14 + Math.random() * 16,
            life: 26 + Math.random() * 16,
            vy: 3 + Math.random() * 4,
            vx: (Math.random() - 0.5) * 1.5,
            rot: Math.PI / 2,
            stretch: 2.6,
            scaleRate: 0.98,
          });
        }
        break;

      case "guardBreak":
        this.spawn({ shape: "ring", x, y, color: "#ff5c5c", size: 80, life: 18, scaleRate: 1.18 });
        this.burst(x, y, 14, "#ff8a8a", 4.4, 8, 24);
        break;

      case "ko":
        this.spawn({ shape: "ring", x, y, color: "#ffffff", size: 120, life: 24, scaleRate: 1.2 });
        this.burst(x, y, 22, "#ffd06b", 6, 10, 30);
        break;
    }
  }

  /** Ambient sparkle around a charged fighter. */
  aura(x: number, y: number, color: string) {
    this.spawn({
      shape: "shard",
      x: x + (Math.random() - 0.5) * 34,
      y: y + Math.random() * 20,
      color,
      size: 8 + Math.random() * 10,
      life: 18,
      vy: 1.4 + Math.random(),
      rot: Math.PI / 2,
      stretch: 2.4,
      scaleRate: 0.97,
      opacity: 0.85,
    });
  }

  update() {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life--;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        p.material.opacity = 0;
        continue;
      }
      p.vy -= p.gravity;
      p.mesh.position.x += p.vx;
      p.mesh.position.y += p.vy;
      p.mesh.rotation.z += p.spin;
      p.baseScaleX *= p.scaleRate;
      p.baseScaleY *= p.scaleRate;
      p.mesh.scale.set(p.baseScaleX, p.baseScaleY, 1);
      p.material.opacity = p.fade * Math.min(1, p.life / (p.maxLife * 0.6));
    }
  }

  clear() {
    for (const p of this.pool) {
      p.active = false;
      p.mesh.visible = false;
      p.material.opacity = 0;
    }
  }

  dispose() {
    for (const g of Object.values(this.geos)) g.dispose();
    for (const p of this.pool) p.material.dispose();
    this.glow.dispose();
  }

}
