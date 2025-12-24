# CbCR Quality Review Web Application

## Overview

This is a Country-by-Country Reporting (CbCR) quality review web application designed to validate XML files against multiple compliance frameworks:

- **OECD BEPS Action 13 Requirements** - Core CbCR schema validation
- **Country-Specific Rules** - Starting with Luxembourg (LU) specific validations
- **Pillar 2 Compliance** - GloBE (Global Anti-Base Erosion) readiness checks

## Purpose

Organizations filing CbCR reports face complex validation requirements across different jurisdictions. This application provides:

1. **Automated XML Validation** - Upload and validate CbCR XML files instantly
2. **Multi-Layer Compliance Checking** - Schema, business rules, and country-specific validations
3. **Clear Issue Reporting** - Categorized findings with severity levels
4. **PDF Export** - Generate professional validation reports
5. **Audit Trail** - Track validation history and report versions

## Target Users

- Tax professionals preparing CbCR filings
- Multinational enterprises (MNEs) with reporting obligations
- Tax consultants reviewing client submissions
- Compliance teams ensuring regulatory adherence

## Key Features

### Validation Engine
- XML well-formedness checks
- OECD CbC-Schema-v2.0 compliance
- Business rule validation (DocRefId uniqueness, MessageTypeIndic logic)
- Country-specific formatting (TIN validation, deadline checks)
- Data quality and reasonableness tests
- Pillar 2 safe harbour eligibility assessment

### User Experience
- Drag-and-drop file upload
- Real-time validation progress
- Color-coded severity indicators
- Detailed error descriptions with XPath locations
- Historical validation dashboard

## Tech Stack

- **Frontend**: Next.js 14 with React Server Components
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **XML Processing**: fast-xml-parser
- **Validation**: Zod schemas
- **PDF Generation**: @react-pdf/renderer

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API endpoints
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── forms/             # Form components
│   ├── validation/        # Validation result displays
│   └── reports/           # PDF report components
├── lib/
│   ├── supabase/          # Database client & helpers
│   ├── validators/        # Validation logic
│   │   ├── oecd/          # OECD schema rules
│   │   ├── countries/     # Country-specific rules
│   │   └── pillar2/       # Pillar 2 checks
│   └── parsers/           # XML parsing utilities
├── types/                 # TypeScript definitions
└── schemas/               # Zod validation schemas
```

## Validation Severity Levels

| Level | Color | Description |
|-------|-------|-------------|
| Critical | Red | Filing will be rejected by tax authority |
| Error | Orange | May cause processing issues |
| Warning | Yellow | Data quality concern |
| Info | Blue | Best practice suggestion |

## License

Proprietary - All rights reserved.

