"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { AnatomyPart } from "@/lib/science/anatomy";

type Props = {
  parts: AnatomyPart[];
  selectedId?: string | null;
  highlightIds?: string[];
  hiddenIds?: Set<string>;
  onSelect?: (partId: string | null) => void;
  showLabels?: boolean;
  exploded?: boolean;
  pulse?: boolean;
};

const FLESH = {
  color: "#b91c3c",
  roughness: 0.42,
  metalness: 0.02,
  clearcoat: 0.35,
  clearcoatRoughness: 0.45,
  sheen: 0.55,
  sheenRoughness: 0.4,
  sheenColor: "#fda4af",
};

function tissueMat(color: string, active: boolean, dim: boolean) {
  return {
    color,
    roughness: 0.38,
    metalness: 0.04,
    clearcoat: 0.28,
    clearcoatRoughness: 0.5,
    sheen: 0.45,
    sheenRoughness: 0.35,
    sheenColor: color,
    transparent: true,
    opacity: dim ? 0.28 : active ? 1 : 0.88,
    emissive: active ? color : "#000000",
    emissiveIntensity: active ? 0.28 : 0,
  } as const;
}

function useTube(points: [number, number, number][], radius: number, tubular = 64) {
  return useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curve, tubular, radius, 12, false);
  }, [points, radius, tubular]);
}

function PulseGroup({
  active,
  pulse,
  children,
}: {
  active: boolean;
  pulse: boolean;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (pulse && active) {
      const s = 1 + Math.sin(clock.elapsedTime * 7) * 0.035;
      ref.current.scale.setScalar(s);
    } else {
      ref.current.scale.setScalar(1);
    }
  });
  return <group ref={ref}>{children}</group>;
}

function Chamber({
  id,
  label,
  position,
  scale,
  rotation,
  color,
  selected,
  highlighted,
  dim,
  showLabel,
  pulse,
  onSelect,
  detail = "ventricle",
}: {
  id: string;
  label: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  selected: boolean;
  highlighted: boolean;
  dim: boolean;
  showLabel: boolean;
  pulse: boolean;
  onSelect?: (id: string | null) => void;
  detail?: "ventricle" | "atrium";
}) {
  const active = selected || highlighted;
  const mat = tissueMat(color, active, dim);

  return (
    <PulseGroup active={highlighted} pulse={pulse}>
      <group position={position} rotation={rotation ?? [0, 0, 0]}>
        <mesh
          scale={scale}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "default";
          }}
        >
          <sphereGeometry args={[1, detail === "ventricle" ? 48 : 40, detail === "ventricle" ? 48 : 40]} />
          <meshPhysicalMaterial {...mat} />
        </mesh>
        {/* subtle epicardial bulge */}
        <mesh
          scale={[scale[0] * 1.02, scale[1] * 0.92, scale[2] * 1.05]}
          position={[0, detail === "ventricle" ? -0.05 : 0.08, 0.02]}
          raycast={() => null}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            {...mat}
            opacity={(mat.opacity as number) * 0.35}
            transparent
            depthWrite={false}
          />
        </mesh>
        {showLabel || selected ? (
          <Html position={[0, scale[1] + 0.2, 0]} center distanceFactor={36} style={{ pointerEvents: "none" }}>
            <span className={`sci-pin${selected ? " is-active" : ""}`}>
              {({ ra: "RA", la: "LA", rv: "RV", lv: "LV" } as Record<string, string>)[id] ??
                label.slice(0, 3)}
            </span>
          </Html>
        ) : null}
      </group>
    </PulseGroup>
  );
}

function Vessel({
  id,
  label,
  points,
  radius,
  color,
  selected,
  highlighted,
  dim,
  showLabel,
  labelAt,
  pulse,
  onSelect,
}: {
  id: string;
  label: string;
  points: [number, number, number][];
  radius: number;
  color: string;
  selected: boolean;
  highlighted: boolean;
  dim: boolean;
  showLabel: boolean;
  labelAt: [number, number, number];
  pulse: boolean;
  onSelect?: (id: string | null) => void;
}) {
  const geo = useTube(points, radius);
  const active = selected || highlighted;
  const mat = tissueMat(color, active, dim);

  return (
    <PulseGroup active={highlighted} pulse={pulse}>
      <mesh
        geometry={geo}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {showLabel || selected ? (
        <Html position={labelAt} center distanceFactor={36} style={{ pointerEvents: "none" }}>
          <span className={`sci-pin${selected ? " is-active" : ""}`}>
            {({ aorta: "Ao", pa: "PT", vc: "SVC", pv: "PV" } as Record<string, string>)[id] ??
              label.slice(0, 3)}
          </span>
        </Html>
      ) : null}
    </PulseGroup>
  );
}

