# Testing Guide

This document describes how to run tests and add new tests to the CbCR Review application.

## Quick Start

```bash
# Run all tests once
npm run test:run

# Run tests in watch mode (for development)
npm run test

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Test Structure

```
tests/
├── fixtures/                    # Test XML files
│   ├── valid-cbcr-report.xml   # Complete, valid CbCR report
│   ├── invalid-message-spec.xml # MessageSpec validation errors
│   ├── invalid-doc-spec.xml    # DocSpec validation errors
│   ├── invalid-tin.xml         # TIN validation errors
│   └── data-quality-issues.xml # Data quality warnings
├── validators/                  # Validator unit tests
│   ├── message-spec.test.ts    # MessageSpec validator tests
│   ├── doc-spec.test.ts        # DocSpec validator tests
│   ├── tin.test.ts             # TIN validator tests
│   └── data-quality.test.ts    # Data quality validator tests
└── setup.ts                     # Global test setup
```

## Test Fixtures

### valid-cbcr-report.xml

A complete, valid CbCR report with:
- Luxembourg as reporting jurisdiction
- 5 jurisdictions (LU, DE, FR, NL, US)
- Multiple entities per jurisdiction
- All required fields populated
- Consistent EUR currency
- Valid TIN formats

**Use case:** Baseline for testing that validators pass on valid data.

### invalid-message-spec.xml

Contains MessageSpec validation errors:
- `MSG-001`: MessageRefId doesn't start with country code
- `MSG-004`: MessageRefId exceeds 100 characters
- `MSG-006`: Invalid MessageTypeIndic (CBC403)
- Missing ReportingPeriod element

**Use case:** Testing MessageSpec validation rules.

### invalid-doc-spec.xml

Contains DocSpec validation errors:
- `DOC-001`: Duplicate DocRefId
- `DOC-002`: OECD1 used with CBC402 message
- `DOC-003`: CorrDocRefId with OECD1
- `DOC-004`: Mixing OECD2 and OECD3 in same message

**Use case:** Testing DocSpec validation rules.

### invalid-tin.xml

Contains TIN validation errors:
- `TIN-001`: Missing issuedBy attribute
- `TIN-002`: issuedBy mismatch with ResCountryCode
- `TIN-003`: Repeated single character TIN
- `TIN-004`: NOTIN without explanation
- `LU-TIN-001`: Invalid Luxembourg TIN format

**Use case:** Testing TIN validation rules (OECD + Luxembourg).

### data-quality-issues.xml

Contains data quality warnings:
- `XFV-001`: Unusual TaxPaid to TaxAccrued ratio
- `XFV-002`: Zero revenue with employees present
- Mixed currencies (EUR and USD)
- Negative profit with positive tax
- Zero capital with significant assets
- Dividends not excluded from revenues

**Use case:** Testing cross-field validation and consistency checks.

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseXmlString } from '@/lib/parsers/xml-parser';
import { transformXmlToCbcReport } from '@/lib/parsers/xml-transformer';
import { YourValidator } from '@/lib/validators/your-validator';
import { ValidationContext } from '@/lib/validators/core/validation-context';

const FIXTURES_DIR = join(__dirname, '../fixtures');

let testReport: ParsedCbcReport;

beforeAll(async () => {
  const xml = readFileSync(join(FIXTURES_DIR, 'your-fixture.xml'), 'utf-8');
  const parsed = parseXmlString(xml);
  if (parsed.success && parsed.data) {
    testReport = transformXmlToCbcReport(parsed.data);
  }
});

describe('YourValidator', () => {
  it('should detect specific error', () => {
    const validator = new YourValidator();
    const context = new ValidationContext(testReport);
    const results = validator.validate(testReport, context);

    const error = results.find(r => r.ruleId === 'YOUR-001');
    expect(error).toBeDefined();
    expect(error?.severity).toBe('error');
  });
});
```

### Helper Functions

```typescript
// Find a single result by rule ID
function findResultByRuleId(results: ValidationResult[], ruleId: string) {
  return results.find((r) => r.ruleId === ruleId);
}

// Find all results by rule ID
function findAllResultsByRuleId(results: ValidationResult[], ruleId: string) {
  return results.filter((r) => r.ruleId === ruleId);
}

// Check if a rule was triggered
function hasRuleId(results: ValidationResult[], ruleId: string) {
  return results.some((r) => r.ruleId === ruleId);
}
```

### Testing Edge Cases

```typescript
it('should handle edge case', () => {
  // Create a modified report for edge case testing
  const testReport: ParsedCbcReport = {
    ...validReport,
    message: {
      ...validReport.message,
      messageSpec: {
        ...validReport.message.messageSpec,
        messageRefId: 'LU' + '0'.repeat(98), // Exactly 100 chars
      },
    },
  };

  const results = runValidator(testReport);
  expect(hasRuleId(results, 'MSG-004')).toBe(false);
});
```

## Adding New Tests

### 1. Create a New Fixture (if needed)

Add a new XML file to `tests/fixtures/`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- Description of what this fixture tests -->
<CBC_OECD xmlns="urn:oecd:ties:cbc:v2" version="2.0">
  <!-- Your test data -->
</CBC_OECD>
```

### 2. Create a Test File

Add a new test file to `tests/validators/`:

```typescript
// tests/validators/your-feature.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
// ... imports

describe('YourFeature', () => {
  // Your tests
});
```

### 3. Run Tests

```bash
# Run specific test file
npm run test -- tests/validators/your-feature.test.ts

# Run tests matching a pattern
npm run test -- -t "YourFeature"
```

## Coverage

Run coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI integration
- Terminal output shows summary

### Coverage Targets

| Category | Target |
|----------|--------|
| Validators | > 80% |
| Parsers | > 90% |
| Overall | > 70% |

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch

The CI pipeline:
1. Installs dependencies
2. Runs linting
3. Runs tests with coverage
4. Fails if coverage drops below threshold

## Debugging Tests

### Run a Single Test

```bash
npm run test -- -t "should detect duplicate DocRefIds"
```

### Verbose Output

```bash
npm run test -- --reporter=verbose
```

### Debug Mode

Add `debugger;` statements and run:

```bash
node --inspect-brk node_modules/.bin/vitest run
```

Then connect Chrome DevTools to debug.

## Best Practices

1. **One assertion per test when possible** - Makes failures easier to diagnose
2. **Descriptive test names** - Use "should [behavior] when [condition]" format
3. **Test both positive and negative cases** - Verify valid data passes and invalid data fails
4. **Use fixtures for complex XML** - Don't construct XML strings in tests
5. **Isolate tests** - Each test should be independent
6. **Mock external dependencies** - Database, network, etc.
7. **Keep tests fast** - Unit tests should run in milliseconds

## Common Issues

### "Cannot find module '@/...'"

Ensure `vitest.config.ts` has the correct path alias:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

### "XML parsing failed"

Check that the fixture XML is well-formed. Common issues:
- Missing closing tags
- Unescaped special characters
- Wrong encoding

### "Test timeout"

Increase timeout in specific test:

```typescript
it('slow test', async () => {
  // ...
}, { timeout: 30000 });
```

Or globally in `vitest.config.ts`:

```typescript
test: {
  testTimeout: 30000,
}
```

