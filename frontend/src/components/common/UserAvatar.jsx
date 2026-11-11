import React from 'react'

/**
 * Extracts initials from a user's full name.
 * E.g., "Anoop Kumar" -> "AK", "Rahul Sharma" -> "RS", "Priya" -> "P"
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Premium, consistent UserAvatar component.
 * Displays initials if no uploaded profile picture exists, or falls back gracefully.
 */
export default function UserAvatar({
  name = '',
  imageUrl = null,
  size = 'md', // 'sm' (w-8 h-8), 'md' (w-9 h-9), 'lg' (w-14 h-14), 'xl' (w-20 h-20), '2xl' (w-24 h-24)
  className = '',
  showBadge = false
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl'
  }

  const selectedSize = sizeClasses[size] || sizeClasses.md
  const initials = getInitials(name)

  // Verify if imageUrl is a custom user-uploaded image (not a stock photograph)
  const hasValidPhoto = Boolean(
    imageUrl &&
    typeof imageUrl === 'string' &&
    imageUrl.trim().length > 0 &&
    !imageUrl.includes('unsplash.com/photo-') // excludes random stock portrait photos
  )

  return (
    <div className="relative inline-block shrink-0">
      {hasValidPhoto ? (
        <img
          src={imageUrl}
          alt={name || 'User Avatar'}
          className={`${selectedSize} rounded-full object-cover border border-border-purple-tint shadow-sm ${className}`}
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.currentTarget.style.display = 'none'
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'flex'
            }
          }}
        />
      ) : null}

      <div
        style={{ display: hasValidPhoto ? 'none' : 'flex' }}
        className={`${selectedSize} rounded-full bg-primary-container text-on-primary font-bold tracking-tight items-center justify-center shadow-sm select-none border border-white/20 ${className}`}
      >
        <span>{initials}</span>
      </div>

      {showBadge && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-sm" title="Verified Host & Driver">
          <span className="material-symbols-outlined text-[12px] font-bold">check</span>
        </div>
      )}
    </div>
  )
}

