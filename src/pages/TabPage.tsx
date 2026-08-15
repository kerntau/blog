import React from 'react';
import tabsData from '../content/tabs.json';
import { TabItem } from '../types/content';
import { PostContent } from '../components/post/PostContent';
import { NotFoundPage } from './NotFoundPage';

interface TabPageProps {
  tabName: string;
}

export const TabPage: React.FC<TabPageProps> = ({ tabName }) => {
  const tabs = tabsData as Record<string, TabItem>;
  const tab = tabs[tabName];

  if (!tab) {
    return <NotFoundPage />;
  }

  return (
    <div className="tab-page max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-main-border">
        {tab.icon && <i className={`${tab.icon} text-2xl text-text-muted`} />}
        <h1 className="text-2xl md:text-3xl font-extrabold text-heading tracking-tight">
          {tab.title}
        </h1>
      </div>

      {/* Content */}
      {tab.html && <PostContent html={tab.html} />}
    </div>
  );
};
