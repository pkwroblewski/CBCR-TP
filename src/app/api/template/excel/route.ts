/**
 * Excel Template Download API
 *
 * GET /api/template/excel
 *
 * Returns a downloadable Excel template for CbCR data input
 */

import { NextResponse } from 'next/server';
import { generateCbcrTemplateBuffer, TEMPLATE_METADATA } from '@/lib/templates/excel-template';

/**
 * GET /api/template/excel
 *
 * Returns the CbCR Excel template as a downloadable file
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Generate the template
    const buffer = generateCbcrTemplateBuffer();

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(buffer);

    // Create response with appropriate headers
    const response = new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="cbcr-template-v${TEMPLATE_METADATA.version}.xlsx"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });

    return response;
  } catch (error) {
    console.error('Error generating Excel template:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEMPLATE_GENERATION_ERROR',
          message: 'Failed to generate Excel template',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/template/excel
 *
 * Returns metadata about the template without the file content
 */
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="cbcr-template-v${TEMPLATE_METADATA.version}.xlsx"`,
    },
  });
}
