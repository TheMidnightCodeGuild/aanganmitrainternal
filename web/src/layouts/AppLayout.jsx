import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { text: 'Dashboard', path: '/dashboard' },
  { text: 'Properties', path: '/properties' },
  { text: 'Clients', path: '/clients' },
  { text: 'Tasks', path: '/tasks' },
  { text: 'Chat', path: '/chat' },
  { text: 'Open List', path: '/open' },
  { text: 'Settings', path: '/settings' },
];

const AppLayout = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col">
        <div className="h-16 flex items-center justify-center border-b">
          <span className="font-bold text-lg">Brokerage Dashboard</span>
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.text}>
                <Link
                  to={item.path}
                  className={`block px-6 py-2 rounded-l-full transition-colors ${
                    location.pathname.startsWith(item.path)
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <button
          onClick={handleLogout}
          className="m-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout; 