/**
 * Full Validation Pipeline Test
 * 
 * Tests the complete validation flow including XSD validation.
 * Run with: npx tsx scripts/test-validation-pipeline.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Import the validation components directly
import { getXsdValidator } from '../src/lib/validators/xsd';
import { validateXmlWellformedness, parseXmlString } from '../src/lib/parsers/xml-parser';
import { parseStatusMessage, formatStatusMessageSummary } from '../src/lib/parsers/status-message-parser';

const SAMPLES_DIR = path.join(process.cwd(), 'samples');

async function testValidationPipeline() {
  console.log('='.repeat(70));
  console.log('FULL VALIDATION PIPELINE TEST');
  console.log('='.repeat(70));
  
  // Test 1: Minimal valid CbCR file
  console.log('\n' + '-'.repeat(70));
  console.log('TEST 1: Minimal Valid CbCR File');
  console.log('-'.repeat(70));
  
  const validFilePath = path.join(SAMPLES_DIR, 'minimal-valid-cbcr.xml');
  if (fs.existsSync(validFilePath)) {
    const validXml = fs.readFileSync(validFilePath, 'utf-8');
    
    // Step 1: XML Well-formedness
    console.log('\n1. XML Well-formedness check...');
    const wellformedResults = validateXmlWellformedness(validXml);
    const criticalWellformed = wellformedResults.filter(r => r.severity === 'critical');
    console.log(`   Results: ${wellformedResults.length} findings, ${criticalWellformed.length} critical`);
    
    if (criticalWellformed.length === 0) {
      // Step 2: XSD Validation
      console.log('\n2. XSD Schema validation...');
      const xsdValidator = getXsdValidator();
      const xsdResult = await xsdValidator.validate(validXml, 'strict');
      console.log(`   Valid: ${xsdResult.valid}`);
      console.log(`   Processing time: ${xsdResult.processingTimeMs}ms`);
      if (!xsdResult.valid) {
        console.log(`   Errors (first 5):`);
        for (const err of xsdResult.errors.slice(0, 5)) {
          console.log(`     Line ${err.line}: ${err.message?.substring(0, 70)}...`);
        }
      }
      
      // Step 3: Parse to structured format
      console.log('\n3. XML Parsing...');
      const parseResult = parseXmlString(validXml);
      console.log(`   Parse success: ${parseResult.success}`);
      if (parseResult.success) {
        const report = parseResult.data;
        console.log(`   MessageRefId: ${report.message.messageSpec.messageRefId}`);
        console.log(`   Reporting Period: ${report.message.messageSpec.reportingPeriod}`);
      }
    }
  } else {
    console.log(`   File not found: ${validFilePath}`);
  }
  
  // Test 2: Invalid CbCR file (schema errors)
  console.log('\n' + '-'.repeat(70));
  console.log('TEST 2: Invalid CbCR File (Schema Errors)');
  console.log('-'.repeat(70));
  
  const invalidFilePath = path.join(SAMPLES_DIR, 'invalid-schema-errors.xml');
  if (fs.existsSync(invalidFilePath)) {
    const invalidXml = fs.readFileSync(invalidFilePath, 'utf-8');
    
    console.log('\n1. XML Well-formedness check...');
    const wellformedResults = validateXmlWellformedness(invalidXml);
    console.log(`   Results: ${wellformedResults.length} findings`);
    
    console.log('\n2. XSD Schema validation...');
    const xsdValidator = getXsdValidator();
    const xsdResult = await xsdValidator.validate(invalidXml, 'strict');
    console.log(`   Valid: ${xsdResult.valid}`);
    console.log(`   Error count: ${xsdResult.errors.length}`);
    
    if (!xsdResult.valid) {
      console.log(`   ✅ Correctly detected schema violations`);
      console.log(`   Sample errors:`);
      for (const err of xsdResult.errors.slice(0, 3)) {
        console.log(`     - Line ${err.line}: [${err.oecdErrorCode}] ${err.message?.substring(0, 60)}...`);
      }
    }
  } else {
    console.log(`   File not found: ${invalidFilePath}`);
  }
  
  // Test 3: Status Message Parsing
  console.log('\n' + '-'.repeat(70));
  console.log('TEST 3: Status Message Parsing');
  console.log('-'.repeat(70));
  
  const statusFilePath = path.join(SAMPLES_DIR, 'status-message-rejected.xml');
  if (fs.existsSync(statusFilePath)) {
    const statusXml = fs.readFileSync(statusFilePath, 'utf-8');
    
    console.log('\n1. Parsing status message...');
    const statusResult = parseStatusMessage(statusXml);
    console.log(`   Parse success: ${statusResult.success}`);
    
    if (statusResult.success && statusResult.statusMessage) {
      const msg = statusResult.statusMessage;
      console.log(`   Original MessageRefId: ${msg.originalMessage.originalMessageRefId}`);
      console.log(`   Status: ${msg.validationResult.status}`);
      console.log(`   File errors: ${msg.validationErrors.fileErrors.length}`);
      console.log(`   Record errors: ${msg.validationErrors.recordErrors.length}`);
      
      console.log('\n2. Formatted summary:');
      const summary = formatStatusMessageSummary(msg);
      for (const line of summary.split('\n').slice(0, 10)) {
        console.log(`   ${line}`);
      }
    }
  } else {
    console.log(`   File not found: ${statusFilePath}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('PIPELINE TEST COMPLETE');
  console.log('='.repeat(70));
  console.log('\n✅ All tests executed. Check results above for any issues.\n');
}

testValidationPipeline().catch(console.error);
