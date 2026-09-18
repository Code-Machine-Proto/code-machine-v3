import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { ProcessorId } from "@/wasm/types";
import {
  ensureWasmInitialized,
  runInstructions,
  assertActiveWires,
  type InstructionTriple,
} from "@/test/circuitTestUtils";
import {
  POLYRISC_WIRE_IDS,
  POLYRISC_JUNCTION_IDS,
  getActivePolyRiscWires,
  getActivePolyRiscJunctions,
  type PolyRiscWireId,
  type PolyRiscJunctionId,
} from "./lineState";

function readExample(name: string): string {
  const path = fileURLToPath(new URL(`../../../../code-examples/polyrisc/${name}`, import.meta.url));
  return readFileSync(path, "utf-8");
}

beforeAll(async () => {
  await ensureWasmInitialized();
});

function run(source: string): InstructionTriple[] {
  return runInstructions(source, ProcessorId.PolyRisc);
}

function finalMemory(source: string): number[] {
  const instrs = run(source);
  return instrs[instrs.length - 1].execute.memory;
}

function assertWires(stimulatedLineState: number, expected: PolyRiscWireId[]) {
  assertActiveWires(POLYRISC_WIRE_IDS, getActivePolyRiscWires, stimulatedLineState, expected);
}

function assertJunctions(stimulatedLineState: number, expected: PolyRiscJunctionId[]) {
  assertActiveWires(POLYRISC_JUNCTION_IDS, getActivePolyRiscJunctions, stimulatedLineState, expected);
}

describe("PolyRisc memory", () => {
  it("stores and reloads a value through (r2) indirection", () => {
    const memory = finalMemory(".text\nldi r1,42\nldi r2,0\nst (r2),r1\nld r3,(r2)\nstop");
    expect(memory[0]).toBe(42);
  });

  it("sums the sommeNbrMemoire.s example table into the following memory cell", () => {
    const memory = finalMemory(readExample("sommeNbrMemoire.s"));
    expect(memory.slice(0, 10)).toEqual([3, 7, 2, 8, 5, 1, 9, 4, 6, 10]);
    expect(memory[10]).toBe(55);
  });
});

