/**
 * Test script to run validation on an Excel file
 * Run with: npx ts-node --esm test-validation.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { parseFile } from './src/lib/parsers/file-parser.js';
import { createFullyConfiguredEngine } from './src/lib/validators/index.js';
import { extractReportMetadata } from './src/lib/parsers/xml-transformer.js';
import { ValidationSeverity } from './src/types/validation.js';

async function main() {
  const filePath = process.argv[2] || 'C:\\Users\\bitpk\\Downloads\\cbcr-validation-2024 - CBCR - Draft v i - v3 (21.10.25)_initial clean (1).xlsx';

  console.log('='.repeat(80));
  console.log('CbCR Validation Test');
  console.log('='.repeat(80));
  console.log(`File: ${filePath}`);
  console.log('');

  // Read file
  const buffer = readFileSync(filePath);
  const filename = filePath.split(/[/\\]/).pop() || 'test.xlsx';

  console.log(`File size: ${buffer.length} bytes`);
  console.log('');

  // Parse file
  console.log('Parsing file...');
  const parseResult = await parseFile(buffer.buffer, filename, buffer.length);

  if (!parseResult.success) {
    console.error('Parse failed:', parseResult.errors);
    return;
  }

  console.log('Parse successful!');
  if (parseResult.warnings && parseResult.warnings.length > 0) {
    console.log('\nParsing Warnings:');
    parseResult.warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  }
  console.log('');

  // Extract metadata
  const metadata = extractReportMetadata(parseResult.report!);
  console.log('Report Metadata:');
  console.log(`  Fiscal Year: ${metadata.reportingPeriod}`);
  console.log(`  UPE: ${metadata.upeName}`);
  console.log(`  UPE Jurisdiction: ${metadata.upeJurisdiction}`);
  console.log(`  Jurisdictions: ${metadata.jurisdictionCount}`);
  console.log(`  Entities: ${metadata.entityCount}`);
  console.log('');

  // Run validation
  console.log('Running validation engine...');
  const engine = createFullyConfiguredEngine('LU', true);
  const engineReport = await engine.validate(parseResult.report!, {
    country: 'LU',
    checkPillar2: true,
    strictMode: false,
  });

  const results = engineReport.results || [];

  // Calculate summary
  const summary = {
    critical: results.filter((r) => r.severity === ValidationSeverity.CRITICAL).length,
    errors: results.filter((r) => r.severity === ValidationSeverity.ERROR).length,
    warnings: results.filter((r) => r.severity === ValidationSeverity.WARNING).length,
    info: results.filter((r) => r.severity === ValidationSeverity.INFO).length,
  };

  console.log('');
  console.log('='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`  CRITICAL: ${summary.critical}`);
  console.log(`  ERROR:    ${summary.errors}`);
  console.log(`  WARNING:  ${summary.warnings}`);
  console.log(`  INFO:     ${summary.info}`);
  console.log(`  TOTAL:    ${results.length}`);
  console.log('');

  // Group results by ruleId
  interface GroupedResult {
    ruleId: string;
    severity: ValidationSeverity;
    count: number;
    message: string;
    suggestion?: string;
    sampleXpaths: string[];
  }

  const groups = new Map<string, GroupedResult>();
  for (const result of results) {
    const key = result.ruleId;
    if (!groups.has(key)) {
      groups.set(key, {
        ruleId: result.ruleId,
        severity: result.severity,
        count: 0,
        message: result.message,
        suggestion: result.suggestion,
        sampleXpaths: [],
      });
    }
    const group = groups.get(key)!;
    group.count++;
    if (result.xpath && group.sampleXpaths.length < 3) {
      group.sampleXpaths.push(result.xpath);
    }
  }

  // Sort by severity, then by count
  const severityOrder: Record<ValidationSeverity, number> = {
    [ValidationSeverity.CRITICAL]: 0,
    [ValidationSeverity.ERROR]: 1,
    [ValidationSeverity.WARNING]: 2,
    [ValidationSeverity.INFO]: 3,
  };

  const groupedResults = Array.from(groups.values()).sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.count - a.count;
  });

  console.log('='.repeat(80));
  console.log(`GROUPED ISSUES (${groupedResults.length} unique rules)`);
  console.log('='.repeat(80));

  const severityLabels: Record<ValidationSeverity, string> = {
    [ValidationSeverity.CRITICAL]: 'CRITICAL',
    [ValidationSeverity.ERROR]: 'ERROR',
    [ValidationSeverity.WARNING]: 'WARNING',
    [ValidationSeverity.INFO]: 'INFO',
  };

  let currentSeverity: ValidationSeverity | null = null;
  for (const group of groupedResults) {
    // Print severity header when it changes
    if (group.severity !== currentSeverity) {
      currentSeverity = group.severity;
      const count = results.filter((r) => r.severity === currentSeverity).length;
      const uniqueCount = groupedResults.filter((g) => g.severity === currentSeverity).length;
      console.log('');
      console.log('-'.repeat(80));
      console.log(`[${severityLabels[currentSeverity]}] - ${count} issue(s) across ${uniqueCount} rule(s)`);
      console.log('-'.repeat(80));
    }

    console.log('');
    console.log(`  ${group.ruleId} (${group.count} occurrence${group.count > 1 ? 's' : ''})`);
    console.log(`  Issue: ${group.message}`);
    if (group.suggestion) {
      console.log(`  Suggestion: ${group.suggestion}`);
    }
    if (group.sampleXpaths.length > 0) {
      console.log(`  Sample locations:`);
      group.sampleXpaths.forEach((xpath) => console.log(`    - ${xpath}`));
      if (group.count > group.sampleXpaths.length) {
        console.log(`    ... and ${group.count - group.sampleXpaths.length} more`);
      }
    }
  }

  // Write full results to file (with grouped summary)
  const outputFile = filePath.replace('.xlsx', '-validation-results.json');
  writeFileSync(outputFile, JSON.stringify({
    metadata,
    summary,
    groupedResults: groupedResults.map((g) => ({
      ruleId: g.ruleId,
      severity: g.severity,
      count: g.count,
      message: g.message,
      suggestion: g.suggestion,
      sampleXpaths: g.sampleXpaths,
    })),
    results: results.map((r) => ({
      ruleId: r.ruleId,
      severity: r.severity,
      category: r.category,
      message: r.message,
      suggestion: r.suggestion,
      xpath: r.xpath,
    })),
  }, null, 2));
  console.log('');
  console.log(`Full results written to: ${outputFile}`);
}

main().catch(console.error);
