import React, { useState } from 'react';
import { CouncilTask } from '../types';
import { ConfirmationDialog } from './ConfirmationDialog';

interface TasksViewProps {
  tasks: CouncilTask[];
  isViewer?: boolean;
  onToggleTaskStatus: (taskId: string) => void;
  onAddTask: (task: Omit<CouncilTask, 'id'>) => void;
  onUpdateTask: (task: CouncilTask) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  isViewer,
  onToggleTaskStatus,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Executive Committee');
  const [assigneeName, setAssigneeName] = useState('Kenzo');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');

  // Edit State
  const [editingTask, setEditingTask] = useState<CouncilTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAssigneeName, setEditAssigneeName] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [editDescription, setEditDescription] = useState('');

  // Delete State
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'priority-desc' | 'priority-asc' | 'dueDate'>('priority-desc');

  const priorityWeight = (p: 'High' | 'Medium' | 'Low') => {
    if (p === 'High') return 3;
    if (p === 'Medium') return 2;
    return 1;
  };

  const filteredTasks = tasks
    .filter((t) => {
      if (filter === 'pending') return t.status === 'Pending' || t.status === 'In Progress';
      if (filter === 'completed') return t.status === 'Completed';
      if (filter === 'overdue') return t.status === 'Overdue';
      return true;
    })
    .sort((a, b) => {
      const weightA = priorityWeight(a.priority);
      const weightB = priorityWeight(b.priority);
      if (sortBy === 'priority-desc') {
        return weightB - weightA;
      } else if (sortBy === 'priority-asc') {
        return weightA - weightB;
      } else {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
    });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      department,
      assignee: {
        name: assigneeName,
        initials: assigneeName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      },
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      dueLabel: 'Due Soon',
      priority,
      status: 'Pending',
    });

    setShowAddModal(false);
    setTitle('');
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    onUpdateTask({
      ...editingTask,
      title: editTitle.trim(),
      department: editDepartment,
      assignee: {
        name: editAssigneeName,
        initials: editAssigneeName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      },
      dueDate: editDueDate || editingTask.dueDate,
      priority: editPriority,
      description: editDescription,
    });

    setEditingTask(null);
  };

  const confirmDelete = () => {
    if (deleteTaskId) {
      onDeleteTask(deleteTaskId);
      setDeleteTaskId(null);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-24 md:pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#bec9c5]/40 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ffdad6]/60 flex items-center justify-center text-[#ba1a1a]">
            <span className="material-symbols-outlined text-[28px] fill-icon">assignment_turned_in</span>
          </div>
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl md:text-2xl font-bold text-[#1c1c18]">
              Council Tasks & Action Items
            </h1>
            <p className="text-xs md:text-sm text-[#5D4037] mt-0.5">
              Track deliverables, committee duty assignments, and deadlines.
            </p>
          </div>
        </div>

        {!isViewer && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_task</span>
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['all', 'pending', 'overdue', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                filter === f
                  ? 'bg-[#006054] text-white shadow-xs'
                  : 'bg-white text-[#5D4037] border border-[#bec9c5]/60 hover:bg-[#f6f3ec]'
              }`}
            >
              {f === 'all' ? 'All Tasks' : f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#5D4037]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-[#bec9c5]/60 rounded-xl text-xs font-semibold text-[#1c1c18] outline-none cursor-pointer"
          >
            <option value="priority-desc">Priority: High to Low</option>
            <option value="priority-asc">Priority: Low to High</option>
            <option value="dueDate">Due Date</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl border border-[#bec9c5]/40 shadow-xs divide-y divide-[#f0eee7] overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#ffdad6]/60 text-[#ba1a1a] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[32px]">task_alt</span>
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18] mb-1">
              No Active Council Tasks
            </h3>
            <p className="text-xs text-[#5D4037] max-w-sm mb-4">
              There are no tasks or duty roster assignments currently pending for the council.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_task</span>
              <span>Create Task</span>
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'Completed';
            return (
              <div
                key={task.id}
                className={`p-4 md:p-5 flex items-start justify-between gap-4 transition-colors ${
                  isDone ? 'bg-[#f6f3ec]/40 opacity-70' : 'hover:bg-[#FAF7F0]'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => onToggleTaskStatus(task.id)}
                    className={`w-6 h-6 rounded-lg border mt-0.5 flex items-center justify-center transition-all cursor-pointer ${
                      isDone
                        ? 'bg-[#006054] border-[#006054] text-white'
                        : 'border-[#bec9c5] hover:border-[#006054] bg-white'
                    }`}
                    title="Toggle Task Status"
                  >
                    {isDone && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm md:text-base font-semibold text-[#1c1c18] leading-snug ${
                        isDone ? 'line-through text-[#6e7976]' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-[#5D4037] mt-1 leading-relaxed">{task.description}</p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap mt-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-[#006054]/10 text-[#006054] font-semibold text-[11px]">
                        {task.department}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          task.priority === 'High'
                            ? 'bg-[#ffdad6] text-[#ba1a1a]'
                            : task.priority === 'Medium'
                            ? 'bg-[#fed65b]/40 text-[#745c00]'
                            : 'bg-[#f0eee7] text-[#5D4037]'
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                      <span className="text-[#6e7976] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        <span>{task.dueLabel || task.dueDate}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div
                    className="w-8 h-8 rounded-full bg-[#fed65b] text-[#745c00] flex items-center justify-center font-bold text-xs shadow-xs"
                    title={task.assignee.name}
                  >
                    {task.assignee.initials}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setEditTitle(task.title);
                        setEditDepartment(task.department);
                        setEditAssigneeName(task.assignee?.name || '');
                        setEditDueDate(task.dueDate);
                        setEditPriority(task.priority);
                        setEditDescription(task.description || '');
                      }}
                      className="p-1.5 text-[#6e7976] hover:text-[#006054] hover:bg-[#006054]/10 rounded-lg transition-colors cursor-pointer"
                      title="Edit Task"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTaskId(task.id)}
                      className="p-1.5 text-[#6e7976] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete Task"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#bec9c5]/40 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2db]">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                Create Council Task
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-[#f6f3ec] cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-[#5D4037] mb-1">
                  Task Title <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Review Q3 Budget Allocation breakdown"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none focus:border-[#006054]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  >
                    <option>Executive Committee</option>
                    <option>House Dept</option>
                    <option>Prefectorial Board</option>
                    <option>Student Welfare Board</option>
                    <option>Student Tech Leaders</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Assignee</label>
                  <input
                    type="text"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6e7976] hover:bg-[#f6f3ec] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#006054] hover:bg-[#1F7A6C] text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#bec9c5]/40 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2db]">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                Edit Council Task
              </h3>
              <button onClick={() => setEditingTask(null)} className="p-1 rounded-lg hover:bg-[#f6f3ec] cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-[#5D4037] mb-1">
                  Task Title <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none focus:border-[#006054]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5D4037] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  placeholder="Task details or notes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Department</label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  >
                    <option>Executive Committee</option>
                    <option>House Dept</option>
                    <option>Prefectorial Board</option>
                    <option>Student Welfare Board</option>
                    <option>Student Tech Leaders</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Assignee</label>
                  <input
                    type="text"
                    value={editAssigneeName}
                    onChange={(e) => setEditAssigneeName(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6e7976] hover:bg-[#f6f3ec] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#006054] hover:bg-[#1F7A6C] text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Task Deletion */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTaskId)}
        title="Delete Council Task"
        message="Are you sure you want to delete this scheduled council task? This action cannot be undone."
        confirmLabel="Delete Task"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>
  );
};
