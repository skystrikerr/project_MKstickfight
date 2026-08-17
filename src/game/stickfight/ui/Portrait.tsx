/**
 * SVG portrait of a fighter, drawn from the same stance data and the same
 * proportions as the 3D rig - ink strokes with a paper halo, blob hands and
 * feet, an open circle for a head - so the select screen never drifts from
 * what you get in the match.
 */

import { useMemo } from "react";
import { BONES, buildSkeleton, type Joint, type Skeleton } from "../skeleton";
import type { FighterDef, Pose, PropDef, ShapePart } from "../types";

/** Limb widths, mirrored from the rig's LIMB table. */
const W = {
  thigh: [2.9, 2.3],
  shin: [2.4, 1.9],
  upperArm: [2.5, 2.0],
  foreArm: [2.1, 1.7],
  spine: [3.4, 2.7],
  neck: [2.3, 2.1],
} as const;

/** Mirrors PAPER, PROP_LINE and HEAD_LINE in the rig. */
const PAPER = 0.85;
const PROP_LINE = 1.2;
const HEAD_LINE = 2.8;

/** Blends two hex colours, matching THREE.Color.lerp. */
function mix(a: string, b: string, t: number): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

/** Rotation, in degrees, that lines a prop's +y up with the shin. */
function shinAngle(knee: Joint, foot: Joint): number {
  return (Math.atan2(knee.y - foot.y, knee.x - foot.x) * 180) / Math.PI - 90;
}

function attachTransform(sk: Skeleton, attach: PropDef["attach"]): { x: number; y: number; rot: number } {
  switch (attach) {
    case "head":
      return { x: sk.head.x, y: sk.head.y, rot: -sk.torsoAngle * 0.6 };
    case "neck":
      return { x: sk.neck.x, y: sk.neck.y, rot: -sk.torsoAngle };
    case "torso":
      return { x: (sk.pelvis.x + sk.neck.x) / 2, y: (sk.pelvis.y + sk.neck.y) / 2, rot: -sk.torsoAngle };
    case "pelvis":
      return { x: sk.pelvis.x, y: sk.pelvis.y, rot: -sk.torsoAngle * 0.5 };
    case "handF":
      return { x: sk.handF.x, y: sk.handF.y, rot: sk.foreAngleF - 90 + sk.weapon };
    case "handB":
      return { x: sk.handB.x, y: sk.handB.y, rot: sk.foreAngleB - 90 + sk.weaponBack };
    case "forearmF":
      return { x: (sk.elbowF.x + sk.handF.x) / 2, y: (sk.elbowF.y + sk.handF.y) / 2, rot: sk.foreAngleF - 90 };
    case "forearmB":
      return { x: (sk.elbowB.x + sk.handB.x) / 2, y: (sk.elbowB.y + sk.handB.y) / 2, rot: sk.foreAngleB - 90 };
    case "back":
      return { x: sk.neck.x, y: sk.neck.y - 12, rot: -sk.torsoAngle };
    // Greaves and wraps belong to the shin, so they turn with it.
    case "footF":
      return { x: sk.footF.x, y: sk.footF.y, rot: shinAngle(sk.kneeF, sk.footF) };
    case "footB":
      return { x: sk.footB.x, y: sk.footB.y, rot: shinAngle(sk.kneeB, sk.footB) };
    default:
      return { x: 0, y: 0, rot: 0 };
  }
}

/** A tapered limb: two circles joined by a quad, matching the rig's shape. */
function Limb({
  a,
  b,
  r1,
  r2,
  color,
  grow = 0,
}: {
  a: Joint;
  b: Joint;
  r1: number;
  r2: number;
  color: string;
  grow?: number;
}) {
  const ax = a.x;
  const ay = -a.y;
  const bx = b.x;
  const by = -b.y;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 0.001;
  const nx = -dy / len;
  const ny = dx / len;
  const w1 = r1 + grow;
  const w2 = r2 + grow;
  const pts = [
    [ax + nx * w1, ay + ny * w1],
    [bx + nx * w2, by + ny * w2],
    [bx - nx * w2, by - ny * w2],
    [ax - nx * w1, ay - ny * w1],
  ]
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  return (
    <g fill={color}>
      <polygon points={pts} />
      <circle cx={ax} cy={ay} r={w1} />
      <circle cx={bx} cy={by} r={w2} />
    </g>
  );
}

