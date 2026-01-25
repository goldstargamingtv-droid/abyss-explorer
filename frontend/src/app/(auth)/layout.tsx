import { Brain } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8" />
          <span className="text-2xl font-bold">PKM Vault</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Your AI-powered
            <br />
            second brain
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Store, connect, search, and generate insights from all your personal
            knowledge. Notes, bookmarks, PDFs, articles, and more.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="p-4 rounded-lg bg-primary-foreground/10">
              <div className="text-3xl font-bold">100%</div>
              <div className="text-sm text-primary-foreground/70">Self-hosted</div>
            </div>
            <div className="p-4 rounded-lg bg-primary-foreground/10">
              <div className="text-3xl font-bold">AI</div>
              <div className="text-sm text-primary-foreground/70">Semantic search</div>
            </div>
            <div className="p-4 rounded-lg bg-primary-foreground/10">
              <div className="text-3xl font-bold">Graph</div>
              <div className="text-sm text-primary-foreground/70">Knowledge links</div>
            </div>
            <div className="p-4 rounded-lg bg-primary-foreground/10">
              <div className="text-3xl font-bold">Free</div>
              <div className="text-sm text-primary-foreground/70">Open source</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} PKM Vault. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
