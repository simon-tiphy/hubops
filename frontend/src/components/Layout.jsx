import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  Settings,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { clsx } from "clsx";

const Layout = ({ children, title, role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={clsx(
          "relative z-50 h-full bg-[#161e33]/90 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ease-in-out flex flex-col",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-glow">
            <span className="font-bold text-white text-lg">H</span>
          </div>
          <span
            className={clsx(
              "font-bold text-lg text-white tracking-tight ml-3 transition-opacity duration-300",
              isSidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
            )}
          >
            HubOps
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={true}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            icon={<Bell size={20} />}
            label="Notifications"
            badge="3"
            collapsed={!isSidebarOpen}
          />
          <NavItem
            icon={<Settings size={20} />}
            label="Settings"
            collapsed={!isSidebarOpen}
          />
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <div
            className={clsx(
              "flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 transition-all",
              !isSidebarOpen && "justify-center"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2b3655] to-[#3b4b70] flex items-center justify-center text-white font-medium shadow-inner shrink-0">
              {user?.username?.charAt(0)}
            </div>
            <div
              className={clsx(
                "flex-1 min-w-0 transition-opacity duration-300",
                isSidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
              )}
            >
              <p className="text-sm font-medium text-white truncate">
                {user?.username}
              </p>
              <p className="text-[10px] text-gray-400 truncate capitalize">
                {role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={clsx(
              "mt-4 w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-2",
              !isSidebarOpen && "px-0"
            )}
            title="Sign Out"
          >
            <LogOut size={18} />
            <span
              className={clsx(
                "transition-opacity duration-300",
                isSidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
              )}
            >
              Sign Out
            </span>
          </button>
        </div>

        {/* Collapse Toggle (Desktop) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 bg-[#2b3655] border border-white/10 rounded-full p-1 text-white hover:bg-primary transition-colors shadow-lg hidden lg:flex"
        >
          {isSidebarOpen ? (
            <ChevronLeft size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0F1526]/80 backdrop-blur-md sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white tracking-tight">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-[#161e33] border border-white/5 rounded-full pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 w-64 transition-all placeholder-gray-600"
              />
            </div>
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full shadow-glow"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-7xl mx-auto animate-fade-in pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, badge, collapsed }) => (
  <button
    className={clsx(
      "w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
      active
        ? "bg-primary/10 text-primary"
        : "text-gray-400 hover:text-white hover:bg-white/5",
      collapsed ? "justify-center" : "justify-between"
    )}
    title={collapsed ? label : undefined}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span
        className={clsx(
          "transition-opacity duration-300 whitespace-nowrap",
          collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
        )}
      >
        {label}
      </span>
    </div>
    {badge && (
      <span
        className={clsx(
          "bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-glow",
          collapsed && "absolute top-1 right-1 w-2 h-2 p-0"
        )}
      >
        {collapsed ? "" : badge}
      </span>
    )}
  </button>
);

export default Layout;
