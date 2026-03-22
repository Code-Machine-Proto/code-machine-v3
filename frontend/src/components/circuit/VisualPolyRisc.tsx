import RegisterBox, { REGISTER_16_BIT, REGISTER_28_BIT } from "./parts/RegisterBox";
import ALU from "./parts/ALU";
import Bus from "./parts/Bus";
import Multiplexer from "./parts/Multiplexer";
import ObscureMemory from "./parts/ObscureMemory";

// LineStatePolyRisc: -1 error, 0 fetch, 1 decode, 2 opTwoReg, 3 opThreeReg,
//   4 load, 5 store, 6 loadI, 7 branching, 8 nop

interface VisualProps {
  stimulatedLineState: number;
  registers: Record<string, number>;
}

export default function VisualPolyRisc(props: VisualProps) {
  const ls = () => props.stimulatedLineState;

  const pcVal = () => props.registers["PC"] ?? 0;
  const irVal = () => props.registers["IR"] ?? 0;

  // Active states
  const fetchActive = () => ls() === 0;
  const decodeActive = () => ls() === 1;
  const opTwoReg = () => ls() === 2;
  const opThreeReg = () => ls() === 3;
  const loadActive = () => ls() === 4;
  const storeActive = () => ls() === 5;
  const loadI = () => ls() === 6;
  const branchActive = () => ls() === 7;

  // Write enables
  const pcWrite = () => fetchActive() || branchActive();
  const irWrite = () => fetchActive();
  const regFileWrite = () => opTwoReg() || opThreeReg() || loadActive() || loadI();
  const aluActivated = () => opTwoReg() || opThreeReg();
  const dataMemRead = () => loadActive();
  const dataMemWrite = () => storeActive();
  const muxWbActive = () => opTwoReg() || opThreeReg() || loadActive() || loadI();

  const wireDefault = "#475569";
  const wireActive = "#38bdf8";
  const strokeW = "2.5";

  // Wire colors
  const pcToImemColor = () => fetchActive() ? wireActive : wireDefault;
  const imemToIrColor = () => fetchActive() ? wireActive : wireDefault;
  const irToDecodeColor = () => decodeActive() ? wireActive : wireDefault;
  const decodeToRegColor = () => (decodeActive() || opTwoReg() || opThreeReg() || loadActive() || storeActive() || loadI()) ? wireActive : wireDefault;
  const rsrc1ToAluColor = () => (opTwoReg() || opThreeReg()) ? wireActive : wireDefault;
  const rsrc2ToAluColor = () => (opTwoReg() || opThreeReg()) ? wireActive : wireDefault;
  const aluToMuxColor = () => (opTwoReg() || opThreeReg()) ? wireActive : wireDefault;
  const dmemToMuxColor = () => loadActive() ? wireActive : wireDefault;
  const immToMuxColor = () => loadI() ? wireActive : wireDefault;
  const muxToRegColor = () => (muxWbActive()) ? wireActive : wireDefault;
  const rsrc1ToDmemColor = () => (loadActive() || storeActive()) ? wireActive : wireDefault;
  const rsrc2ToDmemColor = () => storeActive() ? wireActive : wireDefault;

  return (
    <svg viewBox="0 0 900 600" class="w-full h-full" style="max-height: 100%; max-width: 100%;" preserveAspectRatio="xMidYMid meet">
      <rect width="900" height="600" fill="#0f172a" rx="8" />

      {/* === WIRE PATHS === */}

      {/* PC -> Instruction Memory */}
      <path d="M170 60 L210 60" stroke={pcToImemColor()} stroke-width={strokeW} fill="none" />
      <Bus x={180} y={50} number={28} />

      {/* Instruction Memory -> IR */}
      <path d="M350 60 L400 60" stroke={imemToIrColor()} stroke-width={strokeW} fill="none" />
      <Bus x={365} y={50} number={28} />

      {/* IR -> Decode */}
      <path d="M460 96 L460 150" stroke={irToDecodeColor()} stroke-width={strokeW} fill="none" />

      {/* Decode -> Register File */}
      <path d="M520 180 L560 180" stroke={decodeToRegColor()} stroke-width={strokeW} fill="none" />

      {/* Register rsrc1 -> ALU A */}
      <path d="M600 250 L600 340 L560 340" stroke={rsrc1ToAluColor()} stroke-width={strokeW} fill="none" />

      {/* Register rsrc2 -> ALU B */}
      <path d="M620 250 L620 400 L560 400" stroke={rsrc2ToAluColor()} stroke-width={strokeW} fill="none" />

      {/* ALU output -> WB MUX input 0 */}
      <path d="M560 370 L700 370" stroke={aluToMuxColor()} stroke-width={strokeW} fill="none" />
      <Bus x={630} y={360} number={16} />

      {/* Data Memory -> WB MUX input 1 */}
      <path d="M755 250 L755 390 L740 390" stroke={dmemToMuxColor()} stroke-width={strokeW} fill="none" />

      {/* IR immediate -> WB MUX input 2 */}
      <path d="M520 96 L540 96 L540 130 L800 130 L800 410 L740 410" stroke={immToMuxColor()} stroke-width={strokeW} fill="none" />
      <text x={810} y={300} fill="#64748b" font-size="10" transform="rotate(90, 810, 300)">imm</text>

      {/* WB MUX output -> Register File writeback */}
      <path d="M740 440 L740 500 L570 500 L570 250" stroke={muxToRegColor()} stroke-width={strokeW} fill="none" />
      <Bus x={650} y={490} number={16} />

      {/* Register rsrc1 -> Data Memory address */}
      <path d="M650 200 L700 200" stroke={rsrc1ToDmemColor()} stroke-width={strokeW} fill="none" />

      {/* Register rsrc2 -> Data Memory data_in */}
      <path d="M650 220 L680 220 L680 240 L700 240" stroke={rsrc2ToDmemColor()} stroke-width={strokeW} fill="none" />

      {/* ALU -> Flags (NZ) */}
      <path d="M530 480 L530 510 L490 510 L490 530" stroke={aluActivated() ? wireActive : wireDefault} stroke-width={strokeW} fill="none" />

      {/* === COMPONENTS === */}

      <RegisterBox
        name="PC"
        number={pcVal()}
        class="bg-blue-600/20 border border-blue-500 text-blue-200"
        x={50}
        y={20}
        isActivated={pcWrite()}
        registerSize={REGISTER_28_BIT}
      />

      <ObscureMemory
        name="Inst Mem"
        class="fill-amber-200"
        x={210}
        y={0}
        hasControlSignal={false}
      />

      <RegisterBox
        name="IR"
        number={irVal()}
        class="bg-purple-600/20 border border-purple-500 text-purple-200"
        x={400}
        y={20}
        isActivated={irWrite()}
        registerSize={REGISTER_28_BIT}
      />

      {/* Decode block - simple rect */}
      <svg x={400} y={150} width="120" height="50">
        <rect width="120" height="50" rx="4" fill={decodeActive() ? "#4338ca22" : "#1e293b"} stroke={decodeActive() ? "#818cf8" : "#334155"} stroke-width="1.5" />
        <text x={60} y={30} text-anchor="middle" fill={decodeActive() ? "#a5b4fc" : "#64748b"} font-size="12" font-weight="600">Décodeur</text>
      </svg>

      {/* Register File */}
      <svg x={560} y={150} width="100" height="100">
        <rect width="100" height="100" rx="4" fill={regFileWrite() ? "#16a34a22" : "#1e293b"} stroke={regFileWrite() ? "#22c55e" : "#334155"} stroke-width="1.5" />
        <text x={50} y={25} text-anchor="middle" fill={regFileWrite() ? "#4ade80" : "#64748b"} font-size="11" font-weight="600">Registres</text>
        <text x={50} y={50} text-anchor="middle" fill="#64748b" font-size="9">r0..r15</text>
        <text x={10} y={75} fill="#64748b" font-size="8">rsrc1</text>
        <text x={55} y={75} fill="#64748b" font-size="8">rsrc2</text>
      </svg>

      <ALU
        x={490}
        y={310}
        isActivated={aluActivated()}
        hasNz={true}
      />

      {/* Data Memory */}
      <ObscureMemory
        name="Data Mem"
        class="fill-amber-200"
        x={700}
        y={150}
        hasControlSignal={true}
        controlName="wr_dmem"
        isWritable={dataMemWrite()}
      />

      {/* WB MUX */}
      <Multiplexer
        x={700}
        y={340}
        isActivated={muxWbActive()}
        name="sel_wb"
      />

      {/* Flags register */}
      <svg x={450} y={530} width="80" height="40">
        <rect width="80" height="40" rx="4" fill={aluActivated() ? "#dc262622" : "#1e293b"} stroke={aluActivated() ? "#ef4444" : "#334155"} stroke-width="1.5" />
        <text x={40} y={25} text-anchor="middle" fill={aluActivated() ? "#fca5a5" : "#64748b"} font-size="11" font-weight="600">NZ</text>
      </svg>
    </svg>
  );
}
