/**
 * Cloth strips - capes, coat tails, crests and cloaks.
 *
 * Each strip is a short verlet chain pinned to a joint on the fighter. It
 * inherits whatever the body does, so a cape lags behind a dash, snaps when the
 * fighter reverses, and settles when they stand still. The strip is drawn as a
 * tapering ribbon whose vertices are rewritten each frame.
 */

import * as THREE from "three";
import { rigMaterial } from "./shapes";

export interface ClothDef {
  /** Number of chain segments. 4-6 looks good; more costs vertices. */
  segments: number;
  /** Length of each segment in units. */
  segmentLength: number;
  /** Width at the anchor; the free end tapers to `endWidth`. */
  width: number;
  endWidth?: number;
  color: string;
  /** Secondary colour drawn as a thin lining down one edge. */
  lining?: string;
  /** How strongly gravity pulls, relative to the fighter's own gravity. */
  gravity?: number;
  /** 0..1 - higher keeps the strip straighter behind the anchor. */
  stiffness?: number;
  /** Constant sideways push, in facing space (negative trails behind). */
  drift?: number;
}

interface Node {
  x: number;
  y: number;
  px: number;
  py: number;
}

export class ClothStrip {
  readonly mesh: THREE.Mesh;
  private nodes: Node[] = [];
  private def: Required<Omit<ClothDef, "lining" | "color">> & { color: string; lining?: string };
  private positions: Float32Array;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshBasicMaterial;
  private seeded = false;

  constructor(def: ClothDef, renderOrder: number) {
    this.def = {
      segments: def.segments,
      segmentLength: def.segmentLength,
      width: def.width,
      endWidth: def.endWidth ?? def.width * 0.45,
      color: def.color,
      lining: def.lining,
      gravity: def.gravity ?? 0.42,
      stiffness: def.stiffness ?? 0.35,
      drift: def.drift ?? -0.25,
    };

    for (let i = 0; i <= this.def.segments; i++) {
      this.nodes.push({ x: 0, y: -i * this.def.segmentLength, px: 0, py: -i * this.def.segmentLength });
    }

    // Two vertices per node, drawn as a triangle strip of quads.
    const quads = this.def.segments;
    this.positions = new Float32Array((quads * 6) * 3);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));

    const colors = new Float32Array((quads * 6) * 3);
    const base = new THREE.Color(this.def.color);
    const dark = base.clone().multiplyScalar(0.72);
    for (let q = 0; q < quads; q++) {
      // Far end of the strip is slightly darker, so it reads as depth.
      const t0 = q / quads;
      const t1 = (q + 1) / quads;
      const c0 = base.clone().lerp(dark, t0);
      const c1 = base.clone().lerp(dark, t1);
      const order = [c0, c0, c1, c0, c1, c1];
      for (let v = 0; v < 6; v++) {
        colors[(q * 6 + v) * 3] = order[v].r;
        colors[(q * 6 + v) * 3 + 1] = order[v].g;
        colors[(q * 6 + v) * 3 + 2] = order[v].b;
      }
    }
    this.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    this.material = rigMaterial(this.def.color, { vertexColors: true });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.renderOrder = renderOrder;
    this.mesh.position.z = renderOrder;
    this.mesh.frustumCulled = false;
  }

  /**
   * Advances the simulation. The anchor is in world space; `facing` flips the
   * drift so a cape always trails behind the fighter.
   */
  update(anchorX: number, anchorY: number, facing: 1 | -1, moving: number) {
    const d = this.def;

    if (!this.seeded) {
      for (let i = 0; i < this.nodes.length; i++) {
        const n = this.nodes[i];
        n.x = n.px = anchorX - facing * i * d.segmentLength * 0.35;
        n.y = n.py = anchorY - i * d.segmentLength * 0.9;
      }
      this.seeded = true;
    }

    // Verlet step.
    for (let i = 1; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const vx = (n.x - n.px) * 0.94;
      const vy = (n.y - n.py) * 0.94;
      n.px = n.x;
      n.py = n.y;
      n.x += vx + facing * (d.drift + moving * -0.55);
      n.y += vy - d.gravity;
    }

    // Pin the head of the chain and solve segment lengths.
    this.nodes[0].x = anchorX;
    this.nodes[0].y = anchorY;
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < this.nodes.length - 1; i++) {
        const a = this.nodes[i];
        const b = this.nodes[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const diff = (dist - d.segmentLength) / dist;
        const move = i === 0 ? 1 : 0.5;
        if (i > 0) {
          a.x += dx * diff * 0.5;
          a.y += dy * diff * 0.5;
        }
        b.x -= dx * diff * move;
        b.y -= dy * diff * move;
      }
      // Stiffness pulls the strip back towards hanging straight down-behind.
      for (let i = 1; i < this.nodes.length; i++) {
        const target = {
          x: anchorX - facing * i * d.segmentLength * 0.3,
          y: anchorY - i * d.segmentLength * 0.92,
        };
        this.nodes[i].x += (target.x - this.nodes[i].x) * d.stiffness * 0.25;
        this.nodes[i].y += (target.y - this.nodes[i].y) * d.stiffness * 0.25;
      }
      // Never let cloth sink through the floor.
      for (const n of this.nodes) if (n.y < 1) n.y = 1;
    }

    this.writeGeometry();
  }

  private writeGeometry() {
    const d = this.def;
    const pos = this.positions;
    let o = 0;

    for (let i = 0; i < this.nodes.length - 1; i++) {
      const a = this.nodes[i];
      const b = this.nodes[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 0.0001;
      // Perpendicular to the segment, scaled by the taper at each end.
      const nx = -dy / len;
      const ny = dx / len;
      const t0 = i / (this.nodes.length - 1);
      const t1 = (i + 1) / (this.nodes.length - 1);
      const w0 = (d.width + (d.endWidth - d.width) * t0) / 2;
      const w1 = (d.width + (d.endWidth - d.width) * t1) / 2;

      const ax0 = a.x + nx * w0;
      const ay0 = a.y + ny * w0;
      const ax1 = a.x - nx * w0;
      const ay1 = a.y - ny * w0;
      const bx0 = b.x + nx * w1;
      const by0 = b.y + ny * w1;
      const bx1 = b.x - nx * w1;
      const by1 = b.y - ny * w1;

      const push = (x: number, y: number) => {
        pos[o++] = x;
        pos[o++] = y;
        pos[o++] = 0;
      };
      push(ax0, ay0);
      push(ax1, ay1);
      push(bx0, by0);
      push(ax1, ay1);
      push(bx1, by1);
      push(bx0, by0);
    }

    this.geometry.getAttribute("position").needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
