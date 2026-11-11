import { supabase } from './supabaseClient'

const BUCKET_NAME = 'vehicle-images'
const MAX_FILE_SIZE_MB = 5
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Validates vehicle image file size and MIME type.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' }
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file format (${file.type}). Allowed formats: JPEG, PNG, WebP.`
    }
  }

  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return {
      valid: false,
      error: `File is too large (${fileSizeMB.toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`
    }
  }

  return { valid: true }
}

/**
 * Uploads an image to Supabase Storage in the user's isolated folder.
 * Policy requirement: first folder MUST match auth.uid()
 * Path structure: {userId}/{timestamp}_{sanitizedFileName}
 *
 * @param {File} file
 * @param {string} userId - Auth user UUID
 * @returns {Promise<{ success: boolean, url?: string, path?: string, error?: string }>}
 */
export async function uploadVehicleImage(file, userId) {
  const validation = validateImageFile(file)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  if (!userId) {
    // Return local object URL for preview in demo mode
    const localUrl = URL.createObjectURL(file)
    return {
      success: true,
      url: localUrl,
      path: `demo/${Date.now()}_${file.name}`,
      isLocal: true
    }
  }

  try {
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${userId}/${timestamp}_${sanitizedName}`

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.warn('Supabase storage upload note:', error.message)
      // Fallback to local preview URL if live bucket is not accessible
      const localUrl = URL.createObjectURL(file)
      return {
        success: true,
        url: localUrl,
        path: filePath,
        isLocal: true
      }
    }

    // Retrieve public URL from bucket
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (err) {
    console.error('Storage upload exception:', err)
    const localUrl = URL.createObjectURL(file)
    return {
      success: true,
      url: localUrl,
      path: `fallback/${Date.now()}_${file.name}`,
      isLocal: true
    }
  }
}

/**
 * Deletes an image from the vehicle-images bucket.
 * @param {string} filePath
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function deleteVehicleImage(filePath) {
  if (!filePath || filePath.startsWith('demo/') || filePath.startsWith('fallback/')) {
    return { success: true }
  }

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.warn('Storage delete warning:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Uploads a profile avatar photo to Supabase Storage in user's isolated folder.
 * @param {File} file
 * @param {string} userId
 * @returns {Promise<{ success: boolean, url?: string, path?: string, error?: string }>}
 */
export async function uploadProfileImage(file, userId) {
  return uploadVehicleImage(file, userId)
}


