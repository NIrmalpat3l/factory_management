'use client';

import React, { useState } from 'react';
import { Order, ActiveTab, OrderStatus, UserRole } from '../types/order';
import { BottomNav } from './BottomNav';
import {
  Menu,
  Settings,
  Search,
  RotateCw,
  MoreVertical,
  Plus,
  Factory,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MobileAppViewProps {
  orders: Order[];
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenNewOrder: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onQuickStatusChange: (order: Order, newStatus: OrderStatus) => void;
  onRefresh: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  userRole: UserRole;
  children?: React.ReactNode;
}

export const MobileAppView: React.FC<MobileAppViewProps> = ({
  orders,
  activeTab,
  onSelectTab,
  onOpenNewOrder,
  onEditOrder,
  onDeleteOrder,
  onQuickStatusChange,
  onRefresh,
  searchQuery,
  setSearchQuery,
  userRole,
  children,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const { signOut } = useAuth();

  const isAdmin = userRole === 'admin';
  const isWorker = userRole === 'worker';
  const isViewer = userRole === 'viewer';

  const groupedStatuses: OrderStatus[] = ['received', 'in_progress', 'completed', 'cancelled'];

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

  // Worker-specific menu options
  const getMenuOptions = (order: Order) => {
    if (isViewer) return [];
    if (isWorker) {
      const options: { label: string; action: () => void; danger?: boolean }[] = [];
      if (order.status === 'received') {
        options.push({ label: 'Set: IN PROGRESS', action: () => { onQuickStatusChange(order, 'in_progress'); setActiveMenuId(null); } });
      }
      if (order.status === 'in_progress') {
        options.push({ label: 'Mark COMPLETED', action: () => { onQuickStatusChange(order, 'completed'); setActiveMenuId(null); } });
      }
      return options;
    }
    // Admin gets all options
    return [
      { label: 'Edit Order', action: () => { onEditOrder(order); setActiveMenuId(null); } },
      { label: 'Set: RECEIVED', action: () => { onQuickStatusChange(order, 'received'); setActiveMenuId(null); } },
      { label: 'Set: IN PROGRESS', action: () => { onQuickStatusChange(order, 'in_progress'); setActiveMenuId(null); } },
      { label: 'Set: COMPLETED', action: () => { onQuickStatusChange(order, 'completed'); setActiveMenuId(null); } },
      { label: 'Set: CANCELLED', action: () => { onQuickStatusChange(order, 'cancelled'); setActiveMenuId(null); } },
      { label: 'Delete Order', action: () => { onDeleteOrder(order.id); setActiveMenuId(null); }, danger: true },
    ];
  };

  return (
    <div className="mobile-layout-container">
      {/* App Header */}
      <div className="mobile-app-header">
        <div className="header-left">
          {isAdmin ? (
            <Menu size={22} color="#f87171" onClick={() => setShowAdminMenu(!showAdminMenu)} style={{ cursor: 'pointer' }} />
          ) : (
            <Factory size={22} color="#f87171" />
          )}
          <div className="title-group">
            <span className="header-title">{activeTab}</span>
          </div>
        </div>

          <div className="header-actions">
            <Search
              size={19}
              onClick={() => setShowSearch(!showSearch)}
            />
            <RotateCw size={19} onClick={onRefresh} />
            <LogOut size={19} onClick={signOut} color="#f87171" style={{ marginLeft: '4px' }} />
          </div>
        </div>

        {/* Expandable Search Input */}
        {showSearch && (
          <div style={{ padding: '0 12px 8px 12px', background: '#191c21' }}>
            <input
              type="text"
              className="mobile-search-input"
              placeholder="Search company, size, order no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Admin Menu Dropdown */}
        {showAdminMenu && isAdmin && (
          <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            {['SPRING CONFIG', 'TASK CONFIG', 'WORKERS', 'USERS'].map((tab) => (
              <button
                key={tab}
                style={{ 
                  padding: '16px', 
                  textAlign: 'left', 
                  background: activeTab === tab ? '#e2e8f0' : 'transparent', 
                  border: 'none', 
                  borderBottom: '1px solid #f1f5f9',
                  fontWeight: 600, 
                  color: '#334155',
                  fontSize: '14px'
                }}
                onClick={() => {
                  onSelectTab(tab as ActiveTab);
                  setShowAdminMenu(false);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Order List area grouped by status */}
        <div className="mobile-content" onClick={() => setActiveMenuId(null)}>
          {['SPRING CONFIG', 'TASK CONFIG', 'WORKERS', 'USERS'].includes(activeTab) ? (
            <div style={{ padding: '16px', paddingBottom: '80px' }}>
              {children}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              No orders found under {activeTab}
            </div>
          ) : (
            groupedStatuses.map((st) => {
              const statusOrders = filteredOrders.filter((o) => o.status === st);
              if (statusOrders.length === 0) return null;

              return (
                <div key={st} className="status-group-section">
                  <div className="status-section-header">
                    {st.toUpperCase().replace('_', ' ')}
                  </div>
                  {statusOrders.map((order) => {
                    const menuOptions = getMenuOptions(order);
                    return (
                      <div key={order.id} className="order-item-card" style={{ position: 'relative' }}>
                        <div className="order-main-info" onClick={() => isAdmin ? onEditOrder(order) : undefined}>
                          <div className="company-name">{order.company_name}</div>
                          <div className="order-desc">{order.spring_names || 'No items'}</div>
                          <div className="order-meta">
                            <span>#{order.order_number}</span>
                            <span>• Qty: {order.total_qty_ordered}</span>
                            <span>• Done: {order.total_qty_completed}</span>
                            {order.assigned_worker_name && (
                              <span>• 👷 {order.assigned_worker_name}</span>
                            )}
                          </div>
                        </div>

                        {menuOptions.length > 0 && (
                          <div style={{ position: 'relative' }}>
                            <button
                              className="three-dots-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === order.id ? null : order.id);
                              }}
                            >
                              <MoreVertical size={18} />
                            </button>

                            {activeMenuId === order.id && (
                              <div className="context-menu" style={{ right: 0, top: '24px' }}>
                                {menuOptions.map((opt, i) => (
                                  <button key={i} className={opt.danger ? 'danger' : ''} onClick={opt.action}>
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Floating Action Button (+) — admin only */}
        {isAdmin && (
          <button className="fab-btn" onClick={onOpenNewOrder} title="Create New Order">
            <Plus />
          </button>
        )}

        {/* Bottom Tabs */}
        <BottomNav activeTab={activeTab} onSelectTab={onSelectTab} />
      </div>
  );
};
