import { beforeAll, describe, expect, it } from 'vitest';
import { ProcessorId } from '@/wasm/types';
import {
  ensureWasmInitialized,
  runInstructions,
  assertActiveWires,
  type InstructionTriple,
} from '@/test/circuitTestUtils';
import {
  ACCUMULATOR_MA_WIRE_IDS,
  ACCUMULATOR_MA_JUNCTION_IDS,
  getActiveAccumulatorMaWires,
  getActiveAccumulatorMaJunctions,
  type AccumulatorMaWireId,
  type AccumulatorMaJunctionId,
} from './lineState';

beforeAll(async () => {
  await ensureWasmInitialized();
});

function run(source: string): InstructionTriple[] {
  return runInstructions(source, ProcessorId.AccumulatorMa);
}

function finalMemory(source: string): number[] {
  const instrs = run(source);
  return instrs[instrs.length - 1].execute.memory;
}

function assertWires(stimulatedLineState: number, expected: AccumulatorMaWireId[]) {
  assertActiveWires(ACCUMULATOR_MA_WIRE_IDS, getActiveAccumulatorMaWires, stimulatedLineState, expected);
}

function assertJunctions(stimulatedLineState: number, expected: AccumulatorMaJunctionId[]) {
  assertActiveWires(ACCUMULATOR_MA_JUNCTION_IDS, getActiveAccumulatorMaJunctions, stimulatedLineState, expected);
}

describe('AccumulatorMa memory', () => {
  it('stores the loaded value at the destination address', () => {
    const memory = finalMemory('ld x\nst y\nstop\nx: 42\ny: 0');
    expect(memory[4]).toBe(42);
  });

  it('stores through the indirect sti instruction', () => {
    const memory = finalMemory('ld val\nlea dest\nsti\nstop\nval: 33\ndest: 0');
    expect(memory[5]).toBe(33);
  });
});

