import { useState } from 'react'
import { CATEGORY_TILE } from '../../utils/utils.js'

export function ImageDropzone({ image, category, name, onReplace }) {
  const [error, setError] = useState('')
  const isAsset = image && (image.startsWith('/') || /^data:image\/(png|jpeg|webp);base64,/.test(image))
  return <div className="rounded-lg p-4" style={{ border: '1px dashed var(--blueSlate-300)' }} aria-label={`Image for ${name}`}>
    <div className="flex items-center gap-3 flex-wrap">
      {isAsset ? <img src={image} alt={name} style={{ width: 84, height: 84, borderRadius: 8, objectFit: 'cover' }} />
        : <div className={`tile tile-square ${CATEGORY_TILE[category] || 'tile-unmapped'}`} style={{ width: 84, height: 84 }} aria-hidden="true" />}
      <label className="btn-secondary cursor-pointer">
        Replace image
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
          aria-label={`Replace image for ${name}`} onChange={event => {
            const file = event.target.files?.[0]
            if (!file) return
            if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 1000000) {
              setError('Use PNG/JPEG/WebP files up to 1 MB.')
              return
            }
            setError('')
            const reader = new FileReader()
            reader.onload = () => onReplace(String(reader.result))
            reader.onerror = () => setError('The image is unreadable.')
            reader.readAsDataURL(file)
          }} />
      </label>
    </div>
    <p className="text-meta text-blueSlate-700 mt-2">
      {isAsset ? (image.startsWith('data:') ? 'Uploaded image — save to store in database.' : `Current image: ${image.split('/').pop()}`)
        : 'No photo yet — the category tile stands in.'}
    </p>
    {error && <p role="alert" className="text-meta text-strawberryRed-600 mt-2">{error}</p>}
  </div>
}
