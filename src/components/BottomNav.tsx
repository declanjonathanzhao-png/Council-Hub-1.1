import React from 'react';
import { ViewType } from '../types';

interface BottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  pendingApprovalsCount?: number;
  tasksDueCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  pendingApprovalsCount = 0,
  tasksDueCount = 0,
}) => {
  const tabs: { id: ViewType; label: string; icon: string; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'tasks', label: 'Tasks', icon: 'assignment', badge: tasksDueCount },
    { id: 'calendar', label: 'Calendar', icon: 'calendar_today' },
    { id: 'approvals', label: 'Approvals', icon: 'fact_check', badge: pendingApprovalsCount },
    { id: 'department_hub', label: 'Depts', icon: 'account_tree' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#bec9c5]/50 pb-safe shadow-[0_-2px_12px_rgba(93,64,55,0.06)]">
      <div className="flex justify-around items-center h-16 px-4">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition-colors ${
                isActive ? 'text-[#1F7A6C]' : 'text-[#6e7976] hover:text-[#1c1c18]'
              }`}
            >
              <div className="relative">
                <span className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-icon' : ''}`}>
                  {tab.icon}
                </span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#fed65b] text-[#745c00] text-[10px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[11px] font-medium tracking-tight ${isActive ? 'font-bold text-[#1F7A6C]' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
