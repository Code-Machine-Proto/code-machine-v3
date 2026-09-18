import { createSignal } from "solid-js";

const STORAGE_KEY = "codemachine-ui-zoom-preset";
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const DEFAULT_ZOOM = 1;
const STEP = 0.1;

function clamp(z: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

function getInitialZoom(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  const value = stored ? parseFloat(stored) : NaN;
  return Number.isFinite(value) ? clamp(value) : DEFAULT_ZOOM;
}

function applyZoom(z: number) {
  document.documentElement.style.zoom = String(z);
}

const [zoom, setZoomSignal] = createSignal(getInitialZoom());
applyZoom(zoom());

function setZoom(value: number) {
  const next = clamp(value);
  setZoomSignal(next);
  applyZoom(next);
}

export function useUiZoom() {
  return {
    zoom,
    zoomIn: () => setZoom(zoom() + STEP),
    zoomOut: () => setZoom(zoom() - STEP),
    resetZoom: () => setZoom(DEFAULT_ZOOM),
    zoomBy: (factor: number) => setZoom(zoom() * factor),
    savePreset: () => localStorage.setItem(STORAGE_KEY, String(zoom())),
    hasPreset: () => localStorage.getItem(STORAGE_KEY) !== null,
    isMin: () => zoom() <= MIN_ZOOM,
    isMax: () => zoom() >= MAX_ZOOM,
  };
}
