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
    assert_eq!(*last.registers.get("ACC").unwrap(), 0);
    assert_eq!(*last.registers.get("MA").unwrap(), 2); // address of label x
}

#[test]
fn test_simulate_line_state_lea_is_distinct_from_nop() {
    let source = "lea x\nstop\nx: 0";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success, "diagnostics: {:?}", compiled.diagnostics);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    let execute_states: Vec<i32> = trace
        .steps
        .iter()
        .filter(|s| s.phase == Phase::Execute)
        .map(|s| s.stimulated_line_state)
        .collect();
    assert_eq!(execute_states, vec![12, 14]); // lea, stop
}

#[test]
fn test_simulate_line_state_branch_taken_vs_untaken() {
    let taken_source = "brz target\ntarget: stop"; // ACC starts at 0, so brz is taken
    let taken = compiler::compile(taken_source, ProcessorId::AccumulatorMa);
    assert!(taken.success);
    let taken_trace = engine::simulate(&taken.program, ProcessorId::AccumulatorMa, None);
    let taken_states: Vec<i32> = taken_trace
        .steps
        .iter()
        .filter(|s| s.phase == Phase::Execute)
        .map(|s| s.stimulated_line_state)
        .collect();
    assert_eq!(taken_states, vec![13, 14]); // brz (taken), stop

    let untaken_source = "brnz target\nstop\ntarget: stop"; // ACC starts at 0, so brnz is not taken
    let untaken = compiler::compile(untaken_source, ProcessorId::AccumulatorMa);
    assert!(untaken.success);
    let untaken_trace = engine::simulate(&untaken.program, ProcessorId::AccumulatorMa, None);
    let untaken_states: Vec<i32> = untaken_trace
        .steps
        .iter()
        .filter(|s| s.phase == Phase::Execute)
        .map(|s| s.stimulated_line_state)
        .collect();
    assert_eq!(untaken_states, vec![14, 14]); // brnz (not taken), stop
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
fn test_simulate_shr_is_arithmetic() {
    // shr must sign-extend (arithmetic shift), matching the hardware's SInt semantics
    let source = "ld x\nshr\nstop\nx: -8";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), -4);
}

#[test]
fn test_simulate_br_unconditional() {
    let source = "br target\nld skipped\nstop\ntarget: ld hit\nstop\nskipped: 1\nhit: 9";
    let compiled = compiler::compile(source, ProcessorId::AccumulatorMa);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
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
    assert!(trace.steps.len() <= 4096 * 3);
}

fn read_example(name: &str) -> String {
    let path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../code-examples/accumulateur-ma/"
    )
    .to_string()
        + name;
    fs::read_to_string(&path).unwrap_or_else(|e| panic!("failed to read {}: {}", path, e))
}

#[test]
fn test_example_testaccma() {
    // TestAccMa.s self-checks all 18 v2-specific instructions (including adda/suba/lda/sta/lea)
    // and leaves ACC = 1 (resultat) only if every sub-test passed.
    let source = read_example("TestAccMa.s");
    let compiled = compiler::compile(&source, ProcessorId::AccumulatorMa);
    assert!(compiled.success, "diagnostics: {:?}", compiled.diagnostics);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 1);
}

#[test]
fn test_example_est_pair() {
    // estPair.s checks whether n=4 is even by clearing its low bit; ACC = 1 means "even"
    let source = read_example("estPair.s");
    let compiled = compiler::compile(&source, ProcessorId::AccumulatorMa);
    assert!(compiled.success, "diagnostics: {:?}", compiled.diagnostics);
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 1);
}

#[test]
fn test_example_somme_carres() {
    // sommeCarres.s expects sum of squares (1,4,9,...,81) to be 285.
    let source = read_example("sommeCarres.s");
    let compiled = compiler::compile(&source, ProcessorId::AccumulatorMa);
    assert!(compiled.success, "diagnostics: {:?}", compiled.diagnostics);
    assert_eq!(
        &compiled.program[13..22],
        &[1, 4, 9, 16, 25, 36, 49, 64, 81]
    );
    let trace = engine::simulate(&compiled.program, ProcessorId::AccumulatorMa, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(last.memory[10], 285); // somme
    assert_eq!(&last.memory[13..22], &[1, 4, 9, 16, 25, 36, 49, 64, 81]); // addmem preserved
}
