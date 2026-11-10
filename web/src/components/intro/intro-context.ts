"use client";

import { createContext, useContext } from "react";

export const IntroContext = createContext(true);

/** true setelah intro selesai (atau tidak diputar). */
export function useIntroDone() {
  return useContext(IntroContext);
}
