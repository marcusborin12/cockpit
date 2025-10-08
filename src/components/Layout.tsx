import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Play, 
  FileText, 
  Settings,
  Menu
} from "lucide-react";
import { Button } from "./ui/button";

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Play, label: "Automações", path: "/automations" },
  { icon: FileText, label: "Logs", path: "/logs" },
  { icon: Settings, label: "Administração", path: "/admin" },
];

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-card border-r border-border shadow-lg">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center h-24 px-6 border-b border-border bg-primary">
          <img 
            src="images/crefisa-logo.png" 
            alt="Crefisa Logo" 
            className="h-8 w-auto"
          />
          <h1 className="text-sm font-medium text-primary-foreground mt-2">Automation Hub</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>


      </aside>

      {/* Main content */}
      <div className="flex-1 md:pl-64">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-card">
          <Button variant="ghost" size="icon">
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <img 
              src="images/crefisa-logo.png" 
              alt="Crefisa Logo" 
              className="h-6 w-auto"
            />
            <span className="text-sm font-medium text-primary">Automation Hub</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
