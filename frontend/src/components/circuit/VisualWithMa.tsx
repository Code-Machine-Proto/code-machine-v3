import RegisterBox, { REGISTER_16_BIT } from "./parts/RegisterBox";
import ALU from "./parts/ALU";
import Bus from "./parts/Bus";
import Multiplexer from "./parts/Multiplexer";
import ObscureMemory from "./parts/ObscureMemory";

// LineStateMa: -1 error, 0 fetch, 1 decode, 2 addSubMul, 3 addSubA, 4 addSubX,
//   5 sh, 6 store, 7 load, 8 loadA, 9 loadI, 10 storeA, 11 storeI, 12 branching, 13 nop

interface VisualProps {
  stimulatedLineState: number;
  registers: Record<string, number>;
}

export default function VisualWithMa(props: VisualProps) {
  const ls = () => props.stimulatedLineState;

  const pcVal = () => props.registers["PC"] ?? 0;
  const irVal = () => props.registers["IR"] ?? 0;
  const accVal = () => props.registers["ACC"] ?? 0;
  const maVal = () => props.registers["MA"] ?? 0;

  // Active states
  const fetchActive = () => ls() === 0;
  const decodeActive = () => ls() === 1;
  const addSubMul = () => ls() === 2;
  const addSubA = () => ls() === 3;
  const addSubX = () => ls() === 4;
  const sh = () => ls() === 5;
  const storeActive = () => ls() === 6;
  const loadActive = () => ls() === 7;
  const loadA = () => ls() === 8;
  const loadI = () => ls() === 9;
  const storeA = () => ls() === 10;
  const storeI = () => ls() === 11;
  const branchActive = () => ls() === 12;

  // Write enables
  const pcWrite = () => fetchActive() || branchActive();
  const irWrite = () => fetchActive();
  const accWrite = () => addSubMul() || addSubA() || addSubX() || sh() || loadActive() || loadA() || loadI();
  const maWrite = () => decodeActive() || storeA() || storeI() || loadA() || loadI();
  const memWrite = () => storeActive() || storeA() || storeI();
  const aluActivated = () => addSubMul() || addSubA() || addSubX() || sh();
  const muxActive = () => loadActive() || storeActive() || loadA() || storeA() || loadI() || storeI() || addSubX();

  const wireDefault = "#475569";
  const wireActive = "#38bdf8";
  const strokeW = "2.5";

  // Wire colors
  const pcToMemColor = () => fetchActive() ? wireActive : wireDefault;
  const memToIrColor = () => fetchActive() ? wireActive : wireDefault;
  const irToMuxColor = () => (decodeActive() || muxActive()) ? wireActive : wireDefault;
  const pcToMuxColor = () => fetchActive() ? wireActive : wireDefault;
  const maToMuxColor = () => (loadA() || storeA() || loadI() || storeI()) ? wireActive : wireDefault;
  const muxToMemColor = () => (muxActive() || fetchActive()) ? wireActive : wireDefault;
  const memToAluColor = () => (addSubX() || loadActive()) ? wireActive : wireDefault;
  const accToAluColor = () => aluActivated() ? wireActive : wireDefault;
  const aluToAccColor = () => (aluActivated() || loadActive() || loadA() || loadI()) ? wireActive : wireDefault;
  const aluToMaColor = () => (decodeActive() || maWrite()) ? wireActive : wireDefault;
  const accToMemColor = () => (storeActive() || storeA() || storeI()) ? wireActive : wireDefault;

  return (
    <svg viewBox="0 0 780 600" class="w-full h-full" style="max-height: 100%; max-width: 100%;" preserveAspectRatio="xMidYMid meet">
      <rect width="780" height="600" fill="#0f172a" rx="8" />

      {/* === WIRE PATHS === */}

      {/* PC -> Memory address */}
      <path d="M170 60 L260 60" stroke={pcToMemColor()} stroke-width={strokeW} fill="none" />
      <Bus x={200} y={50} number={16} />

      {/* Memory data -> IR */}
      <path d="M400 60 L450 60" stroke={memToIrColor()} stroke-width={strokeW} fill="none" />
      <Bus x={415} y={50} number={16} />

      {/* IR address -> MUX input 0 */}
      <path d="M510 96 L510 230 L380 230 L380 260" stroke={irToMuxColor()} stroke-width={strokeW} fill="none" />
      <Bus x={495} y={160} number={8} />

      {/* PC -> MUX input 1 */}
      <path d="M120 96 L120 290 L340 290" stroke={pcToMuxColor()} stroke-width={strokeW} fill="none" />

      {/* MA -> MUX input 2 */}
      <path d="M120 420 L120 310 L340 310" stroke={maToMuxColor()} stroke-width={strokeW} fill="none" />

      {/* MUX output -> Memory address (loop back up) */}
      <path d="M380 360 L380 410 L220 410 L220 130 L260 130" stroke={muxToMemColor()} stroke-width={strokeW} fill="none" />

      {/* Memory data -> ALU B input */}
      <path d="M400 130 L420 130 L420 450 L460 450" stroke={memToAluColor()} stroke-width={strokeW} fill="none" />
      <Bus x={410} y={290} number={16} />

      {/* ACC -> ALU A input */}
      <path d="M640 360 L640 390 L530 390" stroke={accToAluColor()} stroke-width={strokeW} fill="none" />

      {/* ALU F output -> ACC */}
      <path d="M530 420 L640 420 L640 270" stroke={aluToAccColor()} stroke-width={strokeW} fill="none" />
      <Bus x={575} y={410} number={16} />

      {/* ALU output -> MA (branch down then left) */}
      <path d="M530 440 L560 440 L560 520 L80 520 L80 420" stroke={aluToMaColor()} stroke-width={strokeW} fill="none" />

      {/* ACC -> Memory data (store) */}
      <path d="M640 270 L680 270 L680 130 L400 130" stroke={accToMemColor()} stroke-width={strokeW} fill="none" stroke-dasharray={storeActive() || storeA() || storeI() ? "none" : "4 4"} />

      {/* === COMPONENTS === */}

      <RegisterBox
        name="PC"
        number={pcVal()}
        class="bg-blue-600/20 border border-blue-500 text-blue-200"
        x={50}
        y={20}
        isActivated={pcWrite()}
        registerSize={REGISTER_16_BIT}
      />

      <ObscureMemory
        name="Mémoire"
        class="fill-amber-200"
        x={260}
        y={0}
        hasControlSignal={true}
        controlName="wr_mem"
        isWritable={memWrite()}
      />

      <RegisterBox
        name="IR"
        number={irVal()}
        class="bg-purple-600/20 border border-purple-500 text-purple-200"
        x={450}
        y={20}
        isActivated={irWrite()}
        registerSize={REGISTER_16_BIT}
      />

      <RegisterBox
        name="MA"
        number={maVal()}
        class="bg-amber-600/20 border border-amber-500 text-amber-200"
        x={50}
        y={380}
        isActivated={maWrite()}
        registerSize={REGISTER_16_BIT}
      />

      <Multiplexer
        x={340}
        y={230}
        isActivated={muxActive()}
        name="sel_mux"
      />

      <ALU
        x={460}
        y={360}
        isActivated={aluActivated()}
        hasNz={true}
      />

      <RegisterBox
        name="ACC"
        number={accVal()}
        class="bg-emerald-600/20 border border-emerald-500 text-emerald-200"
        x={580}
        y={270}
        isActivated={accWrite()}
        registerSize={REGISTER_16_BIT}
      />
    </svg>
  );
}
