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
                let word = memory[pc as usize];
                ir_op = ((word >> 8) & 0xFF) as u8;
                ir_addr = (word & 0xFF) as u8;

                let mut regs = HashMap::new();
                regs.insert("PC".to_string(), pc as i32);
                regs.insert("ACC".to_string(), acc as i32);
                regs.insert("IR".to_string(), ((ir_op as i32) << 8) | (ir_addr as i32));

                steps.push(CycleState {
                    cycle,
                    phase: Phase::Fetch,
                    registers: regs,
                    memory: memory.clone(),
                    active_signals: Vec::new(),
                    active_buses: Vec::new(),
                    stimulated_line_state: 0, // fetch
                    stimulated_memory: pc as i32,
                    stimulated_data_memory: None,
                    instruction_memory: None,
                });

                state = FsmState::Decode;
            }
            FsmState::Decode => {
                // Determine stimulated memory for decode
                let stim_mem = match ir_op {
                    0 | 1 | 2 | 4 => ir_addr as i32, // add, sub, mul, ld read from addr
                    3 => ir_addr as i32,             // st writes to addr
                    _ => -1,
                };

                let mut regs = HashMap::new();
                regs.insert("PC".to_string(), pc as i32);
                regs.insert("ACC".to_string(), acc as i32);
                regs.insert("IR".to_string(), ((ir_op as i32) << 8) | (ir_addr as i32));

                steps.push(CycleState {
                    cycle,
                    phase: Phase::Decode,
                    registers: regs,
                    memory: memory.clone(),
                    active_signals: Vec::new(),
                    active_buses: Vec::new(),
                    stimulated_line_state: 3, // decode
                    stimulated_memory: stim_mem,
                    stimulated_data_memory: None,
                    instruction_memory: None,
                });

                state = FsmState::Execute;
            }
            FsmState::Execute => {
                let addr = ir_addr as usize;
                let mut skip_pc_increment = false;
                let stimulated_line_state: i32;

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

                let mut regs = HashMap::new();
                regs.insert("PC".to_string(), pc as i32);
                regs.insert("ACC".to_string(), acc as i32);
                regs.insert("IR".to_string(), ((ir_op as i32) << 8) | (ir_addr as i32));

                steps.push(CycleState {
                    cycle,
                    phase: Phase::Execute,
                    registers: regs,
                    memory: memory.clone(),
                    active_signals: Vec::new(),
                    active_buses: Vec::new(),
                    stimulated_line_state,
                    stimulated_memory: addr as i32,
                    stimulated_data_memory: None,
                    instruction_memory: None,
                });

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