/** Jantung organik prosedural — mendekati siluet anatomi, tanpa aset eksternal. */
export function OrganicHeart({
  parts,
  selectedId,
  highlightIds,
  hiddenIds,
  onSelect,
  showLabels = true,
  exploded = false,
  pulse = false,
}: Props) {
  const highlightSet = highlightIds ? new Set(highlightIds) : null;
  const e = exploded ? 1.45 : 1;
  const meta = useMemo(() => Object.fromEntries(parts.map((p) => [p.id, p])), [parts]);

  const aortaPts = useMemo(
    () =>
      (
        [
          [0.2, 0.15, -0.05],
          [0.12, 0.55, -0.05],
          [0.05, 0.95, 0.05],
          [0.15, 1.25, 0.35],
          [0.55, 1.35, 0.55],
          [0.85, 1.15, 0.45],
        ] as [number, number, number][]
      ).map(([x, y, z]) => [x * e, y * e, z * e] as [number, number, number]),
    [e]
  );
  const paPts = useMemo(
    () =>
      (
        [
          [-0.1, 0.2, 0.25],
          [-0.05, 0.55, 0.4],
          [0.05, 0.85, 0.55],
          [-0.35, 0.95, 0.7],
          [-0.75, 0.85, 0.65],
        ] as [number, number, number][]
      ).map(([x, y, z]) => [x * e, y * e, z * e] as [number, number, number]),
    [e]
  );
  const vcPts = useMemo(
    () =>
      (
        [
          [-0.55, 1.35, 0.1],
          [-0.6, 0.95, 0.15],
          [-0.62, 0.65, 0.2],
          [-0.58, 0.45, 0.22],
        ] as [number, number, number][]
      ).map(([x, y, z]) => [x * e, y * e, z * e] as [number, number, number]),
    [e]
  );
  const pvPts = useMemo(
    () =>
      (
        [
          [1.15, 0.75, -0.35],
          [0.9, 0.65, -0.28],
          [0.7, 0.55, -0.2],
          [0.55, 0.48, -0.12],
        ] as [number, number, number][]
      ).map(([x, y, z]) => [x * e, y * e, z * e] as [number, number, number]),
    [e]
  );

  const visible = (id: string) => !hiddenIds?.has(id);
  const sel = (id: string) => selectedId === id;
  const hi = (id: string) => highlightSet?.has(id) ?? false;
  const dim = (id: string) => Boolean(highlightSet && highlightSet.size > 0 && !hi(id) && !sel(id));

  return (
    <group
      position={[0, -0.05, 0]}
      rotation={[0.25, 0.55, 0.08]}
      onPointerMissed={() => onSelect?.(null)}
    >
      {/* Miokardium luar — siluet ventrikel + apex */}
      <group>
        <mesh position={[0.12, -0.15, 0]} scale={[1.05, 1.15, 0.92]} raycast={() => null}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhysicalMaterial {...FLESH} transparent opacity={0.22} depthWrite={false} />
        </mesh>
        <mesh position={[-0.25, -0.05, 0.2]} scale={[0.72, 0.78, 0.7]} raycast={() => null}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshPhysicalMaterial {...FLESH} transparent opacity={0.14} depthWrite={false} />
        </mesh>
        <mesh
          position={[0.28, -1.05, 0.05]}
          rotation={[0.15, 0, -0.35]}
          scale={[0.45, 0.55, 0.4]}
          raycast={() => null}
        >
          <coneGeometry args={[1, 1.4, 32]} />
          <meshPhysicalMaterial {...FLESH} transparent opacity={0.2} depthWrite={false} />
        </mesh>
        <mesh
          position={[0.05, 0.05, 0.55]}
          rotation={[1.2, 0.2, 0]}
          scale={[0.9, 0.08, 0.35]}
          raycast={() => null}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial color="#7f1d1d" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      </group>

      {visible("ra") && (
        <Chamber
          id="ra"
          label={meta.ra?.name ?? "RA"}
          position={[-0.55 * e, 0.55 * e, 0.25 * e]}
          scale={[0.48, 0.38, 0.46]}
          color={meta.ra?.color ?? "#38bdf8"}
          selected={sel("ra")}
          highlighted={hi("ra")}
          dim={dim("ra")}
          showLabel={showLabels}
          pulse={pulse}
          onSelect={onSelect}
          detail="atrium"
        />
      )}
      {visible("la") && (
        <Chamber
          id="la"
          label={meta.la?.name ?? "LA"}
          position={[0.52 * e, 0.5 * e, -0.15 * e]}
          scale={[0.46, 0.36, 0.44]}
          color={meta.la?.color ?? "#fb7185"}
          selected={sel("la")}
          highlighted={hi("la")}
          dim={dim("la")}
          showLabel={showLabels}
          pulse={pulse}
          onSelect={onSelect}
          detail="atrium"
        />
      )}
      {visible("rv") && (
        <Chamber
          id="rv"
          label={meta.rv?.name ?? "RV"}
          position={[-0.38 * e, -0.28 * e, 0.35 * e]}
          scale={[0.58, 0.62, 0.52]}
          rotation={[0.1, 0.15, 0]}
          color={meta.rv?.color ?? "#0ea5e9"}
          selected={sel("rv")}
          highlighted={hi("rv")}
          dim={dim("rv")}
          showLabel={showLabels}
          pulse={pulse}
          onSelect={onSelect}
        />
      )}
      {visible("lv") && (
        <Chamber
          id="lv"
          label={meta.lv?.name ?? "LV"}
          position={[0.32 * e, -0.42 * e, -0.05 * e]}
          scale={[0.68, 0.82, 0.62]}
          rotation={[-0.05, -0.1, -0.12]}
          color={meta.lv?.color ?? "#e11d48"}
          selected={sel("lv")}
          highlighted={hi("lv")}
          dim={dim("lv")}
          showLabel={showLabels}
          pulse={pulse}
          onSelect={onSelect}
        />
      )}

      {visible("aorta") && (
        <Vessel
          id="aorta"
          label={meta.aorta?.name ?? "Aorta"}
          points={aortaPts}
          radius={0.11}
          color={meta.aorta?.color ?? "#be123c"}
          selected={sel("aorta")}
          highlighted={hi("aorta")}
          dim={dim("aorta")}
          showLabel={showLabels}
          labelAt={[0.55 * e, 1.45 * e, 0.55 * e]}
          pulse={pulse}
          onSelect={onSelect}
        />
      )}

      {visible("pa") && (
        <Vessel
          id="pa"
          label={meta.pa?.name ?? "PA"}
          points={paPts}
          radius={0.095}
          color={meta.pa?.color ?? "#0369a1"}
          selected={sel("pa")}
          highlighted={hi("pa")}
          dim={dim("pa")}
          showLabel={showLabels}
          labelAt={[-0.5 * e, 1.05 * e, 0.75 * e]}
          pulse={pulse}
          onSelect={onSelect}
        />
      )}

      {visible("vc") && (
        <Vessel
          id="vc"
          label={meta.vc?.name ?? "VC"}
          points={vcPts}
          radius={0.09}
          color={meta.vc?.color ?? "#0284c7"}
          selected={sel("vc")}
          highlighted={hi("vc")}
          dim={dim("vc")}
          showLabel={showLabels}
          labelAt={[-0.7 * e, 1.15 * e, 0.15 * e]}
          pulse={pulse}
          onSelect={onSelect}
        />
      )}

      {visible("pv") && (
        <Vessel
          id="pv"
          label={meta.pv?.name ?? "PV"}
          points={pvPts}
          radius={0.07}
          color={meta.pv?.color ?? "#f43f5e"}
          selected={sel("pv")}
          highlighted={hi("pv")}
          dim={dim("pv")}
          showLabel={showLabels}
          labelAt={[1.05 * e, 0.85 * e, -0.35 * e]}
          pulse={pulse}
          onSelect={onSelect}
        />
      )}
    </group>
  );
}
