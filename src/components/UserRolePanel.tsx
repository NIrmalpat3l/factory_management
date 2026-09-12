'use client';
import React, { useState } from 'react';
import { Profile, UserRole } from '../types/order';
import { api } from '../services/api';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

interface UserRolePanelProps {
  profiles: Profile[];
  currentUserId: string;
  onRefresh: () => void;
}

export const UserRolePanel: React.FC<UserRolePanelProps> = ({
  profiles,
  currentUserId,
  onRefresh,
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setLoading(userId);
      await api.updateUserRole(userId, newRole);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setLoading(null);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <ShieldAlert size={14} color="#D9383A" />;
      case 'worker': return <Shield size={14} color="#3b82f6" />;
      case 'viewer': return <ShieldCheck size={14} color="#10b981" />;
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin': return { background: '#fee2e2', color: '#dc2626' };
      case 'worker': return { background: '#dbeafe', color: '#2563eb' };
      case 'viewer': return { background: '#d1fae5', color: '#059669' };
    }
  };

  return (
    <div>
      <div className="desktop-header-row">
        <div>
          <h1>User Management</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
            Change user roles. Admins have full access, Workers can self-assign and update tasks, Viewers are read-only.
          </p>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Current Role</th>
              <th>Status</th>
              <th>Change Role</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => {
              const isSelf = p.id === currentUserId;
              return (
                <tr key={p.id}>
                  <td>
                    <strong>{p.full_name}</strong>
                    {isSelf && <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '6px' }}>(You)</span>}
                  </td>
                  <td>
                    <span className="status-pill" style={getRoleBadgeStyle(p.role)}>
                      {getRoleIcon(p.role)} {p.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="status-pill" style={{
                      background: p.is_active ? '#d1fae5' : '#fee2e2',
                      color: p.is_active ? '#059669' : '#dc2626',
                    }}>
                      {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    {isSelf ? (
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>Cannot change own role</span>
                    ) : (
                      <select
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: '13px', width: 'auto', minWidth: '120px' }}
                        value={p.role}
                        onChange={e => handleRoleChange(p.id, e.target.value as UserRole)}
                        disabled={loading === p.id}
                      >
                        <option value="admin">Admin</option>
                        <option value="worker">Worker</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
