import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import { Terminal } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 neon-glow border border-primary/20">
          <Terminal className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-4 tracking-tighter">404</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-md">
          The requested endpoint or resource could not be found on this node.
        </p>
        <Link href="/" className="px-8 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300">
          Return to Dashboard
        </Link>
      </div>
    </Layout>
  );
}
