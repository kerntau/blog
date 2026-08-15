import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../../context/ThemeContext';

interface PostContentProps {
  html: string;
  hasMermaid?: boolean;
}

export const PostContent: React.FC<PostContentProps> = ({ html, hasMermaid }) => {
  const { resolvedMode } = useTheme();
  const [zoomImage, setZoomImage] = useState<{ src: string; alt: string } | null>(null);

  // Initialize and render Mermaid diagrams
  useEffect(() => {
    if (hasMermaid) {
      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedMode === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
      });

      const renderMermaid = async () => {
        const elements = document.querySelectorAll('.mermaid');
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          const code = el.getAttribute('data-mermaid-src') || el.textContent || '';
          if (!el.getAttribute('data-mermaid-src')) {
            el.setAttribute('data-mermaid-src', code);
          }
          if (code.trim()) {
            try {
              const id = `mermaid-${i}-${Math.random().toString(36).substring(2, 9)}`;
              const { svg } = await mermaid.render(id, code.trim());
              el.innerHTML = svg;
            } catch (err) {
              console.error('Mermaid render error', err);
            }
          }
        }
      };

      // Slight delay to ensure DOM is ready
      setTimeout(renderMermaid, 50);
    }
  }, [html, resolvedMode, hasMermaid]);

  // Handle Code Copy Buttons and Image Lightbox
  useEffect(() => {
    const handleCodeCopy = async (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.code-copy-btn');
      if (!target) return;

      const codeAttr = target.getAttribute('data-code');
      if (!codeAttr) return;

      const codeText = decodeURIComponent(codeAttr);
      try {
        await navigator.clipboard.writeText(codeText);
        const icon = target.querySelector('i');
        if (icon) {
          icon.className = 'fa-solid fa-check text-green-500';
          setTimeout(() => {
            icon.className = 'fa-regular fa-clipboard';
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to copy code', err);
      }
    };

    const handleImageClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.img-wrapper img') as HTMLImageElement | null;
      if (!target) return;

      setZoomImage({
        src: target.src,
        alt: target.alt || '',
      });
    };

    document.addEventListener('click', handleCodeCopy);
    document.addEventListener('click', handleImageClick);

    return () => {
      document.removeEventListener('click', handleCodeCopy);
      document.removeEventListener('click', handleImageClick);
    };
  }, []);

  return (
    <>
      {/* Post Rendered HTML */}
      <article
        className="post-content max-w-none prose prose-neutral dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Image Lightbox Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out animate-fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <img
              src={zoomImage.src}
              alt={zoomImage.alt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            {zoomImage.alt && (
              <p className="text-white/80 text-xs mt-3 text-center italic">{zoomImage.alt}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
