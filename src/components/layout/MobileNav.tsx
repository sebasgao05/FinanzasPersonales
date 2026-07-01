import { useState, useCallback, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close the menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center border-b bg-background px-4 md:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="size-5" />
        </button>
        <span className="ml-3 text-sm font-semibold">Finanzas Personales</span>
      </header>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-over drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute right-2 top-3 z-10">
          <button
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Cerrar menú de navegación"
          >
            <X className="size-4" />
          </button>
        </div>
        <Sidebar onNavigate={handleClose} />
      </div>
    </>
  );
}
