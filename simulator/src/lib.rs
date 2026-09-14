// simulator/src/lib.rs
use serde::Serialize;
use wasm_bindgen::prelude::*;

pub mod compiler;
pub mod engine;
pub mod types;

// Bind directly to console.log instead of pulling in the full web-sys crate.
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// Prints a `[wasm]`-prefixed line to the browser devtools console.
macro_rules! console_log {
    ($($arg:tt)*) => {
        log(&format!($($arg)*))
    };
}

/// Runs once when the wasm module is instantiated. Routes Rust panics (which would
/// otherwise surface as an opaque "unreachable executed" RuntimeError) to the browser
/// console with a real message and stack trace.
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

fn to_js<T: Serialize>(value: &T) -> Result<JsValue, JsValue> {
    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    value
        .serialize(&serializer)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn compile(source: &str, processor_id: u8) -> Result<JsValue, JsValue> {
    console_log!(
        "[wasm] compile() called: processor_id={} source_len={}",
        processor_id,
        source.len()
    );
    let pid = match types::ProcessorId::from_u8(processor_id) {
        Some(pid) => pid,
        None => {
            console_log!("[wasm] compile() error: invalid processor_id={}", processor_id);
            return Err(JsValue::from_str("Invalid processor ID"));
        }
    };
    let result = compiler::compile(source, pid);
    console_log!(
        "[wasm] compile() done: success={} diagnostics={} program_len={}",
        result.success,
        result.diagnostics.len(),
        result.program.len()
    );
    to_js(&result)
}

#[wasm_bindgen]
pub fn simulate(program: &[u32], processor_id: u8, data_memory: &[i32]) -> Result<JsValue, JsValue> {
    console_log!(
        "[wasm] simulate() called: processor_id={} program_len={} data_memory_len={}",
        processor_id,
        program.len(),
        data_memory.len()
    );
    let pid = match types::ProcessorId::from_u8(processor_id) {
        Some(pid) => pid,
        None => {
            console_log!("[wasm] simulate() error: invalid processor_id={}", processor_id);
            return Err(JsValue::from_str("Invalid processor ID"));
        }
    };
    let data_memory = if data_memory.is_empty() { None } else { Some(data_memory) };
    let result = engine::simulate(program, pid, data_memory);
    console_log!(
        "[wasm] simulate() done: halted={} steps={} error={:?}",
        result.halted,
        result.steps.len(),
        result.error
    );
    to_js(&result)
}
