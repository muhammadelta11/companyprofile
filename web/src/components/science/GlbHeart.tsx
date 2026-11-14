"use client";

import { Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { AnatomyPart } from "@/lib/science/anatomy";

const GLB_URL = "/models/heart.glb";

/** Mesh BodyParts3D → id bagian pembelajaran kita. */
export const MESH_TO_PART: Record<string, string> = {
  "right-atrium": "ra",
  "left-atrium": "la",
  "right-ventricle": "rv",
  "left-ventricle": "lv",
  "ventricular-wall": "lv", // dinding gabungan; highlight ikut LV/RV
  "ascending-aorta": "aorta",
  "aortic-arch": "aorta",
  "pulmonary-trunk": "pa",
  "superior-vena-cava": "vc",
};

const PART_MESHES: Record<string, string[]> = {
  ra: ["right-atrium"],
  la: ["left-atrium"],
  rv: ["right-ventricle"],
  lv: ["left-ventricle", "ventricular-wall"],
  aorta: ["ascending-aorta", "aortic-arch"],
  pa: ["pulmonary-trunk"],
  vc: ["superior-vena-cava"],
  pv: [],
};

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

function meshMatchesPart(meshName: string, partId: string) {
  if (PART_MESHES[partId]?.includes(meshName)) return true;
  if (partId === "rv" && meshName === "ventricular-wall") return true;
  return false;
}

function isMeshActive(
  meshName: string,
  selectedId: string | null | undefined,
  highlightIds: string[] | undefined
) {
  const part = MESH_TO_PART[meshName];
  if (!part) return false;
  if (selectedId && meshMatchesPart(meshName, selectedId)) return true;
  if (highlightIds?.some((id) => meshMatchesPart(meshName, id))) return true;
  return false;
}

function isMeshHidden(meshName: string, hiddenIds?: Set<string>) {
  if (!hiddenIds?.size) return false;
  const part = MESH_TO_PART[meshName];
  if (part && hiddenIds.has(part)) return true;
  if (meshName === "ventricular-wall" && (hiddenIds.has("lv") || hiddenIds.has("rv"))) {
    return hiddenIds.has("lv") && hiddenIds.has("rv");
  }
  return false;
}

type MeshState = {
  mesh: THREE.Mesh;
  baseColor: THREE.Color;
  baseEmissive: THREE.Color;
  baseIntensity: number;
  baseOpacity: number;
};

/** Jantung BodyParts3D (CC BY 4.0) — realistis + hotspot pembelajaran. */
export function GlbHeart({
  parts,
  selectedId,
  highlightIds,
  hiddenIds,
  onSelect,
  showLabels = true,
  exploded = false,
  pulse = false,
}: Props) {
  const { scene } = useGLTF(GLB_URL);
  const root = useRef<THREE.Group>(null);
  const meshes = useRef<MeshState[]>([]);
  void parts;
  const prepared = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.85 / maxDim;
    clone.position.set(-center.x * scale, -center.y * scale + 0.05, -center.z * scale);
    clone.scale.setScalar(scale);
    clone.rotation.set(0.05, 0.15, 0);
    return clone;
  }, [scene]);

  useEffect(() => {
    const list: MeshState[] = [];
    prepared.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const mat = m as THREE.MeshStandardMaterial;
        if (!mat?.color) continue;
        mat.transparent = true;
        mat.depthWrite = true;
        list.push({
          mesh,
          baseColor: mat.color.clone(),
          baseEmissive: mat.emissive?.clone() ?? new THREE.Color(0),
          baseIntensity: mat.emissiveIntensity ?? 0,
          baseOpacity: mat.opacity ?? 1,
        });
        break;
      }
      mesh.userData.structureId = mesh.name;
    });
    meshes.current = list;
  }, [prepared]);

  useFrame(({ clock }) => {
    const hasFocus = Boolean(selectedId) || Boolean(highlightIds?.length);
    const beat = pulse ? 1 + Math.sin(clock.elapsedTime * 7) * 0.018 : 1;
    if (root.current) root.current.scale.setScalar(beat);

    const explode = exploded ? 1.12 : 1;
    for (const state of meshes.current) {
      const name = state.mesh.name;
      const part = MESH_TO_PART[name];
      const hidden = isMeshHidden(name, hiddenIds);
      state.mesh.visible = !hidden;
      if (hidden) continue;

      const active = isMeshActive(name, selectedId, highlightIds);
      const mats = Array.isArray(state.mesh.material) ? state.mesh.material : [state.mesh.material];
      for (const m of mats) {
        const mat = m as THREE.MeshStandardMaterial;
        if (!mat?.color) continue;
        if (active) {
          mat.color.copy(state.baseColor);
          mat.emissive.set(part === "pa" || part === "vc" || part === "ra" || part === "rv" ? "#38bdf8" : "#fb7185");
          mat.emissiveIntensity = 0.45;
          mat.opacity = 1;
        } else if (hasFocus) {
          mat.color.copy(state.baseColor).multiplyScalar(0.55);
          mat.emissive.copy(state.baseEmissive);
          mat.emissiveIntensity = 0;
          mat.opacity = 0.22;
        } else {
          mat.color.copy(state.baseColor);
          mat.emissive.copy(state.baseEmissive);
          mat.emissiveIntensity = state.baseIntensity;
          mat.opacity = state.baseOpacity;
        }
        mat.needsUpdate = true;
      }

      // slight explode by part offset
      if (part && exploded) {
        const dir = state.mesh.position.clone().normalize();
        if (dir.lengthSq() < 0.01) dir.set(0, 1, 0);
        state.mesh.position.addScaledVector(dir, 0); // keep baked; use group offset instead
      }
      void explode;
    }
  });

  function pickPart(object: THREE.Object3D) {
    let obj: THREE.Object3D | null = object;
    while (obj) {
      const id = MESH_TO_PART[obj.name];
      if (id) {
        onSelect?.(id);
        return;
      }
      obj = obj.parent;
    }
  }

  const shortLabel: Record<string, string> = {
    ra: "RA",
    la: "LA",
    rv: "RV",
    lv: "LV",
    aorta: "Ao",
    pa: "PT",
    vc: "SVC",
    pv: "PV",
  };

  const labelAnchors: { id: string; pos: [number, number, number] }[] = [
    { id: "ra", pos: [-0.85, 0.55, 0.35] },
    { id: "la", pos: [0.75, 0.55, -0.25] },
    { id: "rv", pos: [-0.7, -0.25, 0.55] },
    { id: "lv", pos: [0.65, -0.45, 0.15] },
    { id: "aorta", pos: [0.15, 1.25, 0.2] },
    { id: "pa", pos: [-0.2, 1.05, 0.55] },
    { id: "vc", pos: [-0.55, 1.15, -0.05] },
  ];

  return (
    <group
      ref={root}
      onPointerMissed={() => onSelect?.(null)}
      onClick={(e) => {
        e.stopPropagation();
        pickPart(e.object);
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <primitive object={prepared} />

      {/* Vena pulmonalis tidak ada di subset BodyParts3D ini — marker edukatif */}
      {!hiddenIds?.has("pv") ? (
        <mesh
          position={[0.95, 0.45, -0.35]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.("pv");
          }}
        >
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color="#f43f5e"
            emissive={selectedId === "pv" || highlightIds?.includes("pv") ? "#f43f5e" : "#000"}
            emissiveIntensity={selectedId === "pv" ? 0.4 : 0}
            transparent
            opacity={0.85}
          />
        </mesh>
      ) : null}

      {labelAnchors.map((a) => {
        if (hiddenIds?.has(a.id)) return null;
        // Jangan pin dari highlight fisiologi (banyak sekaligus = mengganggu).
        // Hanya: klik terpilih, atau mode "Pin singkat".
        const picked = selectedId === a.id;
        if (!showLabels && !picked) return null;
        return (
          <Html
            key={a.id}
            position={a.pos}
            center
            distanceFactor={36}
            style={{ pointerEvents: "none", transform: "translateZ(0)" }}
            zIndexRange={[10, 0]}
          >
            <span className={`sci-pin${picked ? " is-active" : ""}`}>{shortLabel[a.id] ?? a.id}</span>
          </Html>
        );
      })}
    </group>
  );
}

useGLTF.preload(GLB_URL);
