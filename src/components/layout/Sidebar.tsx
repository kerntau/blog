import React from 'react';
import { useLocation, Link } from 'wouter';
import { useTheme } from '../../context/ThemeContext';
import siteConfig from '../../content/site.json';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [location] = useLocation();
  const { resolvedMode, toggleMode } = useTheme();

  const navItems = [
    { label: 'HOME', path: '/', icon: 'fa-solid fa-house' },
    { label: 'CATEGORIES', path: '/categories/', icon: 'fa-solid fa-stream' },
    { label: 'TAGS', path: '/tags/', icon: 'fa-solid fa-tags' },
    { label: 'ARCHIVES', path: '/archives/', icon: 'fa-solid fa-box-archive' },
    { label: 'ABOUT', path: '/about/', icon: 'fa-solid fa-circle-info' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location === '/' || location === '';
    return location.startsWith(path);
  };

  const avatarUrl = siteConfig.avatar
    ? siteConfig.cdn
      ? `${siteConfig.cdn.replace(/\/$/, '')}${siteConfig.avatar}`
      : siteConfig.avatar
    : '/assets/img/favicons/favicon.ico';

  return (
    <>
      {/* Mobile Backdrop Mask */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="sidebar"
        className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col justify-between w-[260px] xxxl:w-[300px] h-screen bg-sidebar-bg border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          {/* Profile Wrapper */}
          <div className="profile-wrapper px-10 pt-10 pb-4 flex flex-col items-center text-center">
            <Link
              href="/"
              onClick={onClose}
              className="group relative block w-28 h-28 rounded-full overflow-hidden shadow-inner ring-2 ring-avatar-border transition-all duration-300"
            >
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125"
              />
            </Link>

            <Link
              href="/"
              onClick={onClose}
              className="mt-5 font-black text-2xl tracking-wide text-site-title hover:text-sidebar-active transition-colors"
            >
              {siteConfig.title || 'Chirpy'}
            </Link>

            <p className="mt-1 text-xs text-site-subtitle font-normal leading-relaxed line-clamp-2">
              {siteConfig.tagline || 'A technical blog theme'}
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="mt-4 px-6 flex-1">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wider transition-all duration-200 ${
                        active
                          ? 'bg-sidebar-hover text-sidebar-active shadow-sm font-bold'
                          : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-active'
                      }`}
                    >
                      <i className={`${item.icon} w-5 text-center text-base opacity-80`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Sidebar Bottom Controls */}
        <div className="sidebar-bottom px-8 py-5 flex items-center justify-between border-t border-sidebar-border/50 bg-sidebar-bg">
          {/* Mode Toggle Button */}
          <button
            id="mode-toggle"
            onClick={toggleMode}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sidebar-btnColor bg-sidebar-btn border border-sidebar-border shadow-sm hover:bg-sidebar-hover hover:text-sidebar-active transition-all active:scale-95"
            title={`Switch to ${resolvedMode === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme mode"
          >
            {resolvedMode === 'dark' ? (
              <i className="fa-solid fa-moon text-sm text-yellow-400" />
            ) : (
              <i className="fa-solid fa-sun text-sm text-amber-500" />
            )}
          </button>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {siteConfig.github?.username && (
              <a
                href={`https://github.com/${siteConfig.github.username}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center text-sidebar-btnColor bg-sidebar-btn border border-sidebar-border shadow-sm hover:bg-sidebar-hover hover:text-sidebar-active transition-all"
                title="GitHub"
                aria-label="GitHub"
              >
                <i className="fa-brands fa-github text-sm" />
              </a>
            )}

            {siteConfig.twitter?.username && (
              <a
                href={`https://twitter.com/${siteConfig.twitter.username}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center text-sidebar-btnColor bg-sidebar-btn border border-sidebar-border shadow-sm hover:bg-sidebar-hover hover:text-sidebar-active transition-all"
                title="Twitter"
                aria-label="Twitter"
              >
                <i className="fa-brands fa-x-twitter text-sm" />
              </a>
            )}

            {siteConfig.social?.email && (
              <a
                href={`mailto:${siteConfig.social.email}`}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sidebar-btnColor bg-sidebar-btn border border-sidebar-border shadow-sm hover:bg-sidebar-hover hover:text-sidebar-active transition-all"
                title="Email"
                aria-label="Email"
              >
                <i className="fa-solid fa-envelope text-sm" />
              </a>
            )}

            <a
              href="/feed.xml"
              className="w-8 h-8 rounded-full flex items-center justify-center text-sidebar-btnColor bg-sidebar-btn border border-sidebar-border shadow-sm hover:bg-sidebar-hover hover:text-sidebar-active transition-all"
              title="RSS Feed"
              aria-label="RSS Feed"
            >
              <i className="fa-solid fa-rss text-sm" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
