"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

type Props = {
  children: ReactNode;
  className?: string;
  ambient?: number;
  /** Naikkan nilai ini untuk mereset kamera. */
  resetNonce?: number;
};

function Controls({ resetNonce }: { resetNonce?: number }) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  useEffect(() => {
    if (resetNonce == null) return;
    controls.current?.reset();
  }, [resetNonce]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1.2}
      maxDistance={12}
      target={[0, 0.1, 0]}
    />
  );
}

/** Viewer 3D reusable: orbit, zoom, pan, reset. Tanpa HDR eksternal (hindari fetch gagal). */
export function ScienceViewer({ children, className, ambient = 0.7, resetNonce }: Props) {
  return (
    <div className={`sci-viewer${className ? ` ${className}` : ""}`}>
      <Canvas
        camera={{ position: [3.4, 2.0, 3.8], fov: 40, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#e8eef5"]} />
        <ambientLight intensity={ambient} />
        <hemisphereLight args={["#fff7ed", "#64748b", 0.65]} />
        <directionalLight position={[4, 6, 2]} intensity={1.35} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.55} />
        <directionalLight position={[0, 3, 4]} intensity={0.35} color="#fecdd3" />
        <Suspense fallback={null}>
          {children}
          <ContactShadows position={[0, -1.45, 0]} opacity={0.42} scale={12} blur={2.8} far={5} />
        </Suspense>
        <Controls resetNonce={resetNonce} />
      </Canvas>
    </div>
  );
}
