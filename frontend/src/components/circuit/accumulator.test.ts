import { beforeAll, describe, expect, it } from "vitest";
import { ProcessorId } from "@/wasm/types";
import {
  ensureWasmInitialized,
  runInstructions,
  assertActiveWires,
  type InstructionTriple,
} from "@/test/circuitTestUtils";
import {
  ACCUMULATOR_WIRE_IDS,
  ACCUMULATOR_JUNCTION_IDS,
  getActiveAccumulatorWires,
  getActiveAccumulatorJunctions,
  type AccumulatorWireId,
  type AccumulatorJunctionId,
} from "./lineState";

beforeAll(async () => {
  await ensureWasmInitialized();
});

function run(source: string): InstructionTriple[] {
  return runInstructions(source, ProcessorId.Accumulator);
}

function finalMemory(source: string): number[] {
  const instrs = run(source);
  return instrs[instrs.length - 1].execute.memory;
}

function assertWires(stimulatedLineState: number, expected: AccumulatorWireId[]) {
  assertActiveWires(ACCUMULATOR_WIRE_IDS, getActiveAccumulatorWires, stimulatedLineState, expected);
}

function assertJunctions(stimulatedLineState: number, expected: AccumulatorJunctionId[]) {
  assertActiveWires(ACCUMULATOR_JUNCTION_IDS, getActiveAccumulatorJunctions, stimulatedLineState, expected);
}

describe("Accumulator memory", () => {
  it("stores the loaded value at the destination address", () => {
    const memory = finalMemory("ld x\nst y\nstop\nx: 42\ny: 0");
    expect(memory[4]).toBe(42);
  });

  it("stores the sum of two memory operands", () => {
    const memory = finalMemory("ld x\nadd y\nst z\nstop\nx: 10\ny: 20\nz: 0");
    expect(memory[6]).toBe(30);
  });
});

describe("Accumulator instruction -> active wires (Execute)", () => {
  it("ld", () => {
    const [instr] = run("ld x\nstop\nx: 42");
    assertWires(instr.execute.stimulated_line_state, ["mux-mem", "mem-mux", "mux-acc", "ir-mux", "mux-pc", "inc"]);
    assertJunctions(instr.execute.stimulated_line_state, ["inc-pcmux-junction", "mem-out-junction"]);
  });

  it("st", () => {
    const instrs = run("ld x\nst y\nstop\nx: 42\ny: 0");
    const st = instrs[1]; // [0]=ld, [1]=st, [2]=stop
    assertWires(st.execute.stimulated_line_state, ["mux-mem", "ir-mux", "acc-mem", "mux-pc", "inc"]);
    assertJunctions(st.execute.stimulated_line_state, ["inc-pcmux-junction", "acc-in-junction"]);
  });

  it("add", () => {
    const instrs = run("ld x\nadd y\nstop\nx: 10\ny: 20");
    const add = instrs[1];
    assertWires(add.execute.stimulated_line_state, [
      "mux-mem",
      "mux-acc",
      "ir-mux",
      "mem-alu",
      "acc-alu",
      "alu-mux",
      "mux-pc",
      "inc",
    ]);
    assertJunctions(add.execute.stimulated_line_state, [
      "inc-pcmux-junction",
      "mem-out-junction",
      "acc-in-junction",
      "acc-alu-control-junction",
    ]);
  });

  it("sub", () => {
    const instrs = run("ld x\nsub y\nstop\nx: 50\ny: 20");
    const sub = instrs[1];
    assertWires(sub.execute.stimulated_line_state, [
      "mux-mem",
      "mux-acc",
      "ir-mux",
      "mem-alu",
      "acc-alu",
      "alu-mux",
      "mux-pc",
      "inc",
    ]);
    assertJunctions(sub.execute.stimulated_line_state, [
      "inc-pcmux-junction",
      "mem-out-junction",
      "acc-in-junction",
      "acc-alu-control-junction",
    ]);
  });

  it("mul", () => {
    const instrs = run("ld x\nmul y\nstop\nx: 3\ny: 7");
    const mul = instrs[1];
    assertWires(mul.execute.stimulated_line_state, [
      "mux-mem",
      "mux-acc",
      "ir-mux",
      "mem-alu",
      "acc-alu",
      "alu-mux",
      "mux-pc",
      "inc",
    ]);
    assertJunctions(mul.execute.stimulated_line_state, [
      "inc-pcmux-junction",
      "mem-out-junction",
      "acc-in-junction",
      "acc-alu-control-junction",
    ]);
  });

  it("nop", () => {
    const [instr] = run("nop\nstop");
    assertWires(instr.execute.stimulated_line_state, ["mux-pc", "inc"]);
    assertJunctions(instr.execute.stimulated_line_state, ["inc-pcmux-junction"]);
  });

  it("stop", () => {
    const [instr] = run("stop");
    assertWires(instr.execute.stimulated_line_state, ["mux-pc", "inc"]);
    assertJunctions(instr.execute.stimulated_line_state, ["inc-pcmux-junction"]);
  });

  it("br (unconditional, always taken)", () => {
    const [instr] = run("br target\ntarget: stop");
    assertWires(instr.execute.stimulated_line_state, ["ir-mux-addr", "mux-pc"]);
    assertJunctions(instr.execute.stimulated_line_state, []);
  });

  it("brz taken", () => {
    const instrs = run("ld zero\nbrz target\ntarget: stop\nzero: 0");
    const brz = instrs[1];
    assertWires(brz.execute.stimulated_line_state, ["ir-mux-addr", "mux-pc"]);
    assertJunctions(brz.execute.stimulated_line_state, []);
  });

  it("brz not taken", () => {
    const instrs = run("ld one\nbrz target\nstop\ntarget: stop\none: 1");
    const brz = instrs[1];
    assertWires(brz.execute.stimulated_line_state, ["mux-pc", "inc"]);
    assertJunctions(brz.execute.stimulated_line_state, ["inc-pcmux-junction"]);
  });

  it("brnz taken", () => {
    const instrs = run("ld one\nbrnz target\ntarget: stop\none: 1");
    const brnz = instrs[1];
    assertWires(brnz.execute.stimulated_line_state, ["ir-mux-addr", "mux-pc"]);
    assertJunctions(brnz.execute.stimulated_line_state, []);
  });

  it("brnz not taken", () => {
    const instrs = run("ld zero\nbrnz target\nstop\ntarget: stop\nzero: 0");
    const brnz = instrs[1];
    assertWires(brnz.execute.stimulated_line_state, ["mux-pc", "inc"]);
    assertJunctions(brnz.execute.stimulated_line_state, ["inc-pcmux-junction"]);
  });
});

describe("Accumulator Fetch and Decode phases -> active wires", () => {
  it("fetch lights the fetch-specific wires and junctions", () => {
    const [instr] = run("stop");
    assertWires(instr.fetch.stimulated_line_state, ["pc-mux", "mux-mem", "mem-ir"]);
    assertJunctions(instr.fetch.stimulated_line_state, ["inc-pcmux-junction", "mem-out-junction"]);
  });

  it("decode lights the decode-specific wires and junctions", () => {
    const [instr] = run("stop");
    assertWires(instr.decode.stimulated_line_state, ["ir-control", "acc-control", "internal-control"]);
    assertJunctions(instr.decode.stimulated_line_state, ["acc-in-junction", "acc-alu-control-junction"]);
  });
});
