'use client'

import React, { useState, useEffect } from 'react';
import { Order, Company, OrderStats, ActiveTab, OrderStatus, SpringType, SpringCategory, SpringParameter, Profile, UserRole, TaskType } from '@/types/order';
import { api } from '@/services/api';
import { MobileAppView } from '@/components/MobileAppView';
import { DesktopDashboard } from '@/components/DesktopDashboard';
import { OrderFormModal } from '@/components/OrderFormModal';
import { CompanyModal } from '@/components/CompanyModal';
import { SpringConfigPanel } from '@/components/SpringConfigPanel';
import { WorkerManagePanel } from '@/components/WorkerManagePanel';
import { UserRolePanel } from '@/components/UserRolePanel';
import { TaskConfigPanel } from '@/components/TaskConfigPanel';
import { QCInspectionModal } from '@/components/QCInspectionModal';
import { useAuth } from '@/contexts/AuthContext';
import { Factory, LogOut, Loader2, Trash2 } from 'lucide-react';

export default function Page() {
  const { user, loading: isAuthLoading, signOut } = useAuth();
  const userRole: UserRole = user?.role || 'viewer';
  const userRoles: UserRole[] = user?.roles || [userRole];

  const [activeTab, setActiveTab] = useState<ActiveTab>('ALL ORDERS');
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newlyAddedCompany, setNewlyAddedCompany] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // QC Modal
  const [isQCModalOpen, setIsQCModalOpen] = useState(false);
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);

  // Data for admin panels
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [springTypes, setSpringTypes] = useState<SpringType[]>([]);
  const [categories, setCategories] = useState<SpringCategory[]>([]);
  const [parameters, setParameters] = useState<SpringParameter[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        fetchedOrders,
        fetchedCompanies,
        fetchedStats,
        fetchedWorkers,
        fetchedCategories,
        fetchedParameters,
        fetchedSpringTypes,
        fetchedProfiles,
        fetchedTaskTypes,
      ] = await Promise.all([
        api.getOrders(),
        api.getCompanies(),
        api.getOrderStats(),
        api.getActiveWorkers(),
        api.getSpringCategories(),
        api.getSpringParameters(),
        api.getSpringTypes(),
        api.getAllProfiles(),
        api.getTaskTypes(),
      ]);

      setOrders(fetchedOrders);
      setCompanies(fetchedCompanies);
      setStats(fetchedStats);
      setWorkers(fetchedWorkers);
      setCategories(fetchedCategories);
      setParameters(fetchedParameters);
      setSpringTypes(fetchedSpringTypes);
      setAllProfiles(fetchedProfiles);
      setTaskTypes(fetchedTaskTypes);
    } catch (err) {
      console.error('Failed to fetch data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);



  const handleSaveOrder = async (orderData: any) => {
    if (orderData.id) {
      await api.updateOrder(orderData.id, orderData);
    } else {
      await api.createOrder(orderData);
    }
    await fetchData();
  };

  const handleDeleteOrder = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteOrder = async () => {
    if (deleteConfirmId) {
      await api.deleteOrder(deleteConfirmId);
      setDeleteConfirmId(null);
      await fetchData();
    }
  };

  const handleQuickStatusChange = async (order: Order, newStatus: OrderStatus) => {
    await api.updateOrder(order.id, { ...order, status: newStatus });
    await fetchData();
  };

  const handleAddCompany = async (name: string) => {
    const newComp = await api.addCompany(name);
    setCompanies(prev => [...prev, newComp]);
    setNewlyAddedCompany(newComp.name);
  };

  const handleOpenNewOrder = () => {
    setEditingOrder(null);
    setIsOrderModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  // Render the correct admin panel based on active tab
  const renderConfigPanel = () => {
    switch (activeTab) {
      case 'SPRING CONFIG':
        return (
          <SpringConfigPanel
            springTypes={springTypes}
            parameters={parameters}
            categories={categories}
            onRefresh={fetchData}
          />
        );
      case 'TASK CONFIG':
        return (
          <TaskConfigPanel
            taskTypes={taskTypes}
            onRefresh={fetchData}
          />
        );
      case 'WORKERS':
        return (
          <WorkerManagePanel
            profiles={allProfiles}
            onRefresh={fetchData}
          />
        );
      case 'USERS':
        return (
          <UserRolePanel
            profiles={allProfiles}
            currentUserId={user?.id || ''}
            onRefresh={fetchData}
          />
        );
      default:
        return null;
    }
  };

  const isAdmin = userRoles.includes('admin');
  const isWorker = userRoles.includes('worker');
  const isQA = userRoles.includes('qa');
  const isViewer = userRoles.includes('viewer');
  const isAccountant = userRoles.includes('accountant');

  const visibleOrders = orders.filter(order => {
    // Admins always see everything
    if (isAdmin) return true;
    
    // Specialized tabs show everything if the user has the right role
    if (activeTab === 'ACCOUNTING' && isAccountant) return true;
    if (activeTab === 'QA PORTAL' && isQA) return true;
    
    // In common panels, workers (PH), accountants, viewers, and QA can see everything
    if (isWorker || isAccountant || isViewer || isQA) return true;
    
    return false;
  });

  const derivedStats: OrderStats = {
    total: visibleOrders.length,
    received: visibleOrders.filter(o => o.status === 'received').length,
    in_progress: visibleOrders.filter(o => o.status === 'in_progress').length,
    completed: visibleOrders.filter(o => o.status === 'completed').length,
    cancelled: visibleOrders.filter(o => o.status === 'cancelled').length,
  };

  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#cbd5e1' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Factory size={48} color="#D9383A" className="animate-pulse" />
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Loading Factory OS...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">

      {/* Desktop Header (Brand & Logout) */}
      <div className="mode-bar desktop-only">
        <div className="brand">
          <Factory size={18} />
          <span>Factory Order Management</span>
          {user && (
            <span style={{ marginLeft: '8px', fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>
              ({user.full_name} • {userRoles.map(r => r === 'worker' ? 'PH' : r.toUpperCase()).join(', ')})
            </span>
          )}
        </div>

        <div className="view-options">
          <button onClick={signOut} className="btn-cancel" style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#a0aec0', cursor: 'pointer' }}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>

      {/* Responsive Main View Renderer */}
      <div className="mobile-only">
        <MobileAppView
          orders={visibleOrders}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenNewOrder={handleOpenNewOrder}
          onEditOrder={handleEditOrder}
          onDeleteOrder={handleDeleteOrder}
          onQuickStatusChange={handleQuickStatusChange}
          onInspectOrder={(order) => { setInspectingOrder(order); setIsQCModalOpen(true); }}
          onRefresh={fetchData}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          userRole={userRole} // keeping for backwards compatibility in some modals if needed
          userRoles={userRoles}
        >
          {renderConfigPanel()}
        </MobileAppView>
      </div>

      <div className="desktop-only flex-1 w-full h-full relative">
        <DesktopDashboard
          orders={visibleOrders}
          stats={derivedStats}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenNewOrder={handleOpenNewOrder}
          onEditOrder={handleEditOrder}
          onDeleteOrder={handleDeleteOrder}
          onQuickStatusChange={handleQuickStatusChange}
          onInspectOrder={(order) => { setInspectingOrder(order); setIsQCModalOpen(true); }}
          onRefresh={fetchData}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          userRole={userRole}
          userRoles={userRoles}
        >
          {renderConfigPanel()}
        </DesktopDashboard>
      </div>

      {/* Form Dialog for Order */}
      <OrderFormModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setNewlyAddedCompany(null);
        }}
        onSaveOrder={handleSaveOrder}
        initialData={editingOrder}
        companies={companies}
        onOpenAddCompany={() => setIsCompanyModalOpen(true)}
        newlyAddedCompany={newlyAddedCompany}
        workers={workers}
        springTypes={springTypes}
        taskTypes={taskTypes}
        userRole={userRole}
      />

      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onAddCompany={handleAddCompany}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <Trash2 size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>Delete Order</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button type="button" className="btn-primary" style={{ background: '#dc2626' }} onClick={confirmDeleteOrder}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QC Inspection Modal */}
      {isQCModalOpen && inspectingOrder && user && (
        <QCInspectionModal
          order={inspectingOrder}
          currentUserId={user.id}
          onClose={() => {
            setIsQCModalOpen(false);
            setInspectingOrder(null);
          }}
          onSave={() => {
            setIsQCModalOpen(false);
            setInspectingOrder(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
