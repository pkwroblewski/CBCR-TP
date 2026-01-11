import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
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
