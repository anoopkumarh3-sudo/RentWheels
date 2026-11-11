import React, { useState } from 'react'
import { uploadVehicleImage, validateImageFile } from '../../lib/storageService'
import { useAuth } from '../../context/AuthContext'
import { message } from 'antd'

export default function ImageUploadZone({
  images = [],
  onImagesChange,
  maxImages = 4
}) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return

    const files = Array.from(fileList)
    if (images.length + files.length > maxImages) {
      message.warning(`You can upload a maximum of ${maxImages} images per vehicle listing.`)
      return
    }

    setUploading(true)

    for (const file of files) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        message.error(validation.error)
        continue
      }

      const res = await uploadVehicleImage(file, user?.id)
      if (res.success && res.url) {
        onImagesChange([...images, res.url])
        message.success(`Uploaded ${file.name} successfully!`)
      } else {
        message.error(res.error || `Failed to upload ${file.name}`)
      }
    }

    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleRemove = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove)
    onImagesChange(updated)
    message.info('Image removed.')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          Vehicle Photos ({images.length}/{maxImages})
        </label>
        <span className="text-[11px] text-on-surface-variant font-medium">
          JPEG, PNG, WebP up to 5MB each
        </span>
      </div>

      {/* Upload Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
          dragOver
            ? 'border-primary bg-lavender-subtle/40 scale-[0.99]'
            : 'border-border-purple-tint bg-surface-container-low hover:border-primary/50'
        }`}
      >
        <input
          type="file"
          id="vehicle-image-input"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading || images.length >= maxImages}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-lavender-subtle text-primary flex items-center justify-center">
            {uploading ? (
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span className="material-symbols-outlined text-[26px]">add_photo_alternate</span>
            )}
          </div>

          <div>
            <label
              htmlFor="vehicle-image-input"
              className="text-xs sm:text-sm font-bold text-primary hover:underline cursor-pointer"
            >
              Click to browse
            </label>
            <span className="text-xs sm:text-sm text-on-surface-variant font-medium"> or drag and drop photos here</span>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Upload clear exterior and interior angles. High-resolution photos increase bookings by 3x.
          </p>
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
          {images.map((url, idx) => (
            <div
              key={idx}
              className="relative aspect-[16/10] rounded-xl overflow-hidden border border-border-purple-tint group shadow-sm bg-surface-container"
            >
              <img
                src={url}
                alt={`Vehicle Preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Cover badge for first image */}
              {idx === 0 && (
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-primary text-white text-[9px] font-bold uppercase tracking-wider shadow">
                  Featured Cover
                </div>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error"
                title="Remove photo"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

