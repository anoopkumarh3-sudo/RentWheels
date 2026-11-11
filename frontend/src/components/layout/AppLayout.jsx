import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'
import MobileDrawer from './MobileDrawer'

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Desktop Sidebar (fixed 250px) */}
      <Sidebar />

      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      {/* Main Container */}
      <div className="md:pl-[250px] min-h-screen flex flex-col flex-1">
        {/* Fixed Header */}
        <TopHeader 
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} 
        />

        {/* Dynamic Page Content */}
        <main className="w-full px-4 sm:px-6 lg:px-10 pt-20 pb-12 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
