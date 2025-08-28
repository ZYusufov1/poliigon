import { pointsToAttr } from '../lib/utils.js'

export class BufferZone extends HTMLElement {
    constructor() {
        super()
        this.store = null
        this.svg = null
    }

    connectedCallback() {
        this.innerHTML = `<svg></svg>`
        this.svg = this.querySelector('svg')

        const ro = new ResizeObserver(() => this.render())
        ro.observe(this)
        this._ro = ro

        this.svg.addEventListener('pointerdown', (e) => {
            const poly = e.target.closest('polygon')
            if (!poly) return
            const id = Number(poly.getAttribute('data-id'))
            const p = this.clientToLocal(e.clientX, e.clientY)
            const model = this.store.polygons.find(x => x.id === id)
            const offset = { x: p.x - model.pos.x, y: p.y - model.pos.y }
            this.dispatchEvent(new CustomEvent('poly-drag-start', {
                bubbles: true, composed: true, detail: { id, zone: 'buffer', offset }
            }))
        })
    }

    disconnectedCallback() { this._ro?.disconnect() }

    setData(store) { this.store = store; this.render(); }

    getSize() {
        const r = this.getBoundingClientRect()
        const width  = r.width > 0 ? r.width : (this.parentElement?.getBoundingClientRect().width || 800)
        const height = r.height > 40 ? r.height : 260
        return { width, height }
    }

    hitTest(cx, cy) {
        const r = this.getBoundingClientRect()
        return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom
    }

    clientToLocal(cx, cy) {
        const r = this.getBoundingClientRect()
        return { x: cx - r.left, y: cy - r.top }
    }

    render() {
        if (!this.store) return
        const { width, height } = this.getSize()
        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
        this.svg.setAttribute('width', width)
        this.svg.setAttribute('height', height)

        const items = this.store.byZone('buffer')
            .map(p => `<polygon class="poly" data-id="${p.id}" points="${pointsToAttr(p.points, p.pos.x, p.pos.y)}"></polygon>`)
            .join('')
        this.svg.innerHTML = items
    }
}
customElements.define('buffer-zone', BufferZone)
