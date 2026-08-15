import React, { useState, useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { RightPanel } from './components/layout/RightPanel';
import { Footer } from './components/layout/Footer';
import { BackToTop } from './components/layout/BackToTop';
import { SearchModal } from './components/search/SearchModal';
import { HomePage } from './pages/HomePage';
import { PostPage } from './pages/PostPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { TagsPage } from './pages/TagsPage';
import { ArchivesPage } from './pages/ArchivesPage';
import { TabPage } from './pages/TabPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PostItem } from './types/content';

export const AppContent: React.FC = () => {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<PostItem | null>(null);

  const isPostPage = location.startsWith('/posts/');

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setSidebarOpen(false);
    if (!isPostPage) {
      setCurrentPost(null);
    }
  }, [location, isPostPage]);

  // Global Keyboard Shortcuts (Ctrl+K or / to open search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-main-bg text-text transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Layout */}
      <div className="flex flex-col flex-1 min-w-0 lg:pl-[260px] xxxl:pl-[300px]">
        {/* Topbar */}
        <Topbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        {/* Core Container */}
        <main className="flex-1 flex justify-center w-full px-4 sm:px-8 py-6 max-w-[1380px] mx-auto">
          <div className="flex-1 min-w-0 max-w-4xl">
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/posts/:rest*">
                <PostPage onPostLoaded={setCurrentPost} />
              </Route>
              <Route path="/categories/:rest*">
                <CategoriesPage />
              </Route>
              <Route path="/categories" component={CategoriesPage} />
              <Route path="/tags/:rest*">
                <TagsPage />
              </Route>
              <Route path="/tags" component={TagsPage} />
              <Route path="/archives/:rest*">
                <ArchivesPage />
              </Route>
              <Route path="/archives" component={ArchivesPage} />
              <Route path="/about/:rest*">
                <TabPage tabName="about" />
              </Route>
              <Route path="/about">
                <TabPage tabName="about" />
              </Route>
              <Route component={NotFoundPage} />
            </Switch>
          </div>

          {/* Right Panel (TOC on Post page, Recent & Tags on other pages) */}
          <RightPanel
            toc={isPostPage && currentPost?.hasToc ? currentPost.toc : undefined}
            isPostPage={isPostPage}
          />
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Floating Back to Top Button */}
      <BackToTop />

      {/* Global Search Dialog */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};
