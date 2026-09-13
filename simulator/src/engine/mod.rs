pub mod accumulator;
pub mod accumulator_ma;
pub mod polyrisc;

use crate::types::{ProcessorId, SimulationTrace};

pub fn simulate(program: &[u32], processor_id: ProcessorId, data_memory: Option<&[i32]>) -> SimulationTrace {
    match processor_id {
        ProcessorId::Accumulator => accumulator::simulate(program, data_memory),
        ProcessorId::AccumulatorMa => accumulator_ma::simulate(program, data_memory),
        ProcessorId::PolyRisc => polyrisc::simulate(program, data_memory),
    }
}
