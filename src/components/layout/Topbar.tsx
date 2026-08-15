import React from 'react';
import { useLocation, Link } from 'wouter';

interface TopbarProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, onOpenSearch }) => {
  const [location] = useLocation();

  // Generate breadcrumb items
  const getBreadcrumbs = () => {
    if (location === '/' || location === '') {
      return [{ label: 'Home', path: '/' }];
    }

    const parts = location.split('/').filter(Boolean);
    const crumbs = [{ label: 'Home', path: '/' }];

    let currentPath = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath += `/${part}`;
      const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      crumbs.push({
        label,
        path: i === parts.length - 1 ? location : `${currentPath}/`,
      });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header
      id="topbar-wrapper"
      className="sticky top-0 z-30 flex items-center justify-between h-[3rem] px-4 md:px-8 bg-topbar-bg backdrop-blur-md border-b border-main-border transition-colors duration-200"
    >
      {/* Left: Mobile Sidebar Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3 overflow-hidden">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-text-muted hover:text-text hover:bg-sidebar-hover transition-colors"
          title="Open Menu"
          aria-label="Open Menu"
        >
          <i className="fa-solid fa-bars text-lg" />
        </button>

        {/* Breadcrumb navigation */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center text-xs text-text-muted space-x-2 truncate">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.path}>
                {idx > 0 && <span className="text-text-muted/40 font-normal">/</span>}
                {isLast ? (
                  <span className="font-semibold text-text truncate max-w-[200px] md:max-w-[350px]">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.path} className="hover:text-link transition-colors truncate">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Search Box Trigger */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-3 px-3 py-1.5 rounded-full text-xs text-text-muted bg-main-bg border border-search-border hover:border-input-focus-border shadow-sm transition-all group"
          title="Search (Ctrl + K or /)"
          aria-label="Search"
        >
          <i className="fa-solid fa-magnifying-glass text-search-icon-color group-hover:text-link transition-colors" />
          <span className="hidden sm:inline font-normal text-text-muted/80">Search...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-sidebar-bg border border-main-border text-text-muted">
            Ctrl K
          </kbd>
        </button>
      </div>
    </header>
  );
};