/** A foot: a solid teardrop lying along the floor, mirroring bootGeometry(). */
function Boot({ foot, toe, color, grow = 0 }: { foot: Joint; toe: Joint; color: string; grow?: number }) {
  const angle = (Math.atan2(-(toe.y - foot.y), toe.x - foot.x) * 180) / Math.PI;
  const len = BONES.foot + 5;
  const g = grow;
  const h = 4.5 + g;
  const d = `M ${-h * 0.9} ${-h * 0.15}
    Q ${-h * 1.15} ${h * 0.95} ${h * 0.2} ${h * 0.98}
    Q ${len * 0.75} ${h * 1.05} ${len + g} ${h * 0.35}
    Q ${len * 1.06 + g} ${-h * 0.34} ${len * 0.62} ${-h * 0.5}
    Q ${h * 0.5} ${-h * 0.72} ${-h * 0.9} ${-h * 0.15} Z`;
  return (
    <g transform={`translate(${foot.x} ${-foot.y}) rotate(${angle})`}>
      <path d={d} fill={color} />
    </g>
  );
}

/** A hand: a solid blob off the end of the forearm, mirroring handGeometry(). */
function Hand({ at, angle, color, grow = 0 }: { at: Joint; angle: number; color: string; grow?: number }) {
  const s = 4.6 + grow;
  const d = `M ${-s * 0.35} ${s * 0.5}
    Q ${s * 0.85} ${s * 1.02} ${s * 1.12} ${s * 0.18}
    Q ${s * 1.3} ${-s * 0.72} ${s * 0.35} ${-s * 0.94}
    Q ${-s * 0.55} ${-s * 1.02} ${-s * 0.62} ${-s * 0.16}
    Q ${-s * 0.66} ${s * 0.24} ${-s * 0.35} ${s * 0.5} Z`;
  return (
    <g transform={`translate(${at.x} ${-at.y}) rotate(${-(angle - 90)})`}>
      <path d={d} fill={color} />
    </g>
  );
}

/** The head: a pale disc with a heavy ink ring, the open circle of a stick figure. */
function Head({ at, r, fill, ink }: { at: Joint; r: number; fill: string; ink: string }) {
  return (
    <g transform={`translate(${at.x} ${-at.y})`}>
      <circle r={r} fill={fill} />
      <circle r={r - HEAD_LINE / 2} fill="none" stroke={ink} strokeWidth={HEAD_LINE} />
    </g>
  );
}

function PartShape({ part, fallback, grow = 0, ink }: { part: ShapePart; fallback: string; grow?: number; ink?: string }) {
  const color = ink ?? part.color ?? fallback;
  const g = grow;
  const [x, y] = part.pos;
  const transform = `translate(${x} ${-y}) rotate(${-(part.rot ?? 0)})`;

  switch (part.geo) {
    case "box":
      return (
        <rect x={-part.size[0] / 2 - g} y={-part.size[1] / 2 - g} width={part.size[0] + g * 2} height={part.size[1] + g * 2} fill={color} transform={transform} />
      );
    case "cyl":
      return (
        <rect x={-part.size[0] - g} y={-part.size[1] / 2 - g} width={part.size[0] * 2 + g * 2} height={part.size[1] + g * 2} fill={color} transform={transform} />
      );
    case "sphere":
    case "disc":
      return <circle r={part.size[0] + g} fill={color} transform={transform} />;
    case "cone":
    case "tri": {
      const w = (part.geo === "cone" ? part.size[0] * 2 : part.size[0]) + g * 2;
      const h = part.size[1] + g * 2;
      return <polygon points={`${-w / 2},${h / 2} ${w / 2},${h / 2} 0,${-h / 2}`} fill={color} transform={transform} />;
    }
    case "blade": {
      const len = part.size[0] + g * 2;
      const w = part.size[1] + g * 2;
      const taper = part.size[2] ?? 0.5;
      return (
        <polygon
          points={`${-len / 2},${w / 2} ${len / 2},${w * taper * 0.4} ${len / 2 + w * 0.7},0 ${len / 2},${-w * taper} ${-len / 2},${-w / 2}`}
          fill={color}
          transform={transform}
        />
      );
    }
    case "ring": {
      const r = part.size[0] + g;
      const t = part.size[1] + g * 2;
      return (
        <circle r={Math.max(0.01, r - t / 2)} fill="none" stroke={color} strokeWidth={t} transform={transform} />
      );
    }
    case "poly": {
      const n = Math.floor(part.size.length / 2);
      let cx = 0;
      let cy = 0;
      for (let i = 0; i < n; i++) {
        cx += part.size[i * 2];
        cy += part.size[i * 2 + 1];
      }
      cx /= n;
      cy /= n;
      const pts: string[] = [];
      for (let i = 0; i < n; i++) {
        const dx = part.size[i * 2] - cx;
        const dy = part.size[i * 2 + 1] - cy;
        const d = Math.hypot(dx, dy) || 1;
        pts.push(`${part.size[i * 2] + (dx / d) * g},${-(part.size[i * 2 + 1] + (dy / d) * g)}`);
      }
      return <polygon points={pts.join(" ")} fill={color} transform={transform} />;
    }
    default:
      return null;
  }
}

