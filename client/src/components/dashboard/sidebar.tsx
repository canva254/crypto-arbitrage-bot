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
        "flex flex-col w-64 bg-surface border-r border-gray-700 z-50",
        "fixed h-full transition-transform duration-300 ease-in-out md:static",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:flex"
      )}>
        <div className="p-4 flex items-center border-b border-gray-700">
          <div className="bg-primary rounded-lg w-10 h-10 flex items-center justify-center mr-3">
            <span className="material-icons text-white">currency_exchange</span>
          </div>
          <h1 className="text-xl font-semibold text-white">CryptoArb</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Main
          </div>
          <a href="#" className="flex items-center px-4 py-3 text-white bg-primary bg-opacity-20 border-l-4 border-primary">
            <span className="material-icons mr-3">dashboard</span>
            Dashboard
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-surface2 hover:text-white transition-colors">
            <span className="material-icons mr-3">timeline</span>
            Opportunities
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-surface2 hover:text-white transition-colors">
            <span className="material-icons mr-3">history</span>
            History
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-surface2 hover:text-white transition-colors">
            <span className="material-icons mr-3">analytics</span>
            Analytics
          </a>

          <div className="px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Configuration
          </div>
          <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-surface2 hover:text-white transition-colors">
            <span className="material-icons mr-3">tune</span>
            Strategies
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-surface2 hover:text-white transition-colors">
            <span className="material-icons mr-3">account_balance</span>
            Exchanges
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-surface2 hover:text-white transition-colors">
            <span className="material-icons mr-3">settings</span>
            Settings
          </a>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-surface2 flex items-center justify-center">
              <span className="material-icons text-gray-300">person</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">User Account</p>
              <p className="text-xs text-gray-400">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
