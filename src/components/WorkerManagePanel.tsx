'use client';
import React, { useState } from 'react';
import { Profile } from '../types/order';
import { api } from '../services/api';
import { Edit, Save, X, UserPlus, UserX, Check } from 'lucide-react';

interface WorkerManagePanelProps {
  profiles: Profile[];
  onRefresh: () => void;
}

export const WorkerManagePanel: React.FC<WorkerManagePanelProps> = ({
  profiles,
  onRefresh,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const workers = profiles.filter(p => p.role === 'worker');

  const startEdit = (p: Profile) => {
    setEditingId(p.id);
    setEditName(p.full_name);
    setEditPhone(p.phone || '');
  };

  const handleSave = async (id: string) => {
    try {
      setLoading(true);
      await api.updateProfile(id, { full_name: editName, phone: editPhone || null });
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (p: Profile) => {
    try {
      await api.updateProfile(p.id, { is_active: !p.is_active });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    }
  };

  return (
    <div>
      <div className="desktop-header-row">
        <div>
          <h1>Worker Management</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
            Edit worker details and manage active status. To add new workers, create them as users first via User Management.
          </p>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No workers found. Add users with the &quot;worker&quot; role from User Management.
                </td>
              </tr>
            ) : (
              workers.map(w => (
                <tr key={w.id}>
                  <td>
                    {editingId === w.id ? (
                      <input type="text" className="form-input" value={editName}
                        onChange={e => setEditName(e.target.value)} style={{ padding: '4px 8px', fontSize: '13px' }} />
                    ) : (
                      <strong>{w.full_name}</strong>
                    )}
                  </td>
                  <td>
                    {editingId === w.id ? (
                      <input type="text" className="form-input" value={editPhone}
                        onChange={e => setEditPhone(e.target.value)} placeholder="Phone" style={{ padding: '4px 8px', fontSize: '13px' }} />
                    ) : (
                      w.phone || <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className="status-pill" style={{
                      background: w.is_active ? '#d1fae5' : '#fee2e2',
                      color: w.is_active ? '#059669' : '#dc2626',
                    }}>
                      {w.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {editingId === w.id ? (
                        <>
                          <button className="add-plus-btn" style={{ width: '32px', height: '32px', color: '#059669' }}
                            onClick={() => handleSave(w.id)} disabled={loading} title="Save">
                            <Check size={14} />
                          </button>
                          <button className="add-plus-btn" style={{ width: '32px', height: '32px' }}
                            onClick={() => setEditingId(null)} title="Cancel">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="add-plus-btn" style={{ width: '32px', height: '32px' }}
                            onClick={() => startEdit(w)} title="Edit">
                            <Edit size={14} />
                          </button>
                          <button className="add-plus-btn" style={{ width: '32px', height: '32px', color: w.is_active ? '#dc2626' : '#059669' }}
                            onClick={() => toggleActive(w)} title={w.is_active ? 'Deactivate' : 'Activate'}>
                            {w.is_active ? <UserX size={14} /> : <UserPlus size={14} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
