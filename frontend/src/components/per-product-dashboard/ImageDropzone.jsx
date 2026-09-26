import { CATEGORY_TILE } from '../../utils/utils.js'

/**
 * ImageDropzone — the product editor's image field (docs/per-product-
 * dashboard "ImageDropzone"): an 84px thumbnail (the product photo asset,
 * or the category gradient tile for the synthesized rows — the same
 * .tile-<category> fallback SquareTile uses) + a keyboard-replace file
 * input under a dashed blueSlate-300 box. The mock has no image
 * storage: replacing swaps the local draft preview only. An empty
 * image renders the placeholder hint.
 * @param {{image: string | null, category: string, name: string,
 *   onReplace: (image: string) => void}} props
 * @returns {object} the dropzone.
 */
export function ImageDropzone({ image, category, name, onReplace }) {
  const isAsset = image && image.startsWith('/')
  return (
    <div
      className="rounded-lg p-4"
      style={{ border: '1px dashed var(--blueSlate-300)' }}
      aria-label={`Image for ${name}`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {isAsset ? (
          <img
            src={image}
            alt={name}
            style={{ width: 84, height: 84, borderRadius: 8, objectFit: 'cover' }}
          />
        ) : (
          <div
            className={`tile tile-square ${CATEGORY_TILE[category] || 'tile-unmapped'}`}
            style={{ width: 84, height: 84 }}
            aria-hidden="true"
          />
        )}
        <label className="btn-secondary cursor-pointer">
          Replace image
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label={`Replace image for ${name}`}
            onChange={(e) => {
              const f = e.target.files && e.target.files[0]
              if (f) onReplace(URL.createObjectURL(f))
            }}
          />
        </label>
      </div>
      <p className="text-meta text-blueSlate-700 mt-2">
        {isAsset ? `Current image: ${image.split('/').pop()}` : 'No photo yet — the category tile stands in.'}
      </p>
    </div>
  )
}
