/**
 * Turns a Skeleton into three.js geometry: an inked stick-figure body with
 * blob hands and feet, the character's props, physics-driven cloth, and a
 * trail off the weapon while it swings.
 *
 * Layering is done with real depth (see ORDER); everything is unlit and flat,
 * which is what gives the game its 2D look inside a real 3D scene.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { BONES, type Skeleton } from "../skeleton";
import type { FighterDef, PropDef, ShapePart } from "../types";
import { ClothStrip } from "./cloth";
import {
  bootGeometry,
  handGeometry,
  headGeometry,
  headRingGeometry,
  limbGeometry,
  rigMaterial,
} from "./shapes";
import { WeaponTrail } from "./trail";

const ORDER = {
  cloth: 14,
  shadow: 10,
  backProp: 18,
  backLimb: 20,
  body: 30,
  frontLimb: 40,
  head: 46,
  face: 48,
  frontProp: 50,
  trail: 52,
};

const DEG = Math.PI / 180;
/** Thickness of the ink ring around the head. */
const HEAD_LINE = 2.8;
/** How far the light halo sticks out past the ink stroke. */
const PAPER = 0.85;
/** How far the ink line sticks out past a prop shape. */
const PROP_LINE = 1.2;

/**
 * Limb stroke widths: [nominal length, radius at the body end, radius at the
 * far end]. Thin on purpose - a stick figure is drawn with a pen, and the
 * costume props are what give a fighter their bulk.
 */
const LIMB: Record<string, [number, number, number]> = {
  thigh: [BONES.thigh, 2.9, 2.3],
  shin: [BONES.shin, 2.4, 1.9],
  upperArm: [BONES.upperArm, 2.5, 2.0],
  foreArm: [BONES.foreArm, 2.1, 1.7],
  spine: [BONES.spine, 3.4, 2.7],
  neck: [BONES.neck + BONES.headR * 0.55, 2.3, 2.1],
};

/**
 * One drawn limb: an ink stroke with a thin light halo behind it.
 *
 * The halo is what makes the ink work. A stick figure is ink on paper, and
 * without the paper a black stroke disappears against Neon Bazaar or the
 * Ember Forge - so every fighter carries a sliver of their own paper around.
 */
class Limb {
  readonly group = new THREE.Group();
  private fill: THREE.Mesh;
  private halo: THREE.Mesh;
  private nominal: number;

  readonly ink: string;

  constructor(
    nominal: number,
    rStart: number,
    rEnd: number,
    inkColor: string,
    paperColor: string,
    order: number,
  ) {
    this.nominal = nominal;
    this.ink = inkColor;

    this.halo = new THREE.Mesh(limbGeometry(nominal, rStart, rEnd, PAPER), rigMaterial(paperColor));
    this.halo.renderOrder = order - 1;
    this.halo.position.z = -0.5;

    this.fill = new THREE.Mesh(limbGeometry(nominal, rStart, rEnd), rigMaterial(inkColor));
    this.fill.renderOrder = order;

    this.group.add(this.halo, this.fill);
    this.group.position.z = order;
  }

  get material(): THREE.MeshBasicMaterial {
    return this.fill.material as THREE.MeshBasicMaterial;
  }

  get haloMaterial(): THREE.MeshBasicMaterial {
    return this.halo.material as THREE.MeshBasicMaterial;
  }

  set(ax: number, ay: number, bx: number, by: number) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 0.001;
    this.group.position.x = ax;
    this.group.position.y = ay;
    this.group.rotation.z = Math.atan2(dy, dx);
    // Bone lengths are fixed, so this is 1 except when a pose squashes the
    // body or a ragdoll stretches a joint.
    const stretch = len / this.nominal;
    this.fill.scale.x = stretch;
    this.halo.scale.x = stretch;
  }

  dispose() {
    this.fill.geometry.dispose();
    this.halo.geometry.dispose();
    (this.fill.material as THREE.Material).dispose();
    (this.halo.material as THREE.Material).dispose();
  }
}

