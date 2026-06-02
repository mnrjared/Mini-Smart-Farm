import { Outlet, Link, useNavigate, useLocation, useMatches } from "react-router";
import { Button } from "./ui/button";
import { useState } from "react";
// old import
// import { Home, Zap, Bird, Wheat, Droplets, LogOut, Menu, X} from "lucide-react";
import { Home, Zap, Bird, Wheat, Droplets, LogOut, Menu, X, ChevronDown } from "lucide-react";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  //added const for coop dropdown
  const [coopDropdownOpen, setCoopDropdownOpen] = useState(false);

  const matches = useMatches();
  //const activeHandle = matches[matches.length - 1]?.handle as LayoutHandle | undefined;
  //const mainWidthClass = activeHandle?.mainWidthClass ?? "max-w-7xl";

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/dashboard/power-generation", label: "Power Generation", icon: Zap },
    { path: "/dashboard/chicken-coop", label: "Chicken Coop", icon: Bird },
    { path: "/dashboard/crop-farm", label: "Crop Farm", icon: Wheat },
    { path: "/dashboard/water-distribution", label: "Water Distribution", icon: Droplets },
  ];

  //added sub items
  const coopSubItems = [
  { path: "/dashboard/chicken-coop/coop", label: "Coop" },
  { path: "/dashboard/chicken-coop/chicken", label: "Chicken" },
  { path: "/dashboard/chicken-coop/chicken-dashboard", label: "Chicken Dashboard" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 h-16">
            {/* Logo and Title */}
            <div className="min-w-0 flex items-center gap-4">
              <div className="min-w-0 flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <Wheat className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-base sm:text-lg text-slate-900 leading-tight truncate">Bela-Bela Smart Farm</h1>
                  <p className="hidden sm:block text-xs text-slate-600">Belgium Campus × Penn State</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
<nav className="hidden md:flex items-center gap-2">
  {navItems.map((item) => {
    if (item.path === "/dashboard/chicken-coop") {
      const active = isActive(item.path);
      return (
        <div key={item.path} className="relative">
          <button
            onClick={() => setCoopDropdownOpen(!coopDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              active ? "bg-green-100 text-green-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bird className="w-4 h-4" />
            <span className="text-sm font-medium">Chicken Coop</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${coopDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {coopDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
              {coopSubItems.map((sub) => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  onClick={() => setCoopDropdownOpen(false)}
                  className={`flex items-center px-4 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    location.pathname === sub.path
                      ? "bg-green-100 text-green-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {sub.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          active ? "bg-green-100 text-green-700" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{item.label}</span>
      </Link>
    );
  })}
</nav>





            {/* old desktop nav
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? "bg-green-100 text-green-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            */}

            {/* Logout Button */}
            <div className="hidden md:block">
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
              
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-200 bg-white">
    <nav className="px-4 py-4 space-y-2">
      {navItems.map((item) => {
        if (item.path === "/dashboard/chicken-coop") {
          const active = isActive(item.path);
          return (
            <div key={item.path}>
              <button
                onClick={() => setCoopDropdownOpen(!coopDropdownOpen)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active ? "bg-green-100 text-green-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Bird className="w-5 h-5" />
                <span className="font-medium flex-1 text-left">Chicken Coop</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${coopDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {coopDropdownOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  {coopSubItems.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={() => { setMobileMenuOpen(false); setCoopDropdownOpen(false); }}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === sub.path
                          ? "bg-green-100 text-green-700"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              active ? "bg-green-100 text-green-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
      <button
        onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Logout</span>
      </button>
    </nav>
  </div>
)}




        {/* old mobile menu}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? "bg-green-100 text-green-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </div>
        )}
          */}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-600">
                A collaboration between Belgium Campus ITVersity (South Africa) and Pennsylvania State University (USA)
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Empowering Bela-Bela community through smart agriculture
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-500">Data via LoRa Network</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}