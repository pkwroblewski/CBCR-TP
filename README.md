# CbCR Review

A comprehensive Country-by-Country Report (CbCR) quality review web application that validates XML files against OECD BEPS Action 13 requirements, country-specific rules, and Pillar 2 compliance.

![CbCR Review](public/og-image.png)

## 🌟 Features

### Core Validation
- **OECD Schema Compliance** - Validates against CbC-Schema-v2.0
- **Business Rules** - DocRefId uniqueness, MessageTypeIndic consistency
- **Data Quality** - Cross-field validation, reasonableness checks
- **TIN Validation** - Country-specific TIN format verification

### Country-Specific Rules
- **Luxembourg** - Matricule National format, filing deadlines, local requirements
- *More countries coming soon*

### Pillar 2 Readiness
- **Safe Harbour Tests** - De Minimis, Simplified ETR, Routine Profits
- **Jurisdiction Analysis** - GloBE rules applicability
- **Top-up Tax Assessment** - IIR, UTPR, QDMTT evaluation

### Professional Features
- **PDF Reports** - Downloadable validation reports
- **Dashboard** - Overview of all validations
- **History** - Access past validation reports
- **User Profiles** - Save preferences and settings

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **XML Parsing**: [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
- **Validation**: [Zod](https://zod.dev/)
- **PDF Export**: [@react-pdf/renderer](https://react-pdf.org/)
- **Language**: TypeScript (strict mode)
- **Testing**: [Vitest](https://vitest.dev/)

## 📋 Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account (free tier works)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/cbcr-review.git
cd cbcr-review
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up the database

Run the migrations in your Supabase SQL editor:

```bash
# Copy contents of supabase/migrations/001_initial_schema.sql
# and run in Supabase SQL Editor
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
cbcr-review-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth routes (login, register)
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── forms/             # Form components
│   │   ├── validation/        # Validation result displays
│   │   ├── upload/            # File upload components
│   │   ├── layout/            # Layout components
│   │   └── reports/           # PDF report components
│   ├── lib/
│   │   ├── supabase/          # Supabase client & helpers
│   │   ├── validators/        # XML validation logic
│   │   │   ├── core/          # Validation engine
│   │   │   ├── oecd/          # OECD schema rules
│   │   │   ├── quality/       # Data quality rules
│   │   │   ├── countries/     # Country-specific rules
│   │   │   └── pillar2/       # Pillar 2 rules
│   │   ├── parsers/           # XML parsing utilities
│   │   └── utils/             # General utilities
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript type definitions
│   └── schemas/               # Zod validation schemas
├── tests/
│   ├── fixtures/              # Test XML files
│   └── validators/            # Validator unit tests
├── public/                    # Static assets
├── supabase/
│   └── migrations/            # Database migrations
└── docs/                      # Documentation
```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test -- --watch
```

## 📦 Building for Production

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build

# Start production server
npm run start
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment Variables for Production

Ensure these are set in your production environment:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | Yes | Production URL |

## 🔒 Security

- XML parsing with XXE protection
- Input sanitization
- Rate limiting on API routes
- Row Level Security in database
- HTTPS enforced in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OECD](https://www.oecd.org/) for CbCR schema specifications
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the backend infrastructure

## 📞 Support

- 📧 Email: support@cbcr-review.com
- 📖 Documentation: [docs.cbcr-review.com](https://docs.cbcr-review.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/cbcr-review/issues)

---

Built with ❤️ for tax professionals worldwide.
