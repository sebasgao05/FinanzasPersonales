import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex w-full flex-1 flex-col md:pl-64">
        {/* Mobile navigation - visible only on mobile */}
        <MobileNav />

        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