/**
 * One layer of one prop. The rig sorts *parts* rather than whole props into
 * the layer behind the body and the layer in front of it - a helmet's neck
 * guard hangs behind the head while its visor covers the face - so the
 * portrait has to do the same or the two disagree about which side of a
 * fighter their own kit is on.
 */
function Prop({
  def,
  sk,
  fallback,
  ink,
  layer,
}: {
  def: PropDef;
  sk: Skeleton;
  fallback: string;
  ink: string;
  layer: "behind" | "front";
}) {
  if (def.conditional) return null;
  const parts = def.parts.filter((part) => !!part.behind === (layer === "behind"));
  if (parts.length === 0) return null;
  const t = attachTransform(sk, def.attach);
  return (
    <g transform={`translate(${t.x} ${-t.y}) rotate(${-t.rot})`}>
      {parts.map((part, i) => (
        <g key={i}>
          <PartShape part={part} fallback={fallback} grow={PROP_LINE} ink={ink} />
          <PartShape part={part} fallback={fallback} />
        </g>
      ))}
    </g>
  );
}

/** A static hanging cape, standing in for the simulated cloth in-game. */
function Cape({ def, sk }: { def: PropDef; sk: Skeleton }) {
  const cloth = def.cloth;
  if (!cloth) return null;
  const t = attachTransform(sk, def.attach);
  const drop = cloth.segments * cloth.segmentLength;
  const w0 = cloth.width / 2;
  const w1 = (cloth.endWidth ?? cloth.width * 0.45) / 2;
  const sway = drop * 0.22;
  const d = `M ${t.x - w0} ${-t.y}
    L ${t.x + w0} ${-t.y}
    Q ${t.x + w1 - sway * 0.4} ${-t.y + drop * 0.6} ${t.x + w1 - sway} ${-t.y + drop}
    L ${t.x - w1 - sway} ${-t.y + drop}
    Q ${t.x - w0 - sway * 0.3} ${-t.y + drop * 0.55} ${t.x - w0} ${-t.y} Z`;
  return <path d={d} fill={cloth.color} opacity={0.95} />;
}

