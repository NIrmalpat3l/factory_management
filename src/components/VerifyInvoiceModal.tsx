'use client';
import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { Order, Profile, TaskType, SpringType } from '../types/order';

interface VerifyInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  taskTypes: TaskType[];
  springTypes: SpringType[];
  totalAmount: number;
  onGenerate: () => void;
}

export const VerifyInvoiceModal: React.FC<VerifyInvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  taskTypes,
  springTypes,
  totalAmount,
  onGenerate,
}) => {
  if (!isOpen) return null;

  // Calculate detailed lines
  const lines = (order.order_items || []).map(item => {
    const springType = springTypes.find(st => st.id === item.spring_type_id);
    const springRate = springType?.pay_rate || 0;
    const qty = item.quantity_completed > 0 ? item.quantity_completed : (item.quantity_ordered || 0);
    
    // Group tasks by task_type_id
    const taskBreakdown: { name: string; rate: number; qty: number; total: number }[] = [];
    let totalTaskCost = 0;

    if (item.task_assignments) {
      const groupedTasks = item.task_assignments.reduce((acc, ta) => {
        if (!ta.task_type_id) return acc;
        
        // Use a unique key for grouping by task and worker
        const key = `${ta.task_type_id}_${ta.worker_id || 'unassigned'}`;
        
        if (!acc[key]) {
          const tt = taskTypes.find(t => t.id === ta.task_type_id);
          const workerName = ta.profiles?.full_name || ta.worker_name || 'Unassigned';
          const workerRate = ta.profiles?.salary || 0;
          acc[key] = { name: tt?.name || 'Unknown', workerName, taskRate: tt?.rate || 0, workerRate, qty: 0 };
        }
        // Fallback to assigned or ordered quantity if produced is 0 for testing purposes
        const taskQty = ta.quantity_produced > 0 ? ta.quantity_produced : (ta.quantity_assigned || qty);
        acc[key].qty += taskQty;
        return acc;
      }, {} as Record<string, { name: string; workerName: string; taskRate: number; workerRate: number; qty: number }>);

      for (const key in groupedTasks) {
        const t = groupedTasks[key];
        
        // Task entry
        const taskCost = t.taskRate * t.qty;
        taskBreakdown.push({ name: `Task: ${t.name}`, rate: t.taskRate, qty: t.qty, total: taskCost });
        
        // Worker entry
        const workerCost = t.workerRate * t.qty;
        taskBreakdown.push({ name: `Labour: ${t.workerName}`, rate: t.workerRate, qty: t.qty, total: workerCost });
        
        totalTaskCost += (taskCost + workerCost);
      }
    }

    const springTotal = springRate * qty;

    return {
      springName: item.spring_types?.name || springType?.name || 'Unknown Spring',
      springRate,
      qty,
      springTotal,
      taskBreakdown,
      itemTotal: springTotal + totalTaskCost,
    };
  });

  return (
    <div className="modal-overlay" style={{ padding: '24px', zIndex: 1000, overflowY: 'auto' }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '800px', 
          width: '100%', 
          padding: '0', 
          background: '#fff', 
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative'
        }}
      >
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '8px 8px 0 0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>Verify Invoice Details</h2>
          <button className="btn-cancel" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Verification Area */}
        <div style={{ padding: '32px 48px', color: '#1e293b' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Project Info</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Order #:</span>
                <span style={{ fontWeight: 600 }}>{order.order_number}</span>
                <span style={{ color: '#64748b' }}>Company:</span>
                <span style={{ fontWeight: 600 }}>{order.company_name}</span>
                <span style={{ color: '#64748b' }}>Completed On:</span>
                <span style={{ fontWeight: 600 }}>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Amount Breakdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>${totalAmount.toLocaleString()}</span>
                <span style={{ color: '#64748b' }}>Tax:</span>
                <span style={{ fontWeight: 600 }}>$0.00</span>
                <span style={{ color: '#64748b' }}>Total Due:</span>
                <span style={{ fontWeight: 700, color: '#D9383A', fontSize: '16px' }}>${totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Work & Resource Breakdown</h3>
          
          {/* Itemized List */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Item / Task Details</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Qty</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Rate</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <React.Fragment key={idx}>
                  <tr style={{ borderBottom: line.taskBreakdown.length > 0 ? 'none' : '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 12px', fontWeight: 600 }}>{line.springName}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>{line.qty.toLocaleString()}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'right', color: '#64748b' }}>${line.springRate.toFixed(2)}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 600 }}>${line.springTotal.toFixed(2)}</td>
                  </tr>
                  {line.taskBreakdown.map((t, tIdx) => (
                    <tr key={tIdx} style={{ borderBottom: tIdx === line.taskBreakdown.length - 1 ? '1px solid #e2e8f0' : 'none', background: '#fdfdfd' }}>
                      <td style={{ padding: '8px 12px 8px 32px', color: '#64748b', fontSize: '13px' }}>
                        ↳ <span style={{ fontWeight: 600 }}>{t.name}</span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b', fontSize: '13px' }}>{t.qty.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8', fontSize: '13px' }}>${t.rate.toFixed(2)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b', fontSize: '13px' }}>${t.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>

        </div>
        
        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn-cancel" onClick={onClose} style={{ padding: '10px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => { onGenerate(); onClose(); }} style={{ padding: '10px 24px', fontSize: '15px' }}>
            <CheckCircle2 size={18} /> Approve & Generate Invoice
          </button>
        </div>
      </div>
    </div>
  );
};
