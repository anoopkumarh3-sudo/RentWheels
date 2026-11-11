import React from 'react'
import { Link } from 'react-router-dom'

export default function VehicleCard({ vehicle }) {
  const {
    id,
    brand,
    model,
    vehicle_type,
    hourly_price,
    daily_price,
    pickup_location,
    fuel_type,
    transmission,
    seats,
    rating,
    trips_count,
    images
  } = vehicle

  const primaryImage = images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'

  const typeColorMap = {
    car: 'bg-primary-container text-on-primary',
    bike: 'bg-emerald-600 text-white',
    scooter: 'bg-amber-600 text-white'
  }

  return (
    <div className="bg-surface-card rounded-2xl border border-border-purple-tint overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
      {/* Vehicle image with badge overlay */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container">
        <img
          src={primaryImage}
          alt={`${brand} ${model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${typeColorMap[vehicle_type] || 'bg-primary text-white'}`}>
            {vehicle_type}
          </span>
        </div>

        {rating && (
          <div className="absolute top-3 right-3 bg-surface-card/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm text-xs font-bold text-on-surface">
            <span className="material-symbols-outlined text-[14px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
            <span>{rating}</span>
            <span className="text-on-surface-variant text-[10px]">({trips_count || 12})</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {brand}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                {model}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1.5 line-clamp-1">
            <span className="material-symbols-outlined text-[15px] text-primary shrink-0">
              location_on
            </span>
            <span className="truncate">{pickup_location}</span>
          </div>

          {/* Quick specs */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border-purple-tint text-xs text-on-surface-variant">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary-container">
                local_gas_station
              </span>
              <span>{fuel_type || 'Petrol'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary-container">
                auto_mode
              </span>
              <span>{transmission || 'Auto'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary-container">
                airline_seat_recline_normal
              </span>
              <span>{seats ? `${seats} Seats` : '2 Seats'}</span>
            </div>
          </div>
        </div>

        {/* Pricing and Action */}
        <div className="flex items-center justify-between pt-3 border-t border-border-purple-tint mt-1">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-extrabold text-primary">
                ₹{hourly_price?.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-on-surface-variant">/hr</span>
            </div>
            <div className="text-[11px] font-semibold text-on-surface-variant">
              or ₹{daily_price?.toLocaleString('en-IN')}/day
            </div>
          </div>

          <Link
            to={`/vehicle/${id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-on-primary font-bold text-xs sm:text-sm hover:bg-electric-violet-hover shadow-md shadow-primary/20 active:scale-95 transition-all"
          >
            <span>Book Now</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

