// frontend/src/components/execution/Controls.tsx
import type { Accessor, Setter } from "solid-js";
import { Show } from "solid-js";

interface Props {
  currentStep: Accessor<number>;
  totalSteps: Accessor<number>;
  isPlaying: Accessor<boolean>;
  isCompiled: Accessor<boolean>;
  phase: Accessor<string>;
  playbackSpeed: Accessor<number>;
  setPlaybackSpeed: Setter<number>;
  onStepForward: () => void;
  onStepBackward: () => void;
  onGoToStart: () => void;
  onGoToEnd: () => void;
  onTogglePlay: () => void;
  setCurrentStep: Setter<number>;
}

export default function Controls(props: Props) {
  return (
    <div class="flex items-center gap-3 px-4 py-2 bg-main-900 rounded-lg">
      <div class="flex items-center gap-1">
        <ControlButton onClick={props.onGoToStart} disabled={() => !props.isCompiled()} title="Go to start">
          ⏮
        </ControlButton>
        <ControlButton onClick={props.onStepBackward} disabled={() => !props.isCompiled() || props.currentStep() <= 0} title="Step back">
          ◀
        </ControlButton>
        <button
          onClick={props.onTogglePlay}
          disabled={!props.isCompiled()}
          class="w-9 h-9 flex items-center justify-center rounded-full bg-accent hover:bg-accent-light text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          title={props.isPlaying() ? "Pause" : "Play"}
        >
          {props.isPlaying() ? "⏸" : "▶"}
        </button>
        <ControlButton onClick={props.onStepForward} disabled={() => !props.isCompiled() || props.currentStep() >= props.totalSteps() - 1} title="Step forward">
          ▶
        </ControlButton>
        <ControlButton onClick={props.onGoToEnd} disabled={() => !props.isCompiled()} title="Go to end">
          ⏭
        </ControlButton>
      </div>

      <Show when={props.isCompiled()}>
        <div class="flex items-center gap-2 ml-2">
          <span class="text-xs text-main-500">Cycle</span>
          <input
            type="range"
            min="0"
            max={props.totalSteps() - 1}
            value={props.currentStep()}
            onInput={(e) => props.setCurrentStep(parseInt(e.currentTarget.value))}
            class="w-32 accent-accent"
          />
          <span class="text-xs text-main-400 font-mono w-16">
            {props.currentStep() + 1}/{props.totalSteps()}
          </span>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <span class="text-xs text-main-500">Phase:</span>
          <span class="text-xs font-mono text-accent-light">{props.phase()}</span>
        </div>

        <div class="flex items-center gap-2 ml-4">
          <span class="text-xs text-main-500">Speed</span>
          <select
            value={props.playbackSpeed()}
            onChange={(e) => props.setPlaybackSpeed(parseInt(e.currentTarget.value))}
            class="bg-main-800 text-main-300 text-xs rounded px-2 py-1 border border-main-700"
          >
            <option value="1000">Slow</option>
            <option value="500">Normal</option>
            <option value="200">Fast</option>
            <option value="50">Very Fast</option>
          </select>
        </div>
      </Show>
    </div>
  );
}

function ControlButton(props: { onClick: () => void; disabled: () => boolean; title: string; children: any }) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled()}
      class="w-8 h-8 flex items-center justify-center rounded bg-main-800 hover:bg-main-700 text-main-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
      title={props.title}
    >
      {props.children}
    </button>
  );
}
