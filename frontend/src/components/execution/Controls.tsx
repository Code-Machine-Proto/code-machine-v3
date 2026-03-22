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
    <div class="flex items-center gap-3 px-4 py-2 bg-main-900/80">
      {/* Transport buttons */}
      <div class="flex items-center gap-1">
        <ControlButton onClick={props.onGoToStart} disabled={() => !props.isCompiled()} title="Début">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/></svg>
        </ControlButton>
        <ControlButton onClick={props.onStepBackward} disabled={() => !props.isCompiled() || props.currentStep() <= 0} title="Pas précédent">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/></svg>
        </ControlButton>
        <button
          onClick={props.onTogglePlay}
          disabled={!props.isCompiled()}
          class="w-9 h-9 flex items-center justify-center rounded-full bg-accent hover:bg-accent-light text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={props.isPlaying() ? "Pause" : "Lecture"}
        >
          <Show when={props.isPlaying()} fallback={
            <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          }>
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </Show>
        </button>
        <ControlButton onClick={props.onStepForward} disabled={() => !props.isCompiled() || props.currentStep() >= props.totalSteps() - 1} title="Pas suivant">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zm2 0V6l6.5 6L8 18zM16 6v12h2V6h-2z"/></svg>
        </ControlButton>
        <ControlButton onClick={props.onGoToEnd} disabled={() => !props.isCompiled()} title="Fin">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </ControlButton>
      </div>

      <Show when={props.isCompiled()}>
        {/* Timeline slider */}
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="range"
            min="0"
            max={props.totalSteps() - 1}
            value={props.currentStep()}
            onInput={(e) => props.setCurrentStep(parseInt(e.currentTarget.value))}
            class="flex-1 accent-accent h-1.5"
          />
          <span class="text-xs text-main-400 font-mono shrink-0 tabular-nums">
            {props.currentStep() + 1} / {props.totalSteps()}
          </span>
        </div>

        {/* Phase badge */}
        <div class="shrink-0 px-2.5 py-1 rounded bg-main-800 border border-main-700">
          <span class="text-xs font-mono text-accent-light">{props.phase()}</span>
        </div>

        {/* Speed selector */}
        <select
          value={props.playbackSpeed()}
          onChange={(e) => props.setPlaybackSpeed(parseInt(e.currentTarget.value))}
          class="shrink-0 bg-main-800 text-main-300 text-xs rounded px-2 py-1.5 border border-main-700 cursor-pointer"
        >
          <option value="1000">Lent</option>
          <option value="500">Normal</option>
          <option value="200">Rapide</option>
          <option value="50">Très rapide</option>
        </select>
      </Show>

      <Show when={!props.isCompiled()}>
        <span class="text-xs text-main-600 ml-2">Compilez du code pour commencer la simulation</span>
      </Show>
    </div>
  );
}

function ControlButton(props: { onClick: () => void; disabled: () => boolean; title: string; children: any }) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled()}
      class="w-8 h-8 flex items-center justify-center rounded bg-main-800 hover:bg-main-700 text-main-400 hover:text-main-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      title={props.title}
    >
      {props.children}
    </button>
  );
}
