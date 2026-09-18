import { expect } from 'vitest';
import { compileSource, initWasm, simulateProgram } from '@/wasm/bridge';
import type { CycleState } from '@/wasm/types';
import type { ProcessorId } from '@/wasm/types';

export interface InstructionTriple {
  fetch: CycleState;
  decode: CycleState;
  execute: CycleState;
}

export async function ensureWasmInitialized(): Promise<void> {
  await initWasm();
}

export function runInstructions(source: string, processorId: ProcessorId): InstructionTriple[] {
  const compiled = compileSource(source, processorId);
  expect(compiled.success, `compile failed: ${JSON.stringify(compiled.diagnostics)}`).toBe(true);

  const trace = simulateProgram(compiled.program, processorId, compiled.data_memory ?? []);
  expect(trace.error).toBeFalsy();
  expect(trace.halted).toBe(true);

  const triples: InstructionTriple[] = [];
  for (let i = 0; i + 2 < trace.steps.length; i += 3) {
    triples.push({ fetch: trace.steps[i], decode: trace.steps[i + 1], execute: trace.steps[i + 2] });
  }
  return triples;
}

export function assertActiveWires<T extends string>(
  allWireIds: readonly T[],
  getActiveWires: (stimulatedLineState: number) => Set<T>,
  stimulatedLineState: number,
  expected: T[]
): void {
  const active = getActiveWires(stimulatedLineState);
  for (const id of allWireIds) {
    if (expected.includes(id)) {
      expect(active.has(id), `expected "${id}" to be red (active) for state ${stimulatedLineState}`).toBe(true);
    } else {
      expect(active.has(id), `expected "${id}" to be white (inactive) for state ${stimulatedLineState}`).toBe(false);
    }
  }
}
