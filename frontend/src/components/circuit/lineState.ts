// LineStateAccumulator: -1 error, 0 fetch, 1 load, 2 store, 3 decode, 4 alu, 5 nop, 6 branching

export const ACCUMULATOR_WIRE_IDS = [
  "pc-mux",
  "mux-mem",
  "mem-ir",
  "ir-control",
  "mem-mux",
  "mux-acc",
  "ir-mux",
  "acc-mem",
  "mem-alu",
  "acc-alu",
  "alu-mux",
  "ir-mux-addr",
  "mux-pc",
  "inc",
  "acc-control",
  "internal-control",
] as const;

export type AccumulatorWireId = (typeof ACCUMULATOR_WIRE_IDS)[number];

export function getActiveAccumulatorWires(stimulatedLineState: number): Set<AccumulatorWireId> {
  const fetch = stimulatedLineState === 0;
  const load = stimulatedLineState === 1;
  const store = stimulatedLineState === 2;
  const decode = stimulatedLineState === 3;
  const alu = stimulatedLineState === 4;
  const nop = stimulatedLineState === 5;
  const branching = stimulatedLineState === 6;
  const inc = nop || load || store || alu;

  const active = new Set<AccumulatorWireId>();
  if (fetch) active.add("pc-mux");
  if (fetch || load || store || alu) active.add("mux-mem");
  if (fetch) active.add("mem-ir");
  if (decode) active.add("ir-control");
  if (load) active.add("mem-mux");
  if (load || alu) active.add("mux-acc");
  if (load || store || alu) active.add("ir-mux");
  if (store) active.add("acc-mem");
  if (alu) active.add("mem-alu");
  if (alu) active.add("acc-alu");
  if (alu) active.add("alu-mux");
  if (branching) active.add("ir-mux-addr");
  if (branching || inc) active.add("mux-pc");
  if (inc) active.add("inc");
  if (decode) active.add("acc-control");
  if (decode) active.add("internal-control");
  return active;
}

// Junction dots mark where two or more wires converge (e.g. memory's
// data_out fanning out to IR/mux/ALU). Named after the wires that meet
// there, derived by matching each dot's activation condition against the
// union of candidate wires' conditions and cross-checked against their SVG
// path coordinates.
export const ACCUMULATOR_JUNCTION_IDS = [
  "inc-pcmux-junction",
  "mem-out-junction",
  "acc-in-junction",
  "acc-alu-control-junction",
] as const;

export type AccumulatorJunctionId = (typeof ACCUMULATOR_JUNCTION_IDS)[number];

export function getActiveAccumulatorJunctions(stimulatedLineState: number): Set<AccumulatorJunctionId> {
  const fetch = stimulatedLineState === 0;
  const load = stimulatedLineState === 1;
  const store = stimulatedLineState === 2;
  const decode = stimulatedLineState === 3;
  const alu = stimulatedLineState === 4;
  const nop = stimulatedLineState === 5;
  const inc = nop || load || store || alu;

  const active = new Set<AccumulatorJunctionId>();
  if (fetch || inc) active.add("inc-pcmux-junction");
  if (fetch || load || alu) active.add("mem-out-junction");
  if (store || alu || decode) active.add("acc-in-junction");
  if (alu || decode) active.add("acc-alu-control-junction");
  return active;
}

// LineStateMa: -1 error, 0 fetch, 1 decode, 2 addSubMul, 3 addSubA, 4 addSubX,
//   5 sh, 6 store, 7 load, 8 loadA, 9 loadI, 10 storeA, 11 storeI, 12 lea, 13 branching, 14 nop

export const ACCUMULATOR_MA_WIRE_IDS = [
  "mux-pc",
  "pc-mux",
  "inc",
  "mux3-mem",
  "mem-alu",
  "mem-ir",
  "mem-acc",
  "mem-ma",
  "alu-acc",
  "alu-ma",
  "ir-mem",
  "ir-pc",
  "mux-acc",
  "mux-ma",
  "acc-alu",
  "acc-mem",
  "ma-mem",
  "ma-addr",
  "ma-alu",
  "mux-mem",
  "mux-alu",
  "ir-control",
  "acc-control",
  "mux3-ma",
] as const;

export type AccumulatorMaWireId = (typeof ACCUMULATOR_MA_WIRE_IDS)[number];

