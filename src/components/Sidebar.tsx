/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutGrid, 
  FilePlus, 
  ShieldCheck, 
  Scale, 
  Image, 
  ShoppingBag, 
  Wallet, 
  User, 
  Settings,
  Menu,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { User as UserType } from '../types';
import { formatCurrency } from '../utils';

interface SidebarProps {
  currentUser: UserType | null;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export default function Sidebar({
  currentUser,
  currentPage,
  setCurrentPage,
  isOpenMobile,
  setIsOpenMobile,
}: SidebarProps) {
  if (!currentUser) return null;

  // Render high fidelity Sidebar categories according to specifications
  const categories = [
    {
      title: "Navigation",
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutGrid }
      ]
    },
    {
      title: "Image Authentication",
      items: [
        { id: 'register_image', name: 'Register Image', icon: FilePlus },
        { id: 'verify_image', name: 'Verify Image', icon: ShieldCheck },
        { id: 'comparison_tool', name: 'Comparison Tool', icon: Scale }
      ]
    },
    {
      title: "Assets",
      items: [
        { id: 'gallery', name: 'Gallery', icon: Image }
      ]
    },
    {
      title: "Marketplace",
      items: [
        { id: 'marketplace', name: 'Marketplace', icon: ShoppingBag },
        { id: 'wallet', name: 'Wallet', icon: Wallet }
      ]
    },
    {
      title: "Account",
      items: [
        { id: 'profile', name: 'Profile', icon: User },
        { id: 'settings', name: 'Settings', icon: Settings }
      ]
    }
  ];

  const handleItemClick = (id: string) => {
    setCurrentPage(id);
    setIsOpenMobile(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between py-1 select-none" id="sidebar-inner-container">
      {/* Header Account Bio Preview Block */}
      <div className="p-4 mb-4 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-3" id="sidebar-account-preview">
        <div className="flex items-center space-x-3">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="h-10 w-10 rounded-xl object-cover border border-indigo-500/25 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="truncate text-left leading-tight">
            <h4 className="text-xs font-bold text-white tracking-wide truncate">{currentUser.name}</h4>
            <p className="text-[10px] text-indigo-400 font-semibold truncate uppercase mt-0.5">{currentUser.onboardingRole || 'Certified Creator'}</p>
          </div>
        </div>

        {/* Mini Balance summary details */}
        <div className="flex items-center justify-between text-[10px] font-mono border-t border-white/5 pt-2 text-slate-500">
          <span>Wallet Ledger</span>
          <span className="text-[#1eff00] font-bold">{formatCurrency(currentUser.balance)}</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="space-y-5 flex-1 overflow-y-auto pr-1" id="sidebar-scrolling-nav">
        {categories.map((category, catIdx) => (
          <div key={category.title} className="space-y-1 text-left" id={`sidebar-group-${catIdx}`}>
            <h3 className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
              {category.title}
            </h3>
            
            <div className="space-y-0.5">
              {category.items.map((item) => {
                const isActive = currentPage === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-link-${item.id}`}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left border cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-500/15 text-[#1eff00] border-indigo-500/30 font-bold' 
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#1eff00]' : 'text-slate-400'}`} />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer system details info block */}
      <div className="mt-6 border-t border-white/5 pt-4 text-center text-[10px] text-slate-500 font-mono" id="sidebar-footer-stats">
        <div>PassIMG Lite Node: v1.0.4</div>
        <div className="text-[#1eff00] mt-0.5 font-bold">● Network Connection Secure</div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar (always visible on md+) */}
      <aside 
        className="hidden md:block w-64 shrink-0 glass rounded-3xl border border-white/10 bg-slate-900/40 p-5 h-[calc(100vh-10rem)] sticky top-24 overflow-y-auto"
        id="sidebar-desktop-pane"
      >
        {sidebarContent}
      </aside>

      {/* 2. Floating Mobile Sidebar button */}
      <div className="md:hidden fixed bottom-6 left-6 z-40" id="sidebar-floating-mobile-trigger-container">
        <button
          onClick={() => setIsOpenMobile(true)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition-all border border-indigo-500/20 active:scale-90"
          id="btn-sidebar-mobile-toggle"
          title="Open Directory Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* 3. Mobile Sidebar Drawer Overlay (slid-in drawer panel) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex" id="sidebar-mobile-overlay-wrapper">
          {/* Backdrop screen filter */}
          <div 
            onClick={() => setIsOpenMobile(false)} 
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
            id="sidebar-mobile-backdrop"
          />

          {/* Sliding container drawer list */}
          <div 
            className="relative flex w-72 max-w-xs flex-col bg-[#070b13] p-5 shadow-2xl border-r border-white/10 h-screen animate-in slide-in-from-left duration-200"
            id="sidebar-mobile-drawer-body"
          >
            {/* Close Mobile button */}
            <button
              onClick={() => setIsOpenMobile(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer active:scale-95"
              id="sidebar-mobile-btn-close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mt-4 flex-1">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
