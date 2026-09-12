'use client';
import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWorker: (name: string, contact: string) => Promise<void>;
}

export const WorkerModal: React.FC<WorkerModalProps> = ({ isOpen, onClose, onAddWorker }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await onAddWorker(name.trim(), contact.trim());
      setName('');
      setContact('');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to add worker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="form-header">
          <div className="title-area">
            <button className="three-dots-btn" onClick={onClose} style={{ padding: 0 }}>
              <X size={20} color="#64748b" />
            </button>
            <UserPlus size={20} color="#D9383A" />
            <span>Add Worker</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-body">
            <div className="form-field">
              <label>WORKER NAME <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Singh"
                required
              />
            </div>
            
            <div className="form-field">
              <label>CONTACT (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="form-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Add Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
