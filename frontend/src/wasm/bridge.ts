// frontend/src/wasm/bridge.ts
import type { CompileResult, SimulationTrace } from "./types";
import init, { compile, simulate } from "codemachine-simulator";

let initialized = false;

export async function initWasm(): Promise<void> {
  if (initialized) return;
  await init();
  initialized = true;
}

export function compileSource(source: string, processorId: number): CompileResult {
  if (!initialized) throw new Error("WASM not initialized");
  return compile(source, processorId) as CompileResult;
}

export function simulateProgram(program: Uint32Array | number[], processorId: number): SimulationTrace {
  if (!initialized) throw new Error("WASM not initialized");
  const arr = program instanceof Uint32Array ? program : new Uint32Array(program);
  return simulate(arr, processorId) as SimulationTrace;
}
