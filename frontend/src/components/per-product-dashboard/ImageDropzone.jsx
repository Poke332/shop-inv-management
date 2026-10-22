import { useState } from 'react'
import { CATEGORY_TILE, compressImageForUpload } from '../../utils/utils.js'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_IMAGE_BYTES = 1_000_000

/**
 * The product-image dropzone (per-product-dashboard): previews the current
 * image (a /products/, /img/ or /uploads/ path — /uploads is the stored
 * shape of an upload — or a pending data URL) or the category tile when
 * none; the file input takes PNG/JPEG/WebP only. Files under the 1 MB cap
 * go in as data URLs; bigger files are compressed toward the cap before
 * submit (compressImageForUpload) and, when the cap is still hit, the
 * dropzone shows its rejection state instead of sending.
 * @param {{image: string, category: string, name: string, onReplace: (url: string) => void}} props
 * @returns {object}
 */
export function ImageDropzone({ image, category, name, onReplace }) {
  const [error, setError] = useState('')
  const isAsset = image && (image.startsWith('/') || /^data:image\/(png|jpeg|webp);base64,/.test(image))
  const pick = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) {
      setError('Use PNG/JPEG/WebP images.')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = String(reader.result)
      if (file.size <= MAX_IMAGE_BYTES) {
        onReplace(dataUrl)
        return
      }
      const compressed = await compressImageForUpload(dataUrl)
      if (compressed) onReplace(compressed)
      else setError('The image is still above 1 MB after compression — use a smaller file.')
    }
    reader.onerror = () => setError('The image is unreadable.')
    reader.readAsDataURL(file)
  }
  return <div className="rounded-lg p-4" style={{ border: '1px dashed var(--blueSlate-300)' }} aria-label={`Image for ${name}`}>
    <div className="flex items-center gap-3 flex-wrap">
      {isAsset ? <img src={image} alt={name} style={{ width: 84, height: 84, borderRadius: 8, objectFit: 'cover' }} />
        : <div className={`tile tile-square ${CATEGORY_TILE[category] || 'tile-unmapped'}`} style={{ width: 84, height: 84 }} aria-hidden="true" />}
      <label className="btn-secondary cursor-pointer">
        Replace image
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
          aria-label={`Replace image for ${name}`} onChange={pick} />
      </label>
    </div>
    <p className="text-meta text-blueSlate-700 mt-2">
      {isAsset ? (image.startsWith('data:') ? 'New image — stored when the product is saved.' : `Current image: ${image.split('/').pop()}`)
        : 'No photo yet — the category tile stands in.'}
    </p>
    {error && <p role="alert" className="text-meta text-strawberryRed-600 mt-2">{error}</p>}
  </div>
}
