import React, { useState } from 'react';
import { Department } from '../types';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  department?: Department | null;
  departments: Department[];
  onCreateFolder: (departmentId: string, folderName: string) => void;
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  department,
  departments,
  onCreateFolder,
}) => {
  const [folderName, setFolderName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState(department?.id || 'dept-exec');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    onCreateFolder(department ? department.id : selectedDeptId, folderName.trim());
    setFolderName('');
    onClose();
  };

  const activeDept = department || departments.find((d) => d.id === selectedDeptId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#bec9c5]/50 animate-in fade-in zoom-in-95 duration-150 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e2db]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006054]/10 text-[#006054] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">create_new_folder</span>
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                Create New Folder
              </h3>
              <p className="text-xs text-[#5D4037]">
                {activeDept ? activeDept.name : 'Select Department'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f6f3ec] text-[#6e7976] hover:text-[#1c1c18] flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!department && (
            <div>
              <label className="block text-xs font-bold text-[#1c1c18] mb-1.5">
                Target Department
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f6f3ec] rounded-xl border border-[#bec9c5]/60 text-sm text-[#1c1c18] focus:outline-none focus:border-[#006054]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1c1c18] mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Term 1 Orientation, Budgets, Reports"
              className="w-full px-3.5 py-2.5 bg-[#f6f3ec] rounded-xl border border-[#bec9c5]/60 text-sm text-[#1c1c18] focus:outline-none focus:border-[#006054]"
            />
          </div>

          <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#e5e2db] flex items-center gap-2 text-xs text-[#5D4037]">
            <span className="material-symbols-outlined text-[#D4AF37] text-[18px]">folder</span>
            <span>
              This folder will be created under <strong>{activeDept?.name}</strong>.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5D4037] hover:bg-[#f6f3ec] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="px-5 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all disabled:opacity-40 cursor-pointer"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
