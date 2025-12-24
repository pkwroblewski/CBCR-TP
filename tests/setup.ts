/**
 * Vitest Setup
 *
 * Global test configuration and setup.
 *
 * @module tests/setup
 */

import { beforeAll, afterAll, vi } from 'vitest';

// =============================================================================
// GLOBAL SETUP
// =============================================================================

beforeAll(() => {
  // Set up any global mocks or configurations
  
  // Mock console.warn to reduce noise in tests
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  // Clean up
  vi.restoreAllMocks();
});

// =============================================================================
// GLOBAL TEST UTILITIES
// =============================================================================

/**
 * Helper to wait for async operations
 */
export async function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Helper to create a mock CbCR report
 */
export function createMockReport(overrides: Record<string, unknown> = {}) {
  return {
    message: {
      messageSpec: {
        sendingEntityIn: 'LU12345678901',
        transmittingCountry: 'LU',
        receivingCountry: 'LU',
        messageType: 'CBC',
        language: 'EN',
        messageRefId: 'LU2023CBC0001234567890',
        messageTypeIndic: 'CBC401',
        reportingPeriod: '2023-12-31',
        timestamp: '2024-01-15T14:30:00',
        ...overrides,
      },
      cbcBody: {
        reportingEntity: {
          entity: {
            resCountryCode: 'LU',
            tin: { value: '12345678901', issuedBy: 'LU' },
            name: 'Test Company S.à r.l.',
            address: {
              countryCode: 'LU',
              addressFree: 'Test Address, Luxembourg',
            },
          },
          nameMneGroup: 'Test Group',
          docSpec: {
            docTypeIndic: 'OECD1',
            docRefId: 'LU2023DOC001RE001',
          },
        },
        cbcReports: [
          {
            docSpec: {
              docTypeIndic: 'OECD1',
              docRefId: 'LU2023DOC001JUR001',
            },
            resCountryCode: 'LU',
            summary: {
              revenues: {
                unrelated: { value: 10000000, currCode: 'EUR' },
                related: { value: 1000000, currCode: 'EUR' },
                total: { value: 11000000, currCode: 'EUR' },
              },
              profitOrLoss: { value: 1500000, currCode: 'EUR' },
              taxPaid: { value: 375000, currCode: 'EUR' },
              taxAccrued: { value: 380000, currCode: 'EUR' },
              capital: { value: 5000000, currCode: 'EUR' },
              earnings: { value: 3000000, currCode: 'EUR' },
              nbEmployees: 25,
              assets: { value: 20000000, currCode: 'EUR' },
            },
            constEntities: [
              {
                entity: {
                  resCountryCode: 'LU',
                  tin: { value: '12345678901', issuedBy: 'LU' },
                  name: 'Test Company S.à r.l.',
                  address: {
                    countryCode: 'LU',
                    addressFree: 'Test Address, Luxembourg',
                  },
                },
                incorpCountryCode: 'LU',
                bizActivities: ['CBC501'],
              },
            ],
          },
        ],
        additionalInfo: null,
      },
    },
    metadata: {
      xmlVersion: '1.0',
      encoding: 'UTF-8',
      namespaces: {
        default: 'urn:oecd:ties:cbc:v2',
      },
    },
    ...overrides,
  };
}

