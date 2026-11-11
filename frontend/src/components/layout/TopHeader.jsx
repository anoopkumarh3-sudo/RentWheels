import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import UserAvatar from '../common/UserAvatar'

export default function TopHeader({ onToggleMobileMenu }) {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date())

  const userName = profile?.full_name || 'Anoop Kumar'

  return (
    <header className="h-16 fixed top-0 right-0 left-0 md:left-[250px] bg-surface-container-lowest/90 backdrop-blur-md border-b border-border-purple-tint shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 lg:px-8">
      {/* Left side: Mobile menu toggle + Global search */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-on-surface hover:bg-lavender-subtle transition-colors"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search cars, bikes, scooters, locations..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(`/explore?q=${encodeURIComponent(e.target.value)}`)
              }
            }}
            className="w-full h-10 pl-9 pr-4 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
          />
        </div>
      </div>

      {/* Right side icons & badges */}
      <div className="flex items-center gap-3 lg:gap-4 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-lavender-subtle text-primary rounded-full text-xs font-bold border border-primary-fixed-dim/40">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          <span>Verified Marketplace</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold">
          <span className="material-symbols-outlined text-[16px]">event</span>
          <span>{formattedDate}</span>
        </div>

        <button 
          title="Notifications"
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-lavender-subtle hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>

        {/* Clean Circular Avatar */}
        <div 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 pl-1 cursor-pointer"
          title={`Profile: ${userName}`}
        >
          <UserAvatar
            name={userName}
            imageUrl={profile?.profile_image}
            size="md"
          />
        </div>
      </div>
    </header>
  )
}
