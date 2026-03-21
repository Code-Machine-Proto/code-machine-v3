// frontend/src/pages/Workspace.tsx
import { useParams, useNavigate } from "@solidjs/router";
import { onMount, Show, createMemo } from "solid-js";
import { initWasm } from "@/wasm/bridge";
import { processorIdFromRoute } from "@/wasm/types";
import { createSimulationStore } from "@/stores/simulation";
import CodeEditor from "@/components/editor/CodeEditor";
import Controls from "@/components/execution/Controls";
import CircuitRenderer from "@/components/circuit/CircuitRenderer";
import MemoryView from "@/components/memory/MemoryView";

export default function Workspace() {
  const params = useParams();
  const navigate = useNavigate();
  const processorId = createMemo(() => processorIdFromRoute(params.id));

  const store = createSimulationStore(processorId());
  let wasmReady = false;

  onMount(async () => {
    try {
      await initWasm();
      wasmReady = true;
    } catch (e) {
      console.error("Failed to load WASM:", e);
    }
  });

  const handleCompile = () => {
    if (!wasmReady) return;
    store.compileAndRun();
  };

  const stimulatedMemory = createMemo(() => {
    const cycle = store.currentCycle();
    return cycle?.stimulated_memory ?? 0;
  });

  return (
    <div class="flex h-screen">
      {/* Header bar */}
      <div class="absolute top-0 left-0 right-0 h-10 bg-main-900 border-b border-main-800 flex items-center px-4 z-10">
        <button
          onClick={() => navigate("/")}
          class="text-main-500 hover:text-main-300 text-sm mr-4"
        >
          ← Back
        </button>
        <span class="text-main-400 text-sm font-semibold">{params.id}</span>
      </div>

      {/* Main content below header */}
      <div class="flex w-full pt-10">
        {/* Left: Code Editor */}
        <div class="flex-1 bg-main-900 m-1 rounded-lg overflow-hidden border border-main-800">
          <CodeEditor
            processorId={processorId()}
            initialCode={store.code()}
            onChange={store.setCode}
            onCompile={handleCompile}
            diagnostics={store.diagnostics()}
          />
        </div>

        {/* Right: Controls + Circuit + Memory */}
        <div class="flex-[1.5] flex flex-col gap-1 m-1">
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
          <div class="flex-1 bg-main-900 rounded-lg overflow-hidden border border-main-800">
            <CircuitRenderer
              processorId={processorId()}
              registers={store.registers}
              stimulatedLineState={store.stimulatedLineState}
              isCompiled={store.isCompiled}
            />
          </div>
          <div class="h-48 bg-main-900 rounded-lg overflow-hidden border border-main-800">
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