export function getActiveAccumulatorMaWires(stimulatedLineState: number): Set<AccumulatorMaWireId> {
  const fetch = stimulatedLineState === 0;
  const decode = stimulatedLineState === 1;
  const addSubMul = stimulatedLineState === 2;
  const addSubA = stimulatedLineState === 3;
  const addSubX = stimulatedLineState === 4;
  const sh = stimulatedLineState === 5;
  const store = stimulatedLineState === 6;
  const load = stimulatedLineState === 7;
  const loadA = stimulatedLineState === 8;
  const loadI = stimulatedLineState === 9;
  const storeA = stimulatedLineState === 10;
  const storeI = stimulatedLineState === 11;
  const lea = stimulatedLineState === 12;
  const branching = stimulatedLineState === 13;
  const nop =
    stimulatedLineState === 14 ||
    addSubMul ||
    addSubA ||
    addSubX ||
    sh ||
    store ||
    load ||
    loadA ||
    loadI ||
    storeA ||
    storeI ||
    lea;
  const addr = addSubMul || addSubA || store || load || loadA || storeA;

  const active = new Set<AccumulatorMaWireId>();
  if (branching || nop) active.add("mux-pc");
  if (fetch) active.add("pc-mux");
  if (nop) active.add("inc");
  if (fetch || addr || addSubX || loadI || storeI) active.add("mux3-mem");
  if (addSubMul || addSubA || addSubX) active.add("mem-alu");
  if (fetch) active.add("mem-ir");
  if (load || loadI) active.add("mem-acc");
  if (loadA) active.add("mem-ma");
  if (addSubMul || addSubX || sh) active.add("alu-acc");
  if (addSubA) active.add("alu-ma");
  if (addr) active.add("ir-mem");
  if (branching) active.add("ir-pc");
  if (addSubMul || addSubX || sh || load || loadI) active.add("mux-acc");
  if (addSubA || loadA || lea) active.add("mux-ma");
  if (addSubMul || addSubX || sh) active.add("acc-alu");
  if (store || storeI) active.add("acc-mem");
  if (storeA) active.add("ma-mem");
  if (addSubX || loadI || storeI) active.add("ma-addr");
  if (addSubA) active.add("ma-alu");
  if (store || storeA || storeI) active.add("mux-mem");
  if (addSubMul || addSubA || addSubX || sh) active.add("mux-alu");
  if (decode) active.add("ir-control");
  if (decode) active.add("acc-control");
  if (lea) active.add("mux3-ma");
  return active;
}

export const ACCUMULATOR_MA_JUNCTION_IDS = [
  "mem-out-junction",
  "mem-acc-ma-junction",
  "alu-out-junction",
  "acc-in-junction",
  "ir-addr-junction",
  "ma-out-junction",
  "ma-addr-junction",
  "inc-pcmux-junction",
  "acc-alu-control-junction",
  "addr-select-junction",
] as const;

export type AccumulatorMaJunctionId = (typeof ACCUMULATOR_MA_JUNCTION_IDS)[number];

export function getActiveAccumulatorMaJunctions(stimulatedLineState: number): Set<AccumulatorMaJunctionId> {
  const fetch = stimulatedLineState === 0;
  const decode = stimulatedLineState === 1;
  const addSubMul = stimulatedLineState === 2;
  const addSubA = stimulatedLineState === 3;
  const addSubX = stimulatedLineState === 4;
  const sh = stimulatedLineState === 5;
  const store = stimulatedLineState === 6;
  const load = stimulatedLineState === 7;
  const loadA = stimulatedLineState === 8;
  const loadI = stimulatedLineState === 9;
  const storeA = stimulatedLineState === 10;
  const storeI = stimulatedLineState === 11;
  const lea = stimulatedLineState === 12;
  const branching = stimulatedLineState === 13;
  const nop =
    stimulatedLineState === 14 ||
    addSubMul ||
    addSubA ||
    addSubX ||
    sh ||
    store ||
    load ||
    loadA ||
    loadI ||
    storeA ||
    storeI ||
    lea;
  const addr = addSubMul || addSubA || store || load || loadA || storeA;

  const active = new Set<AccumulatorMaJunctionId>();
  if (fetch || addSubMul || addSubA || addSubX || load || loadA || loadI) active.add("mem-out-junction");
  if (load || loadA || loadI) active.add("mem-acc-ma-junction");
  if (addSubMul || addSubA || addSubX || sh) active.add("alu-out-junction");
  if (decode || addSubMul || addSubX || sh || store || storeI) active.add("acc-in-junction");
  if (branching || addr) active.add("ir-addr-junction");
  if (addSubA || addSubX || loadI || storeA || storeI) active.add("ma-out-junction");
  if (addSubA || addSubX || loadI || storeI) active.add("ma-addr-junction");
  if (fetch || nop) active.add("inc-pcmux-junction");
  if (decode || addSubMul || addSubX || sh) active.add("acc-alu-control-junction");
  if (addr || fetch || lea || addSubX || loadI || storeI) active.add("addr-select-junction");
  return active;
}

