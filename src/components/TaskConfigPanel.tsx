'use client';
import React, { useState } from 'react';
import { api } from '../services/api';
import { Plus, Trash2, X, Settings, ListTodo } from 'lucide-react';
import { TaskType } from '../types/order';

interface TaskConfigPanelProps {
  taskTypes: TaskType[];
  onRefresh: () => void;
}

export const TaskConfigPanel: React.FC<TaskConfigPanelProps> = ({
  taskTypes,
  onRefresh,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newTaskName.trim()) return;
    try {
      setLoading(true);
      await api.createTaskType(newTaskName.trim());
      setNewTaskName('');
      setShowAdd(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add task type');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.deleteTaskType(deleteConfirmId);
      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: any) {
      setDeleteConfirmId(null);
      if (err.message?.includes('violates foreign key constraint') || err.message?.includes('task_assignments_task_type_id_fkey')) {
        setErrorModalMessage('Cannot delete this task type because it is currently assigned to one or more orders.');
      } else {
        setErrorModalMessage(err.message || 'Failed to delete task type.');
      }
    }
  };

  return (
    <div>
      <div className="desktop-header-row">
        <div>
          <h1>Task Configuration</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
            Manage tasks that can be performed on spring orders (e.g. Oiling, Cutting).
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={18} /> Add Task
        </button>
      </div>

      {showAdd && (
        <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', maxWidth: '500px', marginBottom: '24px' }}>
          <div className="form-field" style={{ marginBottom: '16px' }}>
            <label>TASK NAME <span className="required">*</span></label>
            <input type="text" className="form-input" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} placeholder="e.g. Oiling" />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-cancel" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleAdd} disabled={loading}>
              Save Task
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {taskTypes.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No task types configured yet.
                </td>
              </tr>
            ) : (
              taskTypes.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td>
                    <button className="add-plus-btn" style={{ width: '32px', height: '32px', color: '#dc2626' }}
                      onClick={() => setDeleteConfirmId(t.id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <Trash2 size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>Delete Task</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
              Are you sure you want to delete this task type?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button type="button" className="btn-primary" style={{ background: '#dc2626' }} onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModalMessage && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <X size={24} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>Cannot Delete</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              {errorModalMessage}
            </p>
            <button type="button" className="btn-primary" onClick={() => setErrorModalMessage(null)} style={{ width: '100%', justifyContent: 'center' }}>
              Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
