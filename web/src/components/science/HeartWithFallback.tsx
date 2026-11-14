"use client";

import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import type { AnatomyPart } from "@/lib/science/anatomy";
import { GlbHeart } from "./GlbHeart";
import { OrganicHeart } from "./OrganicHeart";

type HeartProps = {
  parts: AnatomyPart[];
  selectedId?: string | null;
  highlightIds?: string[];
  hiddenIds?: Set<string>;
  onSelect?: (partId: string | null) => void;
  showLabels?: boolean;
  exploded?: boolean;
  pulse?: boolean;
};

class HeartErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[HeartWithFallback]", error.message, info.componentStack);
  }
  render() {
    if (this.state.err) return this.props.fallback;
    return this.props.children;
  }
}

/** Utamakan GLB BodyParts3D; gagal muat → mesh organik. */
export function HeartWithFallback(props: HeartProps) {
  const fallback = <OrganicHeart {...props} />;
  return (
    <HeartErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GlbHeart {...props} />
      </Suspense>
    </HeartErrorBoundary>
  );
}
