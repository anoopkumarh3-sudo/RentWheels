import React from 'react'

export default function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase()

  const config = {
    available: { label: 'Available', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    approved: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    paid: { label: 'Paid', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    completed: { label: 'Completed', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    pending: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' },
    requested: { label: 'Requested', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' },
    booked: { label: 'Booked', bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    rejected: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    cancelled: { label: 'Cancelled', bg: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  }

  const current = config[normalized] || { label: status, bg: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${current.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      <span>{current.label}</span>
    </span>
  )
}

