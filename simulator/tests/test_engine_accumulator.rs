use codemachine_simulator::compiler;
use codemachine_simulator::engine;
use codemachine_simulator::types::{Phase, ProcessorId};
use std::fs;

#[test]
fn test_simulate_load_store() {
    let source = "ld x\nst y\nstop\nx: 42\ny: 0";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    assert!(trace.error.is_none());
    let last = trace.steps.last().unwrap();
    assert_eq!(last.memory[4], 42);
}

#[test]
fn test_simulate_add() {
    let source = "ld x\nadd y\nst z\nstop\nx: 10\ny: 20\nz: 0";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(last.memory[6], 30);
    assert_eq!(*last.registers.get("ACC").unwrap(), 30);
}

#[test]
fn test_simulate_sub() {
    let source = "ld x\nsub y\nst z\nstop\nx: 50\ny: 20\nz: 0";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 30);
}

#[test]
fn test_simulate_branch_taken() {
    let source = "ld zero\nbrz target\nld one\nstop\ntarget: stop\nzero: 0\none: 1";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 0);
}

#[test]
fn test_simulate_branch_not_taken() {
    let source = "ld one\nbrz target\nld two\nstop\ntarget: stop\none: 1\ntwo: 2";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 2);
}

#[test]
fn test_simulate_mul() {
    let source = "ld x\nmul y\nstop\nx: 3\ny: 7";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 21);
}

#[test]
fn test_simulate_brnz_taken() {
    let source = "ld one\nbrnz target\nld two\nstop\ntarget: stop\none: 1\ntwo: 2";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 1);
}

#[test]
fn test_simulate_brnz_not_taken() {
    let source = "ld zero\nbrnz target\nld two\nstop\ntarget: stop\nzero: 0\ntwo: 2";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 2);
}

#[test]
fn test_simulate_br_unconditional() {
    let source = "br target\nld skipped\nstop\ntarget: ld hit\nstop\nskipped: 1\nhit: 9";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 9);
}

#[test]
fn test_simulate_stop_halts_immediately() {
    let source = "stop\nld x\nx: 5";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 0);
    assert_eq!(trace.steps.len(), 3); // fetch, decode, execute for the single stop
}

#[test]
fn test_simulate_nop() {
    let source = "nop\nld x\nstop\nx: 7";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let after_nop_execute = &trace.steps[2];
    assert_eq!(*after_nop_execute.registers.get("ACC").unwrap(), 0);
    assert_eq!(*after_nop_execute.registers.get("PC").unwrap(), 1);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 7);
}

#[test]
fn test_simulate_st() {
    let source = "ld x\nst y\nstop\nx: 42\ny: 0";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(last.memory[4], 42);
    assert_eq!(*last.registers.get("ACC").unwrap(), 42);
}

#[test]
fn test_simulate_phases() {
    let source = "ld 2\nstop\n";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert_eq!(trace.steps[0].phase, Phase::Fetch);
    assert_eq!(trace.steps[1].phase, Phase::Decode);
    assert_eq!(trace.steps[2].phase, Phase::Execute);
}

#[test]
fn test_simulate_max_cycles() {
    let source = "br 0";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(!trace.halted);
    assert!(trace.steps.len() <= 4096 * 3);
}

#[test]
fn test_simulate_stimulated_line_state() {
    let source = "ld 2\nstop\n";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert_eq!(trace.steps[0].stimulated_line_state, 0); // fetch
    assert_eq!(trace.steps[1].stimulated_line_state, 3); // decode
    assert_eq!(trace.steps[2].stimulated_line_state, 1); // ld execute
}

fn read_example(name: &str) -> String {
    let path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../code-examples/accumulateur/"
    )
    .to_string()
        + name;
    fs::read_to_string(&path).unwrap_or_else(|e| panic!("failed to read {}: {}", path, e))
}

#[test]
fn test_example_fibonacci() {
    // fibonacci.s computes fib(10) expects 55 in ACC at the end of the program
    let source = read_example("fibonacci.s");
    let compiled = compiler::compile(&source, ProcessorId::Accumulator);
    assert!(compiled.success, "diagnostics: {:?}", compiled.diagnostics);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    assert!(trace.error.is_none());
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 55);
}

#[test]
fn test_example_testacc() {
    // TestAcc.s self-checks add/sub/mul/ld/st/br/brz/brnz and leaves ACC = 1 (resultat)
    // only if every one of its 8 sub-tests passed.
    let source = read_example("TestAcc.s");
    let compiled = compiler::compile(&source, ProcessorId::Accumulator);
    assert!(compiled.success, "diagnostics: {:?}", compiled.diagnostics);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    assert!(trace.error.is_none());
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 1);
}
