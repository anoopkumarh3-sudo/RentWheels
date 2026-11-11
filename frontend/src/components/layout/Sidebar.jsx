import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import UserAvatar from '../common/UserAvatar'

export default function Sidebar() {
  const navigate = useNavigate()
  const { profile, logout } = useAuth()

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
    await logout()
    navigate('/login')
  }

  const userName = profile?.full_name || 'Anoop Kumar'
  const userRole = profile?.role_title || 'Verified Host & Driver'

  return (
    <aside className="fixed left-0 top-0 h-screen w-[250px] bg-surface-container-lowest border-r border-border-purple-tint shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between p-space-md hidden md:flex">
      <div className="flex flex-col gap-space-lg">
        {/* Brand header */}
        <div 
          onClick={() => navigate('/home')}
          className="flex items-center gap-space-sm px-space-xs pt-space-xs cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-[0_2px_8px_-2px_rgba(30,16,53,0.04),0_1px_3px_0_rgba(124,58,237,0.3)]">
            <span className="material-symbols-outlined text-[24px]">directions_car</span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-title-md text-on-surface font-extrabold tracking-tight">RentWheels</span>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Mobility Club</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-space-md py-space-sm rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-bold shadow-[0_4px_14px_rgba(124,58,237,0.35)]'
                    : 'text-on-surface-variant hover:bg-lavender-subtle hover:text-primary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-4 bg-on-primary rounded-full"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User profile footer card with clean avatar */}
      <div className="p-space-sm rounded-xl bg-surface-container-low border border-border-purple-tint flex items-center justify-between shadow-[0_2px_8px_-2px_rgba(30,16,53,0.04)]">
        <div 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-space-sm overflow-hidden cursor-pointer flex-1"
        >
          <UserAvatar
            name={userName}
            imageUrl={profile?.profile_image}
            size="md"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-on-surface truncate">{userName}</span>
            <span className="text-[11px] text-primary font-semibold truncate">{userRole}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          title="Sign out"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-lavender-subtle hover:text-error transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>
    </aside>
  )
}
