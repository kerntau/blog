import React, { useEffect, useState } from 'react';

export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 120) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      id="back-to-top"
      onClick={scrollToTop}
      className="fixed bottom-8 right-6 md:right-10 z-40 w-10 h-10 rounded-full flex items-center justify-center bg-button-bg text-btn-backtotop-color border border-btn-backtotop-border-color shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 animate-fade-in group cursor-pointer"
      title="Back to Top"
      aria-label="Back to Top"
    >
      <i className="fa-solid fa-arrow-up text-sm transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
};
