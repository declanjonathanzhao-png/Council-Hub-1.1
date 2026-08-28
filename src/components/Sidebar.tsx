import React, { useState } from 'react';
import { ViewType, Department, UserPermissions } from '../types';
import { COUNCIL_LOGO_SRC } from '../assets/logo';

interface SidebarProps {
  currentView: ViewType;
  selectedDepartmentId?: string;
  selectedFolderName?: string;
  departments: Department[];
  permissions?: UserPermissions;
  onNavigate: (view: ViewType, data?: any) => void;
  onOpenNewModal: () => void;
  onOpenNewFolderModal?: (deptId?: string) => void;
  onDeleteFolder?: (departmentId: string, folderName: string) => void;
  pendingApprovalsCount: number;
  tasksDueCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  selectedDepartmentId,
  selectedFolderName,
  departments,
  permissions,
  onNavigate,
  onOpenNewModal,
  onOpenNewFolderModal,
  onDeleteFolder,
  pendingApprovalsCount,
  tasksDueCount,
}) => {
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({
    'dept-exec': false, // Closed by default
  });
  const [folderToDelete, setFolderToDelete] = useState<{ deptId: string; deptName: string; folderName: string } | null>(null);

  const toggleDept = (deptId: string) => {
    setExpandedDepts((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      view: 'home' as ViewType,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: 'assignment',
      view: 'tasks' as ViewType,
      badge: tasksDueCount > 0 ? tasksDueCount : undefined,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: 'calendar_today',
      view: 'calendar' as ViewType,
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: 'fact_check',
      view: 'approvals' as ViewType,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeGold: true,
    },
    ...(permissions?.isAdmin
      ? [
          {
            id: 'admin_panel',
            label: 'Admin Panel',
            icon: 'admin_panel_settings',
            view: 'admin_panel' as ViewType,
            badge: 'Admin',
            badgeGold: false,
          },
        ]
      : []),
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-white z-50 flex flex-col border-r border-[#bec9c5]/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] select-none">
      {/* Brand Header */}
      <div 
        onClick={() => onNavigate('home')}
        className="h-16 px-6 flex items-center gap-3 cursor-pointer border-b border-[#e5e2db]/40"
      >
        <img
          alt="CouncilHub Logo"
          className="h-9 w-9 rounded-full object-cover shadow-xs"
          referrerPolicy="no-referrer"
          src={COUNCIL_LOGO_SRC}
        />
        <span className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18] tracking-tight">
          CouncilHub
        </span>
      </div>

      {/* Primary Action Button */}
      <div className="px-4 py-4">
        <button
          onClick={onOpenNewModal}
          className="w-full bg-[#006054] hover:bg-[#1F7A6C] text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#006054]/20 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>New</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar space-y-1">
        {navItems.map((item) => {
          const isActive = currentView === item.view && !selectedDepartmentId;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.view)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#1F7A6C] text-white font-semibold shadow-xs'
                  : 'text-[#5D4037] hover:bg-[#f6f3ec] hover:text-[#1c1c18]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-icon' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeGold
                      ? 'bg-[#fed65b] text-[#745c00]'
                      : 'bg-[#ffdad6] text-[#ba1a1a]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Departments Section */}
        <div className="pt-4 pb-2 px-3 flex items-center justify-between text-xs text-[#6e7976] uppercase tracking-widest font-bold">
          <span>Departments</span>
        </div>

        <div className="space-y-0.5 text-sm pb-6">
          {departments.map((dept) => {
            const isDeptActive =
              (currentView === 'department_hub' || currentView === 'mom_list' || currentView === 'proposals_list') &&
              selectedDepartmentId === dept.id;
            const isOpen = !!expandedDepts[dept.id];

            return (
              <div key={dept.id} className="group">
                <div
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                    isDeptActive
                      ? 'bg-[#f0eee7] text-[#006054] font-semibold'
                      : 'text-[#5D4037] hover:bg-[#f6f3ec] hover:text-[#1c1c18]'
                  }`}
                  onClick={() => {
                    onNavigate('department_hub', dept.id);
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {dept.badgeImage ? (
                      <img
                        src={dept.badgeImage}
                        alt={dept.name}
                        className="w-5 h-5 rounded-full object-cover shrink-0 border border-[#D4AF37]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[18px] text-[#D4AF37] shrink-0">
                        {dept.iconName}
                      </span>
                    )}
                    <span className="truncate text-left text-xs sm:text-sm">{dept.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDept(dept.id);
                    }}
                    className="p-1 text-[#6e7976] hover:text-[#1c1c18] rounded-md transition-transform"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                </div>

                {/* Submenu items */}
                {isOpen && (
                  <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                    {(dept.folders || []).map((fName) => (
                      <div
                        key={fName}
                        className={`group/folder w-full flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                          currentView === 'folder_view' && selectedDepartmentId === dept.id && selectedFolderName === fName
                            ? 'bg-[#006054]/10 text-[#006054] font-semibold'
                            : 'text-[#5D4037] hover:bg-[#f6f3ec] hover:text-[#1c1c18]'
                        }`}
                        onClick={() => onNavigate('folder_view', { departmentId: dept.id, folderName: fName })}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-[15px] text-[#D4AF37] shrink-0">folder</span>
                          <span className="truncate">{fName}</span>
                        </div>

                        {onDeleteFolder && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderToDelete({
                                deptId: dept.id,
                                deptName: dept.name,
                                folderName: fName,
                              });
                            }}
                            title={`Delete "${fName}" folder`}
                            className="opacity-0 group-hover/folder:opacity-100 p-0.5 rounded text-[#6e7976] hover:text-[#ba1a1a] hover:bg-white transition-all shrink-0 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        if (onOpenNewFolderModal) {
                          onOpenNewFolderModal(dept.id);
                        } else {
                          onOpenNewModal();
                        }
                      }}
                      className="w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-lg text-[#6e7976] hover:bg-[#f6f3ec] hover:text-[#006054] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">create_new_folder</span>
                      <span>New Folder</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer / Utility Links */}
      <div className="p-3 border-t border-[#bec9c5]/50 bg-[#FAF7F0]/60 space-y-1">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
            currentView === 'settings' ? 'bg-[#006054]/10 text-[#006054] font-bold' : 'text-[#5D4037] hover:bg-[#f6f3ec]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
          <span>Settings</span>
        </button>
        <button
          onClick={() => onNavigate('help')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
            currentView === 'help' ? 'bg-[#006054]/10 text-[#006054] font-bold' : 'text-[#5D4037] hover:bg-[#f6f3ec]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">help</span>
          <span>Help</span>
        </button>
      </div>

      {/* MODAL: Delete Folder Confirmation */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#ffdad6] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">delete_forever</span>
              </div>
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18]">
                  Delete Folder Tab
                </h3>
                <p className="text-xs text-[#6e7976]">{folderToDelete.deptName}</p>
              </div>
            </div>

            <p className="text-xs text-[#5D4037] leading-relaxed">
              Are you sure you want to delete the <strong className="text-[#ba1a1a]">"{folderToDelete.folderName}"</strong> folder tab?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setFolderToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#bec9c5]/60 hover:bg-[#f6f3ec] text-[#5D4037] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteFolder) {
                    onDeleteFolder(folderToDelete.deptId, folderToDelete.folderName);
                  }
                  setFolderToDelete(null);
                }}
                className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