describe('AccumulatorMa instruction -> active wires (Execute)', () => {
  it('ld', () => {
    const instrs = run('ld x\nst y\nstop\nx: 42\ny: 0');
    const ld = instrs[0];
    assertWires(ld.execute.stimulated_line_state, ['mux-pc', 'inc', 'mux3-mem', 'mem-acc', 'ir-mem', 'mux-acc']);
    assertJunctions(ld.execute.stimulated_line_state, [
      'mem-out-junction',
      'mem-acc-ma-junction',
      'ir-addr-junction',
      'inc-pcmux-junction',
      'addr-select-junction',
    ]);
  });

  it('st', () => {
    const instrs = run('ld x\nst y\nstop\nx: 42\ny: 0');
    const st = instrs[1];
    assertWires(st.execute.stimulated_line_state, ['mux-pc', 'inc', 'mux3-mem', 'ir-mem', 'acc-mem', 'mux-mem']);
    assertJunctions(st.execute.stimulated_line_state, [
      'acc-in-junction',
      'ir-addr-junction',
      'inc-pcmux-junction',
      'addr-select-junction',
    ]);
  });

  it('add', () => {
    const instrs = run('ld x\nadd y\nst z\nstop\nx: 10\ny: 20\nz: 0');
    const add = instrs[1];
    assertWires(add.execute.stimulated_line_state, [
      'mux-pc',
      'inc',
      'mux3-mem',
      'mem-alu',
      'ir-mem',
      'alu-acc',
      'mux-acc',
      'acc-alu',
      'mux-alu',
    ]);
    assertJunctions(add.execute.stimulated_line_state, [
      'mem-out-junction',
      'alu-out-junction',
      'acc-in-junction',
      'ir-addr-junction',
      'inc-pcmux-junction',
      'acc-alu-control-junction',
      'addr-select-junction',
    ]);
  });

  it('sub', () => {
    const instrs = run('ld x\nsub y\nst z\nstop\nx: 50\ny: 20\nz: 0');
    const sub = instrs[1];
    assertWires(sub.execute.stimulated_line_state, [
      'mux-pc',
      'inc',
      'mux3-mem',
      'mem-alu',
      'ir-mem',
      'alu-acc',
      'mux-acc',
      'acc-alu',
      'mux-alu',
    ]);
    assertJunctions(sub.execute.stimulated_line_state, [
      'mem-out-junction',
      'alu-out-junction',
      'acc-in-junction',
      'ir-addr-junction',
      'inc-pcmux-junction',
      'acc-alu-control-junction',
      'addr-select-junction',
    ]);
  });

  it('mul', () => {
    const instrs = run('ld x\nmul y\nstop\nx: 3\ny: 7');
    const mul = instrs[1];
    assertWires(mul.execute.stimulated_line_state, [
      'mux-pc',
      'inc',
      'mux3-mem',
      'mem-alu',
      'ir-mem',
      'alu-acc',
      'mux-acc',
      'acc-alu',
      'mux-alu',
    ]);
    assertJunctions(mul.execute.stimulated_line_state, [
      'mem-out-junction',
      'alu-out-junction',
      'acc-in-junction',
      'ir-addr-junction',
      'inc-pcmux-junction',
      'acc-alu-control-junction',
      'addr-select-junction',
    ]);
  });

  it('adda', () => {
    const instrs = run('lda x\nadda y\nstop\nx: 5\ny: 6');
    const adda = instrs[1];
    assertWires(adda.execute.stimulated_line_state, [
      'mux-pc',
      'inc',
      'mux3-mem',
      'mem-alu',
      'ir-mem',
      'mux-ma',
      'alu-ma',
      'ma-alu',
      'mux-alu',
    ]);
    assertJunctions(adda.execute.stimulated_line_state, [
      'mem-out-junction',
      'alu-out-junction',
      'ir-addr-junction',
      'ma-out-junction',
      'ma-addr-junction',
      'inc-pcmux-junction',
      'addr-select-junction',
    ]);
  });

  it('suba', () => {
    const instrs = run('lda x\nsuba y\nstop\nx: 10\ny: 4');
    const suba = instrs[1];
    assertWires(suba.execute.stimulated_line_state, [
      'mux-pc',
      'inc',
      'mux3-mem',
      'mem-alu',
      'ir-mem',
      'mux-ma',
      'alu-ma',
      'ma-alu',
      'mux-alu',
    ]);
    assertJunctions(suba.execute.stimulated_line_state, [
      'mem-out-junction',
      'alu-out-junction',
      'ir-addr-junction',
      'ma-out-junction',
      'ma-addr-junction',
      'inc-pcmux-junction',
      'addr-select-junction',
    ]);
  });

  it('addx', () => {
    const instrs = run('ld x\nlea y\naddx\nstop\nx: 5\ny: 6');
    const addx = instrs[2];
    assertWires(addx.execute.stimulated_line_state, [
      'mux-pc',
      'inc',
      'mux3-mem',
      'mem-alu',
      'alu-acc',
      'mux-acc',
      'acc-alu',
      'ma-addr',
      'mux-alu',
    ]);
    assertJunctions(addx.execute.stimulated_line_state, [
      'mem-out-junction',
      'alu-out-junction',
      'acc-in-junction',
      'ma-out-junction',
      'ma-addr-junction',
      'inc-pcmux-junction',
      'acc-alu-control-junction',
      'addr-select-junction',
    ]);
  });

  it('subx', () => {
    const instrs = run('ld x\nlea y\nsubx\nstop\nx: 10\ny: 4');
    const subx = instrs[2];
    assertWires(subx.execute.stimulated_line_state, [
      'mux-pc',
      'inc',
      'mux3-mem',
      'mem-alu',
      'alu-acc',
      'mux-acc',
      'acc-alu',
      'ma-addr',
      'mux-alu',
    ]);
    assertJunctions(subx.execute.stimulated_line_state, [
      'mem-out-junction',
      'alu-out-junction',
      'acc-in-junction',
      'ma-out-junction',
      'ma-addr-junction',
      'inc-pcmux-junction',
      'acc-alu-control-junction',
      'addr-select-junction',
    ]);
  });

  it('lda', () => {
    const instrs = run('lda x\nstop\nx: 99');
    const lda = instrs[0];
    assertWires(lda.execute.stimulated_line_state, ['mux-pc', 'inc', 'mux3-mem', 'mem-ma', 'ir-mem', 'mux-ma']);
    assertJunctions(lda.execute.stimulated_line_state, [
      'mem-out-junction',
      'mem-acc-ma-junction',
      'ir-addr-junction',
      'inc-pcmux-junction',
      'addr-select-junction',
    ]);
  });

  it('sta', () => {
    const instrs = run('lda x\nsta y\nstop\nx: 77\ny: 0');
    const sta = instrs[1];
    assertWires(sta.execute.stimulated_line_state, ['mux-pc', 'inc', 'mux3-mem', 'ir-mem', 'ma-mem', 'mux-mem']);
    assertJunctions(sta.execute.stimulated_line_state, [
      'ir-addr-junction',
      'ma-out-junction',
      'inc-pcmux-junction',
      'addr-select-junction',
    ]);
  });

  it('lea', () => {
    const instrs = run('lea x\nstop\nx: 55');
    const lea = instrs[0];
    assertWires(lea.execute.stimulated_line_state, ['mux-pc', 'inc', 'mux-ma', 'mux3-ma']);
    assertJunctions(lea.execute.stimulated_line_state, ['inc-pcmux-junction', 'addr-select-junction']);
  });

  it('ldi', () => {
    const instrs = run('lea x\nldi\nstop\nx: 55');
    const ldi = instrs[1];
    assertWires(ldi.execute.stimulated_line_state, ['mux-pc', 'inc', 'mux3-mem', 'mem-acc', 'mux-acc', 'ma-addr']);
    assertJunctions(ldi.execute.stimulated_line_state, [
      'mem-out-junction',
      'mem-acc-ma-junction',
      'ma-out-junction',
      'ma-addr-junction',
      'inc-pcmux-junction',
      'addr-select-junction',
    ]);
  });

  it('sti', () => {
    const instrs = run('ld val\nlea dest\nsti\nstop\nval: 33\ndest: 0');
    const sti = instrs[2];
    assertWires(sti.execute.stimulated_line_state, ['mux-pc', 'inc', 'mux3-mem', 'acc-mem', 'ma-addr', 'mux-mem']);
    assertJunctions(sti.execute.stimulated_line_state, [
      'acc-in-junction',
      'ma-out-junction',
      'ma-addr-junction',
      'inc-pcmux-junction',
      'addr-select-junction',
    ]);
  });

  it('shl', () => {
    const instrs = run('ld x\nshl\nstop\nx: 5');
    const shl = instrs[1];
    assertWires(shl.execute.stimulated_line_state, ['mux-pc', 'inc', 'alu-acc', 'mux-acc', 'acc-alu', 'mux-alu']);
    assertJunctions(shl.execute.stimulated_line_state, [
      'alu-out-junction',
      'acc-in-junction',
      'inc-pcmux-junction',
      'acc-alu-control-junction',
    ]);
  });

  it('shr', () => {
    const instrs = run('ld x\nshr\nstop\nx: 8');
    const shr = instrs[1];
    assertWires(shr.execute.stimulated_line_state, ['mux-pc', 'inc', 'alu-acc', 'mux-acc', 'acc-alu', 'mux-alu']);
    assertJunctions(shr.execute.stimulated_line_state, [
      'alu-out-junction',
      'acc-in-junction',
      'inc-pcmux-junction',
      'acc-alu-control-junction',
    ]);
  });

  it('br (unconditional, always taken)', () => {
    const instrs = run('br target\nld skipped\nstop\ntarget: ld hit\nstop\nskipped: 1\nhit: 9');
    const br = instrs[0];
    assertWires(br.execute.stimulated_line_state, ['mux-pc', 'ir-pc']);
    assertJunctions(br.execute.stimulated_line_state, ['ir-addr-junction']);
  });

  it('brz taken', () => {
    const instrs = run('ld zero\nbrz target\ntarget: stop\nzero: 0');
    const brz = instrs[1];
    assertWires(brz.execute.stimulated_line_state, ['mux-pc', 'ir-pc']);
    assertJunctions(brz.execute.stimulated_line_state, ['ir-addr-junction']);
  });

  it('brz not taken', () => {
    const instrs = run('ld one\nbrz target\nstop\ntarget: stop\none: 1');
    const brz = instrs[1];
    assertWires(brz.execute.stimulated_line_state, ['mux-pc', 'inc']);
    assertJunctions(brz.execute.stimulated_line_state, ['inc-pcmux-junction']);
  });

  it('brnz taken', () => {
    const instrs = run('ld one\nbrnz target\ntarget: stop\none: 1');
    const brnz = instrs[1];
    assertWires(brnz.execute.stimulated_line_state, ['mux-pc', 'ir-pc']);
    assertJunctions(brnz.execute.stimulated_line_state, ['ir-addr-junction']);
  });

  it('brnz not taken', () => {
    const instrs = run('ld zero\nbrnz target\nstop\ntarget: stop\nzero: 0');
    const brnz = instrs[1];
    assertWires(brnz.execute.stimulated_line_state, ['mux-pc', 'inc']);
    assertJunctions(brnz.execute.stimulated_line_state, ['inc-pcmux-junction']);
  });

  it('stop', () => {
    const instrs = run('stop');
    const stop = instrs[0];
    assertWires(stop.execute.stimulated_line_state, ['mux-pc', 'inc']);
    assertJunctions(stop.execute.stimulated_line_state, ['inc-pcmux-junction']);
  });

  it('nop', () => {
    const instrs = run('nop\nld x\nstop\nx: 7');
    const nop = instrs[0];
    assertWires(nop.execute.stimulated_line_state, ['mux-pc', 'inc']);
    assertJunctions(nop.execute.stimulated_line_state, ['inc-pcmux-junction']);
  });
});

describe('AccumulatorMa Fetch and Decode phases -> active wires', () => {
  it('fetch lights the fetch-specific wires and junctions', () => {
    const [instr] = run('stop');
    assertWires(instr.fetch.stimulated_line_state, ['pc-mux', 'mux3-mem', 'mem-ir']);
    assertJunctions(instr.fetch.stimulated_line_state, [
      'mem-out-junction',
      'inc-pcmux-junction',
      'addr-select-junction',
    ]);
  });

  it('decode lights the decode-specific wires and junctions', () => {
    const [instr] = run('stop');
    assertWires(instr.decode.stimulated_line_state, ['ir-control', 'acc-control']);
    assertJunctions(instr.decode.stimulated_line_state, ['acc-in-junction', 'acc-alu-control-junction']);
  });
});