interface PropMesh {
  def: PropDef;
  group: THREE.Group;
  cloth?: ClothStrip;
}

export class StickRig {
  readonly group = new THREE.Group();
  /** Cloth and trails live in world space, so they sit outside the body group. */
  readonly worldGroup = new THREE.Group();

  private limbs: Record<string, Limb> = {};
  private head!: THREE.Mesh;
  private headOutline!: THREE.Mesh;
  private hands: THREE.Mesh[] = [];
  private handOutlines: THREE.Mesh[] = [];
  private boots: THREE.Mesh[] = [];
  private bootOutlines: THREE.Mesh[] = [];
  private shadow!: THREE.Mesh;
  private props: PropMesh[] = [];
  private materials: THREE.Material[] = [];
  private propInk!: THREE.MeshBasicMaterial;
  private trail: WeaponTrail | null = null;
  private trailReach = 0;
  private trailAttach: "handF" | "handB" = "handF";
  private def: FighterDef;
  private scale: number;

  constructor(def: FighterDef) {
    this.def = def;
    this.scale = def.stats.scale;
    const p = def.palette;

    // The ink the whole figure is drawn in. Back limbs get a slightly washed
    // version of it so an arm behind the body still separates.
    const ink = p.outline;
    const backInk = "#" + new THREE.Color(ink).lerp(new THREE.Color(p.cloth), 0.32).getHexString();
    // "Paper": the fighter's own skin tone pulled a fifth of the way towards
    // the ink. Left pure it reads as a chalk outline drawn round the figure;
    // knocked back it reads as the edge of the stroke itself.
    const paper = "#" + new THREE.Color(p.body).lerp(new THREE.Color(ink), 0.2).getHexString();
    const backPaper = "#" + new THREE.Color(paper).lerp(new THREE.Color("#000000"), 0.3).getHexString();

    // One material for every prop outline in the rig - they are all the same
    // flat ink, so there is no reason to make one per part.
    this.propInk = rigMaterial(ink);
    this.materials.push(this.propInk);

    const addLimb = (name: string, spec: [number, number, number], back: boolean, order: number) => {
      const limb = new Limb(
        spec[0],
        spec[1],
        spec[2],
        back ? backInk : ink,
        back ? backPaper : paper,
        order,
      );
      this.materials.push(limb.material, limb.haloMaterial);
      this.group.add(limb.group);
      this.limbs[name] = limb;
    };

    addLimb("thighB", LIMB.thigh, true, ORDER.backLimb);
    addLimb("shinB", LIMB.shin, true, ORDER.backLimb + 1);
    addLimb("upperArmB", LIMB.upperArm, true, ORDER.backLimb + 2);
    addLimb("foreArmB", LIMB.foreArm, true, ORDER.backLimb + 3);
    addLimb("spine", LIMB.spine, false, ORDER.body);
    addLimb("neck", LIMB.neck, false, ORDER.body + 1);
    addLimb("thighF", LIMB.thigh, false, ORDER.frontLimb);
    addLimb("shinF", LIMB.shin, false, ORDER.frontLimb + 1);
    addLimb("upperArmF", LIMB.upperArm, false, ORDER.frontLimb + 2);
    addLimb("foreArmF", LIMB.foreArm, false, ORDER.frontLimb + 3);

    // Hands and feet: solid ink blobs on the ends of the strokes.
    for (let i = 0; i < 2; i++) {
      const back = i === 1;
      const order = back ? ORDER.backLimb + 4 : ORDER.frontLimb + 4;
      const blobInk = back ? backInk : ink;
      const blobPaper = back ? backPaper : paper;

      const handHalo = new THREE.Mesh(handGeometry(4.6, PAPER), rigMaterial(blobPaper));
      handHalo.renderOrder = order - 1;
      handHalo.position.z = order - 0.5;
      const hand = new THREE.Mesh(handGeometry(4.6), rigMaterial(blobInk));
      hand.userData.ink = blobInk;
      hand.renderOrder = order;
      hand.position.z = order;
      this.materials.push(hand.material as THREE.Material, handHalo.material as THREE.Material);
      this.group.add(handHalo, hand);
      this.hands.push(hand);
      this.handOutlines.push(handHalo);

      const bootHalo = new THREE.Mesh(bootGeometry(BONES.foot + 5, 9, PAPER), rigMaterial(blobPaper));
      bootHalo.renderOrder = order - 1;
      bootHalo.position.z = order - 0.5;
      const boot = new THREE.Mesh(bootGeometry(BONES.foot + 5, 9), rigMaterial(blobInk));
      boot.userData.ink = blobInk;
      boot.renderOrder = order;
      boot.position.z = order;
      this.materials.push(boot.material as THREE.Material, bootHalo.material as THREE.Material);
      this.group.add(bootHalo, boot);
      this.boots.push(boot);
      this.bootOutlines.push(bootHalo);
    }

    // Head: an open circle - a pale disc with a heavy ink ring on top of it.
    this.head = new THREE.Mesh(headGeometry(BONES.headR), rigMaterial(p.body));
    this.head.renderOrder = ORDER.head;
    this.head.position.z = ORDER.head;
    this.materials.push(this.head.material as THREE.Material);

    this.headOutline = new THREE.Mesh(headRingGeometry(BONES.headR, HEAD_LINE), rigMaterial(ink));
    this.headOutline.renderOrder = ORDER.face;
    this.headOutline.position.z = ORDER.face;
    this.materials.push(this.headOutline.material as THREE.Material);
    this.group.add(this.head, this.headOutline);

    // Ground shadow --------------------------------------------------------
    const shadowMat = rigMaterial("#000000", { opacity: 0.3 });
    this.materials.push(shadowMat);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 20), shadowMat);
    this.shadow.renderOrder = ORDER.shadow;

    // Props, cloth and trail ----------------------------------------------
    for (const prop of def.props) {
      const g = this.buildProp(prop);
      const entry: PropMesh = { def: prop, group: g };
      if (prop.cloth) {
        entry.cloth = new ClothStrip(prop.cloth, ORDER.cloth);
        this.worldGroup.add(entry.cloth.mesh);
      }
      this.props.push(entry);
      this.group.add(g);

      // The furthest point of a hand-held prop is the weapon tip.
      if (prop.attach === "handF" || prop.attach === "handB") {
        const reach = Math.max(...prop.parts.map((part) => partReach(part)));
        if (reach > this.trailReach) {
          this.trailReach = reach;
          this.trailAttach = prop.attach;
        }
      }
    }

    if (this.trailReach > 24) {
      this.trail = new WeaponTrail(def.palette.metal, ORDER.trail);
      this.worldGroup.add(this.trail.mesh);
    }
  }

  get shadowMesh(): THREE.Mesh {
    return this.shadow;
  }

  private buildProp(def: PropDef): THREE.Group {
    const g = new THREE.Group();

    // Every piece of kit gets the same ink line the body is drawn with, so a
    // helmet or an axe head reads as part of the same drawing rather than a
    // coloured sticker laid over it. All of a prop's lines are the same flat
    // ink at the same depth, so they are merged into one mesh per layer -
    // otherwise a fighter in full armour costs a hundred extra draw calls for
    // what is visually a single silhouette.
    for (const behind of [true, false]) {
      const parts = def.parts.filter((part) => !!part.behind === behind);
      if (parts.length === 0) continue;
      const outlines = parts.map((part) => {
        const geo = partGeometry(part, PROP_LINE);
        geo.applyMatrix4(
          new THREE.Matrix4()
            .makeRotationZ((part.rot ?? 0) * DEG)
            .premultiply(new THREE.Matrix4().makeTranslation(part.pos[0], part.pos[1], 0)),
        );
        return geo;
      });
      const merged = mergeGeometries(outlines, false);
      for (const geo of outlines) geo.dispose();
      if (!merged) continue;
      const order = behind ? ORDER.backProp : ORDER.frontProp;
      const line = new THREE.Mesh(merged, this.propInk);
      line.renderOrder = order - 1;
      line.position.z = order - 0.5;
      g.add(line);
    }

    for (const part of def.parts) {
      const order = part.behind ? ORDER.backProp : ORDER.frontProp + (part.z ?? 0);
      const mesh = this.buildPart(part);
      mesh.renderOrder = order;
      mesh.position.z = order;
      g.add(mesh);
    }
    return g;
  }

  private buildPart(part: ShapePart): THREE.Mesh {
    const color = part.color ?? this.def.palette.metal;
    const geo = partGeometry(part, 0);
    // Props get an across-the-form gradient so they sit in the same world as
    // the body. Round shapes get a softer one - a boss or a pommel is a dome,
    // not a flat plate.
    applyPartShading(
      geo,
      color,
      part.geo === "disc" || part.geo === "sphere" ? 0.55 : 1,
      (part.rot ?? 0) * DEG,
    );
    const mat = rigMaterial(color, { vertexColors: true });
    this.materials.push(mat);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(part.pos[0], part.pos[1], 0);
    if (part.rot) mesh.rotation.z = part.rot * DEG;
    return mesh;
  }

  /**
   * Applies a posed skeleton.
   */
  update(
    sk: Skeleton,
    opts: {
      x: number;
      y: number;
      z?: number;
      facing: 1 | -1;
      visibleProps: Set<string>;
      hiddenProps: Set<string>;
      flash: number;
      airborne: boolean;
      /** Horizontal speed, used to make cloth trail behind movement. */
      speed?: number;
      /** True while an attack is live, so the weapon leaves a trail. */
      swinging?: boolean;
    },
  ) {
    const g = this.group;
    g.position.set(opts.x, opts.y, opts.z ?? 0);
    g.scale.set(opts.facing * this.scale, this.scale, 1);
    g.rotation.z = sk.spin * DEG;

    const L = this.limbs;
    L.thighB.set(sk.pelvis.x, sk.pelvis.y, sk.kneeB.x, sk.kneeB.y);
    L.shinB.set(sk.kneeB.x, sk.kneeB.y, sk.footB.x, sk.footB.y);
    L.upperArmB.set(sk.neck.x, sk.neck.y, sk.elbowB.x, sk.elbowB.y);
    L.foreArmB.set(sk.elbowB.x, sk.elbowB.y, sk.handB.x, sk.handB.y);
    L.spine.set(sk.pelvis.x, sk.pelvis.y, sk.neck.x, sk.neck.y);
    L.neck.set(sk.neck.x, sk.neck.y, sk.head.x, sk.head.y);
    L.thighF.set(sk.pelvis.x, sk.pelvis.y, sk.kneeF.x, sk.kneeF.y);
    L.shinF.set(sk.kneeF.x, sk.kneeF.y, sk.footF.x, sk.footF.y);
    L.upperArmF.set(sk.neck.x, sk.neck.y, sk.elbowF.x, sk.elbowF.y);
    L.foreArmF.set(sk.elbowF.x, sk.elbowF.y, sk.handF.x, sk.handF.y);

    // Hands follow the forearm; boots follow the shin.
    const placeHand = (i: number, x: number, y: number, angle: number) => {
      this.hands[i].position.set(x, y, this.hands[i].position.z);
      this.handOutlines[i].position.set(x, y, this.handOutlines[i].position.z);
      this.hands[i].rotation.z = (angle - 90) * DEG;
      this.handOutlines[i].rotation.z = this.hands[i].rotation.z;
    };
    placeHand(0, sk.handF.x, sk.handF.y, sk.foreAngleF);
    placeHand(1, sk.handB.x, sk.handB.y, sk.foreAngleB);

    const placeBoot = (i: number, foot: { x: number; y: number }, toe: { x: number; y: number }) => {
      const angle = Math.atan2(toe.y - foot.y, toe.x - foot.x);
      this.boots[i].position.set(foot.x, foot.y, this.boots[i].position.z);
      this.bootOutlines[i].position.set(foot.x, foot.y, this.bootOutlines[i].position.z);
      this.boots[i].rotation.z = angle;
      this.bootOutlines[i].rotation.z = angle;
    };
    placeBoot(0, sk.footF, sk.toeF);
    placeBoot(1, sk.footB, sk.toeB);

    // Head, with the face turned along the body's facing.
    const headAngle = (sk.torsoAngle + (sk.head.x - sk.neck.x) * 0.4) * DEG;
    this.head.position.set(sk.head.x, sk.head.y, this.head.position.z);
    this.headOutline.position.set(sk.head.x, sk.head.y, this.headOutline.position.z);
    this.head.rotation.z = -headAngle * 0.35;
    this.headOutline.rotation.z = this.head.rotation.z;

    // Props ---------------------------------------------------------------
    for (const prop of this.props) {
      const visible =
        (!prop.def.conditional || opts.visibleProps.has(prop.def.id)) && !opts.hiddenProps.has(prop.def.id);
      prop.group.visible = visible;
      if (prop.cloth) prop.cloth.mesh.visible = visible;
      if (!visible) continue;
      const t = attachTransform(sk, prop.def.attach);
      prop.group.position.set(t.x, t.y, prop.group.position.z);
      prop.group.rotation.z = t.rot * DEG;

      if (prop.cloth) {
        // Cloth is simulated in world space so it keeps its own momentum.
        const wx = opts.x + t.x * opts.facing * this.scale;
        const wy = opts.y + t.y * this.scale;
        prop.cloth.update(wx, wy, opts.facing, opts.speed ?? 0);
      }
    }

    // Weapon trail --------------------------------------------------------
    if (this.trail) {
      const attach = attachTransform(sk, this.trailAttach);
      if (opts.swinging) {
        const a = attach.rot * DEG;
        const tipLocalX = attach.x + Math.cos(a) * this.trailReach;
        const tipLocalY = attach.y + Math.sin(a) * this.trailReach;
        this.trail.push(
          opts.x + tipLocalX * opts.facing * this.scale,
          opts.y + tipLocalY * this.scale,
          opts.x + attach.x * opts.facing * this.scale,
          opts.y + attach.y * this.scale,
        );
      } else {
        this.trail.fade();
      }
      this.trail.update();
    }

    // Ground shadow shrinks as the fighter rises.
    const lift = Math.max(0, opts.y);
    const shrink = Math.max(0.35, 1 - lift / 260);
    this.shadow.position.set(opts.x, 1.5, ORDER.shadow + (opts.z ?? 0));
    this.shadow.scale.set(26 * shrink * this.scale, 6 * shrink, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.3 * shrink;

    // White flash when hit.
    const flash = opts.flash > 0 ? Math.min(1, opts.flash / 8) : 0;
    const white = new THREE.Color("#ffffff");
    const applyFlash = (mat: THREE.MeshBasicMaterial, base: string) => {
      const c = new THREE.Color(base);
      if (flash > 0) c.lerp(white, flash * 0.8);
      mat.color.copy(c);
    };
    for (const limb of Object.values(this.limbs)) applyFlash(limb.material, limb.ink);
    for (const blob of [...this.hands, ...this.boots]) {
      applyFlash(blob.material as THREE.MeshBasicMaterial, (blob.userData.ink as string) ?? this.def.palette.outline);
    }
    applyFlash(this.head.material as THREE.MeshBasicMaterial, this.def.palette.body);
  }

  clearTrail() {
    this.trail?.clear();
  }

  dispose() {
    for (const limb of Object.values(this.limbs)) limb.dispose();
    for (const m of [...this.hands, ...this.handOutlines, ...this.boots, ...this.bootOutlines]) {
      m.geometry.dispose();
    }
    this.head.geometry.dispose();
    this.headOutline.geometry.dispose();
    this.shadow.geometry.dispose();
    for (const prop of this.props) {
      prop.cloth?.dispose();
      prop.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
    }
    this.trail?.dispose();
    for (const m of this.materials) m.dispose();
  }
}