export function FighterPortrait({
  def,
  pose,
  className,
  facing = 1,
}: {
  def: FighterDef;
  pose?: Pose;
  className?: string;
  facing?: 1 | -1;
}) {
  const sk = useMemo(() => buildSkeleton({ ...def.stance, ...pose }, true, 1), [def, pose]);
  const p = def.palette;
  const ink = p.outline;

  const capes = def.props.filter((pr) => pr.cloth);

  // Same washes the rig uses for the limbs on the far side of the body.
  const backInk = mix(ink, p.cloth, 0.32);
  const paper = mix(p.body, ink, 0.2);
  const backPaper = mix(paper, "#000000", 0.3);

  return (
    <svg viewBox="-70 -125 140 140" className={className} role="img" aria-label={def.name}>
      <g transform={`scale(${facing} 1)`}>
        {capes.map((pr) => (
          <Cape key={`cape-${pr.id}`} def={pr} sk={sk} />
        ))}
        {def.props.map((pr) => (
          <Prop key={`b-${pr.id}`} def={pr} sk={sk} fallback={p.cloth} ink={ink} layer="behind" />
        ))}

        {/* Back limbs: washed ink over dimmed paper, so they sit behind. */}
        <Limb a={sk.pelvis} b={sk.kneeB} r1={W.thigh[0]} r2={W.thigh[1]} color={backPaper} grow={PAPER} />
        <Limb a={sk.kneeB} b={sk.footB} r1={W.shin[0]} r2={W.shin[1]} color={backPaper} grow={PAPER} />
        <Limb a={sk.neck} b={sk.elbowB} r1={W.upperArm[0]} r2={W.upperArm[1]} color={backPaper} grow={PAPER} />
        <Limb a={sk.elbowB} b={sk.handB} r1={W.foreArm[0]} r2={W.foreArm[1]} color={backPaper} grow={PAPER} />
        <Boot foot={sk.footB} toe={sk.toeB} color={backPaper} grow={PAPER} />
        <Hand at={sk.handB} angle={sk.foreAngleB} color={backPaper} grow={PAPER} />

        <Limb a={sk.pelvis} b={sk.kneeB} r1={W.thigh[0]} r2={W.thigh[1]} color={backInk} />
        <Limb a={sk.kneeB} b={sk.footB} r1={W.shin[0]} r2={W.shin[1]} color={backInk} />
        <Limb a={sk.neck} b={sk.elbowB} r1={W.upperArm[0]} r2={W.upperArm[1]} color={backInk} />
        <Limb a={sk.elbowB} b={sk.handB} r1={W.foreArm[0]} r2={W.foreArm[1]} color={backInk} />
        <Boot foot={sk.footB} toe={sk.toeB} color={backInk} />
        <Hand at={sk.handB} angle={sk.foreAngleB} color={backInk} />

        {/* Torso and head */}
        <Limb a={sk.pelvis} b={sk.neck} r1={W.spine[0]} r2={W.spine[1]} color={paper} grow={PAPER} />
        <Limb a={sk.neck} b={sk.head} r1={W.neck[0]} r2={W.neck[1]} color={paper} grow={PAPER} />
        <Limb a={sk.pelvis} b={sk.neck} r1={W.spine[0]} r2={W.spine[1]} color={ink} />
        <Limb a={sk.neck} b={sk.head} r1={W.neck[0]} r2={W.neck[1]} color={ink} />
        <Head at={sk.head} r={BONES.headR} fill={p.body} ink={ink} />

        {/* Front limbs */}
        <Limb a={sk.pelvis} b={sk.kneeF} r1={W.thigh[0]} r2={W.thigh[1]} color={paper} grow={PAPER} />
        <Limb a={sk.kneeF} b={sk.footF} r1={W.shin[0]} r2={W.shin[1]} color={paper} grow={PAPER} />
        <Limb a={sk.neck} b={sk.elbowF} r1={W.upperArm[0]} r2={W.upperArm[1]} color={paper} grow={PAPER} />
        <Limb a={sk.elbowF} b={sk.handF} r1={W.foreArm[0]} r2={W.foreArm[1]} color={paper} grow={PAPER} />
        <Boot foot={sk.footF} toe={sk.toeF} color={paper} grow={PAPER} />
        <Hand at={sk.handF} angle={sk.foreAngleF} color={paper} grow={PAPER} />

        <Limb a={sk.pelvis} b={sk.kneeF} r1={W.thigh[0]} r2={W.thigh[1]} color={ink} />
        <Limb a={sk.kneeF} b={sk.footF} r1={W.shin[0]} r2={W.shin[1]} color={ink} />
        <Limb a={sk.neck} b={sk.elbowF} r1={W.upperArm[0]} r2={W.upperArm[1]} color={ink} />
        <Limb a={sk.elbowF} b={sk.handF} r1={W.foreArm[0]} r2={W.foreArm[1]} color={ink} />
        <Boot foot={sk.footF} toe={sk.toeF} color={ink} />
        <Hand at={sk.handF} angle={sk.foreAngleF} color={ink} />

        {def.props.map((pr) => (
          <Prop key={`f-${pr.id}`} def={pr} sk={sk} fallback={p.metal} ink={ink} layer="front" />
        ))}
      </g>
    </svg>
  );
}
