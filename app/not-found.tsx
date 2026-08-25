import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4 relative z-10">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 bg-transparent overflow-hidden rounded-3xl pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-[100px]"></div>
        <div className="absolute right-10 top-10 h-[20rem] w-[20rem] rounded-full bg-blue-500/10 blur-[80px]"></div>
      </div>

      <div className="glass-panel animate-rise flex w-full max-w-md flex-col items-center justify-center rounded-[2rem] border border-border/60 p-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5">
          <SearchX className="h-10 w-10" strokeWidth={1.5} />
        </div>
        
        <h1 className="mb-2 text-7xl font-black tracking-tight text-foreground">404</h1>
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Page not found</h2>
        
        <p className="mb-8 text-sm text-muted-foreground leading-relaxed px-2">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Or maybe it hasn't been built yet!
        </p>
        
        <Button asChild size="lg" className="rounded-xl w-full font-semibold shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
