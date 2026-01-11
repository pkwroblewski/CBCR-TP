# Pending: XSD Validation Testing with Real CbCR Files

**Status:** ⏳ AWAITING USER-PROVIDED TEST FILES  
**Created:** 2026-01-11  
**Priority:** HIGH - Critical for production readiness

---

## Background

The XSD Schema Validation integration has been implemented but requires testing with real-world CbCR XML files to confirm production readiness. The sample files created during development have minor schema ordering issues that prevent full validation pass.

## What Was Implemented

| Component | File | Status |
|-----------|------|--------|
| XSD Validator Service | `src/lib/validators/xsd/xsd-validator.ts` | ✅ Code complete |
| API Integration | `src/app/api/validate/route.ts` | ✅ Integrated |
| OECD Error Code Mapping | `xsd-validator.ts` lines 69-85 | ✅ Implemented |
| Status Message Parser | `src/lib/parsers/status-message-parser.ts` | ✅ Code complete |
| String Length Validation | `src/lib/validators/quality/completeness-validator.ts` | ✅ Implemented |
| MonAmnt/currCode Validation | `src/lib/validators/oecd/summary-validator.ts` | ✅ Implemented |

## What Needs Testing

### Test 1: Valid CbCR File (Positive Test)

**Purpose:** Confirm that a known-good CbCR file passes XSD validation without errors.

**Requirements:**
- A CbCR XML file that has been previously accepted by a tax authority (ACD, etc.)
- OR an official OECD sample file from their documentation

**Expected Result:**
```
XSD Validation: Valid = true
Errors: 0
```

**How to Test:**
```bash
# Place file in samples/ directory, then run:
npx tsx scripts/test-validation-pipeline.ts
```

**If Test Fails:**
- Check which elements are flagged as "not expected"
- Verify namespace prefixes match XSD requirements
- Consider if XSD files need updating to a newer version

---

### Test 2: Known-Invalid CbCR File (Negative Test)

**Purpose:** Confirm that the validator correctly identifies and reports errors from a file that was previously rejected.

**Requirements:**
- A CbCR XML file that was rejected by a tax authority
- The rejection reason/error codes from the authority

**Expected Result:**
- XSD validator detects the same (or similar) errors as the tax authority
- Error codes map correctly to OECD 50xxx/80xxx series

**Verification:**
- Compare detected errors with official rejection notice
- Confirm line numbers are accurate
- Verify error messages are actionable

---

### Test 3: Status Message Processing

**Purpose:** Confirm that status messages received from tax authorities can be parsed and displayed.

**Requirements:**
- An actual CbC Status Message XML received from a tax authority
- OR the official OECD status message sample

**Expected Result:**
- Parser extracts all file-level and record-level errors
- Original MessageRefId is correctly identified
- Acceptance/Rejection status is correctly parsed

---

### Test 4: End-to-End Web Application Test

**Purpose:** Confirm the full user flow works correctly.

**Steps:**
1. Start the development server: `npm run dev`
2. Navigate to http://localhost:3000/validate
3. Upload a test CbCR XML file
4. Verify:
   - XSD validation runs (check server console for "XSD Validation:" log)
   - Errors display correctly in the UI
   - Line numbers are shown for XSD errors
   - OECD error codes are displayed

---

## Known Limitations

1. **Native Module:** `libxmljs2` is a native Node.js module. It works on the current Windows development machine but may need recompilation on different OS/architecture.

2. **Browser Incompatibility:** XSD validation runs server-side only. Client-side validation uses basic XML well-formedness checks.

3. **XSD Version:** Currently using OECD CbC XML Schema v2.0. If tax authorities require a different version, the XSD files in `src/lib/xsd/` need updating.

4. **Performance:** XSD validation adds ~70-100ms overhead per file. This is acceptable for typical CbCR file sizes.

---

## Files for Testing

| Location | Purpose |
|----------|---------|
| `samples/minimal-valid-cbcr.xml` | Development sample (has minor schema issues) |
| `samples/invalid-schema-errors.xml` | Development sample for error detection |
| `samples/status-message-rejected.xml` | Development sample for status parsing |
| `scripts/test-xsd-validation.ts` | Unit test for XSD validator |
| `scripts/test-validation-pipeline.ts` | Integration test for full pipeline |

---

## Success Criteria Checklist

Before marking XSD validation as production-ready:

- [ ] Valid CbCR file passes with 0 XSD errors
- [ ] Invalid file errors match tax authority rejection reasons
- [ ] Error line numbers are accurate (±1 line tolerance)
- [ ] OECD error codes (50xxx, 80xxx) are correctly mapped
- [ ] Status message parsing extracts all error details
- [ ] Web UI displays XSD errors clearly
- [ ] No false positives on valid files
- [ ] Performance is acceptable (<500ms for typical files)

---

## Contact/Notes

When providing test files:
1. Anonymize any sensitive data (company names, TINs) if needed
2. Provide context: "This file was accepted/rejected by [authority] on [date]"
3. If rejected, include the error message received from the authority

---

**Next Action:** User to provide real CbCR XML file(s) for validation testing.
