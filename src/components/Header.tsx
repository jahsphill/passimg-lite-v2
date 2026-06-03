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
  onOpenSidebar?: () => void;
}

export default function Header({
  currentUser,
  allUsers,
  onSelectUser,
  onLogout,
  onOpenProfile,
  currentPage,
  setCurrentPage,
  onOpenSidebar,
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);


  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutGrid },
    { id: 'register_image', name: 'Register Image', icon: FilePlus },
    { id: 'verify_image', name: 'Verify Image', icon: ShieldCheck },
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
          {/* Mobile-friendly hamburger menu */}
          {currentUser && currentUser.onboardingCompleted && (
            <button
              onClick={onOpenSidebar}
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer mr-0.5 active:scale-95"
              id="btn-trigger-mobile-nav"
              title="Open Navigation Drawer"
            >
              <Menu className="h-5.5 w-5.5 text-indigo-400" />
            </button>
          )}

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
            currentPage !== 'welcome' && (
              <button
                id="btn-trigger-login"
                onClick={() => setCurrentPage('login')}
                className="flex items-center space-x-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-all duration-150 hover:bg-indigo-600 hover:shadow-[0_0_12px_rgba(99,102,241,0.4)] cursor-pointer"
              >
                <UserCircle className="h-4 w-4" />
                <span>Sign In / Create Account</span>
              </button>
            )
          )}
        </div>
      </div>

    </header>
  );
}
