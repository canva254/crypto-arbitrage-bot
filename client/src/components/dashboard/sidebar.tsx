import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={cn(
        "flex flex-col w-64 bg-card border-r border-border z-50",
        "fixed h-full transition-transform duration-300 ease-in-out md:static",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:flex"
      )}>
        <div className="p-4 flex items-center border-b border-border">
          <div className="bg-primary rounded-lg w-10 h-10 flex items-center justify-center mr-3">
            <span className="material-icons text-primary-foreground">currency_exchange</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">CryptoArb</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Main
          </div>
          <a href="#" className="flex items-center px-4 py-3 text-primary-foreground bg-primary/20 border-l-4 border-primary">
            <span className="material-icons mr-3">dashboard</span>
            Dashboard
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <span className="material-icons mr-3">timeline</span>
            Opportunities
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <span className="material-icons mr-3">history</span>
            History
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <span className="material-icons mr-3">analytics</span>
            Analytics
          </a>

          <div className="px-4 mt-6 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Configuration
          </div>
          <a href="#" className="flex items-center px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <span className="material-icons mr-3">tune</span>
            Strategies
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <span className="material-icons mr-3">account_balance</span>
            Exchanges
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <span className="material-icons mr-3">settings</span>
            Settings
          </a>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="material-icons text-muted-foreground">person</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-foreground">User Account</p>
              <p className="text-xs text-muted-foreground">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
