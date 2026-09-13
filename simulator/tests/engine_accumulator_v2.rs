use codemachine_simulator::compiler;
use codemachine_simulator::engine;
use codemachine_simulator::types::{Phase, ProcessorId};
use std::fs;

#[test]
fn test_simulate_ld() {
    let source = "ld x\nst y\nstop\nx: 42\ny: 0";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 42);
}

#[test]
fn test_simulate_st() {
    let source = "ld x\nst y\nstop\nx: 42\ny: 0";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(last.memory[4], 42);
    // st must not clobber ACC
    assert_eq!(*last.registers.get("ACC").unwrap(), 42);
}

#[test]
fn test_simulate_add() {
    let source = "ld x\nadd y\nst z\nstop\nx: 10\ny: 20\nz: 0";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(last.memory[6], 30);
    assert_eq!(*last.registers.get("ACC").unwrap(), 30);
}

#[test]
fn test_simulate_sub() {
    let source = "ld x\nsub y\nst z\nstop\nx: 50\ny: 20\nz: 0";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 30);
}

#[test]
fn test_simulate_mul() {
    let source = "ld x\nmul y\nstop\nx: 3\ny: 7";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 21);
}

#[test]
fn test_simulate_adda() {
    let source = "lda x\nadda y\nstop\nx: 5\ny: 6";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("MA").unwrap(), 11);
}

#[test]
fn test_simulate_suba() {
    let source = "lda x\nsuba y\nstop\nx: 10\ny: 4";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("MA").unwrap(), 6);
}

#[test]
fn test_simulate_addx() {
    let source = "ld x\nlea y\naddx\nstop\nx: 5\ny: 6";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 11);
}

#[test]
fn test_simulate_subx() {
    let source = "ld x\nlea y\nsubx\nstop\nx: 10\ny: 4";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 6);
}

#[test]
fn test_simulate_lda() {
    let source = "lda x\nstop\nx: 99";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("MA").unwrap(), 99);
    assert_eq!(*last.registers.get("ACC").unwrap(), 0);
}

#[test]
fn test_simulate_sta() {
    let source = "lda x\nsta y\nstop\nx: 77\ny: 0";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(last.memory[4], 77);
}

#[test]
fn test_simulate_lea_sets_ma() {
    let source = "lea x\nstop\nx: 55";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    // lea must not touch ACC, only MA
    assert_eq!(*last.registers.get("ACC").unwrap(), 0);
    assert_eq!(*last.registers.get("MA").unwrap(), 2); // address of label x
}

#[test]
fn test_simulate_ldi() {
    let source = "lea x\nldi\nstop\nx: 55";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 55);
}

#[test]
fn test_simulate_sti() {
    let source = "ld val\nlea dest\nsti\nstop\nval: 33\ndest: 0";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(last.memory[5], 33);
}

#[test]
fn test_simulate_shl() {
    let source = "ld x\nshl\nstop\nx: 5";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 10);
}

#[test]
fn test_simulate_shr() {
    let source = "ld x\nshr\nstop\nx: 8";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 4);
}

#[test]
fn test_simulate_br_unconditional() {
    let source = "br target\nld skipped\nstop\ntarget: ld hit\nstop\nskipped: 1\nhit: 9";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    // br always jumps to target, so "ld skipped" in between never runs
    assert_eq!(*last.registers.get("ACC").unwrap(), 9);
}

#[test]
fn test_simulate_brz_taken() {
    let source = "ld zero\nbrz target\nld one\nstop\ntarget: stop\nzero: 0\none: 1";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 0);
}

#[test]
fn test_simulate_brz_not_taken() {
    let source = "ld one\nbrz target\nld two\nstop\ntarget: stop\none: 1\ntwo: 2";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 2);
}

#[test]
fn test_simulate_brnz_taken() {
    let source = "ld one\nbrnz target\nld two\nstop\ntarget: stop\none: 1\ntwo: 2";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 1);
}

#[test]
fn test_simulate_brnz_not_taken() {
    let source = "ld zero\nbrnz target\nld two\nstop\ntarget: stop\nzero: 0\ntwo: 2";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 2);
}

#[test]
fn test_simulate_stop_halts_immediately() {
    let source = "stop\nld x\nx: 5";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 0);
    assert_eq!(trace.steps.len(), 3); // fetch, decode, execute for the single stop
}

#[test]
fn test_simulate_nop() {
    let source = "nop\nld x\nstop\nx: 7";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let after_nop_execute = &trace.steps[2];
    assert_eq!(*after_nop_execute.registers.get("ACC").unwrap(), 0);
    assert_eq!(*after_nop_execute.registers.get("PC").unwrap(), 1);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 7);
}

#[test]
fn test_simulate_phases() {
    let source = "ld 2\nstop\n";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert_eq!(trace.steps[0].phase, Phase::Fetch);
    assert_eq!(trace.steps[1].phase, Phase::Decode);
    assert_eq!(trace.steps[2].phase, Phase::Execute);
}

#[test]
fn test_simulate_max_cycles() {
    let source = "br 0";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(!trace.halted);
    assert!(trace.steps.len() <= 1024);
}
