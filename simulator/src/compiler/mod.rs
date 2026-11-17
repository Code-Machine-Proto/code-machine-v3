pub mod accumulator;
pub mod lexer;
pub mod polyrisc;

use crate::compiler::lexer::{tokenize_line, Token};
use crate::types::{CompileResult, Diagnostic, ProcessorId, Severity, TokenSpan};

/// Every program must contain a `.text` section (`.data` is optional). This is
/// checked before anything else, so a missing section is always the first error.
/// Returns the diagnostics (empty when `.text` is present) and the token spans.
fn check_sections(source: &str) -> (Vec<Diagnostic>, Vec<TokenSpan>) {
    let mut spans = Vec::new();
    let mut has_text = false;

    for (line_idx, line) in source.lines().enumerate() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let (tokens, line_spans) = tokenize_line(trimmed, line_idx);
        spans.extend(line_spans);
        if let Some(Token::Directive(dir)) =
            tokens.iter().find(|t| !matches!(t, Token::Comment(_)))
        {
            if dir == ".text" {
                has_text = true;
            }
        }
    }

    let diagnostics = if has_text {
        Vec::new()
    } else {
        vec![Diagnostic {
            line: 0,
            column: 0,
            message: "Missing .text section: the program must contain a .text section".into(),
            severity: Severity::Error,
        }]
    };
    (diagnostics, spans)
}

/// Message for a line in `.text` that starts with something other than an instruction
/// mnemonic. Numbers and `[` mean the user is declaring data without a `.data` directive.
pub(crate) fn unexpected_text_token_message(tok: &Token) -> &'static str {
    match tok {
        Token::Number(_) | Token::LBracket => {
            "Data must be declared in a .data section (add a .data directive before it)"
        }
        _ => "Expected instruction mnemonic",
    }
}

pub fn compile(source: &str, processor_id: ProcessorId) -> CompileResult {
    let (section_errors, spans) = check_sections(source);
    if !section_errors.is_empty() {
        return CompileResult {
            success: false,
            program: Vec::new(),
            diagnostics: section_errors,
            tokens: spans,
            data_memory: None,
            instruction_lines: Vec::new(),
        };
    }

    match processor_id {
        ProcessorId::Accumulator | ProcessorId::AccumulatorMa => {
            accumulator::compile(source, processor_id)
        }
        ProcessorId::PolyRisc => polyrisc::compile(source),
    }
}
