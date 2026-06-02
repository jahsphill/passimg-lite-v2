/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, Wallet, ChevronDown, UserCircle, LogOut, Settings2, Menu, X, LayoutGrid, Image, ShoppingBag, ShieldAlert, FilePlus, Scale } from 'lucide-react';
import { formatCurrency } from '../utils';
import Logo from './Logo';

interface HeaderProps {
  currentUser: User | null;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export default function Header({
  currentUser,
  allUsers,
  onSelectUser,
  onLogout,
  onOpenProfile,
  currentPage,
  setCurrentPage,
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutGrid },
    { id: 'register_image', name: 'Register Image', icon: FilePlus },
    { id: 'verify_image', name: 'Verify Image', icon: ShieldCheck },
    { id: 'comparison_tool', name: 'Comparison Tool', icon: Scale },
    { id: 'gallery', name: 'Gallery', icon: Image },
    { id: 'marketplace', name: 'Marketplace', icon: ShoppingBag },
    { id: 'admin', name: 'Admin Console', icon: ShieldAlert, adminOnly: true },
  ];

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Dashboard';
      case 'register_image':
        return 'Register Image';
      case 'verify_image':
        return 'Verify Image';
      case 'comparison_tool':
        return 'Image Comparison Tool';
      case 'gallery':
        return 'Gallery';
      case 'marketplace':
        return 'Marketplace';
      case 'admin':
        return 'Admin Console';
      case 'welcome':
        return 'Welcome Portal';
      case 'signup_flow':
        return 'Join Onboarding';
      default:
        return 'PassIMG Lite';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-header shrink-0 select-none">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" id="hdr-container">
        
        {/* Left Section: Logo & Brand */}
        <div className="flex items-center space-x-6" id="hdr-left-block">
          {/* Mobile hamburger menu */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="md:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer mr-0.5 active:scale-95"
            id="btn-trigger-mobile-nav"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>

          <div 
            onClick={() => setCurrentPage(currentUser && currentUser.onboardingCompleted ? 'dashboard' : 'welcome')}
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
            id="hdr-logo-home-trigger"
          >
            <div className="h-9 w-9 shrink-0 flex items-center justify-center">
              <Logo size={36} />
            </div>
            <span className="font-sans text-lg font-bold tracking-tight text-white">PassIMG Lite</span>
          </div>

          <div className="hidden h-5 w-px bg-white/10 md:block" />

          {/* Active page label (Desktop) */}
          <div className="hidden lg:flex flex-col items-start px-1 leading-none">
            <h1 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Workspace</h1>
            <h2 className="text-sm font-extrabold text-white tracking-wide">{getPageTitle()}</h2>
          </div>
        </div>

        {/* Center Section: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center space-x-2" id="hdr-nav-links">
          {navigationItems.map((item) => {
            if (item.adminOnly && (!currentUser || !currentUser.isAdmin)) return null;
            const isActive = currentPage === item.id;
            return (
              <React.Fragment key={item.id}>
                <button
                  id={`hdr-nav-${item.id}`}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/5'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.name}</span>
                </button>

                {item.id === 'marketplace' && currentUser && (
                  <div className="flex items-center space-x-1.5 ml-2 border-l border-white/10 pl-2">
                    {/* Wallet Widget beside Marketplace */}
                    <div 
                      className="flex items-center space-x-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 font-mono text-xs text-emerald-400"
                      id="wallet-balance-nav"
                      title="Wallet Balance"
                    >
                      <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{formatCurrency(currentUser.balance)}</span>
                    </div>

                    {/* Role indication section */}
                    <div 
                      className="flex items-center space-x-1.5 rounded-lg bg-indigo-500/10 border border-indigo-505/20 px-2.5 py-1.5 text-xs text-indigo-300"
                      id="user-onboarding-role-badge"
                    >
                      <span className="text-slate-400 font-sans text-[10px] uppercase font-bold">Role:</span>
                      <span className="font-semibold text-white truncate max-w-[150px]">{currentUser.onboardingRole || 'Digital Artist / Creator'}</span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right Section: Secondary controls & Profile Emulators */}
        <div className="flex items-center space-x-3" id="hdr-right-panel">
          {currentUser ? (
            <>
              {/* User Avatar Action Menu */}
              <div className="relative">
                <button
                  id="btn-user-avatar"
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                  }}
                  className="flex items-center space-x-1.5 focus:outline-none transition-transform active:scale-95 cursor-pointer animate-in fade-in duration-300"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-8 w-8 rounded-lg object-cover border border-white/15 hover:border-[#1eff00] transition-colors"
                    referrerPolicy="no-referrer"
                  />
                  <span className="hidden sm:inline text-xs font-bold text-slate-300 hover:text-white transition-colors">{currentUser.name.split(' ')[0]}</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-md p-1.5 shadow-2xl ring-1 ring-black/50">
                    <div className="px-3 py-2.5 border-b border-white/10 text-left">
                      <p className="text-xs font-semibold text-white">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{currentUser.email}</p>
                    </div>

                    <button
                      id="menu-edit-profile"
                      onClick={() => {
                        setCurrentPage('profile');
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
                    >
                      <Settings2 className="h-4 w-4 text-slate-400" />
                      <span>Edit Creator Profile</span>
                    </button>

                    <div className="mt-1 border-t border-white/10 pt-1">
                      <button
                        id="menu-logout"
                        onClick={() => {
                          onLogout();
                          setShowProfileMenu(false);
                        }}
                        className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-xs text-red-00 text-red-455 text-red-400 transition-colors hover:bg-red-950/20 hover:text-red-300 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              id="btn-trigger-login"
              onClick={() => setCurrentPage('login')}
              className="flex items-center space-x-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-all duration-150 hover:bg-indigo-600 hover:shadow-[0_0_12px_rgba(99,102,241,0.4)] cursor-pointer"
            >
              <UserCircle className="h-4 w-4" />
              <span>Sign In / Create Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Sliding Overlay) */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 flex md:hidden" id="mobile-nav-drawer">
          {/* Backdrop */}
          <div 
            onClick={() => setShowMobileMenu(false)} 
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
            id="mobile-nav-overlay"
          />

          {/* Drawer content */}
          <div className="relative flex w-full max-w-xs flex-col bg-[#070b13] pb-4 shadow-2xl border-r border-white/5 h-screen animate-in slide-in-from-left duration-250" id="mobile-nav-panel">
            {/* Close button inside drawer */}
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => setShowMobileMenu(false)} 
                className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                id="btn-close-mobile-nav"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Logo and Brand inside drawer */}
            <div 
              onClick={() => {
                setCurrentPage('welcome');
                setShowMobileMenu(false);
              }}
              className="flex items-center space-x-3 px-6 py-6 border-b border-white/5 cursor-pointer hover:opacity-90 transition-all"
            >
              <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                <Logo size={40} />
              </div>
              <span className="font-sans text-xl font-bold tracking-tight text-white">PassIMG Lite</span>
            </div>

