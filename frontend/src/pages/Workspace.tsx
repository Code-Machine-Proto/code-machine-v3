// frontend/src/pages/Workspace.tsx
import { useParams, useNavigate } from "@solidjs/router";
import { onMount, Show, createMemo, createSignal, For } from "solid-js";
import { initWasm } from "@/wasm/bridge";
import { processorIdFromRoute, ProcessorId } from "@/wasm/types";
import { createSimulationStore } from "@/stores/simulation";
import CodeEditor from "@/components/editor/CodeEditor";
import Controls from "@/components/execution/Controls";
import CircuitRenderer from "@/components/circuit/CircuitRenderer";
import MemoryView from "@/components/memory/MemoryView";

const processorLabels: Record<number, string> = {
  [ProcessorId.Accumulator]: "Accumulateur",
  [ProcessorId.AccumulatorMa]: "Accumulateur + MA",
  [ProcessorId.PolyRisc]: "PolyRisc",
};

export default function Workspace() {
  const params = useParams();
  const navigate = useNavigate();
  const processorId = createMemo(() => processorIdFromRoute(params.id));

  const store = createSimulationStore(processorId());
  const [wasmReady, setWasmReady] = createSignal(false);
  const [wasmError, setWasmError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      await initWasm();
      setWasmReady(true);
    } catch (e) {
      console.error("Failed to load WASM:", e);
      setWasmError(String(e));
    }
  });

  const handleCompile = () => {
    if (!wasmReady()) return;
    store.compileAndRun();
  };

  const stimulatedMemory = createMemo(() => {
    const cycle = store.currentCycle();
    return cycle?.stimulated_memory ?? 0;
  });

  const registerEntries = createMemo(() => {
    const regs = store.registers();
    return Object.entries(regs).sort(([a], [b]) => {
      const order = ["PC", "IR", "ACC", "MA", "FlagZ", "FlagN"];
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  });

  return (
    <div class="flex flex-col h-screen overflow-hidden bg-main-950">
      {/* Header bar */}
      <div class="h-11 shrink-0 bg-main-900 border-b border-main-800 flex items-center px-4 gap-3">
        <button
          onClick={() => navigate("/")}
          class="text-main-500 hover:text-main-300 text-sm flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          Retour
        </button>
        <div class="w-px h-5 bg-main-800" />
        <span class="text-main-300 text-sm font-semibold">{processorLabels[processorId()] ?? params.id}</span>

        <Show when={wasmError()}>
          <span class="text-red-400 text-xs ml-auto">Erreur WASM: {wasmError()}</span>
        </Show>
        <Show when={!wasmReady() && !wasmError()}>
          <span class="text-main-600 text-xs ml-auto animate-pulse">Chargement du simulateur...</span>
        </Show>
        <Show when={wasmReady()}>
          <span class="text-green-500/60 text-xs ml-auto">Simulateur chargé</span>
        </Show>
      </div>

      {/* Controls bar */}
      <div class="shrink-0 border-b border-main-800">
        <Controls
          currentStep={store.currentStep}
          totalSteps={store.totalSteps}
          isPlaying={store.isPlaying}
          isCompiled={store.isCompiled}
          phase={store.phase}
          playbackSpeed={store.playbackSpeed}
          setPlaybackSpeed={store.setPlaybackSpeed}
          onStepForward={store.stepForward}
          onStepBackward={store.stepBackward}
          onGoToStart={store.goToStart}
          onGoToEnd={store.goToEnd}
          onTogglePlay={store.togglePlay}
          setCurrentStep={store.setCurrentStep}
        />
      </div>

      {/* Main content */}
      <div class="flex flex-1 min-h-0">
        {/* Left: Code Editor */}
        <div class="w-[380px] shrink-0 flex flex-col border-r border-main-800">
          <CodeEditor
            processorId={processorId()}
            initialCode={store.code()}
            onChange={store.setCode}
            onCompile={handleCompile}
            diagnostics={store.diagnostics()}
          />
        </div>

        {/* Center: Circuit View */}
        <div class="flex-1 min-w-0 flex flex-col">
          <CircuitRenderer
            processorId={processorId()}
            registers={store.registers}
            stimulatedLineState={store.stimulatedLineState}
            isCompiled={store.isCompiled}
          />
        </div>

        {/* Right: Registers + Memory */}
        <div class="w-[320px] shrink-0 flex flex-col border-l border-main-800">
          {/* Registers */}
          <div class="shrink-0 border-b border-main-800">
            <div class="flex items-center px-3 py-2 border-b border-main-800/50">
              <span class="text-xs text-main-500 uppercase font-semibold tracking-wider">Registres</span>
            </div>
            <div class="p-2 max-h-48 overflow-auto">
              <Show when={store.isCompiled()} fallback={
                <p class="text-main-600 text-xs text-center py-3">Compilez pour voir les registres</p>
              }>
                <div class="grid grid-cols-2 gap-x-3 gap-y-1">
                  <For each={registerEntries()}>
                    {([name, value]) => (
                      <div class="flex items-center justify-between px-2 py-1 rounded bg-main-900/50">
                        <span class="text-xs font-mono text-main-500">{name}</span>
                        <span class="text-xs font-mono text-main-300">
                          {typeof value === "number"
                            ? `0x${((value < 0 ? value + 0x10000 : value) & 0xFFFF).toString(16).toUpperCase().padStart(4, "0")}`
                            : value}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>

          {/* Memory */}
          <div class="flex-1 min-h-0 overflow-hidden">
            <MemoryView
              memory={store.memory}
              stimulatedMemory={stimulatedMemory}
              isCompiled={store.isCompiled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