describe("PolyRisc instruction -> active wires (Execute)", () => {
  it("ldi", () => {
    const instrs = run(".text\nldi r1,10\nstop");
    const ldi = instrs[0];
    assertWires(ldi.execute.stimulated_line_state, ["mux-pc", "pc-mux", "mux-reg", "ir-reg", "ir-rdst"]);
    assertJunctions(ldi.execute.stimulated_line_state, ["pc-mux-junction", "ir-out-junction"]);
  });

  it("add (3-reg)", () => {
    const instrs = run(".text\nldi r1,10\nldi r2,20\nadd r3,r1,r2\nstop");
    const add = instrs[2];
    assertWires(add.execute.stimulated_line_state, [
      "mux-pc",
      "pc-mux",
      "mux-reg",
      "ir-rdst",
      "ir-rsrc1",
      "ir-rsrc2",
      "reg-A",
      "reg-B",
      "alu-reg",
    ]);
    assertJunctions(add.execute.stimulated_line_state, ["pc-mux-junction", "ir-out-junction", "reg-b-data-junction"]);
  });

  it("sub (3-reg)", () => {
    const instrs = run(".text\nldi r1,50\nldi r2,20\nsub r3,r1,r2\nstop");
    const sub = instrs[2];
    assertWires(sub.execute.stimulated_line_state, [
      "mux-pc",
      "pc-mux",
      "mux-reg",
      "ir-rdst",
      "ir-rsrc1",
      "ir-rsrc2",
      "reg-A",
      "reg-B",
      "alu-reg",
    ]);
    assertJunctions(sub.execute.stimulated_line_state, ["pc-mux-junction", "ir-out-junction", "reg-b-data-junction"]);
  });

  it("and (3-reg)", () => {
    const instrs = run(".text\nldi r1,12\nldi r2,10\nand r3,r1,r2\nstop");
    const and = instrs[2];
    assertWires(and.execute.stimulated_line_state, [
      "mux-pc",
      "pc-mux",
      "mux-reg",
      "ir-rdst",
      "ir-rsrc1",
      "ir-rsrc2",
      "reg-A",
      "reg-B",
      "alu-reg",
    ]);
    assertJunctions(and.execute.stimulated_line_state, ["pc-mux-junction", "ir-out-junction", "reg-b-data-junction"]);
  });

  it("or (3-reg)", () => {
    const instrs = run(".text\nldi r1,12\nldi r2,10\nor r3,r1,r2\nstop");
    const or = instrs[2];
    assertWires(or.execute.stimulated_line_state, [
      "mux-pc",
      "pc-mux",
      "mux-reg",
      "ir-rdst",
      "ir-rsrc1",
      "ir-rsrc2",
      "reg-A",
      "reg-B",
      "alu-reg",
    ]);
    assertJunctions(or.execute.stimulated_line_state, ["pc-mux-junction", "ir-out-junction", "reg-b-data-junction"]);
  });

  it("not (2-reg)", () => {
    const instrs = run(".text\nldi r1,0\nnot r2,r1\nstop");
    const not = instrs[1];
    assertWires(not.execute.stimulated_line_state, [
      "mux-pc",
      "pc-mux",
      "mux-reg",
      "ir-rdst",
      "ir-rsrc1",
      "reg-A",
      "alu-reg",
    ]);
    assertJunctions(not.execute.stimulated_line_state, ["pc-mux-junction", "ir-out-junction"]);
  });

  it("mv (2-reg)", () => {
    const instrs = run(".text\nldi r1,42\nmv r2,r1\nstop");
    const mv = instrs[1];
    assertWires(mv.execute.stimulated_line_state, [
      "mux-pc",
      "pc-mux",
      "mux-reg",
      "ir-rdst",
      "ir-rsrc1",
      "reg-A",
      "alu-reg",
    ]);
    assertJunctions(mv.execute.stimulated_line_state, ["pc-mux-junction", "ir-out-junction"]);
  });

  it("shl (2-reg)", () => {
    const instrs = run(".text\nldi r1,4\nshl r2,r1\nshr r3,r1\nstop");
    const shl = instrs[1];
    assertWires(shl.execute.stimulated_line_state, [
      "mux-pc",
      "pc-mux",
      "mux-reg",
      "ir-rdst",
      "ir-rsrc1",
      "reg-A",
      "alu-reg",
    ]);
    assertJunctions(shl.execute.stimulated_line_state, ["pc-mux-junction", "ir-out-junction"]);
  });

  it("shr (2-reg)", () => {
    const instrs = run(".text\nldi r1,4\nshl r2,r1\nshr r3,r1\nstop");
    const shr = instrs[2];
    assertWires(shr.execute.stimulated_line_state, [
      "mux-pc",
      "pc-mux",
      "mux-reg",
      "ir-rdst",
      "ir-rsrc1",
      "reg-A",
      "alu-reg",
    ]);
    assertJunctions(shr.execute.stimulated_line_state, ["pc-mux-junction", "ir-out-junction"]);
  });

  it("st", () => {
    const instrs = run(".text\nldi r1,42\nldi r2,0\nst (r2),r1\nld r3,(r2)\nstop");
    const st = instrs[2];
    assertWires(st.execute.stimulated_line_state, ["mux-pc", "pc-mux", "ir-rsrc1", "ir-rsrc2", "reg-data", "reg-addr"]);
    assertJunctions(st.execute.stimulated_line_state, ["pc-mux-junction", "ir-out-junction", "reg-b-data-junction"]);
  });

  it("ld", () => {
    const instrs = run(".text\nldi r1,42\nldi r2,0\nst (r2),r1\nld r3,(r2)\nstop");
    const ld = instrs[3];
    assertWires(ld.execute.stimulated_line_state, [
      "mux-pc",
      "pc-mux",
      "mux-reg",
      "ir-rdst",
      "ir-rsrc1",
      "reg-addr",
      "mem-reg",
    ]);
    assertJunctions(ld.execute.stimulated_line_state, ["pc-mux-junction", "ir-out-junction"]);
  });

  it("br (unconditional, always taken)", () => {
    const instrs = run(".text\nbr target\nldi r1,99\ntarget:\nldi r2,1\nstop");
    const br = instrs[0];
    assertWires(br.execute.stimulated_line_state, ["mux-pc", "ir-pc"]);
    assertJunctions(br.execute.stimulated_line_state, ["ir-out-junction"]);
  });

  it("brz taken", () => {
    const instrs = run(".text\nldi r1,0\nsub r1,r1,r1\nbrz skip\nldi r2,99\nskip:\nldi r3,1\nstop");
    const brz = instrs[2];
    assertWires(brz.execute.stimulated_line_state, ["mux-pc", "ir-pc"]);
    assertJunctions(brz.execute.stimulated_line_state, ["ir-out-junction"]);
  });

  it("brz not taken", () => {
    const instrs = run(".text\nldi r1,5\nldi r2,3\nsub r3,r1,r2\nbrz target\nldi r4,99\ntarget:\nldi r5,1\nstop");
    const brz = instrs[3];
    assertWires(brz.execute.stimulated_line_state, ["mux-pc", "pc-mux"]);
    assertJunctions(brz.execute.stimulated_line_state, ["pc-mux-junction"]);
  });

  it("brnz taken", () => {
    const instrs = run(".text\nldi r1,5\nldi r2,0\nadd r3,r1,r2\nbrnz target\nldi r4,99\ntarget:\nldi r5,1\nstop");
    const brnz = instrs[3];
    assertWires(brnz.execute.stimulated_line_state, ["mux-pc", "ir-pc"]);
    assertJunctions(brnz.execute.stimulated_line_state, ["ir-out-junction"]);
  });

  it("brnz not taken", () => {
    const instrs = run(".text\nldi r1,0\nldi r2,0\nadd r3,r1,r2\nbrnz target\nldi r4,99\ntarget:\nldi r5,1\nstop");
    const brnz = instrs[3];
    assertWires(brnz.execute.stimulated_line_state, ["mux-pc", "pc-mux"]);
    assertJunctions(brnz.execute.stimulated_line_state, ["pc-mux-junction"]);
  });

  it("brlz taken", () => {
    const instrs = run(".text\nldi r1,5\nldi r2,10\nsub r3,r1,r2\nbrlz target\nldi r4,99\ntarget:\nldi r5,1\nstop");
    const brlz = instrs[3];
    assertWires(brlz.execute.stimulated_line_state, ["mux-pc", "ir-pc"]);
    assertJunctions(brlz.execute.stimulated_line_state, ["ir-out-junction"]);
  });

  it("brlz not taken", () => {
    const instrs = run(".text\nldi r1,10\nldi r2,3\nsub r3,r1,r2\nbrlz target\nldi r4,99\ntarget:\nldi r5,1\nstop");
    const brlz = instrs[3];
    assertWires(brlz.execute.stimulated_line_state, ["mux-pc", "pc-mux"]);
    assertJunctions(brlz.execute.stimulated_line_state, ["pc-mux-junction"]);
  });

  it("brgez taken", () => {
    const instrs = run(".text\nldi r1,10\nldi r2,5\nsub r3,r1,r2\nbrgez target\nldi r4,99\ntarget:\nldi r5,1\nstop");
    const brgez = instrs[3];
    assertWires(brgez.execute.stimulated_line_state, ["mux-pc", "ir-pc"]);
    assertJunctions(brgez.execute.stimulated_line_state, ["ir-out-junction"]);
  });

  it("brgez not taken", () => {
    const instrs = run(".text\nldi r1,3\nldi r2,10\nsub r3,r1,r2\nbrgez target\nldi r4,99\ntarget:\nldi r5,1\nstop");
    const brgez = instrs[3];
    assertWires(brgez.execute.stimulated_line_state, ["mux-pc", "pc-mux"]);
    assertJunctions(brgez.execute.stimulated_line_state, ["pc-mux-junction"]);
  });

  it("stop", () => {
    const instrs = run(".text\nstop");
    const stop = instrs[0];
    assertWires(stop.execute.stimulated_line_state, ["mux-pc", "pc-mux"]);
    assertJunctions(stop.execute.stimulated_line_state, ["pc-mux-junction"]);
  });
});

describe("PolyRisc Fetch and Decode phases -> active wires", () => {
  it("fetch lights the fetch-specific wires and junctions", () => {
    const [instr] = run(".text\nstop");
    assertWires(instr.fetch.stimulated_line_state, ["pc-inst", "inst-ir"]);
    assertJunctions(instr.fetch.stimulated_line_state, ["pc-mux-junction"]);
  });

  it("decode lights the decode-specific wires and junctions", () => {
    const [instr] = run(".text\nstop");
    assertWires(instr.decode.stimulated_line_state, ["ir-control1", "ir-control2"]);
    assertJunctions(instr.decode.stimulated_line_state, []);
  });
});
