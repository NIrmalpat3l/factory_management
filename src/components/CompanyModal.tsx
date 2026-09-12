'use client';
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCompany: (name: string) => Promise<void>;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({ isOpen, onClose, onAddCompany }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Company name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onAddCompany(name.trim());
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '360px' }}>
        <div className="form-header">
          <div className="title-area">
            <Plus size={18} color="#D9383A" />
            <span>Add New Company</span>
          </div>
          <button className="three-dots-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-body">
            {error && <div style={{ color: '#dc2626', fontSize: '12px' }}>{error}</div>}
            <div className="form-field">
              <label>Company Name <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Industrial Springs"
                autoFocus
              />
            </div>
          </div>

          <div className="form-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Add Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
