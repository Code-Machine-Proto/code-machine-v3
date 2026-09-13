use codemachine_simulator::compiler;
use codemachine_simulator::engine;
use codemachine_simulator::types::{Phase, ProcessorId};
use std::fs;

#[test]
fn test_simulate_ldi_and_add() {
    let source = ".text\nldi r1,10\nldi r2,20\nadd r3,r1,r2\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r1").unwrap(), 10);
    assert_eq!(*last.registers.get("r2").unwrap(), 20);
    assert_eq!(*last.registers.get("r3").unwrap(), 30);
}

#[test]
fn test_simulate_sub() {
    let source = ".text\nldi r1,50\nldi r2,20\nsub r3,r1,r2\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r3").unwrap(), 30);
}

#[test]
fn test_simulate_memory_load_store() {
    let source = ".text\nldi r1,42\nldi r2,0\nst (r2),r1\nld r3,(r2)\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, compiled.data_memory.as_deref());
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r3").unwrap(), 42);
    assert_eq!(last.memory[0], 42);
}

#[test]
fn test_simulate_branch_brz() {
    let source = ".text\nldi r1,0\nsub r1,r1,r1\nbrz skip\nldi r2,99\nskip:\nldi r3,1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_ne!(*last.registers.get("r2").unwrap_or(&0), 99);
    assert_eq!(*last.registers.get("r3").unwrap(), 1);
}

#[test]
fn test_simulate_shift_operations() {
    let source = ".text\nldi r1,4\nshl r2,r1\nshr r3,r1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r2").unwrap(), 8);
    assert_eq!(*last.registers.get("r3").unwrap(), 2);
}

#[test]
fn test_simulate_and() {
    let source = ".text\nldi r1,12\nldi r2,10\nand r3,r1,r2\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r3").unwrap(), 8); // 1100 & 1010 = 1000
}

#[test]
fn test_simulate_or() {
    let source = ".text\nldi r1,12\nldi r2,10\nor r3,r1,r2\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r3").unwrap(), 14); // 1100 | 1010 = 1110
}

#[test]
fn test_simulate_not() {
    let source = ".text\nldi r1,0\nnot r2,r1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r2").unwrap(), -1); // bitwise NOT of 0
}

#[test]
fn test_simulate_mv() {
    let source = ".text\nldi r1,42\nmv r2,r1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r2").unwrap(), 42);
}

#[test]
fn test_simulate_br_unconditional() {
    let source = ".text\nbr target\nldi r1,99\ntarget:\nldi r2,1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    // br always jumps to target, so "ldi r1,99" in between never runs
    assert_eq!(*last.registers.get("r1").unwrap_or(&0), 0);
    assert_eq!(*last.registers.get("r2").unwrap(), 1);
}

#[test]
fn test_simulate_brz_not_taken() {
    let source = ".text\nldi r1,5\nldi r2,3\nsub r3,r1,r2\nbrz target\nldi r4,99\ntarget:\nldi r5,1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r4").unwrap(), 99);
    assert_eq!(*last.registers.get("r5").unwrap(), 1);
}

#[test]
fn test_simulate_brnz_taken() {
    let source = ".text\nldi r1,5\nldi r2,0\nadd r3,r1,r2\nbrnz target\nldi r4,99\ntarget:\nldi r5,1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r4").unwrap_or(&0), 0);
    assert_eq!(*last.registers.get("r5").unwrap(), 1);
}

#[test]
fn test_simulate_brnz_not_taken() {
    let source = ".text\nldi r1,0\nldi r2,0\nadd r3,r1,r2\nbrnz target\nldi r4,99\ntarget:\nldi r5,1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r4").unwrap(), 99);
    assert_eq!(*last.registers.get("r5").unwrap(), 1);
}

#[test]
fn test_simulate_brlz_taken() {
    let source = ".text\nldi r1,5\nldi r2,10\nsub r3,r1,r2\nbrlz target\nldi r4,99\ntarget:\nldi r5,1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r3").unwrap(), -5);
    assert_eq!(*last.registers.get("r4").unwrap_or(&0), 0);
    assert_eq!(*last.registers.get("r5").unwrap(), 1);
}

#[test]
fn test_simulate_brlz_not_taken() {
    let source = ".text\nldi r1,10\nldi r2,3\nsub r3,r1,r2\nbrlz target\nldi r4,99\ntarget:\nldi r5,1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r4").unwrap(), 99);
    assert_eq!(*last.registers.get("r5").unwrap(), 1);
}

#[test]
fn test_simulate_brgez_taken() {
    let source = ".text\nldi r1,10\nldi r2,5\nsub r3,r1,r2\nbrgez target\nldi r4,99\ntarget:\nldi r5,1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r4").unwrap_or(&0), 0);
    assert_eq!(*last.registers.get("r5").unwrap(), 1);
}

