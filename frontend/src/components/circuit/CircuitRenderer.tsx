import { Switch, Match } from "solid-js";
import type { Accessor } from "solid-js";
import { ProcessorId } from "@/wasm/types";
import VisualAccumulator from "./VisualAccumulator";
import VisualWithMa from "./VisualWithMa";
import VisualPolyRisc from "./VisualPolyRisc";

interface Props {
  processorId: ProcessorId;
  registers: Accessor<Record<string, number>>;
  stimulatedLineState: Accessor<number>;
  isCompiled: Accessor<boolean>;
}

export default function CircuitRenderer(props: Props) {
  return (
    <div class="flex flex-col h-full">
      <div class="flex items-center px-3 py-2 border-b border-main-800">
        <span class="text-xs text-main-500 uppercase font-semibold tracking-wider">Vue du circuit</span>
      </div>
      <div class="flex-1 flex items-center justify-center p-4 min-h-0">
        <Switch fallback={<p class="text-main-600">Sélectionnez un processeur</p>}>
          <Match when={props.processorId === ProcessorId.Accumulator}>
            <VisualAccumulator stimulatedLineState={props.stimulatedLineState()} registers={props.registers()} />
          </Match>
          <Match when={props.processorId === ProcessorId.AccumulatorMa}>
            <VisualWithMa stimulatedLineState={props.stimulatedLineState()} registers={props.registers()} />
          </Match>
          <Match when={props.processorId === ProcessorId.PolyRisc}>
            <VisualPolyRisc stimulatedLineState={props.stimulatedLineState()} registers={props.registers()} />
          </Match>
        </Switch>
      </div>
    </div>
  );
}
