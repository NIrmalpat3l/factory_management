'use client';
import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { Order, Invoice, Profile, TaskType, SpringType } from '../types/order';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  order: Order;
  taskTypes: TaskType[];
  springTypes: SpringType[];
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  order,
  taskTypes,
  springTypes,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Calculate detailed lines
  const lines = (order.order_items || []).map(item => {
    const springType = springTypes.find(st => st.id === item.spring_type_id);
    const qty = item.quantity_completed > 0 ? item.quantity_completed : (item.quantity_ordered || 0);
    
    // Group tasks by task_type_id
    const taskBreakdown: { name: string; qty: number; total: number }[] = [];
    let totalTaskCost = 0;

    if (item.task_assignments) {
      const groupedTasks = item.task_assignments.reduce((acc: any, ta: any) => {
        if (!ta.task_type_id) return acc;
        const key = `${ta.task_type_id}_${ta.worker_id || ta.manual_worker_name || 'unassigned'}`;
        if (!acc[key]) {
          const tt = taskTypes.find(t => t.id === ta.task_type_id);
          const workerName = ta.profiles?.full_name || ta.manual_worker_name || ta.worker_name || 'Unassigned';
          const workerRate = ta.profiles?.salary || 0;
          acc[key] = { name: tt?.name || 'Unknown', workerName, workerRate, qty: 0 };
        }
        const taskQty = ta.quantity_produced > 0 ? ta.quantity_produced : (ta.quantity_assigned || qty);
        acc[key].qty += taskQty;
        return acc;
      }, {} as Record<string, { name: string; workerName: string; workerRate: number; qty: number }>);

      for (const key in groupedTasks) {
        const t = groupedTasks[key];
        taskBreakdown.push({ name: `Task: ${t.name}`, qty: t.qty, total: 0 });
        const workerCost = t.workerRate * t.qty;
        taskBreakdown.push({ name: `Labour: ${t.workerName}`, qty: t.qty, total: workerCost });
        totalTaskCost += workerCost;
      }
    }

    const springTotal = 0;

    return {
      springName: item.spring_types?.name || springType?.name || 'Unknown Spring',
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
        {/* Controls - Won't be printed */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '8px 8px 0 0', gap: '8px' }}>
          <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={16} /> Print Bill Book
          </button>
          <button className="btn-cancel" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Printable Area */}
        <div className="print-area" ref={printRef} style={{ padding: '48px', color: '#1e293b' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1e293b', paddingBottom: '24px', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#D9383A', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Hari Om Spring Industries
              </h1>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#475569' }}>123 Industrial Area, Manufacturing Zone</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#475569' }}>Phone: +91 98765 43210</p>
              <p style={{ margin: '0', fontSize: '14px', color: '#475569' }}>Email: billing@hariomsprings.com</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 300, margin: '0 0 12px 0', color: '#cbd5e1' }}>INVOICE</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px', fontSize: '14px' }}>
                <span style={{ fontWeight: 600, color: '#64748b' }}>Invoice #:</span>
                <span style={{ fontWeight: 700 }}>INV-{invoice.id.substring(0,8).toUpperCase()}</span>
                <span style={{ fontWeight: 600, color: '#64748b' }}>Date:</span>
                <span style={{ fontWeight: 700 }}>{new Date(invoice.generated_at).toLocaleDateString()}</span>
                <span style={{ fontWeight: 600, color: '#64748b' }}>Order #:</span>
                <span style={{ fontWeight: 700 }}>{order.order_number}</span>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Billed To</h3>
            <p style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700 }}>{order.company_name}</p>
            {order.company?.contact_info && (
              <p style={{ margin: '0', fontSize: '14px', color: '#475569', whiteSpace: 'pre-wrap' }}>{order.company.contact_info}</p>
            )}
          </div>

          {/* Itemized List */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Item / Task Details</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Qty</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line: any, idx: number) => (
                <React.Fragment key={idx}>
                  <tr style={{ borderBottom: line.taskBreakdown.length > 0 ? 'none' : '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 12px', fontWeight: 600 }}>{line.springName}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>{line.qty.toLocaleString()}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 600 }}>${line.springTotal.toFixed(2)}</td>
                  </tr>
                  {line.taskBreakdown.map((t: any, tIdx: number) => (
                    <tr key={tIdx} style={{ borderBottom: tIdx === line.taskBreakdown.length - 1 ? '1px solid #e2e8f0' : 'none', background: '#fdfdfd' }}>
                      <td style={{ padding: '8px 12px 8px 32px', color: '#64748b', fontSize: '13px' }}>
                        ↳ <span style={{ fontWeight: 600 }}>{t.name}</span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b', fontSize: '13px' }}>{t.qty.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b', fontSize: '13px' }}>${t.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 600, color: '#64748b' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>${invoice.amount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 600, color: '#64748b' }}>Tax (0%)</span>
                <span style={{ fontWeight: 600 }}>$0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 12px', background: '#f8fafc', borderRadius: '0 0 8px 8px', marginTop: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 700 }}>Total Due</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#D9383A' }}>${invoice.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '64px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
            <p style={{ margin: '0 0 4px 0' }}>Thank you for doing business with Hari Om Spring Industries.</p>
            <p style={{ margin: '0' }}>Payment is due within 30 days of the invoice date.</p>
          </div>
        </div>

        {/* Global Print Styles */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            .modal-overlay { background: none !important; padding: 0 !important; }
            .modal-content { box-shadow: none !important; max-width: 100% !important; }
            .no-print { display: none !important; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          }
        `}} />
      </div>
    </div>
  );
};
