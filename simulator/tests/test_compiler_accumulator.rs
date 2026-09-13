use codemachine_simulator::compiler;
use codemachine_simulator::types::ProcessorId;

#[test]
fn test_compile_simple_program() {
    let source = "ld 5\nadd 6\nst 7\nstop";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success);
    assert_eq!(result.diagnostics.len(), 0);
    assert_eq!(result.program[0], 0x0405); // ld 5
    assert_eq!(result.program[1], 0x0006); // add 6
    assert_eq!(result.program[2], 0x0307); // st 7
    assert_eq!(result.program[3], 0x0500); // stop
}

#[test]
fn test_compile_with_labels() {
    let source = "ld x\nadd y\nst z\nstop\nx: 10\ny: 20\nz: 0";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success);
    assert_eq!(result.program[0], (4 << 8) | 4);
    assert_eq!(result.program[1], (0 << 8) | 5);
    assert_eq!(result.program[2], (3 << 8) | 6);
    assert_eq!(result.program[3], (5 << 8) | 0);
    assert_eq!(result.program[4], 10);
    assert_eq!(result.program[5], 20);
    assert_eq!(result.program[6], 0);
}

#[test]
fn test_compile_instruction_lines_maps_program_words_to_source_lines() {
    let source = "ld x\nadd y\nst z\nstop\nx: 10\ny: 20\nz: 0";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success);
    // program[0..=3] are the four instructions, one per source line 0..=3
    assert_eq!(result.instruction_lines[0], 0); // ld x
    assert_eq!(result.instruction_lines[1], 1); // add y
    assert_eq!(result.instruction_lines[2], 2); // st z
    assert_eq!(result.instruction_lines[3], 3); // stop
    // program[4..=6] are the data words for x/y/z on lines 4..=6
    assert_eq!(result.instruction_lines[4], 4); // x: 10
    assert_eq!(result.instruction_lines[5], 5); // y: 20
    assert_eq!(result.instruction_lines[6], 6); // z: 0
    assert_eq!(result.instruction_lines.len(), result.program.len());
}

#[test]
fn test_compile_instruction_lines_multiline_data_shares_label_line() {
    let source = ".data\ntable: 1\n2\n3\n.text\nld table\nstop";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success);
    // The 3 data words all originate from source line 1 ("table: 1"),
    // since 2 and 3 are bare continuation lines with no label of their own.
    assert_eq!(result.instruction_lines[0], 1);
    assert_eq!(result.instruction_lines[1], 2);
    assert_eq!(result.instruction_lines[2], 3);
    assert_eq!(result.instruction_lines.len(), result.program.len());
}

#[test]
fn test_compile_branch_instructions() {
    let source = "ld 5\nbrz loop\nstop\nloop: nop\nbr loop";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success);
    assert_eq!(result.program[0], (4 << 8) | 5);
    assert_eq!(result.program[1], (8 << 8) | 3);
    assert_eq!(result.program[2], (5 << 8) | 0);
    assert_eq!(result.program[3], (6 << 8) | 0);
    assert_eq!(result.program[4], (7 << 8) | 3);
}

#[test]
fn test_compile_label_with_multiple_values() {
    let source = "ld data\nstop\ndata: 42, 100, 255";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success);
    assert_eq!(result.program[2], 42);
    assert_eq!(result.program[3], 100);
    assert_eq!(result.program[4], 255);
}

#[test]
fn test_compile_label_offset() {
    let source = "ld data + 1\nstop\ndata: 42, 100";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success);
    assert_eq!(result.program[0], (4 << 8) | 3);
}

#[test]
fn test_compile_error_unknown_instruction() {
    let source = "foo 5\nstop";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(!result.success);
    assert!(!result.diagnostics.is_empty());
    assert_eq!(result.diagnostics[0].line, 0);
}

#[test]
fn test_compile_data_section_multiline_literals() {
    // Inside an explicit .data section, unlabeled continuation lines must still be
    // stored contiguously in memory, not skipped.
    let source = ".text\nld table\nstop\n.data\ntable: 1\n4\n9\n16\n25\n36\n49\n64\n81";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success, "diagnostics: {:?}", result.diagnostics);
    // program[0..2] are the two instructions; data starts at program[2]
    assert_eq!(&result.program[2..11], &[1, 4, 9, 16, 25, 36, 49, 64, 81]);
}

#[test]
fn test_compile_data_section_mixed_labeled_and_bare_lines() {
    // A labeled multi-value line followed by bare continuation lines, followed by
    // another label, should all resolve to contiguous, correctly addressed memory.
    let source = ".text\nld a\nld b\nstop\n.data\na: 1, 2\n3\n4\nb: 99";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success, "diagnostics: {:?}", result.diagnostics);
    // instructions at 0,1,2; data starts at 3: a=1,2,3,4 (addresses 3-6), b=99 (address 7)
    assert_eq!(result.program[0], (4 << 8) | 3); // ld a -> address 3
    assert_eq!(result.program[1], (4 << 8) | 7); // ld b -> address 7
    assert_eq!(&result.program[3..7], &[1, 2, 3, 4]);
    assert_eq!(result.program[7], 99);
}

#[test]
fn test_compile_data_section_bracket_array_single_line() {
    let source = ".text\nld table\nstop\n.data\ntable: [1, 2, 3, 4]";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success, "diagnostics: {:?}", result.diagnostics);
    assert_eq!(&result.program[2..6], &[1, 2, 3, 4]);
}

#[test]
fn test_compile_data_section_bracket_array_multi_line() {
    let source = ".text\nld table\nstop\n.data\ntable: [\n1,\n2,\n3,\n4\n]";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success, "diagnostics: {:?}", result.diagnostics);
    assert_eq!(&result.program[2..6], &[1, 2, 3, 4]);
}

#[test]
fn test_compile_data_section_unclosed_bracket_errors() {
    let source = ".text\nld table\nstop\n.data\ntable: [1, 2, 3";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(!result.success);
    assert!(result.diagnostics.iter().any(|d| d.message.contains("Unclosed '['")));
}

#[test]
fn test_compile_data_section_unmatched_closing_bracket_errors() {
    let source = ".text\nld table\nstop\n.data\ntable: 1, 2]";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(!result.success);
    assert!(result.diagnostics.iter().any(|d| d.message.contains("Unmatched ']'")));
}

#[test]
fn test_compile_data_section_nested_bracket_errors() {
    let source = ".text\nld table\nstop\n.data\ntable: [[1, 2]]";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(!result.success);
    assert!(result.diagnostics.iter().any(|d| d.message.contains("nested")));
}

#[test]
fn test_compile_directives_stripped() {
    let source = ".text\nld 5\nstop";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success);
    assert_eq!(result.program[0], (4 << 8) | 5);
    assert_eq!(result.program[1], (5 << 8) | 0);
}
