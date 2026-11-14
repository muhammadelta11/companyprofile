"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { AnatomyModel, AnatomyPart } from "@/lib/science/anatomy";
import { HeartWithFallback } from "./HeartWithFallback";
import { OrganicHeart } from "./OrganicHeart";

type Props = {
  model: AnatomyModel;
  selectedId?: string | null;
  highlightIds?: string[];
  hiddenIds?: Set<string>;
  onSelect?: (partId: string | null) => void;
  showLabels?: boolean;
  exploded?: boolean;
  pulse?: boolean;
};

function PartMesh({
  part,
  selected,
  highlighted,
  exploded,
  showLabel,
  pulse,
  onSelect,
}: {
  part: AnatomyPart;
  selected: boolean;
  highlighted: boolean;
  exploded: boolean;
  showLabel: boolean;
  pulse: boolean;
  onSelect?: (id: string | null) => void;
}) {
  const group = useRef<Group>(null);
  const explodeFactor = exploded ? 1.55 : 1;
  const pos: [number, number, number] = [
    part.position[0] * explodeFactor,
    part.position[1] * explodeFactor,
    part.position[2] * explodeFactor,
  ];

  useFrame(({ clock }) => {
    if (!group.current) return;
    if (pulse && highlighted) {
      const s = 1 + Math.sin(clock.elapsedTime * 6) * 0.04;
      group.current.scale.setScalar(s);
    } else {
      group.current.scale.setScalar(1);
    }
  });

  const active = selected || highlighted;

  return (
    <group ref={group} position={pos} rotation={part.rotation ?? [0, 0, 0]}>
      <mesh
        scale={part.scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(part.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        {part.shape === "box" ? (
          <boxGeometry args={[1, 1, 1]} />
        ) : part.shape === "cylinder" ? (
          <cylinderGeometry args={[1, 1, 1, 20]} />
        ) : (
          <sphereGeometry args={[1, 28, 28]} />
        )}
        <meshStandardMaterial
          color={part.color}
          roughness={0.4}
          metalness={0.05}
          transparent
          opacity={active ? 1 : highlighted ? 0.95 : 0.55}
          emissive={active ? part.color : "#000000"}
          emissiveIntensity={selected ? 0.35 : highlighted ? 0.22 : 0}
        />
      </mesh>
      {showLabel ? (
        <Html
          position={[0, part.scale[1] * 0.65 + 0.15, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <span className={`sci-atom-label${active ? " is-selected" : ""}`}>{part.name}</span>
        </Html>
      ) : null}
    </group>
  );
}

/** Scene anatomi — jantung memakai mesh organik; model lain fallback primitif. */
export function AnatomyScene({
  model,
  selectedId,
  highlightIds,
  hiddenIds,
  onSelect,
  showLabels = true,
  exploded = false,
  pulse = false,
}: Props) {
  if (model.id === "heart") {
    const Heart = model.glbPath ? HeartWithFallback : OrganicHeart;
    return (
      <Heart
        parts={model.parts}
        selectedId={selectedId}
        highlightIds={highlightIds}
        hiddenIds={hiddenIds}
        onSelect={onSelect}
        showLabels={showLabels}
        exploded={exploded}
        pulse={pulse}
      />
    );
  }

  const highlightSet = highlightIds ? new Set(highlightIds) : null;

  return (
    <group position={[0, 0.05, 0]} onPointerMissed={() => onSelect?.(null)}>
      {model.parts.map((part) => {
        if (hiddenIds?.has(part.id)) return null;
        return (
          <PartMesh
            key={part.id}
            part={part}
            selected={selectedId === part.id}
            highlighted={highlightSet?.has(part.id) ?? false}
            exploded={exploded}
            showLabel={showLabels}
            pulse={pulse}
            onSelect={onSelect}
          />
        );
      })}
    </group>
  );
}
