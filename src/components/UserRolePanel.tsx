'use client';
import React, { useState } from 'react';
import { Profile, UserRole } from '../types/order';
import { api } from '../services/api';
import { Shield, ShieldCheck, ShieldAlert, Eye, Calculator } from 'lucide-react';

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

  const currentUser = profiles.find(p => p.id === currentUserId);
  const isAdmin = currentUser?.roles?.includes('admin') || currentUser?.role === 'admin';

  const handleRoleChange = async (userId: string, newRoles: UserRole[]) => {
    try {
      setLoading(userId);
      await api.updateUserRoles(userId, newRoles);
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
      case 'qa': return <Eye size={14} color="#d97706" />;
      case 'accountant': return <Calculator size={14} color="#4338ca" />;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin': return { background: '#fee2e2', color: '#dc2626' };
      case 'worker': return { background: '#dbeafe', color: '#2563eb' };
      case 'viewer': return { background: '#d1fae5', color: '#059669' };
      case 'qa': return { background: '#fef3c7', color: '#d97706' };
      case 'accountant': return { background: '#e0e7ff', color: '#4338ca' };
      default: return { background: '#e2e8f0', color: '#475569' };
    }
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div className="desktop-header-row" style={{ padding: '16px' }}>
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
              <th>Status</th>
              <th>Current Roles</th>
              <th>Manage Roles</th>
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
                    <span className="status-pill" style={{
                      background: p.is_active ? '#d1fae5' : '#fee2e2',
                      color: p.is_active ? '#059669' : '#dc2626',
                    }}>
                      {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(p.roles || [p.role]).map(r => (
                        <span key={r} style={{ ...getRoleBadgeStyle(r), padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                          {r === 'worker' ? 'PH' : r.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {isSelf ? (
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>Cannot change own role</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {['admin', 'worker', 'viewer', 'qa', 'accountant'].map(r => {
                          const userRoles = p.roles || [p.role];
                          const hasRole = userRoles.includes(r as UserRole);
                          
                          // Styling for the toggle buttons
                          const baseStyle: React.CSSProperties = {
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: loading === p.id ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            border: '1px solid transparent',
                            userSelect: 'none',
                          };
                          
                          const activeStyle = hasRole ? getRoleBadgeStyle(r) : {
                            background: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #e2e8f0'
                          };

                          return (
                            <div 
                              key={r}
                              style={{ ...baseStyle, ...activeStyle, opacity: loading === p.id ? 0.6 : 1 }}
                              onClick={() => {
                                if (loading === p.id) return;
                                
                                const newRoles = hasRole
                                  ? userRoles.filter(existing => existing !== r)
                                  : [...userRoles, r as UserRole];
                                  
                                // Ensure at least one role
                                if (newRoles.length > 0) {
                                  handleRoleChange(p.id, newRoles);
                                } else {
                                  alert('User must have at least one role.');
                                }
                              }}
                            >
                              {hasRole && <span style={{ marginRight: '4px' }}>✓</span>}
                              {r === 'worker' ? 'PH' : r.toUpperCase()}
                            </div>
                          );
                        })}
                      </div>
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
