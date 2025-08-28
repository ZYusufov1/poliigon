import { randInt, randomPolygon, polygonBBox } from '../lib/utils.js'

const KEY = 'wc-polygons-v1'

function rectsOverlap(a, b, pad = 4) {
    return !(
        a.x + a.w + pad < b.x ||
        b.x + b.w + pad < a.x ||
        a.y + a.h + pad < b.y ||
        b.y + b.h + pad < a.y
    )
}

export class Store {
    constructor() {
        this.polygons = []
        this.view = { scale: 1, tx: 0, ty: 0 }
        this._id = 1
    }

    load() {
        const raw = localStorage.getItem(KEY)
        if (!raw) return false
        try {
            const data = JSON.parse(raw)
            this.polygons = data.polygons || []
            this.view = data.view || { scale: 1, tx: 0, ty: 0 }
            this._id = this.polygons.reduce((m, p) => Math.max(m, p.id), 0) + 1
            return true
        } catch { return false }
    }

    save() {
        localStorage.setItem(KEY, JSON.stringify({ polygons: this.polygons, view: this.view }))
    }

    reset() {
        localStorage.removeItem(KEY)
        this.polygons = []
        this.view = { scale: 1, tx: 0, ty: 0 }
        this._id = 1
    }

    createRandomInBuffer(bufferWidth, bufferHeight) {
        this.polygons = this.polygons.filter(p => p.zone !== 'buffer')

        const count = randInt(5, 20)
        const occupied = []
        const margin = 10

        for (let i = 0; i < count; i++) {
            const verts = randInt(3, 8)
            const pts = randomPolygon(verts, 18, 50)
            const box = polygonBBox(pts)

            let x, y, tries = 0
            do {
                x = randInt(margin, Math.max(margin, bufferWidth - box.w - margin))
                y = randInt(margin, Math.max(margin, bufferHeight - box.h - margin))
                const rect = { x, y, w: box.w, h: box.h }
                const clash = occupied.some(o => rectsOverlap(rect, o, 6))
                if (!clash) { occupied.push(rect); break; }
                tries++
            } while (tries < 200)

            this.polygons.push({
                id: this._id++,
                points: pts,
                pos: { x, y },
                zone: 'buffer'
            })
        }
    }

    byZone(zone) { return this.polygons.filter(p => p.zone === zone) }

    moveTo(id, zone, pos) {
        const p = this.polygons.find(x => x.id === id)
        if (!p) return
        p.zone = zone
        p.pos = { x: pos.x, y: pos.y }
    }

    setView(view) { this.view = { ...this.view, ...view } }
}
