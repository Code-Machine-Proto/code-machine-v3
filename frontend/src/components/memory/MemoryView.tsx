// frontend/src/components/memory/MemoryView.tsx
import { createSignal, onMount, onCleanup, For, Show } from "solid-js";
import type { Accessor } from "solid-js";
import { ProcessorId } from "@/wasm/types";

interface Props {
  memory: Accessor<number[]>;
  instructionMemory?: Accessor<number[]>;
  stimulatedMemory: Accessor<number>;
  isCompiled: Accessor<boolean>;
  processorId: ProcessorId;
}

const COLUMN_OPTIONS = [2, 4, 8, 16];

type MemoryTab = "data" | "instructions";

export default function MemoryView(props: Props) {
  const [displayHex, setDisplayHex] = createSignal(true);
  const [addrHex, setAddrHex] = createSignal(true);
  const [columns, setColumns] = createSignal(4);
  const [wide, setWide] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<MemoryTab>("data");

  const hasMemoryTabs = () => props.processorId === ProcessorId.PolyRisc;

  const activeMemory = () =>
    hasMemoryTabs() && activeTab() === "instructions"
      ? (props.instructionMemory?.() ?? [])
      : props.memory();

  let containerRef!: HTMLDivElement;

  onMount(() => {
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWide(w > 380);
    });
    observer.observe(containerRef);
    onCleanup(() => observer.disconnect());
  });

  const formatValue = (val: number) => {
    if (displayHex()) {
      const unsigned = val < 0 ? val + 0x10000 : val;
      return "0x" + unsigned.toString(16).toUpperCase().padStart(4, "0");
    }
    return val.toString();
  };

  const formatAddr = (addr: number) => {
    if (addrHex()) return "0x" + addr.toString(16).toUpperCase().padStart(2, "0");
    return addr.toString();
  };

  const rows = () => {
    const mem = activeMemory();
    const cols = columns();
    const result = [];
    for (let i = 0; i < mem.length; i += cols) {
      result.push({
        address: i,
        values: mem.slice(i, i + cols),
      });
    }
    return result;
  };

  return (
    <div ref={containerRef} class="flex flex-col h-full">
      {/* Header */}
      <div class="panel-header gap-2">
        <div class="flex items-center gap-2 shrink-0">
          <span
            class="panel-label shrink-0"
            classList={{ "text-xs": wide(), "text-[10px]": !wide() }}
          >
            {wide() ? "Memoire" : "Mem."}
          </span>
          <Show when={hasMemoryTabs()}>
            <div class="flex items-center rounded-md border border-main-700/50 overflow-hidden">
              <button
                onClick={() => setActiveTab("data")}
                classList={{
                  "transition-colors": true,
                  "bg-main-700 text-main-300": activeTab() === "data",
                  "bg-main-800 text-main-500 hover:text-main-300":
                    activeTab() !== "data",
                  "text-xs px-2 py-0.5": wide(),
                  "text-[10px] px-1.5 py-0.5": !wide(),
                }}
              >
                {wide() ? "Donnees" : "Don."}
              </button>
              <button
                onClick={() => setActiveTab("instructions")}
                classList={{
                  "transition-colors": true,
                  "bg-main-700 text-main-300": activeTab() === "instructions",
                  "bg-main-800 text-main-500 hover:text-main-300":
                    activeTab() !== "instructions",
                  "text-xs px-2 py-0.5": wide(),
                  "text-[10px] px-1.5 py-0.5": !wide(),
                }}
              >
                {wide() ? "Instructions" : "Ins."}
              </button>
            </div>
          </Show>
        </div>
        <div class="flex items-center gap-1 flex-wrap justify-end">
          <select
            value={columns()}
            onChange={(e) => setColumns(parseInt(e.currentTarget.value))}
            classList={{
              "bg-main-800 text-main-400 rounded-md border border-main-700/50 cursor-pointer transition-colors": true,
              "text-xs px-1.5 py-0.5": wide(),
              "text-[10px] px-1 py-0.5": !wide(),
            }}
          >
            <For each={COLUMN_OPTIONS}>
              {(n) => <option value={n}>{wide() ? `${n} col` : `${n}c`}</option>}
            </For>
          </select>
          <button
            onClick={() => setAddrHex((h) => !h)}
            classList={{
              "text-main-500 hover:text-main-300 rounded-md border border-main-700/50 transition-colors": true,
              "text-xs px-1.5 py-0.5": wide(),
              "text-[10px] px-1 py-0.5": !wide(),
            }}
          >
            {wide() ? (addrHex() ? "Addr: HEX" : "Addr: DEC") : (addrHex() ? "A:H" : "A:D")}
          </button>
          <button
            onClick={() => setDisplayHex((h) => !h)}
            classList={{
              "text-main-500 hover:text-main-300 rounded-md border border-main-700/50 transition-colors": true,
              "text-xs px-1.5 py-0.5": wide(),
              "text-[10px] px-1 py-0.5": !wide(),
            }}
          >
            {wide() ? (displayHex() ? "Val: HEX" : "Val: DEC") : (displayHex() ? "V:H" : "V:D")}
          </button>
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-auto p-1.5">
        <Show when={props.isCompiled()} fallback={
          <p class="text-main-600 text-xs text-center mt-8">Compilez pour voir la memoire</p>
        }>
          <table class="w-full table-fixed border-collapse font-mono" classList={{ "text-xs": wide(), "text-[10px]": !wide() }}>
            <thead>
              <tr>
                <th class="text-main-600 text-right pr-1.5 py-0.5 font-normal w-10"></th>
                <For each={Array.from({ length: columns() }, (_, i) => i)}>
                  {(offset) => (
                    <th class="text-main-600 text-center py-0.5 font-normal">+{offset}</th>
                  )}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={rows()}>
                {(row) => (
                  <tr>
                    <td class="text-main-500 text-right pr-1.5 py-0.5 w-10 shrink-0">{formatAddr(row.address)}</td>
                    <For each={row.values}>
                      {(val, idx) => {
                        const addr = row.address + idx();
                        // PolyRisc's stimulated_memory only ever reflects the
                        // instruction-fetch address (never a data access), so
                        // only apply it while that tab is the one showing.
                        const isStimulated = () =>
                          (!hasMemoryTabs() || activeTab() === "instructions") &&
                          addr === props.stimulatedMemory() &&
                          props.stimulatedMemory() >= 0;
                        return (
                          <td class="text-center py-0.5 px-0.5 overflow-hidden">
                            <div
                              class="rounded px-1 truncate transition-colors"
                              title={formatValue(val)}
                              classList={{
                                "bg-main-800 text-main-400": !isStimulated(),
                                "bg-green-700 text-white": isStimulated(),
                                "py-1.5": wide(),
                                "py-1": !wide(),
                              }}
                            >
                              {formatValue(val)}
                            </div>
                          </td>
                        );
                      }}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>
    </div>
  );
}
