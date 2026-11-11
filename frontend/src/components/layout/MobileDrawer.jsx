import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import UserAvatar from '../common/UserAvatar'

export default function MobileDrawer({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { profile, logout } = useAuth()

  if (!isOpen) return null

  const navItems = [
    { name: 'Home', path: '/home', icon: 'home' },
    { name: 'Explore Vehicles', path: '/explore', icon: 'explore' },
    { name: 'List Your Vehicle', path: '/list-vehicle', icon: 'add_circle' },
    { name: 'My Bookings', path: '/my-bookings', icon: 'calendar_today' },
    { name: 'Rental Requests', path: '/rental-requests', icon: 'inbox' },
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'My Profile', path: '/profile', icon: 'account_circle' },
  ]

  const handleLogout = async () => {
    onClose()
    await logout()
    navigate('/login')
  }

  const userName = profile?.full_name || 'Anoop Kumar'
  const userRole = profile?.role_title || 'Verified Host & Driver'

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-72 max-w-[85%] bg-surface-container-lowest h-full shadow-2xl flex flex-col justify-between p-4 z-10 animate-in slide-in-from-left duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border-purple-tint mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[20px]">directions_car</span>
              </div>
              <div>
                <div className="font-extrabold text-base text-on-surface">RentWheels</div>
                <div className="text-[10px] text-primary font-bold uppercase">Mobility Club</div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-lavender-subtle"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-primary-container text-on-primary font-bold shadow-md'
                      : 'text-on-surface-variant hover:bg-lavender-subtle hover:text-primary'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Card */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-border-purple-tint flex items-center justify-between">
          <div 
            onClick={() => { onClose(); navigate('/profile'); }}
            className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
          >
            <UserAvatar
              name={userName}
              imageUrl={profile?.profile_image}
              size="sm"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface truncate">{userName}</span>
              <span className="text-[10px] text-primary font-semibold truncate">{userRole}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-error hover:bg-red-50"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
