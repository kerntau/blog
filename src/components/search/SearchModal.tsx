import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import Fuse from 'fuse.js';
import searchData from '../../content/search-index.json';
import { SearchItem } from '../../types/content';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Fuse.js
  const fuse = useRef(
    new Fuse(searchData as SearchItem[], {
      keys: [
        { name: 'title', weight: 0.5 },
        { name: 'snippet', weight: 0.2 },
        { name: 'categories', weight: 0.15 },
        { name: 'tags', weight: 0.1 },
        { name: 'content', weight: 0.05 },
      ],
      threshold: 0.4,
      includeMatches: true,
      minMatchCharLength: 2,
    })
  ).current;

  // Auto focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle Search Input
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const searchResults = fuse.search(query).map((res) => res.item);
    setResults(searchResults);
    setSelectedIndex(0);
  }, [query, fuse]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex].url);
    }
  };

  const handleSelect = (url: string) => {
    setLocation(url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-2xl bg-card-bg border border-main-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-main-border bg-sidebar-bg/50">
          <i className="fa-solid fa-magnifying-glass text-search-icon-color text-base mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts by title, tag, or content..."
            className="flex-1 bg-transparent text-sm text-text placeholder-text-muted/60 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-text-muted hover:text-text rounded-full hover:bg-sidebar-hover text-xs transition-colors mr-2"
              title="Clear search"
              aria-label="Clear search"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono rounded bg-main-bg border border-main-border text-text-muted">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div className="overflow-y-auto p-3 space-y-1.5 flex-1 max-h-[60vh] no-scrollbar">
          {query && results.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-muted">
              <i className="fa-regular fa-face-frown text-3xl mb-3 text-text-muted/50 block" />
              Oops! No results found for &ldquo;{query}&rdquo;
            </div>
          ) : results.length > 0 ? (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.url)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-sidebar-hover text-sidebar-active' : 'hover:bg-sidebar-hover/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-heading truncate">{item.title}</h4>
                    {item.categories?.[0] && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-main-bg border border-main-border text-text-muted shrink-0">
                        {item.categories[0]}
                      </span>
                    )}
                  </div>
                  {item.snippet && (
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {item.snippet}
                    </p>
                  )}
                  {item.tags?.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-[10px] text-text-muted/80">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-text-muted">
              Type keywords above to quickly search across all articles.
            </div>
          )}
        </div>

        {/* Search Footer */}
        <div className="px-4 py-2 bg-sidebar-bg/60 border-t border-main-border text-[11px] text-text-muted flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-main-bg border border-main-border text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-main-bg border border-main-border text-[10px]">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-main-bg border border-main-border text-[10px]">↵</kbd>
              <span>Select</span>
            </span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
};
