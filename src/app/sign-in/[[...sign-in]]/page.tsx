import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-8">
          PW-(CbCR) Analyzer
        </h1>
        <SignIn
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
