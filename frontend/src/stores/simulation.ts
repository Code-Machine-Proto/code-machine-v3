// frontend/src/stores/simulation.ts
import { createSignal, createEffect, onCleanup, batch } from 'solid-js';
import { compileSource, simulateProgram } from '@/wasm/bridge';
import type { CycleState, CompileResult, Diagnostic } from '@/wasm/types';
import { ProcessorId } from '@/wasm/types';
import { loadCode, saveCode } from './persistence';

// Fixed auto-play tick (the speed dropdown was replaced by the step-mode selector).
const AUTO_PLAY_INTERVAL_MS = 400;

export type StepMode = 'regular' | 'execution';

// Steps show the state *during* a cycle, so an instruction's results only appear in the next
// Fetch snapshot. Execution mode therefore lands on Fetch steps (plus the very last step, since
// `stop` writes nothing and no Fetch follows it).
function isExecutionLanding(phase: string): boolean {
  return phase === 'Fetch';
}

export function createSimulationStore(processorId: ProcessorId) {
  const [code, setCode] = createSignal(loadCode(processorId));
  const [steps, setSteps] = createSignal<CycleState[]>([]);
  const [currentStep, setCurrentStep] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isCompiled, setIsCompiled] = createSignal(false);
  const [isCompiling, setIsCompiling] = createSignal(false);
  const [diagnostics, setDiagnostics] = createSignal<Diagnostic[]>([]);
  const [stepMode, setStepMode] = createSignal<StepMode>('regular');
  const [instructionLines, setInstructionLines] = createSignal<number[]>([]);
  const [lastCompiledCode, setLastCompiledCode] = createSignal<string | null>(null);

  // Derived signals
  const currentCycle = () => steps()[currentStep()] ?? null;
  const activeSignals = () => currentCycle()?.active_signals ?? [];
  const registers = () => currentCycle()?.registers ?? {};
  const memory = () => currentCycle()?.memory ?? [];
  const instructionMemory = () => currentCycle()?.instruction_memory ?? [];
  const totalSteps = () => steps().length;
  const phase = () => currentCycle()?.phase ?? 'Fetch';
  // In execution mode the landing snapshot only stands for "the previous instruction has
  // executed", so we show the mode instead of a cycle name that would be misleading.
  const phaseLabel = () =>
    stepMode() === 'execution' && (isExecutionLanding(phase()) || currentStep() === steps().length - 1)
      ? 'Mode execute'
      : phase();
  const stimulatedLineState = () => currentCycle()?.stimulated_line_state ?? -1;
  // Source line (0-indexed) of the instruction currently under the program counter,
  // so the editor can highlight it in sync with the circuit animation. A Fetch
  // step's PC names the instruction being fetched; we look it up from the most
  // recent Fetch and hold that line through Decode/Execute.
  const currentLine = () => {
    const all = steps();
    let i = currentStep();
    while (i > 0 && all[i]?.phase !== 'Fetch') i--;
    const pc = all[i]?.registers['PC'];
    const lines = instructionLines();
    if (pc === undefined || pc < 0 || pc >= lines.length) return null;
    return lines[pc];
  };
  // True once a compile has happened at least once and the code has since
  // been edited, so the compile status badge can prompt the user to recompile.
  const isStale = () => lastCompiledCode() !== null && code() !== lastCompiledCode();

  // Debounced persistence
  let saveTimeout: ReturnType<typeof setTimeout>;
  createEffect(() => {
    const c = code();
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveCode(processorId, c), 300);
  });

  // Find the next/previous step index to land on given the current step mode.
  // Regular mode moves one step at a time; execution mode jumps from Fetch to Fetch.
  function nextLanding(from: number): number | null {
    const all = steps();
    if (stepMode() === 'regular') {
      return from < all.length - 1 ? from + 1 : null;
    }
    for (let i = from + 1; i < all.length; i++) {
      if (isExecutionLanding(all[i].phase)) return i;
    }
    // No Fetch left: the last step (the executing `stop`) is the final state.
    return from < all.length - 1 ? all.length - 1 : null;
  }

  function prevLanding(from: number): number | null {
    const all = steps();
    if (stepMode() === 'regular') {
      return from > 0 ? from - 1 : null;
    }
    for (let i = from - 1; i >= 0; i--) {
      if (isExecutionLanding(all[i].phase)) return i;
    }
    return null;
  }

  // Auto-play
  createEffect(() => {
    if (!isPlaying()) return;
    const id = setInterval(() => {
      setCurrentStep((s) => {
        const next = nextLanding(s);
        if (next === null) {
          setIsPlaying(false);
          return s;
        }
        return next;
      });
    }, AUTO_PLAY_INTERVAL_MS);
    onCleanup(() => clearInterval(id));
  });

  async function compileAndRun() {
    setIsCompiling(true);
    // Compiling/simulating is synchronous and typically finishes in well under
    // a frame, so without yielding here the "compiling" indicator would never
    // actually get painted before the work is already done. Two rAFs give the
    // browser a real chance to render it first.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    try {
      const source = code();
      const result: CompileResult = compileSource(source, processorId);
      setLastCompiledCode(source);
      setDiagnostics(result.diagnostics);

      if (!result.success) {
        setIsCompiled(false);
        setSteps([]);
        setInstructionLines([]);
        return;
      }

      const trace = simulateProgram(result.program, processorId, result.data_memory ?? []);
      batch(() => {
        setSteps(trace.steps);
        setCurrentStep(0);
        setIsCompiled(true);
        setIsPlaying(false);
        setInstructionLines(result.instruction_lines);
      });
    } finally {
      setIsCompiling(false);
    }
  }

  function stepForward() {
    setCurrentStep((s) => nextLanding(s) ?? s);
  }

  function stepBackward() {
    setCurrentStep((s) => prevLanding(s) ?? s);
  }

  function goToStart() {
    setCurrentStep(0);
  }

  function goToEnd() {
    setCurrentStep(steps().length - 1);
  }

  function togglePlay() {
    setIsPlaying((p) => !p);
  }
  return {
    code,
    setCode,
    steps,
    currentStep,
    setCurrentStep,
    isPlaying,
    isCompiled,
    isCompiling,
    isStale,
    diagnostics,
    stepMode,
    setStepMode,
    currentCycle,
    activeSignals,
    registers,
    memory,
    instructionMemory,
    totalSteps,
    phase,
    phaseLabel,
    stimulatedLineState,
    currentLine,
    compileAndRun,
    stepForward,
    stepBackward,
    goToStart,
    goToEnd,
    togglePlay,
  };
}
