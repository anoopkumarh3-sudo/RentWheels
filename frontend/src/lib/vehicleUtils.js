/**
 * Vehicle Utilities for Supabase Integration
 * Handles safe unpacking of vehicle attributes from database rows.
 */

// Clean fallback visuals by vehicle type if no custom photo is provided
const DEFAULT_VEHICLE_IMAGES = {
  car: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
  bike: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
  scooter: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80',
  default: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80'
}

/**
 * Parses a database vehicle row, safely unpacking metadata (images, fuel type, transmission, seats)
 * stored in the description field while keeping schema 100% compliant.
 *
 * @param {Object} row - Supabase vehicles row
 * @returns {Object} Normalized vehicle object
 */
export function parseVehicleRow(row) {
  if (!row) return null

  let descText = row.description || ''
  let images = []
  let fuel_type = 'Petrol'
  let transmission = 'Automatic'
  let seats = 5

  if (row.description && typeof row.description === 'string' && row.description.trim().startsWith('{')) {
    try {
      const meta = JSON.parse(row.description)
      descText = meta.text || ''
      if (Array.isArray(meta.images) && meta.images.length > 0) {
        images = meta.images
      }
      if (meta.fuel_type) fuel_type = meta.fuel_type
      if (meta.transmission) transmission = meta.transmission
      if (meta.seats) seats = Number(meta.seats)
    } catch (e) {
      // Plain text description
      descText = row.description
    }
  }

  // If no images were provided, assign default category image
  if (images.length === 0) {
    const fallback = DEFAULT_VEHICLE_IMAGES[row.vehicle_type] || DEFAULT_VEHICLE_IMAGES.default
    images = [fallback]
  }

  return {
    ...row,
    raw_description: row.description,
    description: descText,
    images,
    fuel_type,
    transmission,
    seats,
    hourly_price: Number(row.hourly_price) || 0,
    daily_price: Number(row.daily_price) || 0,
    latitude: Number(row.latitude) || 12.9352,
    longitude: Number(row.longitude) || 77.6245
  }
}

/**
 * Formats an amount into standard Indian Rupees (₹).
 * @param {number|string} amount
 * @returns {string}
 */
export function formatINR(amount) {
  const num = Number(amount) || 0
  return `₹${num.toLocaleString('en-IN')}`
}

