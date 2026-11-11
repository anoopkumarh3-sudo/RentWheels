// Vehicle Catalog — Starts empty. Real listings are loaded from the database.
export const MOCK_VEHICLES = [];

// Clean default user profile (No fake earnings, no fake trips, no random portrait photos)
export const MOCK_USER = {
  id: "user-current",
  full_name: "Anoop Kumar",
  email: "anoop.kumar@example.com",
  phone: "+91 98765 43210",
  profile_image: null, // No stock photos; renders initials "AK"
  role_title: "Verified Host & Driver",
  member_since: "Nov 2026",
  driving_license_verified: true,
  aadhaar_verified: true,
  rating: 0,
  total_trips: 0,
  total_rental_hours: 0,
  total_earnings: 0
};

// Clean empty collections for genuine user account state
export const MOCK_BOOKINGS = [];
export const MOCK_RENTAL_REQUESTS = [];
export const MOCK_USER_VEHICLES = [];
