use codemachine_simulator::compiler;
use codemachine_simulator::types::ProcessorId;

#[test]
fn test_compile_alu_three_reg() {
    let source = ".text\nadd r1,r2,r3";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(result.success);
    assert_eq!(result.program[0], 0x00010203);
}

#[test]
fn test_compile_alu_two_reg() {
    let source = ".text\nshr r5,r10";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(result.success);
    assert_eq!(result.program[0], 0x02050A00);
}

#[test]
fn test_compile_load_memory() {
    let source = ".text\nld r1,(r2)";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(result.success);
    assert_eq!(result.program[0], 0x08010200);
}

#[test]
fn test_compile_store_memory() {
    let source = ".text\nst (r3),r4";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(result.success);
    assert_eq!(result.program[0], 0x09000304);
}

#[test]
fn test_compile_instruction_lines_maps_program_words_to_source_lines() {
    let source = ".text\nldi r1,10\nadd r2,r1,r1\nstop";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(result.success);
    // line 0 is the ".text" directive, so instructions start on line 1
    assert_eq!(result.instruction_lines, vec![1, 2, 3]);
    assert_eq!(result.instruction_lines.len(), result.program.len());
}

#[test]
fn test_compile_ldi() {
    let source = ".text\nldi r7,255";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(result.success);
    assert_eq!(result.program[0], 0x0A0700FF);
}

#[test]
fn test_compile_branch() {
    let source = ".text\nbr 10";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(result.success);
    assert_eq!(result.program[0], 0x0C00000A);
}

#[test]
fn test_compile_brz() {
    let source = ".text\nbrz 5";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(result.success);
    assert_eq!(result.program[0], 0x0C010005);
}

#[test]
fn test_compile_stop() {
    let source = ".text\nstop";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(result.success);
    assert_eq!(result.program[0], 0x0F000000);
}

#[test]
fn test_compile_with_labels() {
    let source = ".text\nldi r1,10\nloop:\nsub r1,r1,r2\nbrnz loop\nstop";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(result.success);
    assert_eq!(result.program[2], (0xC << 24) | (2 << 16) | 1);
}

#[test]
fn test_compile_data_section() {
    let source = ".text\nld r1,(r2)\nstop\n.data\nmydata: 42,100";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(result.success);
    assert!(result.data_memory.is_some());
    let dm = result.data_memory.unwrap();
    assert_eq!(dm[0], 42);
    assert_eq!(dm[1], 100);
}

#[test]
fn test_compile_data_section_bracket_array() {
    let source = ".text\nld r1,(r2)\nstop\n.data\nmydata: [42, 100, 7]";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(result.success, "diagnostics: {:?}", result.diagnostics);
    let dm = result.data_memory.unwrap();
    assert_eq!(dm, vec![42, 100, 7]);
}

#[test]
fn test_compile_data_section_unclosed_bracket_errors() {
    let source = ".text\nld r1,(r2)\nstop\n.data\nmydata: [42, 100";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(!result.success);
    assert!(result.diagnostics.iter().any(|d| d.message.contains("Unclosed '['")));
}

#[test]
fn test_compile_data_section_unmatched_closing_bracket_errors() {
    let source = ".text\nld r1,(r2)\nstop\n.data\nmydata: 42, 100]";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(!result.success);
    assert!(result.diagnostics.iter().any(|d| d.message.contains("Unmatched ']'")));
}

#[test]
fn test_compile_mv() {
    let source = ".text\nmv r1,r2";
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(result.success);
    assert_eq!(result.program[0], 0x07010200);
}

fn assert_compile_error(source: &str, expected: &str) {
    let result = compiler::compile(source, ProcessorId::PolyRisc);
    assert!(!result.success, "expected a compile error for {:?}", source);
    assert!(result.program.is_empty());
    assert!(
        result.diagnostics.iter().any(|d| d.message.contains(expected)),
        "expected a diagnostic containing {:?}, got {:?}",
        expected,
        result.diagnostics
    );
}

// --- section directives ---

#[test]
fn test_missing_section_directive_errors() {
    assert_compile_error("ldi r1,10\nstop", "Missing section directive");
}

#[test]
fn test_empty_source_errors() {
    assert_compile_error("", "Missing section directive");
}

#[test]
fn test_commented_out_directive_does_not_count() {
    assert_compile_error("// .text\nldi r1,10", "Missing section directive");
}

#[test]
fn test_data_directive_alone_is_enough() {
    let result = compiler::compile(".data\nmydata: 1,2", ProcessorId::PolyRisc);
    assert!(result.success, "diagnostics: {:?}", result.diagnostics);
}

// --- mandatory parentheses on ld / st ---

#[test]
fn test_ld_without_parentheses_errors() {
    assert_compile_error(".text\nld r1,r2", "ld requires parentheses");
}

#[test]
fn test_st_without_parentheses_errors() {
    assert_compile_error(".text\nst r3,r4", "st requires parentheses");
}

#[test]
fn test_ld_parentheses_on_wrong_operand_errors() {
    assert_compile_error(".text\nld (r1),r2", "ld destination cannot be in parentheses");
}

#[test]
fn test_st_parentheses_on_wrong_operand_errors() {
    assert_compile_error(".text\nst r3,(r4)", "st requires parentheses");
}

#[test]
fn test_unbalanced_parentheses_error() {
    assert_compile_error(".text\nld r1,(r2", "parentheses");
    assert_compile_error(".text\nld r1,r2)", "parentheses");
    assert_compile_error(".text\nst ((r3)),r4", "parentheses");
}

#[test]
fn test_parentheses_outside_ld_st_error() {
    assert_compile_error(".text\nadd r1,(r2),r3", "only allowed in ld and st");
    assert_compile_error(".text\nldi (r1),5", "only allowed in ld and st");
}

#[test]
fn test_ld_st_accept_spaces_around_parentheses() {
    let result = compiler::compile(".text\nld r1 , ( r2 )\nst ( r3 ) , r4", ProcessorId::PolyRisc);
    assert!(result.success, "diagnostics: {:?}", result.diagnostics);
    assert_eq!(result.program, vec![0x08010200, 0x09000304]);
}

// --- mandatory commas ---

#[test]
fn test_missing_comma_in_alu_errors() {
    assert_compile_error(".text\nadd r1 r2,r3", "Missing ','");
    assert_compile_error(".text\nadd r1,r2 r3", "Missing ','");
    assert_compile_error(".text\nmv r1 r2", "Missing ','");
}

#[test]
fn test_missing_comma_in_ldi_errors() {
    assert_compile_error(".text\nldi r1 10", "Missing ','");
}

#[test]
fn test_missing_comma_in_ld_st_errors() {
    assert_compile_error(".text\nld r1 (r2)", "Missing ','");
    assert_compile_error(".text\nst (r3) r4", "Missing ','");
}

#[test]
fn test_stray_comma_errors() {
    assert_compile_error(".text\nadd r1,,r3", "missing operand");
    assert_compile_error(".text\nmv r1,r2,", "missing operand");
    assert_compile_error(".text\nmv ,r2", "missing operand");
}
