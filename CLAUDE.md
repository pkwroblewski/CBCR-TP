# CbCR Review Web App - Claude Code Project Rules

## Project Overview
This is a CbCR (Country-by-Country Reporting) quality review web application that validates XML files against OECD BEPS Action 13 requirements, country-specific rules (starting with Luxembourg), and Pillar 2 compliance.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **XML Parsing**: fast-xml-parser
- **Validation**: Zod schemas
- **PDF Export**: @react-pdf/renderer
- **Testing**: Vitest
- **Language**: TypeScript (strict mode)

## Project Structure
```
cbcr-review-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth routes (login, register)
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── api/               # API routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── forms/             # Form components
│   │   ├── validation/        # Validation result displays
│   │   └── reports/           # PDF report components
│   ├── lib/
│   │   ├── supabase/          # Supabase client & helpers
│   │   ├── validators/        # XML validation logic
│   │   │   ├── core/          # Base validator classes
│   │   │   ├── oecd/          # OECD schema rules
│   │   │   ├── countries/     # Country-specific rules
│   │   │   ├── quality/       # Data quality validators
│   │   │   └── pillar2/       # Pillar 2 rules
│   │   ├── parsers/           # XML parsing utilities
│   │   └── utils/             # General utilities
│   ├── types/                 # TypeScript type definitions
│   ├── constants/             # Validation rules & constants
│   └── hooks/                 # React hooks
├── tests/
│   ├── fixtures/              # Test XML files
│   └── validators/            # Validator tests
├── supabase/
│   └── migrations/            # Database migrations
└── docs/                      # Project documentation
```

## Coding Standards

### TypeScript
- Use strict TypeScript - no `any` types unless absolutely necessary
- Define interfaces for all data structures
- Use Zod for runtime validation with inferred types

### React/Next.js
- Use Server Components by default
- Only use 'use client' when necessary (interactivity, hooks)
- Implement proper error boundaries
- Use Suspense for loading states

### Naming Conventions
- Components: PascalCase (e.g., `ValidationResult.tsx`)
- Utilities/hooks: camelCase (e.g., `useValidation.ts`)
- Types/Interfaces: PascalCase with descriptive names (e.g., `CbcReportValidation`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `OECD_ERROR_CODES`)
- Validators: PascalCase with `Validator` suffix (e.g., `TinValidator`)

### File Organization
- One component per file
- Co-locate tests with components (`Component.test.tsx`) or in `tests/` directory
- Keep files under 200 lines when possible

## Validation Engine Architecture

### Severity Levels
```typescript
enum ValidationSeverity {
  CRITICAL = 'critical',  // Submission will be rejected
  ERROR = 'error',        // May cause issues
  WARNING = 'warning',    // Data quality concern
  INFO = 'info'           // Best practice suggestion
}
```

### Validation Categories
1. **XML Well-Formedness** - Valid XML structure, UTF-8 encoding
2. **Schema Validation** - OECD CbC-Schema-v2.0 compliance
3. **Business Rules** - DocRefId uniqueness, MessageTypeIndic matching
4. **Country Rules** - Luxembourg TIN format, deadlines
5. **Data Quality** - Cross-field validation, reasonableness
6. **Pillar 2 Readiness** - Safe harbour eligibility

### Validation Rule IDs
- MSG-001 to MSG-010: MessageSpec rules
- DOC-001 to DOC-007: DocSpec rules
- TIN-001 to TIN-006: TIN validation rules
- LU-TIN-001 to LU-TIN-003: Luxembourg-specific TIN rules
- XFV-001 to XFV-004: Cross-field validation rules

## Database Schema Patterns
- Use UUID for primary keys
- Include created_at and updated_at timestamps
- Implement Row Level Security (RLS) in Supabase
- Use snake_case for database columns

## Security Requirements
- Validate all XML input for XXE attacks
- Sanitize file uploads
- Implement rate limiting on API routes
- Never expose sensitive validation rules client-side

## UI/UX Guidelines
- Clean, professional design (not flashy)
- Clear visual hierarchy for validation results
- Color coding: Red (critical), Orange (error), Yellow (warning), Blue (info)
- Mobile-responsive design
- Accessible (WCAG 2.1 AA)

## When Writing Code
1. Always handle errors gracefully
2. Add JSDoc comments for complex functions
3. Write self-documenting code with clear variable names
4. Implement proper TypeScript types
5. Consider edge cases in validation logic

## Common Patterns

### Validation Result Type
```typescript
interface ValidationResult {
  ruleId: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  message: string;
  xpath?: string;
  details?: Record<string, unknown>;
  suggestion?: string;
  reference?: string;
}
```

### API Response Pattern
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### Validator Pattern
```typescript
class MyValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'my-validator',
    name: 'My Validator',
    description: 'Validates something',
    category: ValidationCategory.BUSINESS_RULES,
    order: 10,
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    // Implementation
  }
}
```

## Testing
- Run tests: `npm test`
- Run TypeScript check: `npx tsc --noEmit`
- Test fixtures are in `tests/fixtures/`
- Use Vitest for unit and integration tests

## Do NOT
- Use `var` - always `const` or `let`
- Skip error handling
- Use inline styles (use Tailwind)
- Commit secrets or API keys
- Use deprecated React patterns (class components, etc.)
- Add unnecessary dependencies
- Create overly complex abstractions
- Ignore TypeScript errors
