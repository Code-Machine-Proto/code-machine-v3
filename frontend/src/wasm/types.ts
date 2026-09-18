// frontend/src/wasm/types.ts
export type Phase = 'Fetch' | 'Decode' | 'Execute';

export interface BusActivity {
  bus_name: string;
  value: number;
}

export interface CycleState {
  cycle: number;
  phase: Phase;
  registers: Record<string, number>;
  memory: number[];
  active_signals: string[];
  active_buses: BusActivity[];
  stimulated_line_state: number;
  stimulated_memory: number;
  instruction_memory: number[] | null;
}

export interface Diagnostic {
  line: number;
  column: number;
  message: string;
  severity: 'Error' | 'Warning';
}

export interface TokenSpan {
  line: number;
  start: number;
  end: number;
  kind: string;
}

export interface CompileResult {
  success: boolean;
  program: number[];
  diagnostics: Diagnostic[];
  tokens: TokenSpan[];
  data_memory: number[] | null;
  instruction_lines: number[];
}

export interface SimulationTrace {
  steps: CycleState[];
  halted: boolean;
  error: string | null;
}

export enum ProcessorId {
  Accumulator = 0,
  AccumulatorMa = 1,
  PolyRisc = 2,
}

export function processorIdFromRoute(route: string | undefined): ProcessorId {
  switch (route) {
    case 'accumulator':
      return ProcessorId.Accumulator;
    case 'accumulator-ma':
      return ProcessorId.AccumulatorMa;
    case 'polyrisc':
      return ProcessorId.PolyRisc;
    default:
      return ProcessorId.Accumulator;
  }
}
