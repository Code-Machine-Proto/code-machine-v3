// simulator/src/lib.rs
use wasm_bindgen::prelude::*;

pub mod types;

#[wasm_bindgen]
pub fn compile(source: &str, processor_id: u8) -> Result<JsValue, JsValue> {
    let _pid = types::ProcessorId::from_u8(processor_id)
        .ok_or_else(|| JsValue::from_str("Invalid processor ID"))?;
    Err(JsValue::from_str("Not yet implemented"))
}

#[wasm_bindgen]
pub fn simulate(program: &[u32], processor_id: u8) -> Result<JsValue, JsValue> {
    let _pid = types::ProcessorId::from_u8(processor_id)
        .ok_or_else(|| JsValue::from_str("Invalid processor ID"))?;
    Err(JsValue::from_str("Not yet implemented"))
}
