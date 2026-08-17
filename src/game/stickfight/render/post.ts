/**
 * Post-processing: bloom, colour grade, vignette and impact effects.
 *
 * The game is flat, unlit art, so the grade is doing the work a lighting rig
 * would normally do - bloom picks out hot effects (muzzle flashes, supers,
 * lava, neon), the vignette pulls focus to the middle of the arena, and a
 * per-frame flash/aberration channel gives heavy hits some weight.
 *
 * It degrades cleanly: `PostFx` is only created for the "high" quality path;
 * everything falls back to a plain forward render otherwise.
 */

import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

/**
 * Final grade: slight contrast and saturation lift, vignette, a full-screen
 * flash for impacts, and chromatic aberration that scales with screen shake.
 */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    flash: { value: 0 },
    flashColor: { value: new THREE.Color("#ffffff") },
    aberration: { value: 0 },
    vignette: { value: 0.26 },
    saturation: { value: 1.1 },
    contrast: { value: 1.05 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float flash;
    uniform vec3 flashColor;
    uniform float aberration;
    uniform float vignette;
    uniform float saturation;
    uniform float contrast;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec2 fromCenter = uv - 0.5;

      // Chromatic aberration, strongest at the edges, driven by screen shake.
      vec3 color;
      if (aberration > 0.0001) {
        vec2 offset = fromCenter * aberration;
        color.r = texture2D(tDiffuse, uv + offset).r;
        color.g = texture2D(tDiffuse, uv).g;
        color.b = texture2D(tDiffuse, uv - offset).b;
      } else {
        color = texture2D(tDiffuse, uv).rgb;
      }

      // Grade: contrast around mid grey, then saturation.
      color = (color - 0.5) * contrast + 0.5;
      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(luma), color, saturation);

      // Vignette.
      float d = length(fromCenter * vec2(1.05, 1.0));
      color *= 1.0 - vignette * smoothstep(0.35, 0.95, d);

      // Impact flash.
      color = mix(color, flashColor, clamp(flash, 0.0, 1.0));

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export class PostFx {
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private grade: ShaderPass;
  private flash = 0;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, width: number, height: number) {
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    // Subtle: hot effects glow, the flat art itself stays crisp. The blur runs
    // at half resolution - it is a soft glow, so nobody can tell, and it is
    // four times cheaper on fill rate.
    //
    // The threshold is high on purpose. Bright backdrops - the clouds over
    // Cloudbreak Temple, a snowfield - sit just under it, so bloom only ever
    // picks out muzzle flashes, supers, lava and weapon trails instead of
    // washing out the whole stage.
    this.bloom = new UnrealBloomPass(new THREE.Vector2(width / 2, height / 2), 0.62, 0.5, 0.9);
    this.composer.addPass(this.bloom);

    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);

    // The composer works in linear space; without this final pass the image is
    // written to the canvas unconverted and everything looks muddy.
    this.composer.addPass(new OutputPass());

    this.setSize(width, height);
  }

  setSize(width: number, height: number) {
    this.composer.setSize(width, height);
    this.bloom.setSize(width / 2, height / 2);
  }

  /** Adds a one-off screen flash, e.g. on a super or a heavy counter hit. */
  punch(amount: number, color = "#ffffff") {
    this.flash = Math.max(this.flash, amount);
    (this.grade.uniforms.flashColor.value as THREE.Color).set(color);
  }

  render(shake: number) {
    this.flash *= 0.76;
    if (this.flash < 0.002) this.flash = 0;
    this.grade.uniforms.flash.value = this.flash;
    // Shake and aberration are linked so heavy hits smear the edges.
    this.grade.uniforms.aberration.value = Math.min(0.006, shake * 0.0007);
    this.composer.render();
  }

  dispose() {
    this.composer.dispose();
    this.bloom.dispose();
  }
}

/** Picks a sensible default: heavy effects off on touch devices. */
export function defaultQuality(): "high" | "low" {
  if (typeof window === "undefined") return "low";
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  const smallScreen = window.innerWidth < 820;
  return coarse || smallScreen ? "low" : "high";
}
