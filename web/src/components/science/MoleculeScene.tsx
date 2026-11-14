"use client";

import { Html } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { ELEMENT_META } from "@/lib/science/elements";
import type { MoleculeDefinition, MoleculeStyle } from "@/lib/science/types";

type Props = {
  molecule: MoleculeDefinition;
  style?: MoleculeStyle;
  selectedAtomId?: string | null;
  onSelectAtom?: (atomId: string | null) => void;
  showLabels?: boolean;
};

function BondMesh({
  a,
  b,
  order = 1,
  wireframe,
}: {
  a: THREE.Vector3;
  b: THREE.Vector3;
  order?: 1 | 2 | 3;
  wireframe?: boolean;
}) {
  const { mid, quat, len } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = dir.length();
    const midpoint = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { mid: midpoint, quat: quaternion, len: length };
  }, [a, b]);

  const offsets =
    order === 1 ? [0] : order === 2 ? [-0.08, 0.08] : [-0.12, 0, 0.12];

  return (
    <group position={mid.toArray()} quaternion={quat}>
      {offsets.map((off, i) => (
        <mesh key={i} position={[off, 0, 0]}>
          <cylinderGeometry args={[wireframe ? 0.02 : 0.06, wireframe ? 0.02 : 0.06, len, 12]} />
          <meshStandardMaterial
            color="#94a3b8"
            roughness={0.45}
            metalness={0.1}
            wireframe={Boolean(wireframe)}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Scene molekul prosedural (tanpa GLB) — cocok untuk seed H₂O dll. */
export function MoleculeScene({
  molecule,
  style = "ball-stick",
  selectedAtomId,
  onSelectAtom,
  showLabels = true,
}: Props) {
  const atoms = useMemo(() => {
    const map = new Map(molecule.atoms.map((a) => [a.id, a]));
    return map;
  }, [molecule]);

  const scale = style === "spacefill" ? 1.55 : 1;

  return (
    <group onPointerMissed={() => onSelectAtom?.(null)} position={[0, 0.15, 0]}>
      {molecule.bonds.map((bond) => {
        const from = atoms.get(bond.from);
        const to = atoms.get(bond.to);
        if (!from || !to) return null;
        if (style === "spacefill") return null;
        return (
          <BondMesh
            key={bond.id}
            a={new THREE.Vector3(...from.position)}
            b={new THREE.Vector3(...to.position)}
            order={bond.order ?? 1}
            wireframe={style === "wireframe"}
          />
        );
      })}

      {molecule.atoms.map((atom) => {
        const meta = ELEMENT_META[atom.element];
        const r =
          style === "spacefill"
            ? meta.radius * 0.85
            : style === "wireframe"
              ? meta.radius * 0.28
              : meta.radius * 0.42;
        const selected = selectedAtomId === atom.id;
        return (
          <group key={atom.id} position={atom.position}>
            <mesh
              scale={scale}
              onClick={(e) => {
                e.stopPropagation();
                onSelectAtom?.(atom.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "default";
              }}
            >
              <sphereGeometry args={[r, 28, 28]} />
              <meshStandardMaterial
                color={meta.color}
                roughness={0.35}
                metalness={0.08}
                emissive={selected ? "#0f766e" : "#000000"}
                emissiveIntensity={selected ? 0.35 : 0}
                wireframe={style === "wireframe"}
              />
            </mesh>
            {showLabels && style !== "spacefill" ? (
              <Html position={[0, r * scale + 0.22, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
                <span className={`sci-atom-label${selected ? " is-selected" : ""}`}>{atom.element}</span>
              </Html>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}
