"use client";

import { Html } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { ELEMENT_META } from "@/lib/science/elements";
import {
  REACTION_SPECIES,
  layoutSpeciesInstances,
  type ChemicalReaction,
  type ReactionSpecies,
} from "@/lib/science/reactions";

type Props = {
  reaction: ChemicalReaction;
  /** 0 = hanya reaktan, 1 = hanya produk. */
  progress: number;
};

function MiniMolecule({
  species,
  position,
  opacity,
}: {
  species: ReactionSpecies;
  position: [number, number, number];
  opacity: number;
}) {
  const atomMap = useMemo(() => new Map(species.atoms.map((a) => [a.id, a])), [species]);

  if (opacity < 0.05) return null;

  return (
    <group position={position}>
      {species.bonds.map((bond) => {
        const from = atomMap.get(bond.from);
        const to = atomMap.get(bond.to);
        if (!from || !to) return null;
        const a = new THREE.Vector3(...from.position);
        const b = new THREE.Vector3(...to.position);
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const dir = b.clone().sub(a);
        const len = dir.length();
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.clone().normalize()
        );
        const order = bond.order ?? 1;
        const offsets = order === 1 ? [0] : order === 2 ? [-0.06, 0.06] : [-0.1, 0, 0.1];
        return (
          <group key={bond.id} position={mid.toArray()} quaternion={quat}>
            {offsets.map((off, i) => (
              <mesh key={i} position={[off, 0, 0]}>
                <cylinderGeometry args={[0.045, 0.045, len, 10]} />
                <meshStandardMaterial color="#94a3b8" transparent opacity={opacity} roughness={0.45} />
              </mesh>
            ))}
          </group>
        );
      })}
      {species.atoms.map((atom) => {
        const meta = ELEMENT_META[atom.element];
        return (
          <mesh key={atom.id} position={atom.position}>
            <sphereGeometry args={[meta.radius * 0.4, 20, 20]} />
            <meshStandardMaterial
              color={meta.color}
              transparent
              opacity={opacity}
              roughness={0.35}
            />
          </mesh>
        );
      })}
      <Html position={[0, 0.85, 0]} center distanceFactor={12} style={{ pointerEvents: "none" }}>
        <span className="sci-atom-label" dangerouslySetInnerHTML={{ __html: species.formulaHtml }} />
      </Html>
    </group>
  );
}

/** Visualisasi konseptual reaktan → produk (bukan dinamika molekular). */
export function ReactionScene({ reaction, progress }: Props) {
  const t = Math.min(1, Math.max(0, progress));
  const reactantOpacity = 1 - t;
  const productOpacity = t;

  const reactants = layoutSpeciesInstances(reaction.reactants, "left");
  const products = layoutSpeciesInstances(reaction.products, "right");

  return (
    <group>
      <Html position={[0, 1.65, 0]} center distanceFactor={14} style={{ pointerEvents: "none" }}>
        <span className="rxn-arrow-label">{t < 0.5 ? "reaktan" : "produk"}</span>
      </Html>
      <mesh position={[0, 0.2, -0.4]}>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {reactants.map((inst, i) => {
        const sp = REACTION_SPECIES[inst.speciesId];
        if (!sp) return null;
        return (
          <MiniMolecule
            key={`r-${i}`}
            species={sp}
            position={inst.offset}
            opacity={reactantOpacity}
          />
        );
      })}
      {products.map((inst, i) => {
        const sp = REACTION_SPECIES[inst.speciesId];
        if (!sp) return null;
        return (
          <MiniMolecule
            key={`p-${i}`}
            species={sp}
            position={inst.offset}
            opacity={productOpacity}
          />
        );
      })}
    </group>
  );
}
