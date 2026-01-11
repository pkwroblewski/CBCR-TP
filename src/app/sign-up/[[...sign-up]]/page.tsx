import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export default function SignUpPage() {
  // Check if sign-ups are blocked (invite-only mode)
  const isInviteOnly = process.env.NEXT_PUBLIC_INVITE_ONLY === 'true';

  if (isInviteOnly) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="text-center max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/25">
              PW
            </div>
            <span className="text-2xl font-semibold text-slate-100">
              CbCR Analyzer
            </span>
          </Link>

          {/* Invite-only message */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-blue-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-100 mb-3">
              Invite Only
            </h1>
            
            <p className="text-slate-400 mb-6">
              Access to CbCR Analyzer is currently by invitation only. 
              If you&apos;ve received an invitation email, please use the link in that email to create your account.
            </p>

            <p className="text-slate-500 text-sm mb-6">
              Need access? Contact your administrator or account manager to request an invitation.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/sign-in"
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
              >
                Already have an account? Sign in
              </Link>
              
              <Link
                href="/"
                className="w-full px-4 py-3 text-slate-400 hover:text-slate-200 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard sign-up form (when sign-ups are enabled)
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25">
            PW
          </div>
          <span className="text-xl font-semibold text-slate-100">
            CbCR Analyzer
          </span>
        </Link>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-slate-900 border-slate-700",
            },
          }}
        />
      </div>
    </div>
  );
}
