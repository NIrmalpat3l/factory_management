'use client';
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Company, SpringType, Profile, TaskType } from '../types/order';
import { Settings, Plus, X, Trash2 } from 'lucide-react';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOrder: (order: any) => Promise<void>;
  initialData?: Order | null;
  companies: Company[];
  onOpenAddCompany: () => void;
  newlyAddedCompany?: string | null;
  workers?: Profile[];
  springTypes?: SpringType[];
  taskTypes?: TaskType[];
  userRole?: string;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  isOpen,
  onClose,
  onSaveOrder,
  initialData,
  companies,
  onOpenAddCompany,
  newlyAddedCompany,
  workers = [],
  springTypes = [],
  taskTypes = [],
  userRole = 'admin',
}) => {
  const [orderNo, setOrderNo] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<OrderStatus>('received');

  // Spring type selection
  const [springTypeId, setSpringTypeId] = useState('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  // Worker task assignment
  const [tasks, setTasks] = useState<{task_type_id: string, worker_id: string, manual_worker_name: string, quantity_assigned: number}[]>([]);

  // Dynamic parameter values (filled by user when ordering)
  const [paramValues, setParamValues] = useState<Record<string, number>>({});

  const selectedSpring = springTypes.find(st => st.id === springTypeId);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setOrderNo(initialData.order_number || '');
      setCompanyId(initialData.company_id || '');
      setDueDate(initialData.due_date ? initialData.due_date.split('T')[0] : '');
      setStatus(initialData.status || 'received');
      
      const firstItem = initialData.order_items?.[0];
      setSpringTypeId(firstItem?.spring_type_id || '');
      setQty(initialData.total_qty_ordered || 1);
      
      const initialTasks = firstItem?.task_assignments?.map(ta => ({
        task_type_id: ta.task_type_id || '',
        worker_id: ta.worker_id || '',
        manual_worker_name: ta.manual_worker_name || '',
        quantity_assigned: ta.quantity_assigned || initialData.total_qty_ordered || 1
      })) || [];
      setTasks(initialTasks);

      // Populate dimensions
      if (firstItem?.dimensions) {
        setParamValues(firstItem.dimensions);
      } else {
        setParamValues({});
      }
    } else {
      setOrderNo(Math.floor(1000 + Math.random() * 9000).toString());
      setCompanyId(companies.length > 0 ? companies[0].id : '');
      setDueDate(new Date().toISOString().split('T')[0]);
      setStatus('received');
      setSpringTypeId(springTypes.length > 0 ? springTypes[0].id : '');
      setQty(1);
      setTasks([]);
      setParamValues({});
    }
  }, [initialData, isOpen, companies, springTypes]);

  // Reset param values when spring type changes (ONLY if not editing existing data that already has dimensions for this spring type)
  useEffect(() => {
    if (selectedSpring) {
      // If we are editing, and the currently selected spring is the one from initialData, don't overwrite with defaults
      const firstItem = initialData?.order_items?.[0];
      if (initialData && firstItem?.spring_type_id === springTypeId && Object.keys(paramValues).length > 0) {
        // We already have dimensions populated from initialData, keep them
        return;
      }

      const defaults: Record<string, number> = {};
      (selectedSpring.parameters || []).forEach(p => {
        defaults[p.parameter_id] = p.value || 0;
      });
      setParamValues(defaults);
    } else {
      setParamValues({});
    }
  }, [springTypeId, springTypes, initialData]);

  useEffect(() => {
    if (newlyAddedCompany) {
      const match = companies.find(c => c.name === newlyAddedCompany);
      if (match) setCompanyId(match.id);
    }
  }, [newlyAddedCompany, companies]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNo.trim() || !companyId) {
      alert('Please fill in required fields (Order No, Company)');
      return;
    }

    try {
      setLoading(true);
      await onSaveOrder({
        ...(initialData ? { id: initialData.id } : {}),
        order_number: orderNo,
        company_id: companyId,
        status: status,
        due_date: dueDate || null,
        _new_item: {
          spring_type_id: springTypeId || null,
          quantity_ordered: qty,
        },
        _tasks: tasks,
        _dimensions: paramValues,
        _skip_order_update: userRole === 'worker'
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  // Determine allowed statuses for worker role
  const allowedStatuses: OrderStatus[] = userRole === 'worker'
    ? ['received', 'in_progress']
    : ['received', 'in_progress', 'completed', 'cancelled'];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="form-header">
          <div className="title-area">
            <button type="button" className="three-dots-btn" onClick={onClose} style={{ padding: 0 }}>
              <X size={20} color="#64748b" />
            </button>
            <Settings size={20} color="#D9383A" />
            <span>Order Form</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-body">
            {/* ORDER NO */}
            <div className="form-field">
              <label>ORDER NO <span className="required">*</span></label>
              <input type="text" className="form-input" value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)} required disabled={userRole === 'worker'} />
            </div>

            {/* COMPANY NAME */}
            <div className="form-field">
              <label>COMPANY <span className="required">*</span></label>
              <div className="form-input-wrapper">
                <select className="form-input" value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)} required disabled={userRole === 'worker'}>
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {userRole === 'admin' && (
                  <button type="button" className="add-plus-btn" onClick={onOpenAddCompany}>
                    <Plus size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* STATUS */}
            <div className="form-field">
              <label>STATUS <span className="required">*</span></label>
              <div className="pill-selector-group">
                {allowedStatuses.map((st) => (
                  <button key={st} type="button"
                    className={`pill-btn ${status === st ? 'selected' : ''}`}
                    disabled={userRole === 'worker'}
                    onClick={() => setStatus(st)}>
                    {st.toUpperCase().replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* SPRING TYPE & PARAMETERS */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#475569' }}>
                Order Item &amp; Spring Details
              </h4>

                <div className="form-field" style={{ marginBottom: '12px' }}>
                  <label>SPRING TYPE <span className="required">*</span></label>
                  <select className="form-input" value={springTypeId}
                    onChange={e => setSpringTypeId(e.target.value)} disabled={userRole === 'worker'}>
                    <option value="">-- Select Spring Type --</option>
                    {springTypes.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.category_name || 'No Category'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Parameters for selected spring */}
                {selectedSpring && selectedSpring.parameters && selectedSpring.parameters.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
                      DIMENSIONS ({selectedSpring.parameters.length} parameters)
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedSpring.parameters.map(p => (
                        <div key={p.parameter_id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: '#334155', textTransform: 'none', letterSpacing: '0' }}>
                            {p.label} {p.unit && <span style={{ color: '#94a3b8', fontWeight: 400 }}>({p.unit})</span>}
                          </label>
                          <input type="number" step="0.001" className="form-input"
                            style={{ width: '120px', padding: '6px 8px', fontSize: '13px' }}
                            value={paramValues[p.parameter_id] || ''}
                            onChange={e => setParamValues(prev => ({
                              ...prev, [p.parameter_id]: parseFloat(e.target.value) || 0
                            }))}
                            disabled={userRole === 'worker'}
                            placeholder="0.00" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* QTY */}
                <div className="form-field">
                  <label>QTY <span className="required">*</span></label>
                  <div className="stepper-container">
                    <button type="button" className="stepper-btn" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                    <input type="number" className="stepper-input" value={qty}
                      onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} disabled={userRole === 'worker'} />
                    <button type="button" className="stepper-btn" onClick={() => setQty(qty + 1)}>+</button>
                  </div>
              </div>
            </div>

            {/* WORKER ASSIGNMENT */}
            {(userRole === 'admin' || userRole === 'worker') && (
              <div className="form-field">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span>TASKS & WORKERS</span>
                  <button type="button" className="btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}
                    onClick={() => setTasks([...tasks, { task_type_id: '', worker_id: '', manual_worker_name: '', quantity_assigned: qty }])}>
                    <Plus size={14} /> Add Task
                  </button>
                </label>
                
                {tasks.length === 0 ? (
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                    No tasks assigned yet. Click "Add Task" to assign workers.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tasks.map((task, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f1f5f9', padding: '8px', borderRadius: '6px' }}>
                        <select className="form-input" style={{ flex: 1, padding: '4px 8px', fontSize: '13px' }}
                          value={task.task_type_id}
                          onChange={e => {
                            const newTasks = [...tasks];
                            newTasks[idx].task_type_id = e.target.value;
                            setTasks(newTasks);
                          }}>
                          <option value="">-- Task Type --</option>
                          {taskTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <select className="form-input" style={{ padding: '4px 8px', fontSize: '13px' }}
                            value={task.worker_id}
                            onChange={e => {
                              const newTasks = [...tasks];
                              newTasks[idx].worker_id = e.target.value;
                              setTasks(newTasks);
                            }}>
                            <option value="">-- Unassigned --</option>
                            {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                          </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <label style={{ fontSize: '11px', color: '#64748b' }}>Qty:</label>
                          <input type="number" className="form-input" style={{ width: '60px', padding: '4px', fontSize: '13px' }}
                            value={task.quantity_assigned}
                            onChange={e => {
                              const newTasks = [...tasks];
                              newTasks[idx].quantity_assigned = parseInt(e.target.value) || 0;
                              setTasks(newTasks);
                            }}
                          />
                        </div>
                        <button type="button" className="add-plus-btn" style={{ width: '28px', height: '28px', color: '#dc2626' }}
                          onClick={() => {
                            const newTasks = [...tasks];
                            newTasks.splice(idx, 1);
                            setTasks(newTasks);
                          }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DUE DATE */}
            <div className="form-field">
              <label>DUE DATE</label>
              <input type="date" className="form-input" value={dueDate}
                onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="form-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
