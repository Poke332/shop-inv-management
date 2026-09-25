import { CATEGORY_TILE } from '../utils/utils.js'
import { TileGlyph } from './TileGlyph.jsx'

/**
 * The square category tile (cart lines 84px, order-review / order-line
 * thumbs 44px): the same .tile-<category> gradient family as the 4:3 grid
 * tiles, minus the aspect-ratio, with the glyph sized to the thumb. One
 * component per file (code-org rule).
 * @param {{category: string, size?: number, className?: string}} props
 * @returns {object} the gradient tile with its glyph.
 */
export function SquareTile({ category, size = 84, className = '' }) {
  const tileClass = CATEGORY_TILE[category] || 'tile-fallback'
  return (
    <div
      className={`tile-square ${tileClass} ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <TileGlyph category={category} size={Math.round(size * 0.45)} />
    </div>
  )
}
