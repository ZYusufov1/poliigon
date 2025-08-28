import { niceStep, pointsToAttr } from '../lib/utils.js'

export class WorkZone extends HTMLElement {
    constructor() {
        super()
        this.store = null
        this.state = { scale: 1, tx: 0, ty: 0, panning: false, panStart: null, panOrigin: null }
    }

    connectedCallback() {
        this.innerHTML = `
                      <svg>
                        <g id="grid"></g>
                        <g id="content"></g>
                        <g id="overlay"></g>
                      </svg>
                    `;
        this.svg = this.querySelector('svg')
        this.gridG = this.querySelector('#grid')
        this.contentG = this.querySelector('#content')

        const ro = new ResizeObserver(() => this.render())
        ro.observe(this)
        this._ro = ro

        this.svg.addEventListener('wheel', (e) => {
            e.preventDefault()
            const factor = e.deltaY < 0 ? 1.1 : 0.9
            this.zoomAtClient(e.clientX, e.clientY, factor)
        }, { passive: false })

        this.svg.addEventListener('pointerdown', (e) => {
            const isPoly = e.target.closest('polygon')
            if (isPoly) {
                const id = Number(isPoly.getAttribute('data-id'))
                const wpt = this.clientToWorld(e.clientX, e.clientY)
                const model = this.store.polygons.find(x => x.id === id)
                const offset = { x: wpt.x - model.pos.x, y: wpt.y - model.pos.y }
                this.dispatchEvent(new CustomEvent('poly-drag-start', {
                    bubbles: true, composed: true, detail: { id, zone: 'work', offset }
                }))
                return
            }
            this.state.panning = true
            this.state.panOrigin = { x: e.clientX, y: e.clientY }
            this.state.panStart = { tx: this.state.tx, ty: this.state.ty }
            this.svg.setPointerCapture(e.pointerId)
        })

        window.addEventListener('pointermove', (e) => {
            if (!this.state.panning) return
            const dx = e.clientX - this.state.panOrigin.x
            const dy = e.clientY - this.state.panOrigin.y
            this.state.tx = this.state.panStart.tx + dx
            this.state.ty = this.state.panStart.ty + dy
            this.store.setView({ tx: this.state.tx, ty: this.state.ty })
            this.render()
        })

        window.addEventListener('pointerup', () => { this.state.panning = false })
    }

    disconnectedCallback() { this._ro?.disconnect() }

    setData(store) {
        this.store = store
        this.state.scale = store.view.scale
        this.state.tx = store.view.tx
        this.state.ty = store.view.ty
        this.render()
    }

    resetView() {
        this.state = { scale: 1, tx: 0, ty: 0, panning: false, panStart: null, panOrigin: null }
        this.store?.setView({ scale: 1, tx: 0, ty: 0 })
    }

    getSize() {
        const r = this.getBoundingClientRect()
        return { width: Math.max(10, r.width), height: Math.max(10, r.height) }
    }

    hitTest(cx, cy) {
        const r = this.getBoundingClientRect()
        return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom
    }

    clientToWorld(cx, cy) {
        const r = this.getBoundingClientRect()
        const x = (cx - r.left - this.state.tx) / this.state.scale
        const y = (cy - r.top  - this.state.ty) / this.state.scale
        return { x, y }
    }

    zoomAtClient(cx, cy, factor) {
        const r = this.getBoundingClientRect()
        const pre = this.clientToWorld(cx, cy)
        const ns = Math.min(10, Math.max(0.25, this.state.scale * factor))
        this.state.scale = ns
        this.state.tx = cx - r.left - pre.x * ns
        this.state.ty = cy - r.top  - pre.y * ns
        this.store.setView({ scale: this.state.scale, tx: this.state.tx, ty: this.state.ty })
        this.render()
    }

    drawGrid(width, height) {
        const s = this.state.scale, tx = this.state.tx, ty = this.state.ty
        const worldMinX = (-tx) / s, worldMaxX = (width - tx) / s
        const worldMinY = (-ty) / s, worldMaxY = (height - ty) / s

        const step = niceStep(60, s)
        const startX = Math.floor(worldMinX / step) * step
        const startY = Math.floor(worldMinY / step) * step

        const lines = []
        const labels = []

        for (let x = startX; x <= worldMaxX; x += step) {
            const sx = x * s + tx
            lines.push(`<line class="grid-line" x1="${sx}" y1="0" x2="${sx}" y2="${height}"/>`)
            labels.push(`<text class="axis-text" x="${sx + 2}" y="${height - 4}">${roundLabel(x)}</text>`)
        }
        for (let y = startY; y <= worldMaxY; y += step) {
            const sy = y * s + ty
            lines.push(`<line class="grid-line" x1="0" y1="${sy}" x2="${width}" y2="${sy}"/>`)
            labels.push(`<text class="axis-text" x="4" y="${sy - 2}">${roundLabel(y)}</text>`)
        }

        this.gridG.innerHTML = lines.join('') + labels.join('')
    }

    render() {
        if (!this.store) return
        const { width, height } = this.getSize()
        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
        this.svg.setAttribute('width', width)
        this.svg.setAttribute('height', height)

        this.drawGrid(width, height)

        const t = `translate(${this.state.tx},${this.state.ty}) scale(${this.state.scale})`
        this.contentG.setAttribute('transform', t)

        const items = this.store.byZone('work')
            .map(p => `<polygon class="poly" data-id="${p.id}" points="${pointsToAttr(p.points, p.pos.x, p.pos.y)}"></polygon>`)
            .join('')
        this.contentG.innerHTML = items
    }
}

function roundLabel(v) {
    const abs = Math.abs(v)
    if (abs >= 1000) return (v/1000).toFixed(1).replace(/\.0$/,'') + 'k'
    if (abs >= 100) return Math.round(v)
    if (abs >= 10) return (Math.round(v*10)/10).toFixed(1).replace(/\.0$/,'')
    return (Math.round(v*100)/100).toFixed(2).replace(/0+$/,'').replace(/\.$/,'')
}

customElements.define('work-zone', WorkZone)
