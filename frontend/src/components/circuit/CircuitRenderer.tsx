// frontend/src/components/circuit/CircuitRenderer.tsx
import { For, Show, createMemo } from "solid-js";
import type { Accessor } from "solid-js";
import RegisterBox from "./parts/RegisterBox";
import ALUShape from "./parts/ALUShape";
import MuxShape from "./parts/MuxShape";
import MemoryBlock from "./parts/MemoryBlock";
import Connection from "./parts/Connection";

import accumulatorSchema from "@/schemas/accumulator.circuit.json";
import accumulatorMaSchema from "@/schemas/accumulator-ma.circuit.json";
import polyriscSchema from "@/schemas/polyrisc.circuit.json";
import { ProcessorId } from "@/wasm/types";

interface CircuitSchema {
  id: string;
  viewBox: string;
  components: any[];
  connections: any[];
}

interface Props {
  processorId: ProcessorId;
  registers: Accessor<Record<string, number>>;
  stimulatedLineState: Accessor<number>;
  isCompiled: Accessor<boolean>;
}

function getSchema(processorId: ProcessorId): CircuitSchema {
  switch (processorId) {
    case ProcessorId.Accumulator: return accumulatorSchema;
    case ProcessorId.AccumulatorMa: return accumulatorMaSchema;
    case ProcessorId.PolyRisc: return polyriscSchema;
  }
}

function formatRegValue(name: string, value: number | undefined): string {
  if (value === undefined) return "";
  if (name === "Flags") return `Z:${value & 1} N:${(value >> 1) & 1}`;
  const hex = (value < 0 ? value + 0x10000 : value).toString(16).toUpperCase();
  return `0x${hex.padStart(4, "0")}`;
}

export default function CircuitRenderer(props: Props) {
  const schema = createMemo(() => getSchema(props.processorId));

  const getRegValue = (componentId: string): string => {
    const regs = props.registers();
    const labelMap: Record<string, string> = {
      pc: "PC", ir: "IR", acc: "ACC", ma: "MA",
      flags: "FlagZ",
      reg_file: "r0",
      decode: "",
    };
    const regName = labelMap[componentId];
    if (!regName) return "";
    return formatRegValue(componentId, regs[regName]);
  };

  const isActive = () => props.stimulatedLineState() >= 0 && props.isCompiled();

  return (
    <div class="flex flex-col h-full">
      <div class="flex items-center px-3 py-2 border-b border-main-800">
        <span class="text-xs text-main-500 uppercase font-semibold tracking-wider">Circuit View</span>
      </div>
      <div class="flex-1 flex items-center justify-center p-4">
        <Show when={props.isCompiled()} fallback={
          <p class="text-main-600">Compile to view circuit</p>
        }>
          <svg viewBox={schema().viewBox} class="w-full h-full max-w-full max-h-full">
            <For each={schema().connections}>
              {(conn) => {
                const fromComp = schema().components.find((c: any) => conn.from.startsWith(c.id));
                const toComp = schema().components.find((c: any) => conn.to.startsWith(c.id));
                if (!fromComp || !toComp) return null;
                const fromX = fromComp.x + fromComp.width;
                const fromY = fromComp.y + fromComp.height / 2;
                const toX = toComp.x;
                const toY = toComp.y + toComp.height / 2;
                return (
                  <Connection
                    points={[{ x: fromX, y: fromY }, { x: toX, y: toY }]}
                    active={isActive()}
                    label={conn.label}
                  />
                );
              }}
            </For>
            <For each={schema().components}>
              {(comp) => {
                const value = () => getRegValue(comp.id);
                const active = isActive;
                switch (comp.type) {
                  case "register":
                    return <RegisterBox {...comp} value={value()} active={active()} />;
                  case "alu":
                    return <ALUShape {...comp} active={active()} />;
                  case "multiplexer":
                    return <MuxShape {...comp} active={active()} />;
                  case "memory":
                    return <MemoryBlock {...comp} active={active()} />;
                  default:
                    return null;
                }
              }}
            </For>
          </svg>
        </Show>
      </div>
    </div>
  );
}
