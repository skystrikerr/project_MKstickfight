/**
 * Weapon trails: a fading ribbon that follows the tip of a swinging weapon.
 *
 * The renderer feeds it the tip position each frame while an attack is live;
 * the ribbon tapers and fades along its length so a fast arc leaves a streak
 * without smearing the whole screen.
 */

import * as THREE from "three";

const MAX_POINTS = 10;

interface TrailPoint {
  x: number;
  y: number;
  /** The base of the weapon, so the ribbon has width along the blade. */
  bx: number;
  by: number;
  life: number;
}

export class WeaponTrail {
  readonly mesh: THREE.Mesh;
  private points: TrailPoint[] = [];
  private positions: Float32Array;
  private colors: Float32Array;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshBasicMaterial;
  private color: THREE.Color;

  constructor(color: string, renderOrder: number) {
    this.color = new THREE.Color(color);
    this.positions = new Float32Array(MAX_POINTS * 6 * 3);
    this.colors = new Float32Array(MAX_POINTS * 6 * 3);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.renderOrder = renderOrder;
    this.mesh.position.z = renderOrder;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }

  /** Records the current tip/base of the weapon. */
  push(tipX: number, tipY: number, baseX: number, baseY: number) {
    this.points.push({ x: tipX, y: tipY, bx: baseX, by: baseY, life: 1 });
    if (this.points.length > MAX_POINTS) this.points.shift();
  }

  /** Fades the ribbon out when the swing is over. */
  fade() {
    for (const p of this.points) p.life -= 0.16;
    this.points = this.points.filter((p) => p.life > 0);
  }

  clear() {
    this.points.length = 0;
    this.mesh.visible = false;
  }

  update() {
    if (this.points.length < 2) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;

    let o = 0;
    let c = 0;
    const quads = this.points.length - 1;
    for (let i = 0; i < quads; i++) {
      const a = this.points[i];
      const b = this.points[i + 1];
      // Older samples are narrower and dimmer.
      const t0 = (i / quads) * a.life;
      const t1 = ((i + 1) / quads) * b.life;

      const ax0 = a.bx + (a.x - a.bx) * 0.35;
      const ay0 = a.by + (a.y - a.by) * 0.35;
      const bx0 = b.bx + (b.x - b.bx) * 0.35;
      const by0 = b.by + (b.y - b.by) * 0.35;

      const push = (x: number, y: number, alpha: number) => {
        this.positions[o++] = x;
        this.positions[o++] = y;
        this.positions[o++] = 0;
        this.colors[c++] = this.color.r * alpha;
        this.colors[c++] = this.color.g * alpha;
        this.colors[c++] = this.color.b * alpha;
      };

      push(ax0, ay0, t0 * 0.5);
      push(a.x, a.y, t0);
      push(b.x, b.y, t1);
      push(ax0, ay0, t0 * 0.5);
      push(b.x, b.y, t1);
      push(bx0, by0, t1 * 0.5);
    }
    // Collapse any unused quads onto a point so they draw nothing.
    while (o < this.positions.length) {
      this.positions[o++] = 0;
      this.colors[c++] = 0;
    }

    this.geometry.getAttribute("position").needsUpdate = true;
    this.geometry.getAttribute("color").needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
