pub mod accumulator;

use crate::types::{ProcessorId, SimulationTrace};

pub fn simulate(program: &[u32], processor_id: ProcessorId, data_memory: Option<&[i32]>) -> SimulationTrace {
    match processor_id {
        ProcessorId::Accumulator => accumulator::simulate_v1(program, data_memory),
        ProcessorId::AccumulatorMa => accumulator::simulate_v2(program, data_memory),
        ProcessorId::PolyRisc => SimulationTrace {
            steps: Vec::new(),
            halted: false,
            error: Some("Not yet implemented".to_string()),
        },
    }
}
