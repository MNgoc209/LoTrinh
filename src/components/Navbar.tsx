import React from 'react';

export type NavTab = 'dashboard' | 'knowledge' | 'bugs';

interface NavbarProps {
  currentTab: NavTab | 'quiz';
  onSelectTab: (tab: NavTab) => void;
  onOpenConfig: () => void;
  onOpenSyncModal: () => void;
  pendingBugsCount: number;
  weakItemsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenConfig,
  onOpenSyncModal,
  pendingBugsCount,
  weakItemsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-200/70 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title (single text element, one line) */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className="text-lg font-bold tracking-tight text-stone-900 hover:text-pink-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          JLPT N3 AI Tracker
        </button>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav aria-label="Điều hướng chính" className="flex items-center gap-6 text-sm font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'dashboard'
                ? 'border-pink-600 text-pink-700 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Lịch hôm nay
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('knowledge')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
              currentTab === 'knowledge'
                ? 'border-pink-600 text-pink-700 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Kho Từ & Ngữ pháp ({weakItemsCount})
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('bugs')}
            className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
              currentTab === 'bugs'
                ? 'border-pink-600 text-pink-700 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Bug Tracker ({pendingBugsCount})
          </button>

          <button
            type="button"
            onClick={onOpenConfig}
            className="py-1 border-b-2 border-transparent text-stone-600 hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cấu hình lộ trình
          </button>
        </nav>

        {/* Zone 3: 1 primary action button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenSyncModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            Đồng bộ dữ liệu
          </button>
        </div>
      </div>
    </header>
  );
};
