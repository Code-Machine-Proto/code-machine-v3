use std::collections::HashMap;

use crate::compiler::lexer::{tokenize_line, Token};
use crate::types::{CompileResult, Diagnostic, ProcessorId, Severity, TokenSpan};

/// Instruction definition: mnemonic -> (opcode, has_operand)
fn build_instruction_set(processor_id: ProcessorId) -> HashMap<String, (u32, bool)> {
    let mut map = HashMap::new();
    match processor_id {
        ProcessorId::Accumulator => {
            map.insert("add".into(), (0, true));
            map.insert("sub".into(), (1, true));
            map.insert("mul".into(), (2, true));
            map.insert("st".into(), (3, true));
            map.insert("ld".into(), (4, true));
            map.insert("stop".into(), (5, false));
            map.insert("nop".into(), (6, false));
            map.insert("br".into(), (7, true));
            map.insert("brz".into(), (8, true));
            map.insert("brnz".into(), (9, true));
        }
        ProcessorId::AccumulatorMa => {
            map.insert("add".into(), (0, true));
            map.insert("sub".into(), (1, true));
            map.insert("mul".into(), (2, true));
            map.insert("adda".into(), (3, true));
            map.insert("suba".into(), (4, true));
            map.insert("addx".into(), (5, false));
            map.insert("subx".into(), (6, false));
            map.insert("ld".into(), (7, true));
            map.insert("st".into(), (8, true));
            map.insert("lda".into(), (9, true));
            map.insert("sta".into(), (10, true));
            map.insert("ldi".into(), (11, false));
            map.insert("sti".into(), (12, false));
            map.insert("br".into(), (13, true));
            map.insert("brz".into(), (14, true));
            map.insert("brnz".into(), (15, true));
            map.insert("shl".into(), (16, false));
            map.insert("shr".into(), (17, false));
            map.insert("lea".into(), (18, true));
            map.insert("stop".into(), (19, false));
            map.insert("nop".into(), (20, false));
        }
        _ => {}
    }
    map
}

/// Represents a parsed line before final resolution.
#[derive(Debug)]
enum ParsedLine {
    /// An instruction with opcode and optional operand reference
    Instruction {
        opcode: u32,
        operand: Option<Operand>,
    },
    /// Raw data values from a label definition
    Data(Vec<i32>),
    /// Empty/directive line (skipped)
    Empty,
}

#[derive(Debug)]
enum Operand {
    Literal(u32),
    LabelRef { name: String, offset: i32 },
}

#[derive(Debug, Clone, Copy, PartialEq)]
enum Section {
    Text,
    Data,
}

/// Parses numeric data values out of a (post-label) token slice, validating that any
/// `[`/`]` array-literal brackets are balanced. Bracket state is threaded across calls
/// so an array can legally span multiple source lines (e.g. `table: [\n1,\n2\n]`).
fn parse_data_values(
    tokens: &[Token],
    line_idx: usize,
    bracket_depth: &mut u32,
    bracket_open_line: &mut Option<usize>,
    diagnostics: &mut Vec<Diagnostic>,
) -> Vec<i32> {
    let mut values = Vec::new();
    for token in tokens {
        match token {
            Token::Number(n) => values.push(*n),
            Token::Comma => {}
            Token::LBracket => {
                if *bracket_depth > 0 {
                    diagnostics.push(Diagnostic {
                        line: line_idx,
                        column: 0,
                        message: "Unexpected nested '['".into(),
                        severity: Severity::Error,
                    });
                } else {
                    *bracket_depth += 1;
                    *bracket_open_line = Some(line_idx);
                }
            }
            Token::RBracket => {
                if *bracket_depth == 0 {
                    diagnostics.push(Diagnostic {
                        line: line_idx,
                        column: 0,
                        message: "Unmatched ']'".into(),
                        severity: Severity::Error,
                    });
                } else {
                    *bracket_depth -= 1;
                    *bracket_open_line = None;
                }
            }
            Token::Identifier(name) => {
                // Could be a label reference in data - not supported.
                diagnostics.push(Diagnostic {
                    line: line_idx,
                    column: 0,
                    message: format!("Label reference '{}' in data not supported", name),
                    severity: Severity::Error,
                });
            }
            _ => {}
        }
    }
    values
}

