import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { parseVehicleRow, formatINR } from '../lib/vehicleUtils'
import ImageUploadZone from '../components/common/ImageUploadZone'
import { message, Modal } from 'antd'

export default function ListVehiclePage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('listings') // 'listings' or 'add'

  // Host vehicles state loaded from Supabase
  const [userVehicles, setUserVehicles] = useState([])
  const [loadingListings, setLoadingListings] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState([])

  // Form state
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    vehicle_type: 'car',
    registration_number: '',
    hourly_price: '',
    daily_price: '',
    pickup_location: 'Koramangala, Bengaluru',
    latitude: 12.9352,
    longitude: 77.6245,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    seats: 5,
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Edit Modal State
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  // Fetch host's vehicles from Supabase
  const fetchOwnerVehicles = useCallback(async () => {
    if (!user?.id) {
      setUserVehicles([])
      return
    }

    setLoadingListings(true)
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Fetch owner vehicles note:', error.message)
        setUserVehicles([])
      } else {
        const parsed = (data || []).map(parseVehicleRow)
        setUserVehicles(parsed)
      }
    } catch (err) {
      console.error('Fetch vehicles error:', err)
      setUserVehicles([])
    } finally {
      setLoadingListings(false)
    }
  }, [user])

  useEffect(() => {
    fetchOwnerVehicles()
  }, [fetchOwnerVehicles])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // 1. Create a new vehicle listing in Supabase
  const handleCreateVehicle = async (e) => {
    e.preventDefault()

    if (!user) {
      message.error('Please sign in to list your vehicle.')
      navigate('/login')
      return
    }

    if (!formData.registration_number.trim()) {
      message.error('Please enter a vehicle registration number.')
      return
    }

    setSubmitting(true)

    try {
      const descPayload = JSON.stringify({
        text: formData.description.trim() || 'Well-maintained personal vehicle available on RentWheels.',
        images: uploadedPhotos,
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        seats: Number(formData.seats) || (formData.vehicle_type === 'car' ? 5 : 2)
      })

      const newRow = {
        owner_id: user.id,
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        vehicle_type: formData.vehicle_type,
        registration_number: formData.registration_number.trim().toUpperCase(),
        hourly_price: Number(formData.hourly_price),
        daily_price: Number(formData.daily_price),
        pickup_location: formData.pickup_location.trim(),
        latitude: Number(formData.latitude) || 12.9352,
        longitude: Number(formData.longitude) || 77.6245,
        description: descPayload,
        availability_status: 'available',
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('vehicles')
        .insert([newRow])
        .select()

      if (error) throw error

      message.success('Vehicle listed successfully! Now live on RentWheels.')
      setUploadedPhotos([])
      setFormData({
        brand: '',
        model: '',
        vehicle_type: 'car',
        registration_number: '',
        hourly_price: '',
        daily_price: '',
        pickup_location: 'Koramangala, Bengaluru',
        latitude: 12.9352,
        longitude: 77.6245,
        fuel_type: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        description: ''
      })
      setActiveTab('listings')
      await fetchOwnerVehicles()
    } catch (err) {
      console.error('Failed to insert vehicle:', err)
      message.error(err.message || 'Failed to list vehicle. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // 2. Toggle listing availability status (available <-> paused)
  const handleToggleStatus = async (vehicle) => {
    if (!user) return
    const nextStatus = vehicle.availability_status === 'available' ? 'paused' : 'available'

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          availability_status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicle.id)
        .eq('owner_id', user.id)

      if (error) throw error

      setUserVehicles(prev =>
        prev.map(v => v.id === vehicle.id ? { ...v, availability_status: nextStatus } : v)
      )
      message.info(`Listing is now ${nextStatus === 'available' ? 'active & bookable' : 'paused'}.`)
    } catch (err) {
      message.error('Failed to update listing status: ' + err.message)
    }
  }

  // 3. Delete listing
  const handleDeleteListing = (vehicleId) => {
    Modal.confirm({
      title: 'Remove this vehicle listing?',
      content: 'Are you sure you want to delete this vehicle listing? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', vehicleId)
            .eq('owner_id', user.id)

          if (error) throw error

          setUserVehicles(prev => prev.filter(v => v.id !== vehicleId))
          message.success('Listing removed successfully.')
        } catch (err) {
          message.error('Failed to delete listing: ' + err.message)
        }
      }
    })
  }

  // 4. Open edit modal
  const openEditModal = (v) => {
    setEditingVehicle({
      id: v.id,
      brand: v.brand,
      model: v.model,
      hourly_price: v.hourly_price,
      daily_price: v.daily_price,
      pickup_location: v.pickup_location,
      description: v.description,
      images: v.images || [],
      fuel_type: v.fuel_type || 'Petrol',
      transmission: v.transmission || 'Automatic',
      seats: v.seats || 5
    })
    setIsEditModalOpen(true)
  }

  // 5. Save edited vehicle details
  const handleSaveEdit = async () => {
    if (!editingVehicle || !user) return
    setSavingEdit(true)

    try {
      const descPayload = JSON.stringify({
        text: editingVehicle.description || '',
        images: editingVehicle.images || [],
        fuel_type: editingVehicle.fuel_type || 'Petrol',
        transmission: editingVehicle.transmission || 'Automatic',
        seats: Number(editingVehicle.seats) || 5
      })

      const { error } = await supabase
        .from('vehicles')
        .update({
          hourly_price: Number(editingVehicle.hourly_price),
          daily_price: Number(editingVehicle.daily_price),
          pickup_location: editingVehicle.pickup_location.trim(),
          description: descPayload,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingVehicle.id)
        .eq('owner_id', user.id)

      if (error) throw error

      message.success('Listing details updated successfully.')
      setIsEditModalOpen(false)
      await fetchOwnerVehicles()
    } catch (err) {
      message.error('Failed to update listing: ' + err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold mb-2">
          <Link to="/home" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-primary font-bold">Host & Manage Vehicles</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Vehicle Host Hub
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              List new wheels, adjust your hourly/daily rates (₹), and manage active listings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'listings'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-lavender-subtle hover:text-primary'
                }`}
            >
              My Listings ({userVehicles.length})
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'add'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-lavender-subtle hover:text-primary'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>List New Vehicle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guest Warning Banner if Logged Out */}
      {!user && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[24px]">lock</span>
            <div>
              <p className="text-xs font-bold text-amber-900">Sign in required to manage host listings</p>
              <p className="text-[11px] text-amber-700">Please sign in to add, edit, or pause your vehicles.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
          >
            Sign In Now
          </button>
        </div>
      )}

      {/* Tab 1: My Listings View */}
      {activeTab === 'listings' && (
        <div className="flex flex-col gap-5">
          {loadingListings ? (
            <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-12 text-center flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="text-xs font-bold text-on-surface-variant">Loading your listings...</span>
            </div>
          ) : userVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userVehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  className="bg-surface-card rounded-3xl border border-border-purple-tint p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={vehicle.images?.[0]}
                      alt={vehicle.model}
                      className="w-24 h-20 rounded-2xl object-cover shrink-0 border border-border-purple-tint bg-surface-container"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {vehicle.brand} • {vehicle.vehicle_type}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${vehicle.availability_status === 'available'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                          {vehicle.availability_status === 'available' ? 'Active & Bookable' : 'Paused'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-on-surface truncate mt-0.5">
                        {vehicle.brand} {vehicle.model}
                      </h3>

                      <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 truncate">
                        <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                        <span>{vehicle.pickup_location}</span>
                      </div>

                      <div className="text-[11px] font-mono text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded mt-1.5 inline-block">
                        Reg: {vehicle.registration_number} (Confidential)
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Controls */}
                  <div className="pt-3 border-t border-border-purple-tint flex items-center justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-primary">
                        {formatINR(vehicle.hourly_price)}/hr <span className="text-xs text-on-surface-variant font-normal">| {formatINR(vehicle.daily_price)}/day</span>
                      </div>
                      <div className="text-[10px] text-on-surface-variant">
                        {vehicle.fuel_type} • {vehicle.transmission} • {vehicle.seats} Seats
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(vehicle)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${vehicle.availability_status === 'available'
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                      >
                        {vehicle.availability_status === 'available' ? 'Pause' : 'Activate'}
                      </button>

                      <button
                        onClick={() => openEditModal(vehicle)}
                        className="px-3 py-1.5 rounded-xl bg-surface-container-low text-on-surface font-bold text-xs hover:bg-lavender-subtle transition-colors"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteListing(vehicle.id)}
                        className="w-8 h-8 rounded-xl bg-red-50 text-error flex items-center justify-center hover:bg-red-100 transition-colors"
                        title="Delete listing"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Professional Empty State */
            <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-lavender-subtle text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">directions_car</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">No vehicles listed yet</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mt-1 leading-relaxed">
                Turn your idle car, bike or scooter into extra earnings. Start by listing your first vehicle today.
              </p>
              <button
                onClick={() => setActiveTab('add')}
                className="mt-5 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-bold text-xs hover:bg-electric-violet-hover transition-all shadow-md"
              >
                List Your First Vehicle
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Add New Vehicle Form */}
      {activeTab === 'add' && (
        <form onSubmit={handleCreateVehicle} className="bg-surface-card rounded-3xl border border-border-purple-tint p-6 sm:p-10 shadow-sm flex flex-col gap-6">
          <div className="border-b border-border-purple-tint pb-4">
            <h2 className="text-xl font-bold text-on-surface">Vehicle Registration Details</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Fill in accurate details. Your vehicle registration plate is strictly confidential and never displayed on public search.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Vehicle Category
              </label>
              <select
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleInputChange}
                className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20 cursor-pointer"
              >
                <option value="car">Car / SUV</option>
                <option value="bike">Motorcycle / Cruiser</option>
                <option value="scooter">Electric / City Scooter</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Brand / Make
              </label>
              <input
                type="text"
                name="brand"
                required
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="e.g. Hyundai, Royal Enfield, Ather"
                className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Model Name
              </label>
              <input
                type="text"
                name="model"
                required
                value={formData.model}
                onChange={handleInputChange}
                placeholder="e.g. Creta SX, Hunter 350, 450X"
                className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Registration Number (Confidential)
              </label>
              <input
                type="text"
                name="registration_number"
                required
                value={formData.registration_number}
                onChange={handleInputChange}
                placeholder="e.g. KA-05-MM-2024"
                className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface uppercase focus:outline-none focus:ring-2 focus:ring-primary-container/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Hourly Price (₹)
              </label>
              <input
                type="number"
                name="hourly_price"
                required
                min="30"
                value={formData.hourly_price}
                onChange={handleInputChange}
                placeholder="e.g. 150"
                className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Daily Price (₹)
              </label>
              <input
                type="number"
                name="daily_price"
                required
                min="300"
                value={formData.daily_price}
                onChange={handleInputChange}
                placeholder="e.g. 1800"
                className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Fuel Type
              </label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleInputChange}
                className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="CNG">CNG</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Transmission
              </label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Pickup Hub Address
              </label>
              <input
                type="text"
                name="pickup_location"
                required
                value={formData.pickup_location}
                onChange={handleInputChange}
                placeholder="e.g. Koramangala 4th Block, Bengaluru"
                className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20"
              />
            </div>
          </div>

          {/* Supabase Storage Image Upload Zone */}
          <ImageUploadZone
            images={uploadedPhotos}
            onImagesChange={setUploadedPhotos}
            maxImages={4}
          />

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Description & Features
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Highlight clean interior, recent servicing, sanitization, Bluetooth connectivity..."
              className="w-full p-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-purple-tint">
            <button
              type="button"
              onClick={() => setActiveTab('listings')}
              className="px-5 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-bold text-xs hover:bg-lavender-subtle"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-primary-container hover:bg-electric-violet-hover text-on-primary font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all"
            >
              {submitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">publish</span>
                  <span>Publish Listing</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Edit Listing Modal */}
      {editingVehicle && (
        <Modal
          title={`Edit Listing: ${editingVehicle.brand} ${editingVehicle.model}`}
          open={isEditModalOpen}
          onOk={handleSaveEdit}
          onCancel={() => setIsEditModalOpen(false)}
          okText={savingEdit ? "Saving..." : "Save Changes"}
          confirmLoading={savingEdit}
          okButtonProps={{ className: 'bg-primary-container' }}
        >
          <div className="flex flex-col gap-3 py-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant">Hourly Price (₹)</label>
              <input
                type="number"
                value={editingVehicle.hourly_price}
                onChange={(e) => setEditingVehicle({ ...editingVehicle, hourly_price: Number(e.target.value) })}
                className="w-full h-10 px-3 border border-border-purple-tint rounded-lg mt-1 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant">Daily Price (₹)</label>
              <input
                type="number"
                value={editingVehicle.daily_price}
                onChange={(e) => setEditingVehicle({ ...editingVehicle, daily_price: Number(e.target.value) })}
                className="w-full h-10 px-3 border border-border-purple-tint rounded-lg mt-1 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant">Pickup Hub Location</label>
              <input
                type="text"
                value={editingVehicle.pickup_location}
                onChange={(e) => setEditingVehicle({ ...editingVehicle, pickup_location: e.target.value })}
                className="w-full h-10 px-3 border border-border-purple-tint rounded-lg mt-1 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant">Description</label>
              <textarea
                rows={2}
                value={editingVehicle.description}
                onChange={(e) => setEditingVehicle({ ...editingVehicle, description: e.target.value })}
                className="w-full p-2 border border-border-purple-tint rounded-lg mt-1 text-sm font-semibold resize-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
