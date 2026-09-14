'use client';
import React, { useState, useEffect } from 'react';
import { SpringType, SpringParameter, SpringCategory, SpringTypeParam } from '../types/order';
import { api } from '../services/api';
import { Plus, Edit, Trash2, X, Settings, Save, ChevronLeft } from 'lucide-react';

interface SpringConfigModalProps {
  springTypes: SpringType[];
  parameters: SpringParameter[];
  categories: SpringCategory[];
  onRefresh: () => void;
}

export const SpringConfigPanel: React.FC<SpringConfigModalProps> = ({
  springTypes,
  parameters,
  categories,
  onRefresh,
}) => {
  const [editingType, setEditingType] = useState<SpringType | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showParamAdd, setShowParamAdd] = useState(false);
  const [newParamCode, setNewParamCode] = useState('');
  const [newParamLabel, setNewParamLabel] = useState('');
  const [newParamUnit, setNewParamUnit] = useState('');

  const [showCategoryAdd, setShowCategoryAdd] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedParams, setSelectedParams] = useState<{ parameter_id: string; value: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (editingType) {
      setName(editingType.name);
      setCategoryId(editingType.category_id);
      setSelectedParams(
        (editingType.parameters || []).map(p => ({
          parameter_id: p.parameter_id,
          value: p.value,
        }))
      );
    } else if (isAdding) {
      setName('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setSelectedParams([]);
    }
  }, [editingType, isAdding, categories]);

  const isFormOpen = isAdding || editingType !== null;

  const toggleParam = (paramId: string) => {
    setSelectedParams(prev => {
      const exists = prev.find(p => p.parameter_id === paramId);
      if (exists) return prev.filter(p => p.parameter_id !== paramId);
      return [...prev, { parameter_id: paramId, value: 0 }];
    });
  };

  const updateParamValue = (paramId: string, value: number) => {
    setSelectedParams(prev =>
      prev.map(p => p.parameter_id === paramId ? { ...p, value } : p)
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !categoryId) {
      alert('Name and Category are required');
      return;
    }
    try {
      setLoading(true);
      const payload = { name, category_id: categoryId, parameters: selectedParams };
      if (editingType) {
        await api.updateSpringType(editingType.id, payload);
      } else {
        await api.createSpringType(payload);
      }
      setEditingType(null);
      setIsAdding(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.deleteSpringType(deleteConfirmId);
      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: any) {
      setDeleteConfirmId(null);
      if (err.message?.includes('violates foreign key constraint') || err.message?.includes('order_items_spring_type_id_fkey')) {
        setErrorModalMessage('Cannot delete this spring type because it is currently being used in one or more orders. You must delete those orders first, or simply leave the spring type active.');
      } else {
        setErrorModalMessage(err.message || 'Failed to delete spring type.');
      }
    }
  };

  const handleAddParam = async () => {
    if (!newParamCode.trim() || !newParamLabel.trim()) return;
    try {
      await api.createSpringParameter({
        code: newParamCode.trim().toLowerCase().replace(/\s+/g, '_'),
        label: newParamLabel.trim(),
        unit: newParamUnit.trim() || null,
      });
      setNewParamCode('');
      setNewParamLabel('');
      setNewParamUnit('');
      setShowParamAdd(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add parameter');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCat = await api.createSpringCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowCategoryAdd(false);
      onRefresh();
      setCategoryId(newCat.id);
    } catch (err: any) {
      alert(err.message || 'Failed to add category');
    }
  };

  if (isFormOpen) {
    return (
      <div>
        <div className="desktop-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="add-plus-btn" style={{ width: '36px', height: '36px' }}
              onClick={() => { setEditingType(null); setIsAdding(false); }}>
              <ChevronLeft size={18} />
            </button>
            <h1>{editingType ? 'Edit Spring Type' : 'Add Spring Type'}</h1>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', maxWidth: '600px' }}>
          <div className="form-field" style={{ marginBottom: '16px' }}>
            <label>SPRING NAME <span className="required">*</span></label>
            <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Compression Spring A" />
          </div>

          <div className="form-field" style={{ marginBottom: '16px' }}>
            <label>CATEGORY <span className="required">*</span></label>
            <div className="form-input-wrapper">
              <select className="form-input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" className="add-plus-btn" onClick={() => setShowCategoryAdd(!showCategoryAdd)} title="Add new category">
                <Plus size={18} />
              </button>
            </div>
            {showCategoryAdd && (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', marginTop: '12px', border: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                <input type="text" className="form-input" placeholder="Category Name (e.g. Compression)" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={{ flex: 1 }} />
                <button type="button" className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleAddCategory}>
                  Add
                </button>
              </div>
            )}
          </div>

          <div className="form-field" style={{ marginBottom: '16px' }}>
            <label style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>PARAMETERS (select which dimensions this spring measures)</span>
              <button type="button" className="add-plus-btn" style={{ width: '28px', height: '28px' }}
                onClick={() => setShowParamAdd(!showParamAdd)} title="Add new parameter">
                <Plus size={14} />
              </button>
            </label>

            {showParamAdd && (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input type="text" className="form-input" placeholder="Code (e.g. wire_dia)" value={newParamCode} onChange={e => setNewParamCode(e.target.value)} style={{ flex: 1 }} />
                  <input type="text" className="form-input" placeholder="Label (e.g. Wire Diameter)" value={newParamLabel} onChange={e => setNewParamLabel(e.target.value)} style={{ flex: 1 }} />
                  <input type="text" className="form-input" placeholder="Unit (mm)" value={newParamUnit} onChange={e => setNewParamUnit(e.target.value)} style={{ width: '80px' }} />
                </div>
                <button type="button" className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleAddParam}>
                  <Plus size={14} /> Add Parameter
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {parameters.map(p => {
                const isSelected = selectedParams.some(sp => sp.parameter_id === p.id);
                const currentValue = selectedParams.find(sp => sp.parameter_id === p.id)?.value || 0;
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', borderRadius: '6px',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--primary-light)' : '#fff',
                    cursor: 'pointer',
                  }}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleParam(p.id)}
                      style={{ accentColor: 'var(--primary)' }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{p.label}</span>
                      {p.unit && <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '4px' }}>({p.unit})</span>}
                    </div>
                    {isSelected && (
                      <input type="number" step="0.01" className="form-input"
                        style={{ width: '100px', padding: '4px 8px', fontSize: '13px' }}
                        value={currentValue}
                        onChange={e => updateParamValue(p.id, parseFloat(e.target.value) || 0)}
                        placeholder="Ref value"
                        onClick={e => e.stopPropagation()} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn-cancel" onClick={() => { setEditingType(null); setIsAdding(false); }}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={loading} style={{ padding: '8px 20px' }}>
              <Save size={16} /> {loading ? 'Saving...' : 'Save Spring Type'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="desktop-header-row">
        <div>
          <h1>Spring Configuration</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
            Manage spring types, their measurement parameters, and pay rates.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={18} /> Add Spring Type
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Required Parameters</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {springTypes.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No spring types configured yet. Click "Add Spring Type" to get started.
                </td>
              </tr>
            ) : (
              springTypes.map(st => (
                <tr key={st.id}>
                  <td><strong>{st.name}</strong></td>
                  <td>{st.category_name || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(st.parameters || []).map(p => (
                        <span key={p.parameter_id} className="badge" style={{ fontSize: '10px' }}>
                          {p.label}{p.unit ? ` (${p.unit})` : ''}
                        </span>
                      ))}
                      {(!st.parameters || st.parameters.length === 0) && <span style={{ color: '#94a3b8', fontSize: '12px' }}>None</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="add-plus-btn" style={{ width: '32px', height: '32px' }}
                        onClick={() => setEditingType(st)} title="Edit">
                        <Edit size={14} />
                      </button>
                      <button className="add-plus-btn" style={{ width: '32px', height: '32px', color: '#dc2626' }}
                        onClick={() => setDeleteConfirmId(st.id)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
            <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>Delete Spring Type</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
              Are you sure you want to delete this spring type? This action cannot be undone.
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