            {/* Nav list */}
            <nav className="flex-1 space-y-2 px-3 py-4" id="mobile-nav-list">
              {navigationItems.map((item) => {
                if (item.adminOnly && (!currentUser || !currentUser.isAdmin)) return null;
                const isActive = currentPage === item.id;
                const IconComponent = item.icon;
                return (
                  <React.Fragment key={item.id}>
                    <button
                      id={`mobile-nav-${item.id}`}
                      onClick={() => {
                        setCurrentPage(item.id);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer text-left ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <IconComponent className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="font-sans leading-none">{item.name}</span>
                    </button>

                    {item.id === 'marketplace' && currentUser && (
                      <div className="px-4 py-2 space-y-2 border-l border-white/5 ml-4">
                        {/* Wallet Widget */}
                        <div 
                          className="flex items-center space-x-2 text-xs font-mono text-emerald-450 text-emerald-400 bg-white/5 p-2 rounded-xl"
                        >
                          <Wallet className="h-4 w-4" />
                          <span>{formatCurrency(currentUser.balance)}</span>
                        </div>

                        {/* Onboarding selected role section */}
                        <div 
                          className="flex items-center space-x-2 text-xs text-indigo-300 bg-white/5 p-2 rounded-xl"
                        >
                          <span className="text-slate-400 font-bold text-[9px] uppercase">Role:</span>
                          <span className="font-semibold text-white truncate max-w-[150px]">{currentUser.onboardingRole || 'Digital Artist / Creator'}</span>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>

            {/* Bottom context indicators inside drawer */}
            <div className="p-4 border-t border-white/5 mt-auto mx-4 mb-2">
              <div className="rounded-xl bg-white/5 p-3.5 border border-white/5 text-center text-[10px] text-slate-400 font-sans leading-relaxed">
                <p className="font-semibold text-[11px] text-white mb-0.5">SHA-256 Ledger</p>
                Secure digital image copyright & ownership registry workspace.
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
