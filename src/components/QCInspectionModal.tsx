'use client';
import React, { useState, useEffect } from 'react';
import { Order } from '../types/order';
import { api } from '../services/api';
import { Plus, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface QCInspectionModalProps {
  order: Order;
  onClose: () => void;
  onSave: () => void;
  currentUserId: string;
}

export const QCInspectionModal: React.FC<QCInspectionModalProps> = ({
  order,
  onClose,
  onSave,
  currentUserId
}) => {
  const [stage, setStage] = useState<'in_progress' | 'after_completion'>('in_progress');
  const [status, setStatus] = useState<'pending' | 'passed' | 'failed'>('pending');
  const [notes, setNotes] = useState('');
  
  // parameter_id -> { actual, expected }
  const [results, setResults] = useState<Record<string, { actual: string, expected: number | null }>>({});
  const [allParams, setAllParams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // For selecting a new param
  const [selectedParamToAdd, setSelectedParamToAdd] = useState('');

  // Existing inspection ID if editing
  const [inspectionId, setInspectionId] = useState<string | null>(null);

  const orderItem = order.order_items?.[0];

  useEffect(() => {
    const init = async () => {
      try {
        const p = await api.getSpringParameters();
        setAllParams(p);

        // Load existing inspection
        const existing = await api.getQCInspections(order.id);
        if (existing && existing.length > 0) {
          const latest = existing[0];
          setInspectionId(latest.id);
          setStage(latest.stage);
          setStatus(latest.status);
          setNotes(latest.notes || '');

          if (latest.results && latest.results.length > 0) {
            const loadedResults: Record<string, any> = {};
            latest.results.forEach((r: any) => {
              loadedResults[r.parameter_id] = {
                actual: r.actual_value.toString(),
                expected: r.expected_value
              };
            });
            setResults(loadedResults);
          }
        }
      } catch (err: any) {
        if (err.message.includes('schema cache')) {
          alert("Database schema is updating. Please reload the page or click 'Reload Schema' in Supabase to continue.");
        } else {
          console.error("Failed to load QC data", err);
        }
      }
    };
    init();
  }, [order.id]);

  const handleAddParam = () => {
    if (!selectedParamToAdd) return;
    if (results[selectedParamToAdd]) return; // already added

    // Find expected value if it exists in order dimensions
    let expected: number | null = null;
    if (orderItem && orderItem.dimensions && orderItem.dimensions[selectedParamToAdd] !== undefined) {
      expected = orderItem.dimensions[selectedParamToAdd];
    }

    setResults(prev => ({
      ...prev,
      [selectedParamToAdd]: { actual: '', expected }
    }));
    setSelectedParamToAdd('');
  };

  const handleRemoveParam = (pid: string) => {
    setResults(prev => {
      const next = { ...prev };
      delete next[pid];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'pending') {
      alert("Please select a final PASSED or FAILED status.");
      return;
    }
    
    try {
      setLoading(true);
      
      const inspectionData = {
        stage,
        status,
        notes,
        inspector_id: currentUserId
      };

      const resultsData = Object.entries(results).map(([pid, r]) => {
        const actual = Number(r.actual);
        const expected = r.expected !== null ? Number(r.expected) : null;
        
        let isPassed = true;
        if (expected !== null && !isNaN(actual)) {
          // 5% tolerance check
          isPassed = Math.abs(expected - actual) <= (expected * 0.05);
        }

        return {
          parameter_id: pid,
          expected_value: expected,
          actual_value: actual,
          is_passed: isPassed
        };
      }).filter(r => !isNaN(r.actual_value));

      if (inspectionId) {
        await api.updateQCInspection(inspectionId, order.id, inspectionData, resultsData);
      } else {
        await api.createQCInspection(order.id, inspectionData, resultsData);
      }
      onSave();
    } catch (err: any) {
      if (err.message.includes('schema cache')) {
        alert("Failed to save: Could not find the table in the schema cache. Please click 'Reload Schema' in your Supabase SQL editor or wait a minute and reload the page.");
      } else {
        alert('Failed to save QC inspection: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get available params to add (exclude already added)
  const availableParams = allParams.filter(p => !results[p.id]);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px', padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        
        <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: 700 }}>QC Inspection</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Order #{order.order_number} • {order.company_name}
            </p>
          </div>
          <div className={`status-pill ${order.status.toUpperCase()}`}>
            {order.status.replace('_', ' ')}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="modal-body" style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Stage & Status Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', letterSpacing: '0.5px' }}>INSPECTION STAGE</label>
                <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                  <button type="button" 
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: stage === 'in_progress' ? '#ffffff' : 'transparent', color: stage === 'in_progress' ? '#0f172a' : '#64748b', fontWeight: stage === 'in_progress' ? 600 : 500, boxShadow: stage === 'in_progress' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px' }}
                    onClick={() => setStage('in_progress')}
                  >
                    In Progress
                  </button>
                  <button type="button" 
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: stage === 'after_completion' ? '#ffffff' : 'transparent', color: stage === 'after_completion' ? '#0f172a' : '#64748b', fontWeight: stage === 'after_completion' ? 600 : 500, boxShadow: stage === 'after_completion' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px' }}
                    onClick={() => setStage('after_completion')}
                  >
                    After Completion
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', letterSpacing: '0.5px' }}>OVERALL RESULT</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: status === 'passed' ? '2px solid #10b981' : '1px solid #e2e8f0', background: status === 'passed' ? '#ecfdf5' : '#ffffff', color: status === 'passed' ? '#047857' : '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s', fontSize: '13px' }}
                    onClick={() => setStatus('passed')}
                  >
                    <CheckCircle size={16} /> Passed
                  </button>
                  <button type="button" 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: status === 'failed' ? '2px solid #ef4444' : '1px solid #e2e8f0', background: status === 'failed' ? '#fef2f2' : '#ffffff', color: status === 'failed' ? '#b91c1c' : '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s', fontSize: '13px' }}
                    onClick={() => setStatus('failed')}
                  >
                    <XCircle size={16} /> Failed
                  </button>
                </div>
              </div>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid #e2e8f0' }} />

            {/* Dynamic Parameter Selection */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.5px' }}>TEST PARAMETERS</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    className="form-input" 
                    style={{ padding: '6px 10px', fontSize: '13px', width: '200px' }}
                    value={selectedParamToAdd}
                    onChange={e => setSelectedParamToAdd(e.target.value)}
                  >
                    <option value="">-- Choose parameter --</option>
                    {availableParams.map(p => (
                      <option key={p.id} value={p.id}>{p.label} {p.unit && `(${p.unit})`}</option>
                    ))}
                  </select>
                  <button type="button" className="btn-primary" style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }} onClick={handleAddParam} disabled={!selectedParamToAdd}>
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>

              {Object.keys(results).length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13.5px' }}>
                  No parameters added for testing. Please select a parameter above.
                </div>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '10px 16px' }}>Parameter</th>
                        <th style={{ padding: '10px 16px', width: '100px', textAlign: 'center' }}>Expected</th>
                        <th style={{ padding: '10px 16px', width: '140px' }}>Actual</th>
                        <th style={{ padding: '10px 16px', width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(results).map(([pid, res]) => {
                        const paramDef = allParams.find(p => p.id === pid);
                        return (
                          <tr key={pid}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>
                              {paramDef?.label || 'Unknown'} {paramDef?.unit && <span style={{ color: '#94a3b8', fontWeight: 400 }}>({paramDef.unit})</span>}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
                              {res.expected !== null ? res.expected : <span style={{ opacity: 0.5 }}>-</span>}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <input 
                                type="number" 
                                step="0.001"
                                className="form-input" 
                                style={{ padding: '6px 10px', width: '100%' }}
                                value={res.actual}
                                placeholder="0.00"
                                onChange={e => {
                                  setResults(prev => ({
                                    ...prev,
                                    [pid]: { ...prev[pid], actual: e.target.value }
                                  }));
                                }}
                                required
                              />
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <button type="button" onClick={() => handleRemoveParam(pid)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} title="Remove">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="form-field">
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.5px' }}>INSPECTOR NOTES</label>
              <textarea 
                className="form-input" 
                rows={3} 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                placeholder="Add any observations, rejection reasons, or test conditions..."
                style={{ padding: '12px', resize: 'vertical' }}
              />
            </div>

          </div>

          <div className="form-footer" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-cancel" onClick={onClose} style={{ padding: '10px 20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', color: '#334155' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || status === 'pending'} style={{ padding: '10px 24px', borderRadius: '6px' }}>
              {loading ? 'Saving...' : 'Save Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