// LineStatePolyRisc: -1 error, 0 fetch, 1 decode, 2 opTwoReg, 3 opThreeReg,
//   4 load, 5 store, 6 loadI, 7 branching, 8 nop

export const POLYRISC_WIRE_IDS = [
  "mux-pc",
  "pc-inst",
  "inst-ir",
  "pc-mux",
  "mux-reg",
  "ir-reg",
  "ir-rdst",
  "ir-rsrc1",
  "ir-rsrc2",
  "ir-pc",
  "reg-A",
  "reg-B",
  "alu-reg",
  "reg-data",
  "reg-addr",
  "mem-reg",
  "ir-control1",
  "ir-control2",
] as const;

export type PolyRiscWireId = (typeof POLYRISC_WIRE_IDS)[number];

export function getActivePolyRiscWires(stimulatedLineState: number): Set<PolyRiscWireId> {
  const fetch = stimulatedLineState === 0;
  const decode = stimulatedLineState === 1;
  const opTwoReg = stimulatedLineState === 2;
  const opThreeReg = stimulatedLineState === 3;
  const load = stimulatedLineState === 4;
  const store = stimulatedLineState === 5;
  const loadI = stimulatedLineState === 6;
  const branching = stimulatedLineState === 7;
  const nop = stimulatedLineState === 8 || opTwoReg || opThreeReg || load || store || loadI;

  const active = new Set<PolyRiscWireId>();
  if (branching || nop) active.add("mux-pc");
  if (fetch) active.add("pc-inst");
  if (fetch) active.add("inst-ir");
  if (nop) active.add("pc-mux");
  if (opTwoReg || opThreeReg || load || loadI) active.add("mux-reg");
  if (loadI) active.add("ir-reg");
  if (opTwoReg || opThreeReg || load || loadI) active.add("ir-rdst");
  if (opTwoReg || opThreeReg || load || store) active.add("ir-rsrc1");
  if (opThreeReg || store) active.add("ir-rsrc2");
  if (branching) active.add("ir-pc");
  if (opTwoReg || opThreeReg) active.add("reg-A");
  if (opThreeReg) active.add("reg-B");
  if (opTwoReg || opThreeReg) active.add("alu-reg");
  if (store) active.add("reg-data");
  if (load || store) active.add("reg-addr");
  if (load) active.add("mem-reg");
  if (decode) active.add("ir-control1");
  if (decode) active.add("ir-control2");
  return active;
}

export const POLYRISC_JUNCTION_IDS = ["pc-mux-junction", "ir-out-junction", "reg-b-data-junction"] as const;

export type PolyRiscJunctionId = (typeof POLYRISC_JUNCTION_IDS)[number];

export function getActivePolyRiscJunctions(stimulatedLineState: number): Set<PolyRiscJunctionId> {
  const fetch = stimulatedLineState === 0;
  const opTwoReg = stimulatedLineState === 2;
  const opThreeReg = stimulatedLineState === 3;
  const load = stimulatedLineState === 4;
  const store = stimulatedLineState === 5;
  const loadI = stimulatedLineState === 6;
  const branching = stimulatedLineState === 7;
  const nop = stimulatedLineState === 8 || opTwoReg || opThreeReg || load || store || loadI;

  const active = new Set<PolyRiscJunctionId>();
  if (fetch || nop) active.add("pc-mux-junction");
  if (opTwoReg || opThreeReg || branching || load || store || loadI) active.add("ir-out-junction");
  if (opThreeReg || store) active.add("reg-b-data-junction");
  return active;
}
