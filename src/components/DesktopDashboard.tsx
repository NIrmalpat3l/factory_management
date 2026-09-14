'use client';

import React from 'react';
import { Order, OrderStats, ActiveTab, OrderStatus, UserRole } from '../types/order';
import {
  Factory,
  Clock,
  PlayCircle,
  CheckCircle2,
  Plus,
  Search,
  RotateCw,
  Edit,
  Trash2,
  Layers,
  XCircle,
  Settings,
  Users,
  Wrench,
  ListTodo,
  FileText,
} from 'lucide-react';
import { AccountantDashboard } from './AccountantDashboard';

interface DesktopDashboardProps {
  orders: Order[];
  stats: OrderStats | null;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenNewOrder: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onQuickStatusChange: (order: Order, newStatus: OrderStatus) => void;
  onInspectOrder?: (order: Order) => void;
  onRefresh: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  userRole?: UserRole;
  userRoles: UserRole[];
  children?: React.ReactNode; // For rendering config panels
}

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
  orders,
  stats,
  activeTab,
  onSelectTab,
  onOpenNewOrder,
  onEditOrder,
  onDeleteOrder,
  onQuickStatusChange,
  onInspectOrder,
  onRefresh,
  searchQuery,
  setSearchQuery,
  userRole,
  userRoles,
  children,
}) => {
  const [qaSubTab, setQaSubTab] = React.useState<'pending' | 'passed' | 'failed'>('pending');

  const isAdmin = userRoles.includes('admin');
  const isWorker = userRoles.includes('worker');
  const isViewer = userRoles.includes('viewer');
  const isQA = userRoles.includes('qa');
  const isAccountant = userRoles.includes('accountant');
  const isConfigTab = activeTab === 'SPRING CONFIG' || activeTab === 'TASK CONFIG' || activeTab === 'WORKERS' || activeTab === 'USERS' || activeTab === 'ACCOUNTING';

  const hideCompanyAndAssignedTo = isWorker && !isAdmin && activeTab !== 'QA PORTAL';

  const getFilteredOrders = () => {
    let filtered = [...orders];

    if (activeTab === 'RECEIVED') {
      filtered = filtered.filter(o => o.status === 'received');
    } else if (activeTab === 'IN PROGRESS') {
      filtered = filtered.filter(o => o.status === 'in_progress');
    } else if (activeTab === 'COMPLETED') {
      filtered = filtered.filter(o => o.status === 'completed');
    } else if (activeTab === 'CANCELLED') {
      filtered = filtered.filter(o => o.status === 'cancelled');
    } else if (activeTab === 'QA PORTAL') {
      filtered = filtered.filter(o => 
        o.status === 'in_progress' || o.status === 'completed' || o.qc_status === 'passed' || o.qc_status === 'failed'
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        o =>
          (o.company_name && o.company_name.toLowerCase().includes(q)) ||
          o.order_number.toLowerCase().includes(q) ||
          (o.spring_names && o.spring_names.toLowerCase().includes(q))
      );
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  const renderOrdersTable = (ordersList: Order[], emptyMessage: string) => (
    <div className="table-container" style={{ marginBottom: '24px' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Order #</th>
            {!hideCompanyAndAssignedTo && <th>Company Name</th>}
            <th>Spring Types</th>
            <th>Total Qty</th>
            <th>Completed</th>
            {!hideCompanyAndAssignedTo && <th>Assigned To</th>}
            <th>Due Date</th>
            <th>Status</th>
            <th>QC Status</th>
            {((isAdmin || isWorker) && activeTab !== 'QA PORTAL') && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {ordersList.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            ordersList.map((order) => {
              const statusOptions = isWorker
                ? getWorkerStatusOptions(order.status)
                : (['received', 'in_progress', 'completed', 'cancelled'] as OrderStatus[]);

              return (
                <tr key={order.id}>
                  <td><strong>#{order.order_number}</strong></td>
                  {!hideCompanyAndAssignedTo && <td style={{ fontWeight: 600, color: '#d97706' }}>{order.company_name}</td>}
                  <td>{order.spring_names || '-'}</td>
                  <td><strong>{order.total_qty_ordered}</strong></td>
                  <td style={{ color: order.total_qty_completed === order.total_qty_ordered ? '#10b981' : 'inherit' }}>
                    <strong>{order.total_qty_completed}</strong>
                  </td>
                  {!hideCompanyAndAssignedTo && <td>{order.assigned_worker_name || <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>}
                  <td>{order.due_date ? new Date(order.due_date).toLocaleDateString() : '-'}</td>
                  <td>
                    {isViewer ? (
                      <span className={`status-pill ${order.status.toUpperCase()}`}>
                        {order.status.toUpperCase().replace('_', ' ')}
                      </span>
                    ) : (
                      <select
                        className={`status-pill ${order.status.toUpperCase()}`}
                        value={order.status}
                        onChange={(e) => onQuickStatusChange(order, e.target.value as OrderStatus)}
                        style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s}>{s.toUpperCase().replace('_', ' ')}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {(isAdmin || activeTab === 'QA PORTAL') ? (
                      <button
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: order.qc_status === 'passed' ? '#10b981' : order.qc_status === 'failed' ? '#ef4444' : '' }}
                        onClick={() => onInspectOrder?.(order)}
                      >
                        {order.qc_status === 'passed' || order.qc_status === 'failed' ? 'Re-Inspect' : 'Inspect'}
                      </button>
                    ) : (
                      <span className={`status-pill ${order.qc_status?.toUpperCase() || 'PENDING'}`}>
                        {order.qc_status?.toUpperCase() || 'PENDING'}
                      </span>
                    )}
                  </td>
                  {((isAdmin || isWorker) && activeTab !== 'QA PORTAL') && (
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="add-plus-btn" style={{ width: '32px', height: '32px' }} onClick={() => onEditOrder(order)} title="Edit Order">
                          <Edit size={14} />
                        </button>
                        {isAdmin && (
                          <button className="add-plus-btn" style={{ width: '32px', height: '32px', color: '#dc2626' }} onClick={() => onDeleteOrder(order.id)} title="Delete Order">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const navItems: { id: ActiveTab; label: string; count?: number; icon: React.ReactNode }[] = [
    { id: 'ALL ORDERS', label: 'All Factory Orders', count: stats?.total, icon: <Factory size={18} /> },
    { id: 'RECEIVED', label: 'Received', count: stats?.received, icon: <Clock size={18} /> },
    { id: 'IN PROGRESS', label: 'In Process', count: stats?.in_progress, icon: <PlayCircle size={18} /> },
    { id: 'COMPLETED', label: 'Completed', count: stats?.completed, icon: <CheckCircle2 size={18} /> },
    { id: 'CANCELLED', label: 'Cancelled', count: stats?.cancelled, icon: <XCircle size={18} /> },
  ];

  // Admin-only nav items
  const adminNavItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [];
  if (isQA) {
    adminNavItems.push({ id: 'QA PORTAL', label: 'Quality Check', icon: <CheckCircle2 size={18} /> });
  }
  if (isAccountant || isAdmin) {
    adminNavItems.push({ id: 'ACCOUNTING', label: 'Accounting', icon: <FileText size={18} /> });
  }
  if (isAdmin) {
    adminNavItems.push(
      { id: 'SPRING CONFIG', label: 'Spring Config', icon: <Settings size={18} /> },
      { id: 'TASK CONFIG', label: 'Task Config', icon: <ListTodo size={18} /> },
      { id: 'WORKERS', label: 'Members', icon: <Wrench size={18} /> },
      { id: 'USERS', label: 'User Roles', icon: <Users size={18} /> }
    );
  }

  // Worker status change restrictions
  const getWorkerStatusOptions = (currentStatus: OrderStatus): OrderStatus[] => {
    if (currentStatus === 'received') return ['received', 'in_progress'];
    if (currentStatus === 'in_progress') return ['in_progress', 'completed'];
    return [currentStatus]; // Can't change other statuses
  };

  return (
    <div className="desktop-container">
      {/* Sidebar */}
      <div className="desktop-sidebar">
        <div className="sidebar-header">
          <Layers color="#D9383A" size={24} />
          <h2>Factory Manager</h2>
        </div>

        <div className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeTab === item.id ? 'active' : ''}
              onClick={() => onSelectTab(item.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && <span className="badge">{item.count}</span>}
            </button>
          ))}

          {/* Admin / QA / Accountant sections */}
          {(isAdmin || isQA || isAccountant) && (
            <>
              <div style={{ borderTop: '1px solid var(--border-color)', margin: '12px 0 8px', paddingTop: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', paddingLeft: '14px' }}>
                  Administration
                </span>
              </div>
              {adminNavItems.map((item) => (
                <button
                  key={item.id}
                  className={activeTab === item.id ? 'active' : ''}
                  onClick={() => onSelectTab(item.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main Content View */}
      <div className="desktop-main">
        {activeTab === 'ACCOUNTING' ? (
          <AccountantDashboard orders={orders} />
        ) : isConfigTab ? (
          children
        ) : (
          <>
            {/* Header & New Order Action */}
            <div className="desktop-header-row">
              <div>
                <h1>
                  {activeTab === 'ALL ORDERS' ? 'Factory Order Management' 
                    : (activeTab === 'QA PORTAL' ? 'Quality Check' : activeTab)}
                </h1>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
                  {isWorker ? 'View and manage your assigned orders.' : 'Manage spring orders, status updates, and manufacturing assignments.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="add-plus-btn" onClick={onRefresh} style={{ width: '40px', height: '40px' }} title="Refresh Data">
                  <RotateCw size={18} />
                </button>
                {isAdmin && (
                  <button className="btn-primary" onClick={onOpenNewOrder}>
                    <Plus size={18} />
                    Insert Order
                  </button>
                )}
              </div>
            </div>

            {/* Stats Grid Overview */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon red"><Clock /></div>
                <div className="stat-info">
                  <h3>{stats?.received || 0}</h3>
                  <p>Received</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon amber"><PlayCircle /></div>
                <div className="stat-info">
                  <h3>{stats?.in_progress || 0}</h3>
                  <p>In Process</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green"><CheckCircle2 /></div>
                <div className="stat-info">
                  <h3>{stats?.completed || 0}</h3>
                  <p>Completed</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#64748b' }}><XCircle /></div>
                <div className="stat-info">
                  <h3>{stats?.cancelled || 0}</h3>
                  <p>Cancelled</p>
                </div>
              </div>
            </div>

            {/* Search Toolbar */}
            <div className="toolbar">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by company, order #, spring details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                Showing <strong>{filteredOrders.length}</strong> orders
              </div>
            </div>

            {/* Orders Data Tables */}
            {activeTab === 'QA PORTAL' ? (
              <>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <button 
                    onClick={() => setQaSubTab('pending')} 
                    style={{ 
                      background: 'none', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                      color: qaSubTab === 'pending' ? '#ef4444' : '#64748b',
                      borderBottom: qaSubTab === 'pending' ? '2px solid #ef4444' : 'none',
                      paddingBottom: '8px', marginBottom: '-9px'
                    }}
                  >
                    Pending Inspection
                  </button>
                  <button 
                    onClick={() => setQaSubTab('failed')} 
                    style={{ 
                      background: 'none', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                      color: qaSubTab === 'failed' ? '#ef4444' : '#64748b',
                      borderBottom: qaSubTab === 'failed' ? '2px solid #ef4444' : 'none',
                      paddingBottom: '8px', marginBottom: '-9px'
                    }}
                  >
                    Failed QC
                  </button>
                  <button 
                    onClick={() => setQaSubTab('passed')} 
                    style={{ 
                      background: 'none', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                      color: qaSubTab === 'passed' ? '#ef4444' : '#64748b',
                      borderBottom: qaSubTab === 'passed' ? '2px solid #ef4444' : 'none',
                      paddingBottom: '8px', marginBottom: '-9px'
                    }}
                  >
                    Passed QC
                  </button>
                </div>

                {qaSubTab === 'pending' && renderOrdersTable(filteredOrders.filter(o => !o.qc_status || o.qc_status === 'pending'), 'No pending inspections.')}
                {qaSubTab === 'failed' && renderOrdersTable(filteredOrders.filter(o => o.qc_status === 'failed'), 'No failed QC orders.')}
                {qaSubTab === 'passed' && renderOrdersTable(filteredOrders.filter(o => o.qc_status === 'passed'), 'No passed QC orders.')}
              </>
            ) : (
              renderOrdersTable(filteredOrders, 'No matching orders found.')
            )}
          </>
        )}
      </div>
    </div>
  );
};
