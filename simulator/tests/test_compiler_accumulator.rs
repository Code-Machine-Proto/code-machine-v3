use codemachine_simulator::compiler;
use codemachine_simulator::types::ProcessorId;

#[test]
fn test_compile_simple_program() {
    let source = ".text\nld 5\nadd 6\nst 7\nstop";
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
    let source = ".text\nld x\nadd y\nst z\nstop\n.data\nx: 10\ny: 20\nz: 0";
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
    let source = ".text\nld x\nadd y\nst z\nstop\n.data\nx: 10\ny: 20\nz: 0";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success);
    // program[0..=3] are the four instructions, one per source line 1..=4 (line 0 is ".text")
    assert_eq!(result.instruction_lines[0], 1); // ld x
    assert_eq!(result.instruction_lines[1], 2); // add y
    assert_eq!(result.instruction_lines[2], 3); // st z
    assert_eq!(result.instruction_lines[3], 4); // stop
    // program[4..=6] are the data words for x/y/z on lines 6..=8 (line 5 is ".data")
    assert_eq!(result.instruction_lines[4], 6); // x: 10
    assert_eq!(result.instruction_lines[5], 7); // y: 20
    assert_eq!(result.instruction_lines[6], 8); // z: 0
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
    let source = ".text\nld 5\nbrz loop\nstop\nloop: nop\nbr loop";
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
    let source = ".text\nld data\nstop\n.data\ndata: 42, 100, 255";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success);
    assert_eq!(result.program[2], 42);
    assert_eq!(result.program[3], 100);
    assert_eq!(result.program[4], 255);
}

#[test]
fn test_compile_label_offset() {
    let source = ".text\nld data + 1\nstop\n.data\ndata: 42, 100";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(result.success);
    assert_eq!(result.program[0], (4 << 8) | 3);
}

#[test]
fn test_compile_error_unknown_instruction() {
    let source = ".text\nfoo 5\nstop";
    let result = compiler::compile(source, ProcessorId::Accumulator);
    assert!(!result.success);
    assert!(!result.diagnostics.is_empty());
    assert_eq!(result.diagnostics[0].line, 1);
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

// --- section directives ---

const ACCUMULATOR_PROCESSORS: [ProcessorId; 2] = [ProcessorId::Accumulator, ProcessorId::AccumulatorMa];

fn compile_errors(source: &str, processor: ProcessorId) -> Vec<String> {
    let result = compiler::compile(source, processor);
    assert!(!result.success, "expected a compile error for {:?}", source);
    assert!(result.program.is_empty());
    result.diagnostics.into_iter().map(|d| d.message).collect()
}

#[test]
fn test_missing_text_section_errors() {
    for processor in ACCUMULATOR_PROCESSORS {
        for source in ["ld 5\nstop", "", "// .text\nld 5\nstop", ".data\nx: 1, 2"] {
            let errors = compile_errors(source, processor);
            assert_eq!(errors.len(), 1, "errors: {:?}", errors);
            assert!(errors[0].contains("Missing .text section"), "errors: {:?}", errors);
        }
    }
}

#[test]
fn test_missing_text_section_is_reported_before_other_errors() {
    for processor in ACCUMULATOR_PROCESSORS {
        let errors = compile_errors("foo 5\nstop", processor);
        assert_eq!(errors.len(), 1, "errors: {:?}", errors);
        assert!(errors[0].contains("Missing .text section"), "errors: {:?}", errors);
    }
}

#[test]
fn test_data_section_is_optional() {
    for processor in ACCUMULATOR_PROCESSORS {
        let result = compiler::compile(".text\nld 5\nstop", processor);
        assert!(result.success, "diagnostics: {:?}", result.diagnostics);
    }
}

#[test]
fn test_data_outside_data_section_errors() {
    for processor in ACCUMULATOR_PROCESSORS {
        for (source, line) in [
            (".text\nld x\nstop\nx: 42", 3),
            (".text\nld x\nstop\nx: [1, 2, 3]", 3),
            (".text\nld x\nstop\n42", 3),
        ] {
            let result = compiler::compile(source, processor);
            assert!(!result.success, "expected a compile error for {:?}", source);
            assert!(result.program.is_empty());
            let diag = result
                .diagnostics
                .iter()
                .find(|d| d.message.contains("must be declared in a .data section"))
                .unwrap_or_else(|| panic!("diagnostics: {:?}", result.diagnostics));
            assert_eq!(diag.line, line);
        }
    }
}

#[test]
fn test_data_after_data_directive_is_accepted() {
    for processor in ACCUMULATOR_PROCESSORS {
        let result = compiler::compile(".text\nld x\nstop\n.data\nx: 42", processor);
        assert!(result.success, "diagnostics: {:?}", result.diagnostics);
    }
}
