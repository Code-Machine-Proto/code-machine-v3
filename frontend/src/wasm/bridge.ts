// frontend/src/wasm/bridge.ts
import type { CompileResult, SimulationTrace } from "./types";

let wasmModule: any = null;

export async function initWasm(): Promise<void> {
  if (wasmModule) return;
  const wasm = await import("../../simulator/pkg/codemachine_simulator");
  await wasm.default();
  wasmModule = wasm;
}

export function compileSource(source: string, processorId: number): CompileResult {
  if (!wasmModule) throw new Error("WASM not initialized");
  return wasmModule.compile(source, processorId) as CompileResult;
}

export function simulateProgram(program: Uint32Array | number[], processorId: number): SimulationTrace {
  if (!wasmModule) throw new Error("WASM not initialized");
  const arr = program instanceof Uint32Array ? program : new Uint32Array(program);
  return wasmModule.simulate(arr, processorId) as SimulationTrace;
}
