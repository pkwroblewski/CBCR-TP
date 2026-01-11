import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works | CbCR Analyzer',
  description: 'Learn how CbCR Analyzer validates your Country-by-Country Reports. Understand our multi-layer validation approach, AI-powered insights, and security measures.',
  openGraph: {
    title: 'How It Works | CbCR Analyzer',
    description: 'A comprehensive guide to validating your CbCR XML files before submission to tax authorities.',
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
