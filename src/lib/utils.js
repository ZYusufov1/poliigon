export function randInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a
}

export function randomPolygon(n = 5, rMin = 20, rMax = 60) {
    const angles = Array.from({ length: n }, () => Math.random() * Math.PI * 2).sort((a,b)=>a-b)
    const pts = angles.map(a => {
        const r = rMin + Math.random() * (rMax - rMin)
        return [Math.cos(a) * r, Math.sin(a) * r]
    })
    const xs = pts.map(p => p[0])
    const ys = pts.map(p => p[1])
    const minX = Math.min(...xs), minY = Math.min(...ys)
    const shifted = pts.map(([x,y]) => [x - minX, y - minY])
    return shifted
}

export function polygonBBox(points) {
    const xs = points.map(p => p[0])
    const ys = points.map(p => p[1])
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
}

export function pointsToAttr(points, tx = 0, ty = 0) {
    return points.map(([x,y]) => `${x + tx},${y + ty}`).join(' ')
}
export function niceStep(pxDesired, scale) {
    const worldDesired = pxDesired / Math.max(scale, 1e-6)
    const pow = Math.floor(Math.log10(worldDesired))
    const base = Math.pow(10, pow)
    for (const m of [1, 2, 5, 10]) {
        const step = m * base
        if (step >= worldDesired) return step
    }
    return 10 * base
}
