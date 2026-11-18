use std::collections::HashMap;

use crate::types::{CycleState, Phase, SimulationTrace};

const MAX_CYCLES: u32 = 4096;
const MEM_SIZE: usize = 256;

fn init_memory(program: &[u32], data_memory: Option<&[i32]>) -> Vec<i32> {
    let mut memory = vec![0i32; MEM_SIZE];
    for (i, &word) in program.iter().enumerate() {
        if i < MEM_SIZE {
            memory[i] = word as i32;
        }
    }
    if let Some(data) = data_memory {
        // Data memory is placed after program
        let offset = program.len();
        for (i, &val) in data.iter().enumerate() {
            let addr = offset + i;
            if addr < MEM_SIZE {
                memory[addr] = val;
            }
        }
    }
    memory
}

/// Snapshot of the processor *during* a cycle: register and memory values are the
/// ones held before the clock edge that ends the cycle. Whatever the cycle's control
/// signals write only becomes visible in the next snapshot.
fn snapshot(cycle: u32, phase: Phase, pc: u16, acc: i16, ir: (u8, u8), memory: &[i32]) -> CycleState {
    let mut regs = HashMap::new();
    regs.insert("PC".to_string(), pc as i32);
    regs.insert("ACC".to_string(), acc as i32);
    regs.insert("IR".to_string(), ((ir.0 as i32) << 8) | (ir.1 as i32));

    CycleState {
        cycle,
        phase,
        registers: regs,
        memory: memory.to_vec(),
        active_signals: Vec::new(),
        active_buses: Vec::new(),
        stimulated_line_state: -1,
        stimulated_memory: -1,
        stimulated_data_memory: None,
        stimulated_registers: Vec::new(),
        instruction_memory: None,
    }
}

pub fn simulate(program: &[u32], data_memory: Option<&[i32]>) -> SimulationTrace {
    let mut memory = init_memory(program, data_memory);
    let mut pc: u16 = 0;
    let mut acc: i16 = 0;
    let mut ir_op: u8 = 0;
    let mut ir_addr: u8 = 0;

    let mut steps: Vec<CycleState> = Vec::new();
    let mut cycle: u32 = 0;
    let mut halted = false;

    // FSM states
    enum FsmState {
        Fetch,
        Decode,
        Execute,
    }

    let mut state = FsmState::Fetch;

    while cycle < MAX_CYCLES && !halted {
        match state {
            FsmState::Fetch => {
                // IR still holds the previous instruction while wr_ir is active.
                let word = memory[pc as usize];
                let mut snap = snapshot(cycle, Phase::Fetch, pc, acc, (ir_op, ir_addr), &memory);
                snap.stimulated_line_state = 0; // fetch
                snap.stimulated_memory = pc as i32;
                steps.push(snap);

                ir_op = ((word >> 8) & 0xFF) as u8;
                ir_addr = (word & 0xFF) as u8;

                state = FsmState::Decode;
            }
            FsmState::Decode => {
                // No register samples a memory value here: the data read is only
                // highlighted during Execute.
                let mut snap = snapshot(cycle, Phase::Decode, pc, acc, (ir_op, ir_addr), &memory);
                snap.stimulated_line_state = 3; // decode
                steps.push(snap);

                state = FsmState::Execute;
            }
            FsmState::Execute => {
                let addr = ir_addr as usize;
                let mut skip_pc_increment = false;
                let stimulated_line_state: i32;
                // Pre-edge state: the results computed below show up in the next cycle.
                let mut snap = snapshot(cycle, Phase::Execute, pc, acc, (ir_op, ir_addr), &memory);

                match ir_op {
                    0 => {
                        // add
                        acc = (acc as i32).wrapping_add(memory[addr]) as i16;
                        stimulated_line_state = 4;
                    }
                    1 => {
                        // sub
                        acc = (acc as i32).wrapping_sub(memory[addr]) as i16;
                        stimulated_line_state = 4;
                    }
                    2 => {
                        // mul
                        acc = (acc as i32).wrapping_mul(memory[addr]) as i16;
                        stimulated_line_state = 4;
                    }
                    3 => {
                        // st
                        memory[addr] = acc as i32;
                        stimulated_line_state = 2;
                    }
                    4 => {
                        // ld
                        acc = memory[addr] as i16;
                        stimulated_line_state = 1;
                    }
                    5 => {
                        // stop
                        halted = true;
                        stimulated_line_state = 5; // nop-like
                    }
                    6 => {
                        // nop
                        stimulated_line_state = 5;
                    }
                    7 => {
                        // br
                        pc = addr as u16;
                        skip_pc_increment = true;
                        stimulated_line_state = 6;
                    }
                    8 => {
                        // brz
                        if acc == 0 {
                            pc = addr as u16;
                            skip_pc_increment = true;
                            stimulated_line_state = 6;
                        } else {
                            stimulated_line_state = 5;
                        }
                    }
                    9 => {
                        // brnz
                        if acc != 0 {
                            pc = addr as u16;
                            skip_pc_increment = true;
                            stimulated_line_state = 6;
                        } else {
                            stimulated_line_state = 5;
                        }
                    }
                    _ => {
                        stimulated_line_state = 5; // treat unknown as nop
                    }
                }

                if !skip_pc_increment {
                    pc = pc.wrapping_add(1);
                }

                snap.stimulated_line_state = stimulated_line_state;
                snap.stimulated_memory = addr as i32;
                steps.push(snap);

                state = FsmState::Fetch;
            }
        }

        cycle += 1;
    }

    SimulationTrace {
        steps,
        halted,
        error: None,
    }
}