/**
 * Shades a prop across its own height. The top eighth gets a hot band rather
 * than the top of a linear ramp - that hard bright edge is what makes bronze
 * and steel read as bevelled metal instead of a coloured rectangle.
 */
function applyPartShading(
  geo: THREE.BufferGeometry,
  color: THREE.ColorRepresentation,
  strength = 1,
  rot = 0,
) {
  const pos = geo.getAttribute("position");
  const base = new THREE.Color(color);
  const white = new THREE.Color("#ffffff");
  const black = new THREE.Color("#000000");
  const light = base.clone().lerp(white, 0.2 * strength);
  const hot = base.clone().lerp(white, 0.5 * strength);
  const dark = base.clone().lerp(black, 0.38 * strength);
  // Light comes from above the fighter, not from above the shape, so the ramp
  // is measured along the part's own rotation. Without this a spear rotated
  // flat would shade from butt to tip instead of across its thickness.
  const sin = Math.sin(rot);
  const cos = Math.cos(rot);
  const up = (i: number) => pos.getX(i) * sin + pos.getY(i) * cos;
  let minUp = Infinity;
  let maxUp = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const u = up(i);
    if (u < minUp) minUp = u;
    if (u > maxUp) maxUp = u;
  }
  const span = Math.max(0.0001, maxUp - minUp);
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = (up(i) - minUp) / span;
    if (t > 0.88) c.copy(light).lerp(hot, (t - 0.88) / 0.12);
    else c.copy(dark).lerp(light, Math.pow(t / 0.88, 0.7));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

