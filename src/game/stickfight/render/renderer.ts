/**
 * Scene assembly: camera framing, stage, the two fighter rigs, projectiles and
 * effects. `render()` is called once per animation frame with the current
 * simulation state.
 */

import * as THREE from "three";
import { CAMERA, GROUND_Y, STAGE_HALF_WIDTH } from "../constants";
import { projectileArmed } from "../engine/match";
import type { Match, Projectile } from "../engine/match";
import { buildSkeleton } from "../skeleton";
import { FxSystem } from "./fx";
import { StickRig } from "./rig";
import { defaultQuality, PostFx } from "./post";
import { Stage, type StageTheme } from "./stage";

/**
 * "Reduced" still lets an impact read, just not as a full camera shake -
 * "off" removes the camera motion entirely for anyone sensitive to it, while
 * everything else (flash, hitstop, sparks) is untouched.
 */
function motionScale(motion: "full" | "reduced" | "off"): number {
  return motion === "off" ? 0 : motion === "reduced" ? 0.4 : 1;
}

function disposeTree(root: THREE.Object3D) {
  root.traverse((o: THREE.Object3D) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    if (m.material) (m.material as THREE.Material).dispose();
  });
}

function flat(color: THREE.ColorRepresentation, opacity = 1) {
  const translucent = opacity < 1;
  return new THREE.MeshBasicMaterial({
    color,
    transparent: translucent,
    opacity,
    depthTest: true,
    depthWrite: !translucent,
    side: THREE.DoubleSide,
  });
}

export class GameRenderer {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private stage: Stage;
  private rigs: [StickRig, StickRig];
  private fx = new FxSystem();
  private projectileMeshes = new Map<number, THREE.Object3D>();
  private projectileGroup = new THREE.Group();
  private debugGroup = new THREE.Group();
  private viewWidth = CAMERA.minViewWidth;
  private camX = 0;
  private aspect = 16 / 9;
  private post: PostFx | null = null;
  private quality: "high" | "low";
  /** Extra zoom applied by impacts, eased back out over a few frames. */
  private punch = 0;
  private lastShake = 0;
  /** How much of the simulation's own shake value actually reaches the camera. */
  private shakeScale: number;
  showBoxes = false;

  constructor(
    canvas: HTMLCanvasElement,
    match: Match,
    theme: StageTheme,
    quality?: "high" | "low",
    motion: "full" | "reduced" | "off" = "full",
  ) {
    this.quality = quality ?? defaultQuality();
    this.shakeScale = motionScale(motion);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.sortObjects = true;

    this.camera = new THREE.OrthographicCamera(-400, 400, 300, -100, -1000, 1000);
    this.camera.position.z = 100;

    this.stage = new Stage(theme);
    this.scene.add(this.stage.group);

    this.rigs = [new StickRig(match.fighters[0].def), new StickRig(match.fighters[1].def)];
    for (const rig of this.rigs) {
      this.scene.add(rig.shadowMesh);
      this.scene.add(rig.group);
      // Cloth and weapon trails simulate in world space.
      this.scene.add(rig.worldGroup);
    }

    // Projectiles, effects and debug boxes sit in front of the fighters on z.
    this.projectileGroup.position.z = 55;
    this.fx.group.position.z = 60;
    this.debugGroup.position.z = 90;
    this.scene.add(this.projectileGroup);
    this.scene.add(this.fx.group);
    this.scene.add(this.debugGroup);
  }

  /** Live draw-call / triangle counts, for profiling from the console. */
  get stats() {
    return { ...this.renderer.info.render, memory: { ...this.renderer.info.memory } };
  }

  setSize(width: number, height: number) {
    this.aspect = width / Math.max(1, height);
    this.renderer.setSize(width, height, false);
    // The effects chain does not need full retina resolution; capping it keeps
    // the cost roughly constant across displays.
    const pr = Math.min(this.renderer.getPixelRatio(), 1.25);
    if (this.quality === "high") {
      if (!this.post) {
        this.post = new PostFx(this.renderer, this.scene, this.camera, width * pr, height * pr);
      } else {
        this.post.setSize(width * pr, height * pr);
      }
    }
    this.updateCamera(this.viewWidth, this.camX, 0);
  }

