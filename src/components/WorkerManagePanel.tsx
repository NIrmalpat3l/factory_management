'use client';
import React, { useState } from 'react';
import { Profile } from '../types/order';
import { api } from '../services/api';
import { Edit, X, UserPlus, UserX, Check } from 'lucide-react';

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
  const [loading, setLoading] = useState<string | null>(null);

  const members = profiles;

  const startEdit = (p: Profile) => {
    setEditingId(p.id);
    setEditName(p.full_name);
    setEditPhone(p.phone || '');
  };

  const handleSave = async (id: string) => {
    try {
      setLoading(id);
      await api.updateProfile(id, { full_name: editName, phone: editPhone || null });
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    } finally {
      setLoading(null);
    }
  };

  const handleSalaryChange = async (userId: string, newSalary: number) => {
    try {
      setLoading(userId);
      await (await import('../services/api')).api.updateUserProfile(userId, { salary: newSalary });
      onRefresh();
    } catch (err: any) {
      alert('Failed to update salary: ' + err.message);
    } finally {
      setLoading(null);
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
    <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Members</h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
          Edit member details, salaries, and manage active status.
        </p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Salary ($)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No members found.
                </td>
              </tr>
            ) : (
              members.map(w => (
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
                    <input
                      type="number"
                      defaultValue={w.salary || 0}
                      style={{ width: '80px', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val !== w.salary) {
                          handleSalaryChange(w.id, val);
                        }
                      }}
                      disabled={loading === w.id}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {editingId === w.id ? (
                        <>
                          <button className="add-plus-btn" style={{ width: '32px', height: '32px', color: '#059669' }}
                            onClick={() => handleSave(w.id)} disabled={loading === w.id} title="Save">
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
