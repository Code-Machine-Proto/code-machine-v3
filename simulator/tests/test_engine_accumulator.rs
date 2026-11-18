use codemachine_simulator::compiler;
use codemachine_simulator::engine;
use codemachine_simulator::types::{Phase, ProcessorId};
use std::fs;

#[test]
fn test_simulate_load_store() {
    let source = ".text\nld x\nst y\nstop\n.data\nx: 42\ny: 0";
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
    let source = ".text\nld x\nadd y\nst z\nstop\n.data\nx: 10\ny: 20\nz: 0";
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
    let source = ".text\nld x\nsub y\nst z\nstop\n.data\nx: 50\ny: 20\nz: 0";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 30);
}

#[test]
fn test_simulate_branch_taken() {
    let source = ".text\nld zero\nbrz target\nld one\nstop\ntarget: stop\n.data\nzero: 0\none: 1";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 0);
}

#[test]
fn test_simulate_branch_not_taken() {
    let source = ".text\nld one\nbrz target\nld two\nstop\ntarget: stop\n.data\none: 1\ntwo: 2";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 2);
}

#[test]
fn test_simulate_mul() {
    let source = ".text\nld x\nmul y\nstop\n.data\nx: 3\ny: 7";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 21);
}

#[test]
fn test_simulate_brnz_taken() {
    let source = ".text\nld one\nbrnz target\nld two\nstop\ntarget: stop\n.data\none: 1\ntwo: 2";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 1);
}

#[test]
fn test_simulate_brnz_not_taken() {
    let source = ".text\nld zero\nbrnz target\nld two\nstop\ntarget: stop\n.data\nzero: 0\ntwo: 2";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 2);
}

#[test]
fn test_simulate_br_unconditional() {
    let source = ".text\nbr target\nld skipped\nstop\ntarget: ld hit\nstop\n.data\nskipped: 1\nhit: 9";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 9);
}

#[test]
fn test_simulate_stop_halts_immediately() {
    let source = ".text\nstop\nld x\n.data\nx: 5";
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
    let source = ".text\nnop\nld x\nstop\n.data\nx: 7";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(trace.halted);
    // Registers are sampled at the clock edge ending the cycle, so the nop's PC increment
    // is only visible in the following fetch.
    let nop_execute = &trace.steps[2];
    assert_eq!(nop_execute.phase, Phase::Execute);
    assert_eq!(*nop_execute.registers.get("PC").unwrap(), 0);
    let next_fetch = &trace.steps[3];
    assert_eq!(next_fetch.phase, Phase::Fetch);
    assert_eq!(*next_fetch.registers.get("ACC").unwrap(), 0);
    assert_eq!(*next_fetch.registers.get("PC").unwrap(), 1);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("ACC").unwrap(), 7);
}

#[test]
fn test_simulate_st() {
    let source = ".text\nld x\nst y\nstop\n.data\nx: 42\ny: 0";
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
    let source = ".text\nld 2\nstop";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert_eq!(trace.steps[0].phase, Phase::Fetch);
    assert_eq!(trace.steps[1].phase, Phase::Decode);
    assert_eq!(trace.steps[2].phase, Phase::Execute);
}

#[test]
fn test_simulate_max_cycles() {
    let source = ".text\nbr 0";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    assert!(!trace.halted);
    assert!(trace.steps.len() <= 4096 * 3);
}

#[test]
fn test_simulate_stimulated_line_state() {
    let source = ".text\nld 2\nstop";
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

#[test]
fn test_ir_and_memory_update_after_the_clock_edge() {
    let source = ".text\nld x\nst y\nstop\n.data\nx: 42\ny: 0";
    let compiled = compiler::compile(source, ProcessorId::Accumulator);
    let trace = engine::simulate(&compiled.program, ProcessorId::Accumulator, None);
    let (fetch, decode) = (&trace.steps[0], &trace.steps[1]);
    // wr_ir is active during fetch, but IR only changes at the edge: visible in decode.
    assert_eq!(*fetch.registers.get("IR").unwrap(), 0);
    assert_ne!(*decode.registers.get("IR").unwrap(), 0);
    // The operand is read from memory in execute only, never highlighted in decode.
    assert_eq!(decode.stimulated_memory, -1);
    assert_eq!(trace.steps[2].stimulated_memory, 3);
    // ld: ACC is loaded at the edge ending execute, visible in the next fetch.
    assert_eq!(*trace.steps[2].registers.get("ACC").unwrap(), 0);
    assert_eq!(*trace.steps[3].registers.get("ACC").unwrap(), 42);
    // st: the memory write is visible in the following fetch.
    let y = 4; // x is at 3, y at 4 (the data follows the 3 instructions)
    assert_eq!(trace.steps[5].memory[y], 0);
    assert_eq!(trace.steps[6].memory[y], 42);
}