  setMotion(motion: "full" | "reduced" | "off") {
    this.shakeScale = motionScale(motion);
  }

  setQuality(quality: "high" | "low") {
    if (quality === this.quality) return;
    this.quality = quality;
    if (quality === "low") {
      this.post?.dispose();
      this.post = null;
    }
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    this.setSize(size.x, size.y);
  }

  get currentQuality(): "high" | "low" {
    return this.quality;
  }

  /**
   * True when this context has no GPU behind it - a browser falling back to
   * SwiftShader or llvmpipe, or a machine with acceleration switched off.
   *
   * Worth asking up front rather than measuring: the effects chain runs a
   * bloom pass over the whole frame, which software rendering cannot do at
   * any playable rate. Waiting to find that out costs the player the first
   * few seconds of a round.
   */
  get softwareRendered(): boolean {
    const gl = this.renderer.getContext();
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(
      (info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || "",
    );
    return /swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(name);
  }

  private updateCamera(viewWidth: number, x: number, shake: number) {
    const halfW = viewWidth / 2;
    const halfH = halfW / this.aspect;
    const sx = shake > 0 ? (Math.random() - 0.5) * shake * 2.2 : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * shake * 1.6 : 0;
    const centerY = CAMERA.height + halfH * 0.18;
    this.camera.left = -halfW + x + sx;
    this.camera.right = halfW + x + sx;
    this.camera.top = centerY + halfH + sy;
    this.camera.bottom = centerY - halfH + sy;
    this.camera.updateProjectionMatrix();
  }

  render(match: Match) {
    // Camera framing follows the pair.
    const focus = match.cameraFocus();
    const want = Math.max(
      CAMERA.minViewWidth,
      Math.min(CAMERA.maxViewWidth, focus.spread + CAMERA.padding),
    );
    this.viewWidth += (want - this.viewWidth) * CAMERA.lerp;

    // A spike in screen shake means something heavy landed: punch the camera
    // in for a few frames, then let it breathe back out.
    const shake = match.shake * this.shakeScale;
    const spike = shake - this.lastShake;
    this.lastShake = shake;
    if (spike > 1.5) this.punch = Math.min(0.1, this.punch + spike * 0.012);
    this.punch *= 0.9;
    if (this.punch < 0.001) this.punch = 0;

    // Round-end pushes in on whoever is on the floor.
    let framed = this.viewWidth * (1 - this.punch);
    let focusX = focus.x;
    if (match.phase === "roundEnd" && match.lastResult?.winner !== null && match.lastResult) {
      const loser = match.fighters[match.lastResult.winner === 0 ? 1 : 0];
      const t = Math.min(1, match.phaseFrame / 70);
      framed = framed * (1 - 0.22 * t);
      focusX = focus.x + (loser.x - focus.x) * 0.65 * t;
    }

    const halfView = framed / 2;
    const clampX = Math.max(-STAGE_HALF_WIDTH + halfView - 60, Math.min(STAGE_HALF_WIDTH - halfView + 60, focusX));
    this.camX += (clampX - this.camX) * CAMERA.lerp;
    this.updateCamera(framed, this.camX, shake);
    this.stage.update(this.camX, 0);

    // Fighters.
    for (let i = 0; i < 2; i++) {
      const f = match.fighters[i];
      // A downed fighter is driven by the physics body instead of a clip.
      let sk;
      if (f.ragdoll) {
        sk = f.ragdoll.toSkeleton(f.x, f.y, f.facing);
      } else {
        const { pose, grounded } = f.pose();
        sk = buildSkeleton(pose, grounded, 1);
      }
      const visible = new Set(f.move?.showProps ?? []);
      const hidden = new Set(f.move?.hideProps ?? []);
      // Frame-ranged overrides, so a thrown weapon can actually leave the hand
      // on the frame it is thrown rather than for the whole move.
      for (const win of f.move?.propsAt ?? []) {
        if (f.moveFrame < win.from || f.moveFrame > win.to) continue;
        for (const id of win.show ?? []) {
          visible.add(id);
          hidden.delete(id);
        }
        for (const id of win.hide ?? []) {
          hidden.add(id);
          visible.delete(id);
        }
      }
      // A prop that is currently flying around as a projectile (the Spartan's
      // aspis) stays off the fighter until it is gone.
      for (const p of match.projectiles) {
        if (p.owner === i) hidden.add(p.kind);
      }
      // Whoever is swinging renders in front, so weapons never disappear
      // inside the other fighter.
      const depth = (f.state === "move" ? 3 : 0) + i * 0.5;
      // A weapon leaves a trail while its move is actually swinging.
      const swinging =
        f.state === "move" &&
        !!f.move?.hits?.some((h) => f.moveFrame >= h.from - 3 && f.moveFrame <= h.to + 2);
      this.rigs[i].update(sk, {
        x: f.x,
        y: f.y,
        z: depth,
        facing: f.facing,
        visibleProps: visible,
        hiddenProps: hidden,
        flash: f.flash,
        airborne: !f.grounded,
        speed: f.vx * f.facing,
        swinging,
      });

      // Meter aura once a super is available.
      if (f.meter >= 100 && match.frame % 4 === 0) {
        this.fx.aura(f.x, f.y + 10, f.def.palette.aura);
      }
      if (f.parrySuccess > 0) {
        f.parrySuccess--;
        if (f.parrySuccess % 3 === 0) this.fx.aura(f.x, f.y + 40, "#ffe9a8");
      }
    }

    this.syncProjectiles(match);

    for (const e of match.fx) {
      this.fx.emit(e);
      // Big, bright events wash the screen for a frame or two.
      if (this.post) {
        // Enough to register as a hit of light, not enough to lose the fight
        // behind it - a full-strength flash over bloom whites out the frame.
        if (e.kind === "super") this.post.punch(0.34, e.color ?? "#ffffff");
        else if (e.kind === "explode") this.post.punch(0.22, "#ffd06b");
        else if (e.kind === "ko") this.post.punch(0.3, "#ffffff");
        else if (e.kind === "parry") this.post.punch(0.18, "#ffe9a8");
        else if (e.kind === "guardBreak") this.post.punch(0.17, "#ff8a8a");
      }
    }
    this.fx.update();

    if (this.showBoxes) this.drawBoxes(match);
    else if (this.debugGroup.children.length) this.clearDebug();

    if (this.post) this.post.render(match.shake * this.shakeScale);
    else this.renderer.render(this.scene, this.camera);
  }

  // -------------------------------------------------------------------------

  private syncProjectiles(match: Match) {
    const seen = new Set<number>();
    for (const p of match.projectiles) {
      seen.add(p.id);
      let mesh = this.projectileMeshes.get(p.id);
      if (!mesh) {
        mesh = this.buildProjectile(p);
        this.projectileMeshes.set(p.id, mesh);
        this.projectileGroup.add(mesh);
      }
      mesh.position.set(p.x, p.y, 0);
      // A shot that has not armed yet passes through people, so it has to look
      // like it has not arrived - otherwise the first time one sails through
      // an opponent at point blank it reads as the game dropping a hit.
      // Small and faint while it is still leaving the barrel, full size the
      // instant it can hurt someone.
      const armed = projectileArmed(p);
      const grow = armed ? 1 : 0.55;
      mesh.scale.set(p.facing * grow, grow, 1);
      if (mesh.userData.armed !== armed) {
        mesh.userData.armed = armed;
        mesh.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.Material | undefined;
          if (!m || Array.isArray(m)) return;
          const base = (m.userData.baseOpacity ??= m.opacity);
          m.opacity = armed ? base : base * 0.35;
          m.transparent = m.opacity < 1;
          m.depthWrite = !m.transparent;
        });
      }
      if (p.spin) mesh.rotation.z += p.spin * 0.03;
      else if (p.gravity > 0) mesh.rotation.z = Math.atan2(p.vy, p.vx * p.facing);
    }
    const stale: number[] = [];
    this.projectileMeshes.forEach((mesh, id) => {
      if (seen.has(id)) return;
      this.projectileGroup.remove(mesh);
      disposeTree(mesh);
      stale.push(id);
    });
    for (const id of stale) this.projectileMeshes.delete(id);
  }

  private buildProjectile(p: Projectile): THREE.Object3D {
    const g = new THREE.Group();
    const color = p.spec.color ?? "#ffffff";
    const add = (mesh: THREE.Mesh, order = 55) => {
      mesh.renderOrder = order;
      g.add(mesh);
    };

    switch (p.kind) {
      case "pilum": {
        add(new THREE.Mesh(new THREE.PlaneGeometry(72, 3.4), flat("#8a6a3f")));
        const tip = new THREE.Mesh(new THREE.PlaneGeometry(22, 6), flat("#dfe6ee"));
        tip.position.x = 44;
        add(tip);
        const fin = new THREE.Mesh(new THREE.PlaneGeometry(10, 9), flat("#c0392b"));
        fin.position.x = -36;
        add(fin);
        break;
      }
      // A Greek throwing spear, kept visibly distinct from the Roman pilum
      // above: leaf blade rather than a pyramid point, bronze butt-spike, and
      // the leather throwing-loop a hoplite actually hurled one with.
      case "javelin": {
        add(new THREE.Mesh(new THREE.PlaneGeometry(66, 3), flat("#8a6238")));
        const blade = new THREE.Mesh(new THREE.PlaneGeometry(18, 7.5), flat("#d7dee6"));
        blade.position.x = 40;
        add(blade);
        const midrib = new THREE.Mesh(new THREE.PlaneGeometry(18, 1.6), flat("#eef2f6"));
        midrib.position.x = 40;
        add(midrib);
        const butt = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), flat("#a8823a"));
        butt.position.x = -32;
        add(butt);
        const loop = new THREE.Mesh(new THREE.PlaneGeometry(6, 8), flat("#5a3d22"));
        loop.position.x = -6;
        add(loop);
        break;
      }
      case "bullet":
      case "shot": {
        const body = new THREE.Mesh(new THREE.CircleGeometry(4.5, 12), flat(color));
        add(body);
        const streak = new THREE.Mesh(new THREE.PlaneGeometry(34, 3), flat(color, 0.55));
        streak.position.x = -18;
        add(streak);
        break;
      }
      case "hook": {
        add(new THREE.Mesh(new THREE.PlaneGeometry(38, 2.6), flat("#9aa4b1")));
        const claw = new THREE.Mesh(new THREE.PlaneGeometry(16, 5), flat(color));
        claw.position.x = 20;
        add(claw);
        const barb = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), flat(color));
        barb.position.set(16, -7);
        barb.rotation.z = 0.9;
        add(barb);
        break;
      }
      case "dynamite": {
        add(new THREE.Mesh(new THREE.PlaneGeometry(9, 22), flat("#a83b2a")));
        const band = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), flat("#e2c98a"));
        add(band);
        const fuse = new THREE.Mesh(new THREE.CircleGeometry(3.2, 10), flat("#ffcf6b"));
        fuse.position.y = 14;
        add(fuse);
        break;
      }
      case "axe": {
        // Throwing axe: haft with a broad head, spinning end over end.
        add(new THREE.Mesh(new THREE.PlaneGeometry(44, 3.4), flat("#6d4a2c")));
        const head = new THREE.Mesh(new THREE.PlaneGeometry(16, 22), flat(color));
        head.position.x = 16;
        add(head, 56);
        const beard = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), flat(color));
        beard.position.set(14, -14);
        add(beard, 56);
        break;
      }
      case "rifle": {
        // Tracer: a bright core with a long thin streak behind it.
        const core = new THREE.Mesh(new THREE.CircleGeometry(3.4, 10), flat(color));
        add(core, 57);
        const streak = new THREE.Mesh(new THREE.PlaneGeometry(46, 2.2), flat(color, 0.6));
        streak.position.x = -24;
        add(streak);
        break;
      }
      case "grenade": {
        add(new THREE.Mesh(new THREE.CircleGeometry(8, 12), flat(color)));
        const ridge = new THREE.Mesh(new THREE.PlaneGeometry(16, 2), flat("#2f3a24"));
        add(ridge, 56);
        const spoon = new THREE.Mesh(new THREE.PlaneGeometry(4, 9), flat("#8d8560"));
        spoon.position.set(6, 7);
        add(spoon, 56);
        break;
      }
      case "aspis": {
        // A spinning bronze shield: rim, face and the painted lambda.
        add(new THREE.Mesh(new THREE.CircleGeometry(21, 20), flat(color)));
        const face = new THREE.Mesh(new THREE.CircleGeometry(15, 20), flat("#9e2b2b"));
        add(face, 56);
        const boss = new THREE.Mesh(new THREE.CircleGeometry(5, 12), flat("#f0e6d2"));
        add(boss, 57);
        break;
      }
      case "shock": {
        // A low wedge of broken ground skimming along the floor.
        const wedge = new THREE.Shape();
        wedge.moveTo(-22, 0);
        wedge.lineTo(-6, 26);
        wedge.lineTo(6, 10);
        wedge.lineTo(18, 30);
        wedge.lineTo(24, 0);
        wedge.closePath();
        const rock = new THREE.Mesh(new THREE.ShapeGeometry(wedge), flat(color));
        add(rock);
        const dust = new THREE.Mesh(new THREE.CircleGeometry(12, 12), flat("#c9b28a", 0.55));
        dust.position.set(-14, 6);
        add(dust);
        break;
      }
      case "arrow": {
        add(new THREE.Mesh(new THREE.PlaneGeometry(52, 2.4), flat(color)));
        const head = new THREE.Shape();
        head.moveTo(14, 0);
        head.lineTo(0, 4.5);
        head.lineTo(0, -4.5);
        head.closePath();
        const tip = new THREE.Mesh(new THREE.ShapeGeometry(head), flat("#dfe6ee"));
        tip.position.x = 26;
        add(tip, 56);
        // Fletching: two swept vanes at the nock.
        for (const s of [1, -1]) {
          const vane = new THREE.Mesh(new THREE.PlaneGeometry(13, 4.5), flat("#b04a3a"));
          vane.position.set(-22, s * 3);
          vane.rotation.z = s * 0.22;
          add(vane);
        }
        break;
      }
      case "caltrop": {
        // Four spikes from a common centre - however it lands, one points up.
        for (let i = 0; i < 4; i++) {
          const spike = new THREE.Mesh(new THREE.PlaneGeometry(3, 15), flat(color));
          spike.position.y = 1;
          spike.rotation.z = (i / 4) * Math.PI * 2 + Math.PI / 4;
          spike.translateY(6);
          add(spike);
        }
        add(new THREE.Mesh(new THREE.CircleGeometry(3.4, 8), flat("#8b939d")), 56);
        break;
      }
      case "kunai": {
        // Leaf blade, short grip, ring on the pommel - end over end.
        const blade = new THREE.Shape();
        blade.moveTo(16, 0);
        blade.lineTo(0, 5);
        blade.lineTo(-6, 3);
        blade.lineTo(-6, -3);
        blade.lineTo(0, -5);
        blade.closePath();
        add(new THREE.Mesh(new THREE.ShapeGeometry(blade), flat(color)), 56);
        const grip = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.4), flat("#2b2f3d"));
        grip.position.x = -12;
        add(grip);
        const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 4.4, 10), flat("#2b2f3d"));
        ring.position.x = -20;
        add(ring);
        break;
      }
      case "smokebomb": {
        // A dark shell with a lit fuse, tumbling.
        add(new THREE.Mesh(new THREE.CircleGeometry(6.5, 12), flat("#3a3f4a")));
        const seam = new THREE.Mesh(new THREE.PlaneGeometry(13, 1.6), flat("#20242c"));
        add(seam, 56);
        const spark = new THREE.Mesh(new THREE.CircleGeometry(2.6, 8), flat("#ffcf6b"));
        spark.position.y = 8;
        add(spark, 57);
        break;
      }
      case "stone": {
        // A sling bullet is a river cobble, not a ball. Drawn as an irregular
        // lump so that at a glance it reads as picked up rather than made.
        const rock = new THREE.Shape();
        rock.moveTo(-8, 2);
        rock.lineTo(-4, 8);
        rock.lineTo(4, 7);
        rock.lineTo(9, 1);
        rock.lineTo(6, -6);
        rock.lineTo(-3, -8);
        rock.closePath();
        add(new THREE.Mesh(new THREE.ShapeGeometry(rock), flat(color)));
        const lit = new THREE.Mesh(new THREE.CircleGeometry(3, 8), flat("#d4d0c4", 0.7));
        lit.position.set(-2, 2);
        add(lit, 56);
        break;
      }
      case "javelin": {
        // Long shaft, narrow head, no fletching - a gaesum is thrown, not shot.
        add(new THREE.Mesh(new THREE.PlaneGeometry(62, 2.8), flat("#7a5f3a")));
        const head = new THREE.Shape();
        head.moveTo(18, 0);
        head.lineTo(-2, 3.6);
        head.lineTo(-2, -3.6);
        head.closePath();
        const tip = new THREE.Mesh(new THREE.ShapeGeometry(head), flat(color));
        tip.position.x = 22;
        add(tip, 56);
        const collar = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), flat("#8f979f"));
        collar.position.x = 14;
        add(collar, 56);
        const butt = new THREE.Mesh(new THREE.PlaneGeometry(5, 4.4), flat("#c08a3e"));
        butt.position.x = -30;
        add(butt);
        break;
      }
      case "cannon": {
        add(new THREE.Mesh(new THREE.CircleGeometry(11, 16), flat("#23262c")));
        const shine = new THREE.Mesh(new THREE.CircleGeometry(3.4, 10), flat("#6b727d"));
        shine.position.set(-3, 3);
        add(shine);
        break;
      }
      default: {
        add(new THREE.Mesh(new THREE.CircleGeometry(8, 14), flat(color)));
      }
    }

    const scale = p.spec.scale ?? 1;
    g.scale.setScalar(scale);
    return g;
  }

  // -------------------------------------------------------------------------

  private clearDebug() {
    for (const child of [...this.debugGroup.children]) {
      this.debugGroup.remove(child);
      const m = child as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material)?.dispose();
    }
  }

  private drawBoxes(match: Match) {
    this.clearDebug();
    const addBox = (b: { left: number; bottom: number; w: number; h: number }, color: string) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(b.w, b.h), flat(color, 0.32));
      mesh.position.set(b.left + b.w / 2, b.bottom + b.h / 2, 0);
      mesh.renderOrder = 90;
      this.debugGroup.add(mesh);
    };
    for (const f of match.fighters) {
      for (const h of f.hurtboxes()) addBox(h, "#3b82f6");
      for (const { box } of f.activeHits()) addBox(box, "#ef4444");
      addBox(f.pushbox(), "#22c55e");
    }
  }

  setStage(theme: StageTheme) {
    if (this.stage.theme === theme) return;
    this.scene.remove(this.stage.group);
    this.stage.dispose();
    this.stage = new Stage(theme);
    this.scene.add(this.stage.group);
  }

  resetEffects() {
    this.fx.clear();
    this.projectileMeshes.forEach((mesh) => {
      this.projectileGroup.remove(mesh);
      disposeTree(mesh);
    });
    this.projectileMeshes.clear();
  }

  dispose() {
    this.post?.dispose();
    this.post = null;
    this.clearDebug();
    this.fx.dispose();
    this.stage.dispose();
    for (const rig of this.rigs) rig.dispose();
    this.projectileMeshes.forEach((mesh) => disposeTree(mesh));
    this.projectileMeshes.clear();
    this.renderer.dispose();
  }
}

export { GROUND_Y };
