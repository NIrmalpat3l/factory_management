'use client';

import React, { useEffect, useState } from 'react';
import { Order, Invoice, Profile } from '../types/order';
import { api } from '../services/api';
import { FileText, DollarSign, Users, CheckCircle, RotateCw, Eye } from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';
import { VerifyInvoiceModal } from './VerifyInvoiceModal';

interface AccountantDashboardProps {
  orders: Order[];
}

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({ orders }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [springTypes, setSpringTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewInvoiceModal, setViewInvoiceModal] = useState<{invoice: Invoice, order: Order} | null>(null);
  const [verifyInvoiceOrder, setVerifyInvoiceOrder] = useState<{order: Order, totalAmount: number} | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const invs = await api.getInvoices();
      const tTypes = await api.getTaskTypes();
      const sTypes = await api.getSpringTypes();
      
      // Fetch profiles manually here since we need them for payroll
      const { supabase } = await import('../lib/supabase');
      const { data: profs } = await supabase.from('profiles').select('*').order('full_name');
      
      setInvoices(invs);
      setTaskTypes(tTypes);
      setSpringTypes(sTypes);
      if (profs) setProfiles(profs);
    } catch (err) {
      console.error('Failed to fetch accounting data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateInvoice = async (orderId: string, amount: number) => {
    try {
      await api.generateInvoice(orderId, amount);
      fetchData(); // refresh
    } catch (err: any) {
      alert('Failed to generate invoice: ' + err.message);
    }
  };

  const handleToggleInvoiceStatus = async (invoiceId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
      await api.updateInvoiceStatus(invoiceId, newStatus);
      fetchData();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Find orders that are eligible for an invoice but don't have one yet
  // Criteria: completed and qc_status is passed.
  const eligibleOrders = orders.filter(o => 
    o.status === 'completed' && 
    o.qc_status === 'passed' && 
    !invoices.some(i => i.order_id === o.id)
  );

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const totalUnpaid = invoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + i.amount, 0);
  const totalPayroll = profiles.reduce((sum, p) => sum + (Number(p.salary) || 0), 0);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Accounting & Payroll Dashboard</h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Manage invoices and monitor member salaries.</p>
        </div>
        <button className="add-plus-btn" onClick={fetchData} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}>
          <RotateCw size={18} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="accountant-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 700 }}>${totalPaid.toLocaleString()}</h3>
            <p style={{ color: '#64748b', fontSize: '13px' }}>Paid Invoices</p>
          </div>
        </div>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 700 }}>${totalUnpaid.toLocaleString()}</h3>
            <p style={{ color: '#64748b', fontSize: '13px' }}>Unpaid Invoices</p>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 700 }}>${totalPayroll.toLocaleString()}</h3>
            <p style={{ color: '#64748b', fontSize: '13px' }}>Total Monthly Salaries</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Pending Invoice Generation */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ fontWeight: 600 }}>Ready for Invoicing</h3>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Orders that are completed and have passed QA.</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '12px 16px' }}>Order #</th>
                <th style={{ padding: '12px 16px' }}>Company</th>
                <th style={{ padding: '12px 16px' }}>Completion Date</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {eligibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No pending invoices.</td>
                </tr>
              ) : (
                eligibleOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>#{o.order_number}</td>
                    <td style={{ padding: '12px 16px', color: '#d97706', fontWeight: 500 }}>{o.company_name}</td>
                    <td style={{ padding: '12px 16px' }}>{new Date().toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button 
                        style={{ padding: '6px 12px', background: '#D9383A', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                        onClick={() => {
                          // Automatically calculate the amount
                          let calculatedTotal = 0;
                          (o.order_items || []).forEach(item => {
                            const st = springTypes.find(s => s.id === item.spring_type_id);
                            const springQty = item.quantity_completed > 0 ? item.quantity_completed : (item.quantity_ordered || 0);
                            calculatedTotal += (st?.pay_rate || 0) * springQty;
                            if (item.task_assignments) {
                              item.task_assignments.forEach(ta => {
                                const tt = taskTypes.find(t => t.id === ta.task_type_id);
                                const workerSalary = ta.profiles?.salary || 0;
                                const taskQty = ta.quantity_produced > 0 ? ta.quantity_produced : (ta.quantity_assigned || springQty);
                                calculatedTotal += ((tt?.rate || 0) + workerSalary) * taskQty;
                              });
                            }
                          });
                          
                          setVerifyInvoiceOrder({ order: o, totalAmount: calculatedTotal });
                        }}
                      >
                        Generate Invoice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Generated Invoices */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ fontWeight: 600 }}>Generated Invoices</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '12px 16px' }}>Invoice ID</th>
                <th style={{ padding: '12px 16px' }}>Order #</th>
                <th style={{ padding: '12px 16px' }}>Amount</th>
                <th style={{ padding: '12px 16px' }}>Generated Date</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No invoices generated.</td>
                </tr>
              ) : (
                invoices.map(inv => {
                  const order = orders.find(o => o.id === inv.order_id);
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '11px' }}>{inv.id.substring(0,8)}...</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>#{order?.order_number || 'Unknown'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>${Number(inv.amount).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}>{new Date(inv.generated_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleToggleInvoiceStatus(inv.id, inv.status)}
                          style={{
                            padding: '4px 10px',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: inv.status === 'paid' ? '#d1fae5' : '#fee2e2',
                            color: inv.status === 'paid' ? '#059669' : '#dc2626'
                          }}
                        >
                          {inv.status === 'paid' ? 'PAID' : 'UNPAID'}
                        </button>
                        {order && (
                          <button 
                            onClick={() => setViewInvoiceModal({ invoice: inv, order })}
                            style={{ padding: '4px 8px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569' }}
                          >
                            <Eye size={12} /> View Bill Book
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Member Payroll */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ fontWeight: 600 }}>Member Salaries</h3>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Overview of all member salaries set by Admin.</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '12px 16px' }}>Name</th>
                <th style={{ padding: '12px 16px' }}>Role</th>
                <th style={{ padding: '12px 16px' }}>Salary</th>
              </tr>
            </thead>
            <tbody>
              {profiles.filter(p => p.is_active).map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{p.full_name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {(p.roles || [p.role]).map(r => (
                      <span key={r} style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', marginRight: '4px' }}>
                        {r.toUpperCase()}
                      </span>
                    ))}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                    ${Number(p.salary || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewInvoiceModal && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setViewInvoiceModal(null)}
          invoice={viewInvoiceModal.invoice}
          order={viewInvoiceModal.order}
          taskTypes={taskTypes}
          springTypes={springTypes}
        />
      )}

      {verifyInvoiceOrder && (
        <VerifyInvoiceModal
          isOpen={true}
          onClose={() => setVerifyInvoiceOrder(null)}
          order={verifyInvoiceOrder.order}
          taskTypes={taskTypes}
          springTypes={springTypes}
          totalAmount={verifyInvoiceOrder.totalAmount}
          onGenerate={() => handleGenerateInvoice(verifyInvoiceOrder.order.id, verifyInvoiceOrder.totalAmount)}
        />
      )}
    </div>
  );
};
