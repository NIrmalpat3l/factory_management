'use client';
import React from 'react';
import { ActiveTab } from '../types/order';
import { Factory, Clock, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'ALL ORDERS', label: 'All', icon: <Factory /> },
    { id: 'RECEIVED', label: 'Received', icon: <Clock /> },
    { id: 'IN PROGRESS', label: 'In Process', icon: <PlayCircle /> },
    { id: 'COMPLETED', label: 'Completed', icon: <CheckCircle2 /> },
    { id: 'CANCELLED', label: 'Cancelled', icon: <XCircle /> },
  ];

  return (
    <div className="mobile-bottom-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onSelectTab(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