#[test]
fn test_simulate_brgez_not_taken() {
    let source = ".text\nldi r1,3\nldi r2,10\nsub r3,r1,r2\nbrgez target\nldi r4,99\ntarget:\nldi r5,1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r4").unwrap(), 99);
    assert_eq!(*last.registers.get("r5").unwrap(), 1);
}

#[test]
fn test_simulate_stop_halts_immediately() {
    let source = ".text\nstop\nldi r1,5";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    // stop halts before the following "ldi r1,5" ever executes
    assert_eq!(*last.registers.get("r1").unwrap_or(&0), 0);
    assert_eq!(last.phase, Phase::End);
}

#[test]
fn test_simulate_phases() {
    let source = ".text\nldi r1,1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert_eq!(trace.steps[0].phase, Phase::Start);
    assert_eq!(trace.steps[1].phase, Phase::Fetch);
    assert_eq!(trace.steps[2].phase, Phase::Decode);
    assert_eq!(trace.steps[3].phase, Phase::Execute);
}

#[test]
fn test_simulate_flags() {
    let source = ".text\nldi r1,5\nldi r2,5\nsub r3,r1,r2\nbrz success\nldi r10,0\nstop\nsuccess:\nldi r10,1\nstop";
    let compiled = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(compiled.success);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, None);
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(*last.registers.get("r10").unwrap(), 1);
}

fn read_example(name: &str) -> String {
    let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../code-examples/polyrisc/").to_string() + name;
    fs::read_to_string(&path).unwrap_or_else(|e| panic!("failed to read {}: {}", path, e))
}

#[test]
fn test_example_fibonacci() {
    // fibonacci.s fills mem[resultat..resultat+8] with fib(0..8) for n=8
    let source = read_example("fibonacci.s");
    let compiled = compiler::compile(&source, ProcessorId::PolyRisc);
    assert!(compiled.success, "diagnostics: {:?}", compiled.diagnostics);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, compiled.data_memory.as_deref());
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    // mem[0] = n = 8, mem[1..9] = resultat = fib(0)..fib(7)
    assert_eq!(last.memory[0], 8);
    assert_eq!(&last.memory[1..9], &[0, 1, 1, 2, 3, 5, 8, 13]);
}

#[test]
fn test_example_somme_nbr_memoire() {
    // sommeNbrMemoire.s sums a 10-value table and stores the total right after it
    let source = read_example("sommeNbrMemoire.s");
    let compiled = compiler::compile(&source, ProcessorId::PolyRisc);
    assert!(compiled.success, "diagnostics: {:?}", compiled.diagnostics);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, compiled.data_memory.as_deref());
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(&last.memory[0..10], &[3, 7, 2, 8, 5, 1, 9, 4, 6, 10]);
    assert_eq!(last.memory[10], 55); // 3+7+2+8+5+1+9+4+6+10
}

#[test]
fn test_example_somme_nbr_premiers() {
    // sommeNbrPremiers.s sums the first 4 even numbers (2+4+6+8) into mem[1]
    let source = read_example("sommeNbrPremiers.s");
    let compiled = compiler::compile(&source, ProcessorId::PolyRisc);
    assert!(compiled.success, "diagnostics: {:?}", compiled.diagnostics);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, compiled.data_memory.as_deref());
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(last.memory[0], 4); // n, unchanged
    assert_eq!(last.memory[1], 20); // somme = 2+4+6+8
}

#[test]
fn test_example_test_alu() {
    // test_alu.s exercises every ALU op and stores each result to mem[10..18]
    let source = read_example("test_alu.s");
    let compiled = compiler::compile(&source, ProcessorId::PolyRisc);
    assert!(compiled.success, "diagnostics: {:?}", compiled.diagnostics);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, compiled.data_memory.as_deref());
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(
        &last.memory[10..18],
        &[13, 7, 2, 11, 10, 5, 20, -4] // add, sub, and, or, mv, shr, shl, not
    );
}

#[test]
fn test_example_test_branchements() {
    // test_branchements.s exercises br/brz/brnz/brlz/brgez, storing to mem[20..25]
    let source = read_example("test_branchements.s");
    let compiled = compiler::compile(&source, ProcessorId::PolyRisc);
    assert!(compiled.success, "diagnostics: {:?}", compiled.diagnostics);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, compiled.data_memory.as_deref());
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    assert_eq!(&last.memory[20..25], &[42, 55, 2, 77, 5]);
}

#[test]
fn test_example_test_registres() {
    // test_registres.s loads a distinct value into every register (r0-r31) and
    // saves them all to mem[0..32]
    let source = read_example("test_registres.s");
    let compiled = compiler::compile(&source, ProcessorId::PolyRisc);
    assert!(compiled.success, "diagnostics: {:?}", compiled.diagnostics);
    let trace = engine::simulate(&compiled.program, ProcessorId::PolyRisc, compiled.data_memory.as_deref());
    assert!(trace.halted);
    let last = trace.steps.last().unwrap();
    let expected: Vec<i32> = (200..=231).collect();
    assert_eq!(&last.memory[0..32], expected.as_slice());
}
