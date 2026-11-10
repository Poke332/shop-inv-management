import { Vector3, MathUtils } from 'three'

// Solve perspective inequalities for every geometry corner at the fixed default
// viewing angle. Unlike a center-only/sphere heuristic, aspect and rack height
// both constrain distance. An 0.88 NDC limit reserves room around the geometry.
export function fitWarehouseCamera(model, aspect, fov = 43, bounds = null, viewDirection = null) {
  const target = bounds ? bounds.getCenter(new Vector3()) : new Vector3((model.width - 3) / 2, 0, (model.depth - 3) / 2)
  const direction = (viewDirection || new Vector3(0.65, 1, 0.95)).clone().normalize()
  const right = new Vector3(direction.z, 0, -direction.x).normalize()
  const up = direction.clone().cross(right)
  const tanY = Math.tan(MathUtils.degToRad(fov / 2)) * 0.88
  const tanX = tanY * Math.max(0.05, aspect)
  let distance = 4
  const contain = (x, y, z) => {
    const relative = new Vector3(x, y, z).sub(target)
    const along = relative.dot(direction)
    distance = Math.max(distance, along + Math.abs(relative.dot(right)) / tanX,
      along + Math.abs(relative.dot(up)) / tanY, along + 1)
  }
  for (const bin of model.bins) {
    for (const dx of [-1.1, 1.1]) for (const y of [-0.09, 2.4]) for (const dz of [-1, 1]) contain(bin.x + dx, y, bin.z + dz)
    contain(bin.x, 2.9, bin.z) // projected HTML label anchor
  }
  // Include the full base/floor, not just bins: its extents exceed rack extents.
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
    contain(target.x + dx * (model.width + 3) / 2, -0.23, target.z + dz * (model.depth + 3) / 2)
  }
  if (bounds) for (const x of [bounds.min.x,bounds.max.x]) for (const y of [bounds.min.y,bounds.max.y]) for (const z of [bounds.min.z,bounds.max.z]) contain(x,y,z)
  return { target, distance, position: target.clone().addScaledVector(direction, distance) }
}
