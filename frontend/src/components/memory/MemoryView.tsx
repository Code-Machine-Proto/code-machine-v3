// frontend/src/components/memory/MemoryView.tsx
import { createSignal, For, Show } from "solid-js";
import type { Accessor } from "solid-js";

interface Props {
  memory: Accessor<number[]>;
  stimulatedMemory: Accessor<number>;
  isCompiled: Accessor<boolean>;
}

export default function MemoryView(props: Props) {
  const [displayHex, setDisplayHex] = createSignal(true);
  const [collapsed, setCollapsed] = createSignal(false);

  const formatValue = (val: number) => {
    if (displayHex()) {
      const unsigned = val < 0 ? val + 0x10000 : val;
      return unsigned.toString(16).toUpperCase().padStart(4, "0");
    }
    return val.toString();
  };

  const rows = () => {
    const mem = props.memory();
    const result = [];
    for (let i = 0; i < mem.length; i += 8) {
      result.push({
        address: i,
        values: mem.slice(i, i + 8),
      });
    }
    return result;
  };

  return (
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between px-3 py-2 border-b border-main-800">
        <button
          onClick={() => setCollapsed((c) => !c)}
          class="text-xs text-main-500 uppercase font-semibold tracking-wider hover:text-main-400 flex items-center gap-1"
        >
          <span class="text-[10px]">{collapsed() ? "▶" : "▼"}</span>
          Memory
        </button>
        <Show when={!collapsed()}>
          <button
            onClick={() => setDisplayHex((h) => !h)}
            class="text-xs text-main-600 hover:text-main-400 px-2 py-0.5 rounded border border-main-800"
          >
            {displayHex() ? "HEX" : "DEC"}
          </button>
        </Show>
      </div>
      <Show when={!collapsed()}>
        <div class="flex-1 overflow-auto font-mono text-xs p-2">
          <Show when={props.isCompiled()} fallback={<p class="text-main-600 text-center mt-4">Compile to view memory</p>}>
            <table class="w-full">
              <thead>
                <tr class="text-main-600">
                  <th class="text-left px-1 py-0.5 w-12">Addr</th>
                  <For each={[0, 1, 2, 3, 4, 5, 6, 7]}>
                    {(offset) => <th class="text-center px-1 py-0.5 w-12">+{offset}</th>}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For each={rows()}>
                  {(row) => (
                    <tr>
                      <td class="text-main-600 px-1 py-0.5">
                        {displayHex() ? row.address.toString(16).toUpperCase().padStart(2, "0") : row.address}
                      </td>
                      <For each={row.values}>
                        {(val, idx) => {
                          const addr = row.address + idx();
                          const isStimulated = () => addr === props.stimulatedMemory() && props.stimulatedMemory() > 0;
                          return (
                            <td
                              class="text-center px-1 py-0.5 transition-colors"
                              classList={{
                                "text-main-400": !isStimulated(),
                                "text-accent-light bg-accent/10 rounded": isStimulated(),
                              }}
                            >
                              {formatValue(val)}
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
      </Show>
    </div>
  );
}
