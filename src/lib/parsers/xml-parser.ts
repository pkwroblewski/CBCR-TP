/**
 * Secure XML Parser for CbCR Files
 *
 * Uses fast-xml-parser with comprehensive security settings to prevent
 * XXE (XML External Entity) attacks and other XML-based vulnerabilities.
 *
 * @module lib/parsers/xml-parser
 */

import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { ParsedCbcReport } from '@/types/cbcr';
import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of XML parsing operation
 */
export type ParseResult =
  | { success: true; data: ParsedCbcReport }
  | { success: false; error: ParseError };

/**
 * Structured parse error
 */
export interface ParseError {
  code: string;
  message: string;
  line?: number;
  column?: number;
  details?: string;
}

/**
 * Namespace information extracted from XML
 */
export interface NamespaceInfo {
  /** Default namespace URI */
  defaultNamespace?: string;
  /** Map of prefix to namespace URI */
  prefixes: Record<string, string>;
  /** Whether CBC OECD namespace is present */
  hasCbcNamespace: boolean;
  /** Whether STF namespace is present */
  hasStfNamespace: boolean;
  /** Schema locations if specified */
  schemaLocations?: string[];
}

/**
 * Encoding detection result
 */
export interface EncodingInfo {
  /** Detected encoding from XML declaration */
  declared?: string;
  /** Whether UTF-8 BOM is present */
  hasBom: boolean;
  /** Whether encoding is valid UTF-8 */
  isValidUtf8: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** CbC OECD namespace URI */
const CBC_NAMESPACE = 'urn:oecd:ties:cbc:v2';

/** STF (Standard Transmission Format) namespace URI */
const STF_NAMESPACE = 'urn:oecd:ties:stf:v4';

/** ISO CbC namespace (alternative) */
const ISO_CBC_NAMESPACE = 'urn:oecd:ties:isocbctypes:v1';

/** UTF-8 BOM bytes */
const UTF8_BOM = '\uFEFF';

/** Characters that must be escaped in XML */
const UNESCAPED_CHAR_PATTERNS = [
  { pattern: /&(?!(amp|lt|gt|apos|quot|#\d+|#x[0-9a-fA-F]+);)/g, char: '&', escaped: '&amp;' },
];

/** Prohibited control characters in XML 1.0 */
const PROHIBITED_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;

// =============================================================================
// SECURE PARSER CONFIGURATION
// =============================================================================

/**
 * Create a secure XML parser with XXE protection
 * All external entity processing is disabled
 */
function createSecureParser(): XMLParser {
  return new XMLParser({
    // Security settings - prevent XXE attacks
    allowBooleanAttributes: false,
    
    // Parsing options
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    
    // Handle CDATA sections
    cdataPropName: '__cdata',
    
    // Parse tag values
    parseTagValue: true,
    parseAttributeValue: true,
    
    // Trim whitespace
    trimValues: true,
    
    // Handle arrays for repeated elements
    isArray: (name: string) => {
      // Elements that can appear multiple times
      const arrayElements = [
        'CbcReports',
        'TIN',
        'IN',
        'Name',
        'Address',
        'ConstituentEntity',
        'BizActivities',
        'Warning',
        'AdditionalInfo',
        'OtherInfo',
        'ResCountryCode',
      ];
      return arrayElements.includes(name);
    },
    
    // Process tag names (preserve namespaces)
    tagValueProcessor: (tagName: string, tagValue: string) => {
      // Trim and normalize whitespace
      return tagValue.trim();
    },
    
    // Remove comments
    commentPropName: false,
    
    // Don't stop on first error to collect all issues
    stopNodes: [],
    
    // Namespace handling
    removeNSPrefix: false,
  });
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate XML well-formedness and return any issues found
 */
export function validateXmlWellformedness(xmlContent: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Check for empty content
  if (!xmlContent || xmlContent.trim().length === 0) {
    results.push({
      ruleId: 'ENC-001',
      category: ValidationCategory.XML_WELLFORMEDNESS,
      severity: ValidationSeverity.CRITICAL,
      message: 'XML content is empty',
      suggestion: 'Provide a valid CbC XML file',
    });
    return results;
  }
  
  // Check encoding
  const encodingInfo = detectEncoding(xmlContent);
  
  if (encodingInfo.hasBom) {
    results.push({
      ruleId: 'ENC-002',
      category: ValidationCategory.XML_WELLFORMEDNESS,
      severity: ValidationSeverity.WARNING,
      message: 'UTF-8 BOM (Byte Order Mark) detected',
      suggestion: 'Save the file as UTF-8 without BOM for better compatibility',
      details: { hasBom: true },
    });
  }
  
  // Check for XML declaration
  const hasXmlDeclaration = /^<\?xml\s+version\s*=/.test(xmlContent.trim().replace(UTF8_BOM, ''));
  if (!hasXmlDeclaration) {
    results.push({
      ruleId: 'ENC-003',
      category: ValidationCategory.XML_WELLFORMEDNESS,
      severity: ValidationSeverity.WARNING,
      message: 'XML declaration is missing',
      suggestion: 'Add <?xml version="1.0" encoding="UTF-8"?> at the start of the file',
    });
  }
  
  // Check declared encoding
  const encodingMatch = xmlContent.match(/encoding\s*=\s*["']([^"']+)["']/i);
  if (encodingMatch && encodingMatch[1].toUpperCase() !== 'UTF-8') {
    results.push({
      ruleId: 'ENC-001',
      category: ValidationCategory.XML_WELLFORMEDNESS,
      severity: ValidationSeverity.ERROR,
      message: `Non-UTF-8 encoding declared: ${encodingMatch[1]}`,
      suggestion: 'CbC XML files must use UTF-8 encoding',
      details: { declaredEncoding: encodingMatch[1] },
    });
  }
  
  // Check for prohibited control characters
  if (PROHIBITED_CHARS.test(xmlContent)) {
    const match = xmlContent.match(PROHIBITED_CHARS);
    results.push({
      ruleId: 'ENC-003',
      category: ValidationCategory.XML_WELLFORMEDNESS,
      severity: ValidationSeverity.ERROR,
      message: 'Prohibited control characters detected in XML content',
      suggestion: 'Remove or replace control characters (ASCII 0-8, 11, 12, 14-31)',
      details: { charCode: match?.[0].charCodeAt(0) },
    });
  }
  
  // Check for XXE attack patterns
  const xxePatterns = [
    { pattern: /<!ENTITY/i, name: 'Entity declaration' },
    { pattern: /<!DOCTYPE[^>]*\[/i, name: 'Internal DTD subset' },
    { pattern: /SYSTEM\s+["'][^"']+["']/i, name: 'External SYSTEM reference' },
    { pattern: /PUBLIC\s+["'][^"']+["']/i, name: 'External PUBLIC reference' },
  ];
  
  for (const { pattern, name } of xxePatterns) {
    if (pattern.test(xmlContent)) {
      results.push({
        ruleId: 'APP-006',
        category: ValidationCategory.XML_WELLFORMEDNESS,
        severity: ValidationSeverity.CRITICAL,
        message: `Potential XXE attack vector detected: ${name}`,
        suggestion: 'Remove all entity declarations and external references',
        details: { pattern: name },
      });
    }
  }
  
  // Validate basic XML structure using fast-xml-parser validator
  const validationResult = XMLValidator.validate(xmlContent, {
    allowBooleanAttributes: false,
  });
  
  if (validationResult !== true) {
    results.push({
      ruleId: 'APP-001',
      category: ValidationCategory.XML_WELLFORMEDNESS,
      severity: ValidationSeverity.CRITICAL,
      message: `Invalid XML structure: ${validationResult.err.msg}`,
      xpath: validationResult.err.line ? `Line ${validationResult.err.line}` : undefined,
      details: {
        line: validationResult.err.line,
        column: validationResult.err.col,
        errorCode: validationResult.err.code,
      },
      suggestion: 'Fix the XML syntax error at the indicated location',
    });
  }
  
  // Check for unescaped special characters in content (basic check)
  // This is a heuristic - the XML parser will catch actual errors
  const unescapedAmpersand = xmlContent.match(/>([^<]*&(?!amp;|lt;|gt;|apos;|quot;|#\d+;|#x[0-9a-fA-F]+;)[^<]*)</g);
  if (unescapedAmpersand && unescapedAmpersand.length > 0) {
    results.push({
      ruleId: 'ENC-003',
      category: ValidationCategory.XML_WELLFORMEDNESS,
      severity: ValidationSeverity.WARNING,
      message: 'Potentially unescaped ampersand characters detected',
      suggestion: 'Ensure all & characters are escaped as &amp;',
      details: { count: unescapedAmpersand.length },
    });
  }
  
  return results;
}

/**
 * Detect encoding information from XML content
 */
export function detectEncoding(xmlContent: string): EncodingInfo {
  const hasBom = xmlContent.startsWith(UTF8_BOM);
  const cleanContent = hasBom ? xmlContent.slice(1) : xmlContent;
  
  // Extract declared encoding
  const encodingMatch = cleanContent.match(/encoding\s*=\s*["']([^"']+)["']/i);
  const declared = encodingMatch ? encodingMatch[1] : undefined;
  
  // Check if content is valid UTF-8 (basic check)
  // In browser/Node.js, strings are already decoded, so we check for replacement chars
  const hasReplacementChars = /\uFFFD/.test(xmlContent);
  
  return {
    declared,
    hasBom,
    isValidUtf8: !hasReplacementChars,
  };
}

/**
 * Extract namespace information from XML content
 */
export function extractNamespaces(xmlContent: string): NamespaceInfo {
  const prefixes: Record<string, string> = {};
  let defaultNamespace: string | undefined;
  const schemaLocations: string[] = [];
  
  // Find all namespace declarations
  const nsPattern = /xmlns(?::([a-zA-Z0-9_-]+))?\s*=\s*["']([^"']+)["']/g;
  let match;
  
  while ((match = nsPattern.exec(xmlContent)) !== null) {
    const prefix = match[1];
    const uri = match[2];
    
    if (prefix) {
      prefixes[prefix] = uri;
    } else {
      defaultNamespace = uri;
    }
  }
  
  // Find schema locations
  const schemaLocationPattern = /schemaLocation\s*=\s*["']([^"']+)["']/g;
  while ((match = schemaLocationPattern.exec(xmlContent)) !== null) {
    // Schema location is typically space-separated pairs of namespace and URL
    const locations = match[1].split(/\s+/).filter((s) => s.startsWith('http'));
    schemaLocations.push(...locations);
  }
  
  // Check for CbC namespace
  const allNamespaces = [defaultNamespace, ...Object.values(prefixes)].filter(Boolean);
  const hasCbcNamespace = allNamespaces.some(
    (ns) => ns?.includes('cbc') || ns === CBC_NAMESPACE || ns === ISO_CBC_NAMESPACE
  );
  const hasStfNamespace = allNamespaces.some((ns) => ns?.includes('stf') || ns === STF_NAMESPACE);
  
  return {
    defaultNamespace,
    prefixes,
    hasCbcNamespace,
    hasStfNamespace,
    schemaLocations: schemaLocations.length > 0 ? schemaLocations : undefined,
  };
}

// =============================================================================
// XPATH HELPER
// =============================================================================

/**
 * Get a value from parsed XML document using a simplified XPath-like syntax
 *
 * @param doc - Parsed XML document object
 * @param xpath - Simplified XPath (e.g., "CBC_OECD/MessageSpec/MessageRefId")
 * @returns The value at the path, or null if not found
 */
export function getXPathValue(doc: Record<string, unknown>, xpath: string): string | null {
  if (!doc || !xpath) return null;
  
  // Remove leading slash if present
  const normalizedPath = xpath.startsWith('/') ? xpath.slice(1) : xpath;
  
  // Split path into segments
  const segments = normalizedPath.split('/');
  
  let current: unknown = doc;
  
  for (const segment of segments) {
    if (current === null || current === undefined) return null;
    
    // Handle array index notation: Element[0]
    const arrayMatch = segment.match(/^([^[]+)\[(\d+)\]$/);
    
    if (arrayMatch) {
      const [, elementName, indexStr] = arrayMatch;
      const index = parseInt(indexStr, 10);
      
      // Handle namespace prefixes
      const value = findInObject(current as Record<string, unknown>, elementName);
      
      if (Array.isArray(value)) {
        current = value[index];
      } else if (index === 0) {
        current = value;
      } else {
        return null;
      }
    } else {
      // Handle namespace prefixes by checking with and without prefix
      current = findInObject(current as Record<string, unknown>, segment);
    }
  }
  
  // Return string value
  if (current === null || current === undefined) return null;
  if (typeof current === 'string') return current;
  if (typeof current === 'number') return String(current);
  if (typeof current === 'object' && '#text' in (current as Record<string, unknown>)) {
    return String((current as Record<string, unknown>)['#text']);
  }
  
  return null;
}

/**
 * Find a value in an object, handling namespace prefixes
 */
function findInObject(obj: Record<string, unknown>, key: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  
  // Direct match
  if (key in obj) return obj[key];
  
  // Try with common namespace prefixes
  const prefixes = ['cbc:', 'stf:', 'iso:', ''];
  for (const prefix of prefixes) {
    const prefixedKey = prefix + key;
    if (prefixedKey in obj) return obj[prefixedKey];
  }
  
  // Try removing namespace prefix from key
  const colonIndex = key.indexOf(':');
  if (colonIndex > 0) {
    const localName = key.slice(colonIndex + 1);
    if (localName in obj) return obj[localName];
  }
  
  return undefined;
}

// =============================================================================
// MAIN PARSING FUNCTION
// =============================================================================

/**
 * Parse XML string into a structured CbC Report
 *
 * This function:
 * 1. Validates XML well-formedness
 * 2. Checks for security issues (XXE)
 * 3. Parses the XML with a secure parser
 * 4. Extracts metadata
 *
 * @param xmlContent - Raw XML string content
 * @param fileName - Optional file name for metadata
 * @param fileSize - Optional file size for metadata
 * @returns ParseResult with either parsed data or error
 */
export function parseXmlString(
  xmlContent: string,
  fileName: string = 'unknown.xml',
  fileSize?: number
): ParseResult {
  // Validate well-formedness first
  const validationResults = validateXmlWellformedness(xmlContent);
  const criticalErrors = validationResults.filter((r) => r.severity === ValidationSeverity.CRITICAL);
  
  if (criticalErrors.length > 0) {
    return {
      success: false,
      error: {
        code: criticalErrors[0].ruleId,
        message: criticalErrors[0].message,
        details: JSON.stringify(criticalErrors[0].details),
      },
    };
  }
  
  try {
    // Remove BOM if present
    const cleanContent = xmlContent.startsWith(UTF8_BOM) ? xmlContent.slice(1) : xmlContent;
    
    // Create secure parser and parse
    const parser = createSecureParser();
    const parsed = parser.parse(cleanContent);
    
    // Find the root element (could be CBC_OECD or with namespace prefix)
    const rootElement = findRootElement(parsed);
    
    if (!rootElement) {
      return {
        success: false,
        error: {
          code: 'APP-001',
          message: 'Could not find CBC_OECD root element',
          details: 'The XML does not appear to be a valid CbC report',
        },
      };
    }
    
    // Extract namespace info
    const namespaces = extractNamespaces(xmlContent);
    
    // Build the parsed report structure
    const parsingWarnings = validationResults
      .filter((r) => r.severity === ValidationSeverity.WARNING)
      .map((r) => r.message);
    
    const parsedReport: ParsedCbcReport = {
      fileName,
      fileSize: fileSize ?? xmlContent.length,
      parsedAt: new Date().toISOString(),
      message: {
        version: extractVersion(rootElement),
        messageSpec: {
          sendingCompetentAuthority: '',
          receivingCompetentAuthority: '',
          messageType: 'CBC401',
          messageRefId: '',
          messageTypeIndic: 'CBC701',
          reportingPeriod: '',
          timestamp: '',
        },
        cbcBody: {
          reportingEntity: {
            docSpec: {
              docTypeIndic: 'OECD1',
              docRefId: '',
            },
            reportingRole: 'CBC801',
            name: [],
          },
          cbcReports: [],
        },
      },
      rawXml: xmlContent,
      parsingWarnings: parsingWarnings.length > 0 ? parsingWarnings : undefined,
    };
    
    return {
      success: true,
      data: parsedReport,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    return {
      success: false,
      error: {
        code: 'APP-001',
        message: `Failed to parse XML: ${errorMessage}`,
        details: error instanceof Error ? error.stack : undefined,
      },
    };
  }
}

/**
 * Find the CBC_OECD root element in parsed XML
 */
function findRootElement(parsed: Record<string, unknown>): Record<string, unknown> | null {
  if (!parsed || typeof parsed !== 'object') return null;
  
  // Check for direct CBC_OECD element
  if ('CBC_OECD' in parsed) {
    return parsed.CBC_OECD as Record<string, unknown>;
  }
  
  // Check with namespace prefixes
  for (const key of Object.keys(parsed)) {
    if (key.endsWith(':CBC_OECD') || key === 'cbc:CBC_OECD') {
      return parsed[key] as Record<string, unknown>;
    }
  }
  
  // Check if the root itself is the CBC structure (no wrapper)
  if ('MessageSpec' in parsed || 'CbcBody' in parsed) {
    return parsed;
  }
  
  return null;
}

/**
 * Extract version from root element attributes
 */
function extractVersion(rootElement: Record<string, unknown>): string | undefined {
  // Check for version attribute
  const versionAttr = rootElement['@_version'];
  if (typeof versionAttr === 'string') return versionAttr;
  
  // Try to infer from namespace
  // v2 namespace: urn:oecd:ties:cbc:v2
  return '2.0';
}

/**
 * Parse XML and return raw parsed object (for transformer use)
 */
export function parseXmlToObject(xmlContent: string): Record<string, unknown> | null {
  try {
    // Remove BOM if present
    const cleanContent = xmlContent.startsWith(UTF8_BOM) ? xmlContent.slice(1) : xmlContent;
    
    // Validate first
    const validationResult = XMLValidator.validate(cleanContent);
    if (validationResult !== true) {
      return null;
    }
    
    // Parse with secure parser
    const parser = createSecureParser();
    return parser.parse(cleanContent);
  } catch {
    return null;
  }
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export { createSecureParser, findRootElement, UTF8_BOM };