pub fn compile(source: &str, processor_id: ProcessorId) -> CompileResult {
    let instruction_set = build_instruction_set(processor_id);
    let lines: Vec<&str> = source.lines().collect();

    let mut all_spans: Vec<TokenSpan> = Vec::new();
    let mut diagnostics: Vec<Diagnostic> = Vec::new();

    // First pass: tokenize and parse all lines, collect labels
    let mut parsed_lines: Vec<(usize, Option<String>, ParsedLine)> = Vec::new(); // (source_line, label, parsed)
    let mut label_addresses: HashMap<String, usize> = HashMap::new();
    let mut current_address: usize = 0;
    let mut section = Section::Text;
    let mut bracket_depth: u32 = 0;
    let mut bracket_open_line: Option<usize> = None;

    for (line_idx, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        let (tokens, spans) = tokenize_line(trimmed, line_idx);
        all_spans.extend(spans);

        // Filter out comments
        let tokens: Vec<Token> = tokens
            .into_iter()
            .filter(|t| !matches!(t, Token::Comment(_)))
            .collect();

        if tokens.is_empty() {
            continue;
        }

        // Check for directive
        if let Token::Directive(ref dir) = tokens[0] {
            match dir.as_str() {
                ".text" => section = Section::Text,
                ".data" => section = Section::Data,
                _ => {}
            }
            continue;
        }

        // Check for label definition
        let (label, rest_tokens) = if matches!(&tokens[0], Token::LabelDef(_)) {
            let label_name = if let Token::LabelDef(name) = &tokens[0] {
                name.clone()
            } else {
                unreachable!()
            };
            (Some(label_name), &tokens[1..])
        } else {
            (None, &tokens[..])
        };

        // Register label at current address
        if let Some(ref lbl) = label {
            if label_addresses.contains_key(lbl) {
                diagnostics.push(Diagnostic {
                    line: line_idx,
                    column: 0,
                    message: format!("Duplicate label '{}'", lbl),
                    severity: Severity::Error,
                });
            }
            label_addresses.insert(lbl.clone(), current_address);
        }

        if rest_tokens.is_empty() {
            // Label-only line (branch target) - no data, no instruction
            // The label points to whatever comes next; don't emit anything
            // But we already registered the label at current_address
            parsed_lines.push((line_idx, label, ParsedLine::Empty));
            continue;
        }

        // Inside an explicit .data section, every line (labeled or not) is data,
        // so multi-value declarations can continue across lines without repeating the label.
        if section == Section::Data {
            let values = parse_data_values(
                rest_tokens,
                line_idx,
                &mut bracket_depth,
                &mut bracket_open_line,
                &mut diagnostics,
            );
            let count = values.len();
            parsed_lines.push((line_idx, label, ParsedLine::Data(values)));
            current_address += count;
            continue;
        }

        // Check if remaining tokens are data values (after a label def)
        if label.is_some() && !matches!(&rest_tokens[0], Token::Identifier(_)) {
            let values = parse_data_values(
                rest_tokens,
                line_idx,
                &mut bracket_depth,
                &mut bracket_open_line,
                &mut diagnostics,
            );
            let count = values.len();
            parsed_lines.push((line_idx, label, ParsedLine::Data(values)));
            current_address += count;
            continue;
        }

        // It should be an instruction
        if let Token::Identifier(ref mnemonic) = rest_tokens[0] {
            let mnemonic_lower = mnemonic.to_lowercase();
            if let Some(&(opcode, has_operand)) = instruction_set.get(&mnemonic_lower) {
                let operand = if has_operand {
                    if rest_tokens.len() > 1 {
                        parse_operand(&rest_tokens[1..])
                    } else {
                        diagnostics.push(Diagnostic {
                            line: line_idx,
                            column: 0,
                            message: format!("'{}' requires an operand", mnemonic_lower),
                            severity: Severity::Error,
                        });
                        None
                    }
                } else {
                    None
                };
                parsed_lines.push((
                    line_idx,
                    label,
                    ParsedLine::Instruction { opcode, operand },
                ));
                current_address += 1;
            } else {
                diagnostics.push(Diagnostic {
                    line: line_idx,
                    column: 0,
                    message: format!("Unknown instruction '{}'", mnemonic),
                    severity: Severity::Error,
                });
                parsed_lines.push((line_idx, label, ParsedLine::Empty));
            }
        } else {
            // Data values after label that start with a number
            // Already handled above, but just in case
            parsed_lines.push((line_idx, label, ParsedLine::Empty));
        }
    }

    if bracket_depth > 0 {
        diagnostics.push(Diagnostic {
            line: bracket_open_line.unwrap_or(0),
            column: 0,
            message: "Unclosed '[' in data section".into(),
            severity: Severity::Error,
        });
    }

    // Check for errors
    if !diagnostics.is_empty() {
        return CompileResult {
            success: false,
            program: Vec::new(),
            diagnostics,
            tokens: all_spans,
            data_memory: None,
        };
    }

    // Second pass: resolve labels and emit program
    let mut program: Vec<u32> = Vec::new();

    for (line_idx, _label, parsed) in &parsed_lines {
        match parsed {
            ParsedLine::Instruction { opcode, operand } => {
                let address = match operand {
                    Some(Operand::Literal(val)) => *val,
                    Some(Operand::LabelRef { name, offset }) => {
                        if let Some(&addr) = label_addresses.get(name) {
                            ((addr as i32) + offset) as u32
                        } else {
                            diagnostics.push(Diagnostic {
                                line: *line_idx,
                                column: 0,
                                message: format!("Undefined label '{}'", name),
                                severity: Severity::Error,
                            });
                            0
                        }
                    }
                    None => 0,
                };
                if address > 0xFF {
                    diagnostics.push(Diagnostic {
                        line: *line_idx,
                        column: 0,
                        message: format!("Address {} exceeds 8-bit range (max 255)", address),
                        severity: Severity::Warning,
                    });
                }
                let word = (opcode << 8) | (address & 0xFF);
                program.push(word);
            }
            ParsedLine::Data(values) => {
                for v in values {
                    program.push(*v as u32);
                }
            }
            ParsedLine::Empty => {}
        }
    }

    if !diagnostics.is_empty() {
        return CompileResult {
            success: false,
            program: Vec::new(),
            diagnostics,
            tokens: all_spans,
            data_memory: None,
        };
    }

    CompileResult {
        success: true,
        program,
        diagnostics,
        tokens: all_spans,
        data_memory: None,
    }
}

fn parse_operand(tokens: &[Token]) -> Option<Operand> {
    if tokens.is_empty() {
        return None;
    }

    match &tokens[0] {
        Token::Number(n) => Some(Operand::Literal(*n as u32)),
        Token::Identifier(name) => {
            // Check for offset: name + N
            let mut offset: i32 = 0;
            let mut i = 1;
            while i < tokens.len() {
                if matches!(&tokens[i], Token::Plus) {
                    if i + 1 < tokens.len() {
                        if let Token::Number(n) = &tokens[i + 1] {
                            offset += *n;
                        }
                        i += 2;
                    } else {
                        i += 1;
                    }
                } else {
                    i += 1;
                }
            }
            Some(Operand::LabelRef {
                name: name.clone(),
                offset,
            })
        }
        _ => None,
    }
}