/**
 * Geometry for one prop shape. `grow` inflates it evenly on every side, which
 * is how the ink line behind a part is built - scaling the mesh would fatten a
 * long blade along its length instead of around its edge.
 */
function partGeometry(part: ShapePart, grow: number): THREE.BufferGeometry {
  const g = grow;
  switch (part.geo) {
    case "cyl":
      return new THREE.PlaneGeometry(part.size[0] * 2 + g * 2, part.size[1] + g * 2);
    case "sphere":
    case "disc":
      return new THREE.CircleGeometry(part.size[0] + g, 18);
    case "cone":
    case "tri": {
      const w = part.size[0] * (part.geo === "cone" ? 2 : 1) + g * 2;
      const h = part.size[1] + g * 2;
      const shape = new THREE.Shape();
      shape.moveTo(-w / 2, -h / 2);
      shape.lineTo(w / 2, -h / 2);
      shape.lineTo(0, h / 2);
      shape.closePath();
      return new THREE.ShapeGeometry(shape);
    }
    case "ring": {
      const r = part.size[0] + g;
      const t = part.size[1] + g * 2;
      return new THREE.RingGeometry(Math.max(0.01, r - t), r, 30);
    }
    case "poly": {
      // Grown by pushing every point out along its direction from the centroid,
      // which is close enough to a real offset for shapes this size.
      const pts = part.size;
      const n = Math.floor(pts.length / 2);
      let cx = 0;
      let cy = 0;
      for (let i = 0; i < n; i++) {
        cx += pts[i * 2];
        cy += pts[i * 2 + 1];
      }
      cx /= n;
      cy /= n;
      const shape = new THREE.Shape();
      for (let i = 0; i < n; i++) {
        const dx = pts[i * 2] - cx;
        const dy = pts[i * 2 + 1] - cy;
        const d = Math.hypot(dx, dy) || 1;
        const x = pts[i * 2] + (dx / d) * g;
        const y = pts[i * 2 + 1] + (dy / d) * g;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      return new THREE.ShapeGeometry(shape);
    }
    case "blade": {
      const len = part.size[0] + g * 2;
      const w = part.size[1] + g * 2;
      const taper = part.size[2] ?? 0.5;
      const shape = new THREE.Shape();
      shape.moveTo(-len / 2, -w / 2);
      shape.quadraticCurveTo(0, -w * 0.9, len / 2, -w * taper * 0.4);
      shape.lineTo(len / 2 + w * 0.7, 0);
      shape.lineTo(len / 2, w * taper);
      shape.quadraticCurveTo(0, w * 0.6, -len / 2, w / 2);
      shape.closePath();
      return new THREE.ShapeGeometry(shape, 12);
    }
    default:
      return new THREE.PlaneGeometry(part.size[0] + g * 2, (part.size[1] ?? part.size[0]) + g * 2);
  }
}

/** How far a prop part reaches from its attachment point. */
function partReach(part: ShapePart): number {
  if (part.geo === "poly") {
    let max = 0;
    for (let i = 0; i < part.size.length; i += 2) max = Math.max(max, Math.abs(part.size[i]));
    return part.pos[0] + max;
  }
  if (part.geo === "ring") return part.pos[0] + part.size[0];
  const half = part.geo === "cyl" ? part.size[1] / 2 : Math.max(part.size[0], part.size[1] ?? 0) / 2;
  return part.pos[0] + half;
}

/** Rotation, in degrees, that lines a prop's +y up with the shin. */
function shinAngle(knee: { x: number; y: number }, foot: { x: number; y: number }): number {
  return (Math.atan2(knee.y - foot.y, knee.x - foot.x) * 180) / Math.PI - 90;
}

/** Where a prop sits on the body, in facing space. */
export function attachTransform(sk: Skeleton, attach: PropDef["attach"]): { x: number; y: number; rot: number } {
  switch (attach) {
    case "head":
      return { x: sk.head.x, y: sk.head.y, rot: -sk.torsoAngle * 0.6 };
    case "neck":
      return { x: sk.neck.x, y: sk.neck.y, rot: -sk.torsoAngle };
    case "torso":
      return {
        x: (sk.pelvis.x + sk.neck.x) / 2,
        y: (sk.pelvis.y + sk.neck.y) / 2,
        rot: -sk.torsoAngle,
      };
    case "pelvis":
      return { x: sk.pelvis.x, y: sk.pelvis.y, rot: -sk.torsoAngle * 0.5 };
    case "handF":
      return { x: sk.handF.x, y: sk.handF.y, rot: sk.foreAngleF - 90 + sk.weapon };
    case "handB":
      return { x: sk.handB.x, y: sk.handB.y, rot: sk.foreAngleB - 90 + sk.weaponBack };
    case "forearmF":
      return {
        x: (sk.elbowF.x + sk.handF.x) / 2,
        y: (sk.elbowF.y + sk.handF.y) / 2,
        rot: sk.foreAngleF - 90,
      };
    case "forearmB":
      return {
        x: (sk.elbowB.x + sk.handB.x) / 2,
        y: (sk.elbowB.y + sk.handB.y) / 2,
        rot: sk.foreAngleB - 90,
      };
    case "back":
      return { x: sk.neck.x, y: sk.neck.y - 12, rot: -sk.torsoAngle };
    // Greaves, ankle wraps and spurs hang off the ankle but belong to the
    // shin, so they turn with it - otherwise a raised knee leaves the greave
    // standing upright in mid air next to the leg.
    case "footF":
      return { x: sk.footF.x, y: sk.footF.y, rot: shinAngle(sk.kneeF, sk.footF) };
    case "footB":
      return { x: sk.footB.x, y: sk.footB.y, rot: shinAngle(sk.kneeB, sk.footB) };
    default:
      return { x: 0, y: 0, rot: 0 };
  }
}
