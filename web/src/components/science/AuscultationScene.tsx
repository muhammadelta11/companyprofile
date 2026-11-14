"use client";

import { Html } from "@react-three/drei";
import type { AuscultationPoint } from "@/lib/science/clinical-skills";

type Props = {
  points: AuscultationPoint[];
  targetId?: string | null;
  foundIds: Set<string>;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  showLabels?: boolean;
};

/** Dada skematik + 4 titik auskultasi. */
export function AuscultationScene({
  points,
  targetId,
  foundIds,
  selectedId,
  onSelect,
  showLabels = true,
}: Props) {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Torso plane */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.2, 2.6, 0.35]} />
        <meshStandardMaterial color="#fecdd3" roughness={0.65} metalness={0.02} />
      </mesh>
      {/* Sternum hint */}
      <mesh position={[0, 0.1, 0.2]}>
        <boxGeometry args={[0.22, 1.8, 0.08]} />
        <meshStandardMaterial color="#fda4af" roughness={0.5} />
      </mesh>
      {/* Heart ghost */}
      <mesh position={[0.15, -0.05, 0.05]} scale={[0.55, 0.5, 0.35]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#e11d48" transparent opacity={0.35} roughness={0.4} />
      </mesh>

      {points.map((p) => {
        const isTarget = targetId === p.id;
        const found = foundIds.has(p.id);
        const selected = selectedId === p.id;
        return (
          <group key={p.id} position={p.position}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelect(p.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "default";
              }}
            >
              <sphereGeometry args={[isTarget ? 0.14 : 0.11, 20, 20]} />
              <meshStandardMaterial
                color={found ? "#059669" : isTarget ? "#2563eb" : "#0f172a"}
                emissive={isTarget ? "#2563eb" : found ? "#059669" : "#000000"}
                emissiveIntensity={isTarget || selected ? 0.45 : found ? 0.2 : 0}
                roughness={0.35}
              />
            </mesh>
            {showLabels ? (
              <Html position={[0, 0.22, 0]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
                <span
                  className={`sci-atom-label${isTarget || selected ? " is-selected" : ""}${
                    found ? " is-found" : ""
                  }`}
                >
                  {p.short}
                </span>
              </Html>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}
