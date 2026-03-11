import { useState } from 'react';
import {
  HiBars3,
  HiOutlineClipboardDocumentList,
  HiOutlineHome,
  HiOutlinePower,
  HiOutlineQueueList,
  HiOutlineSquares2X2,
  HiXMark,
} from 'react-icons/hi2';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', to: '/', icon: HiOutlineHome },
  { label: 'Orders History', to: '/orders-history', icon: HiOutlineClipboardDocumentList },
  { label: 'Menu Management', to: '/menu-management', icon: HiOutlineQueueList },
  { label: 'Inventory', to: '/inventory', icon: HiOutlineSquares2X2 },
];

const Sidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const showExpandedContent = isHovered || isMobileOpen;

  const handleLogout = () => {
    localStorage.removeItem('kioskToken');
    navigate('/login');
  };

  return (
    <div className="min-h-screen md:flex">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-slate-900 px-4 py-3 text-white md:hidden">
        <h1 className="text-base font-bold">Burp Burger</h1>
        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="rounded-md bg-slate-800 p-2"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <HiXMark className="h-5 w-5" /> : <HiBars3 className="h-5 w-5" />}
        </button>
      </header>

      {isMobileOpen && (
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Close menu overlay"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 md:static md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <aside
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`flex h-full flex-col bg-slate-900 text-white transition-[width] duration-300 ${
            showExpandedContent ? 'md:w-60' : 'md:w-[140px]'
          } w-64`}
        >
          <div className="flex h-14 items-center justify-between border-b border-slate-700/60 px-4">
            <h1 className="whitespace-nowrap text-base font-bold tracking-tight text-center">Burp Burger</h1>
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="rounded-lg bg-slate-800 p-1.5 hover:bg-slate-700 md:hidden"
              aria-label="Close menu"
            >
              <HiXMark className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-2 pt-3">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setIsMobileOpen(false)}
                  title={item.label}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl py-3 text-sm font-medium transition-colors ${
                      showExpandedContent ? 'px-3' : 'justify-center px-2'
                    } ${
                      isActive
                        ? 'bg-amber-500 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-6 w-6 shrink-0" />
                  {showExpandedContent && <span className="whitespace-nowrap">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-slate-700/60 p-2 pb-3">
            <button
              type="button"
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 rounded-xl py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-rose-500 hover:text-white ${
                showExpandedContent ? 'px-3' : 'justify-center px-2'
              }`}
            >
              <HiOutlinePower className="h-6 w-6 shrink-0" />
              {showExpandedContent && 'Logout'}
            </button>
          </div>
        </aside>
      </div>

      <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;
