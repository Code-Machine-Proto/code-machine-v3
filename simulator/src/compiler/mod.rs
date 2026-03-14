pub mod accumulator;
pub mod lexer;

use crate::types::{CompileResult, ProcessorId};

pub fn compile(source: &str, processor_id: ProcessorId) -> CompileResult {
    match processor_id {
        ProcessorId::Accumulator | ProcessorId::AccumulatorMa => {
            accumulator::compile(source, processor_id)
        }
        ProcessorId::PolyRisc => CompileResult {
            success: false,
            program: Vec::new(),
            diagnostics: vec![],
            tokens: Vec::new(),
            data_memory: None,
        },
    }
}
