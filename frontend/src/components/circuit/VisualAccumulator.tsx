import RegisterBox, { REGISTER_16_BIT, REGISTER_8_BIT } from "./parts/RegisterBox";
import ALU from "./parts/ALU";
import Bus from "./parts/Bus";
import Multiplexer from "./parts/Multiplexer";
import ObscureMemory from "./parts/ObscureMemory";

// LineStateAccumulator: -1 error, 0 fetch, 1 load, 2 store, 3 decode, 4 alu, 5 nop, 6 branching

interface VisualProps {
  stimulatedLineState: number;
  registers: Record<string, number>;
}

export default function VisualAccumulator(props: VisualProps) {
  const ls = () => props.stimulatedLineState;

  const pcVal = () => props.registers["PC"] ?? 0;
  const irVal = () => props.registers["IR"] ?? 0;
  const accVal = () => props.registers["ACC"] ?? 0;

  // Wire active states based on line state
  const fetchActive = () => ls() === 0;
  const loadActive = () => ls() === 1;
  const storeActive = () => ls() === 2;
  const decodeActive = () => ls() === 3;
  const aluActive = () => ls() === 4;
  const branchActive = () => ls() === 6;

  // PC writes on fetch or branching
  const pcWrite = () => fetchActive() || branchActive();
  // IR writes on fetch
  const irWrite = () => fetchActive();
  // ACC writes on load or alu
  const accWrite = () => loadActive() || aluActive();
  // Memory read on fetch, load, store
  const memRead = () => fetchActive() || loadActive();
  // Memory write on store
  const memWrite = () => storeActive();
  // ALU active on alu step
  const aluActivated = () => aluActive();
  // MUX active when selecting address
  const muxActive = () => loadActive() || storeActive() || aluActive();

  // Wire colors
  const wireDefault = "#475569";
  const wireActive = "#38bdf8";

  // PC -> Memory address wire
  const pcToMemColor = () => fetchActive() ? wireActive : wireDefault;
  // Memory -> IR wire
  const memToIrColor = () => fetchActive() ? wireActive : wireDefault;
  // IR -> MUX wire (address field)
  const irToMuxColor = () => (loadActive() || storeActive() || aluActive()) ? wireActive : wireDefault;
  // MUX -> Memory address wire
  const muxToMemColor = () => (loadActive() || storeActive() || aluActive()) ? wireActive : wireDefault;
  // Memory -> ALU B input wire
  const memToAluColor = () => (loadActive() || aluActive()) ? wireActive : wireDefault;
  // ACC -> ALU A input wire
  const accToAluColor = () => aluActive() ? wireActive : wireDefault;
  // ALU -> ACC wire
  const aluToAccColor = () => (aluActive() || loadActive()) ? wireActive : wireDefault;
  // ACC -> Memory data wire (store)
  const accToMemColor = () => storeActive() ? wireActive : wireDefault;

  const strokeW = "2.5";

  return (
    <svg viewBox="0 0 700 550" class="w-full h-full" style="max-height: 100%; max-width: 100%;" preserveAspectRatio="xMidYMid meet">
      {/* Background */}
      <rect width="700" height="550" fill="#0f172a" rx="8" />

      {/* === WIRE PATHS === */}

      {/* PC output -> Memory address (top horizontal) */}
      <path d="M170 60 L230 60" stroke={pcToMemColor()} stroke-width={strokeW} fill="none" />
      <Bus x={185} y={50} number={16} />

      {/* Memory data output -> IR input (top horizontal) */}
      <path d="M370 60 L420 60" stroke={memToIrColor()} stroke-width={strokeW} fill="none" />
      <Bus x={385} y={50} number={16} />

      {/* IR address field -> down to MUX (vertical then horizontal) */}
      <path d="M480 96 L480 200 L350 200 L350 230" stroke={irToMuxColor()} stroke-width={strokeW} fill="none" />
      <Bus x={465} y={140} number={8} />

      {/* PC -> down to MUX second input */}
      <path d="M120 96 L120 260 L310 260" stroke={pcToMemColor()} stroke-width={strokeW} fill="none" />

      {/* MUX output -> Memory address (goes up) */}
      <path d="M350 330 L350 370 L200 370 L200 130 L230 130" stroke={muxToMemColor()} stroke-width={strokeW} fill="none" />

      {/* Memory data -> down to ALU B input */}
      <path d="M370 130 L390 130 L390 400 L430 400" stroke={memToAluColor()} stroke-width={strokeW} fill="none" />
      <Bus x={380} y={260} number={16} />

      {/* ACC output -> ALU A input */}
      <path d="M600 310 L600 340 L500 340" stroke={accToAluColor()} stroke-width={strokeW} fill="none" />

      {/* ALU F output -> ACC input */}
      <path d="M500 370 L600 370 L600 220" stroke={aluToAccColor()} stroke-width={strokeW} fill="none" />
      <Bus x={545} y={360} number={16} />

      {/* ACC -> Memory data input (store path) */}
      <path d="M600 220 L640 220 L640 130 L370 130" stroke={accToMemColor()} stroke-width={strokeW} fill="none" stroke-dasharray={storeActive() ? "none" : "4 4"} />

      {/* === COMPONENTS === */}

      {/* PC Register */}
      <RegisterBox
        name="PC"
        number={pcVal()}
        class="bg-blue-600/20 border border-blue-500 text-blue-200"
        x={50}
        y={20}
        isActivated={pcWrite()}
        registerSize={REGISTER_16_BIT}
      />

      {/* Instruction Memory */}
      <ObscureMemory
        name="Mémoire"
        class="fill-amber-200"
        x={230}
        y={0}
        hasControlSignal={true}
        controlName="wr_mem"
        isWritable={memWrite()}
      />

      {/* IR Register */}
      <RegisterBox
        name="IR"
        number={irVal()}
        class="bg-purple-600/20 border border-purple-500 text-purple-200"
        x={420}
        y={20}
        isActivated={irWrite()}
        registerSize={REGISTER_16_BIT}
      />

      {/* MUX */}
      <Multiplexer
        x={310}
        y={200}
        isActivated={muxActive()}
        name="sel_mux"
      />

      {/* ALU */}
      <ALU
        x={430}
        y={310}
        isActivated={aluActivated()}
      />

      {/* ACC Register */}
      <RegisterBox
        name="ACC"
        number={accVal()}
        class="bg-emerald-600/20 border border-emerald-500 text-emerald-200"
        x={540}
        y={220}
        isActivated={accWrite()}
        registerSize={REGISTER_16_BIT}
      />
    </svg>
  );
}
