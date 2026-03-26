import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, Bell } from "lucide-react";
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
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-muted-foreground hover:text-foreground">
              <Menu className="w-6 h-6" />
            </button>
            {title && <h1 className="text-xl font-semibold">{title}</h1>}
          </div>
          <div className="flex items-center gap-4">
            {actions}
            <button className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors relative">
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full border border-background"></span>
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-1"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
