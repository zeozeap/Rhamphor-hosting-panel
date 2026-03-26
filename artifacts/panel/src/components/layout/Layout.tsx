import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function Layout({ children, title, actions }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex w-full overflow-hidden text-foreground selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-muted-foreground hover:text-foreground">
              <Menu className="w-6 h-6" />
            </button>
            {title && <h1 className="text-xl font-semibold">{title}</h1>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 md:p-8 max-w-7xl mx-auto w-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
