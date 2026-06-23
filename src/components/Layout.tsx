import { Link, Outlet, useLocation } from "react-router";
import { Home, Users, ReceiptText, Bot, LogOut, Store } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export function Layout() {
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Failed to sign out", e);
    }
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/transactions", label: "Transactions", icon: ReceiptText },
    { path: "/chatbot", label: "AI Assistant", icon: Bot },
  ];

  return (
    <div className="flex h-screen bg-slate-50 md:flex-row flex-col">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 h-full">
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center text-white">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Aashirwad Stores</h1>
            <p className="text-xs text-slate-500 font-medium">Smart Udhari Manager</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                location.pathname === item.path
                  ? "bg-green-100 text-green-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 h-full">
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">Aashirwad Stores</h1>
            </div>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-slate-900">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 pb-safe z-20">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[4rem] transition-colors ${
                isActive ? "text-green-600" : "text-slate-500"
              }`}
            >
              <div className={`p-1 rounded-full ${isActive ? "bg-green-50" : ""}`}>
                <item.icon className={`w-5 h-5 ${isActive ? "text-green-600" : ""}`} />
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? "text-green-600" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
