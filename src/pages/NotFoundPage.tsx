import React from 'react';
import { Link } from 'wouter';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page max-w-2xl mx-auto py-24 text-center">
      <h1 className="text-8xl font-black text-heading font-mono mb-4">404</h1>
      <h2 className="text-2xl font-bold text-heading mb-4">Page Not Found</h2>
      <p className="text-sm text-text-muted mb-8 leading-relaxed">
        Sorry, we could not find the page you were looking for. It might have been moved or deleted.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs bg-sidebar-active text-main-bg hover:opacity-90 transition-all shadow-md active:scale-95"
      >
        <i className="fa-solid fa-house text-xs" /> Back to Home
      </Link>
    </div>
  );
};
