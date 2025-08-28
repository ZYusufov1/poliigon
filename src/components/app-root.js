import '../styles.css'
import { Store } from '../state/store.js'
import './buffer-zone.js'
import './work-zone.js'

export class AppRoot extends HTMLElement {
    constructor() {
        super()
        this.store = new Store()
        this.drag = null
    }

    connectedCallback() {
        this.innerHTML = `
          <div class="app">
            <div class="toolbar">
              <button id="btnCreate">Создать</button>
              <button id="btnSave">Сохранить</button>
              <button id="btnReset">Сбросить</button>
              <span class="spacer"></span>
              <span class="hint">Зум - колесо мыши, панорамирование - ЛКМ по пустому месту</span>
            </div>
    
            <div class="zone buffer">
              <div class="header">
                <span>Буферная зона</span>
                <span class="badge" id="bufCount"></span>
              </div>
              <buffer-zone id="buffer"></buffer-zone>
            </div>
    
            <div class="zone work">
              <div class="header">
                <span>Рабочая зона</span>
                <span class="badge" id="workCount"></span>
              </div>
              <work-zone id="work"></work-zone>
            </div>
          </div>
        `;

        const buf = this.$('#buffer')
        const work = this.$('#work')

        const had = this.store.load()
        buf.setData(this.store)
        work.setData(this.store)
        this.updateCounters()

        this.$('#btnCreate').addEventListener('click', () => {
            const rect = buf.getSize()
            this.store.createRandomInBuffer(rect.width, rect.height)
            buf.render()
            this.updateCounters()
        })

        this.$('#btnSave').addEventListener('click', () => {
            this.store.save()
            this.flash('Сохранено')
        })

        this.$('#btnReset').addEventListener('click', () => {
            this.store.reset()
            buf.render()
            work.resetView()
            work.render()
            this.updateCounters()
            this.flash('Данные очищены')
        })

        this.addEventListener('poly-drag-start', (e) => this.onDragStart(e.detail))
        window.addEventListener('pointermove', (e) => this.onDragMove(e))
        window.addEventListener('pointerup', () => this.onDragEnd())

        if (had) { buf.render(); work.render(); this.updateCounters(); }
    }

    $(sel) { return this.querySelector(sel) }

    updateCounters() {
        this.$('#bufCount').textContent = `полигонов: ${this.store.byZone('buffer').length}`
        this.$('#workCount').textContent = `полигонов: ${this.store.byZone('work').length}`
    }

    flash(text) {
        const prev = document.title
        document.title = `✓ ${text}`
        setTimeout(() => (document.title = prev), 1200)
    }

    onDragStart({ id, zone, offset }) {
        this.drag = { id, zone, offset }
        this.$('#buffer').classList.add('drop-highlight')
        this.$('#work').classList.add('drop-highlight')
    }

    onDragMove(e) {
        if (!this.drag) return
        const buf = this.$('#buffer')
        const work = this.$('#work')

        const overBuf = buf.hitTest(e.clientX, e.clientY)
        const overWork = work.hitTest(e.clientX, e.clientY)

        if (overBuf) {
            const p = buf.clientToLocal(e.clientX, e.clientY)
            const pos = { x: p.x - this.drag.offset.x, y: p.y - this.drag.offset.y }
            this.store.moveTo(this.drag.id, 'buffer', pos)
            buf.render()
            work.render()
        } else if (overWork) {
            const w = work.clientToWorld(e.clientX, e.clientY)
            const pos = { x: w.x - this.drag.offset.x, y: w.y - this.drag.offset.y }
            this.store.moveTo(this.drag.id, 'work', pos)
            buf.render()
            work.render()
        }
        this.updateCounters()
    }

    onDragEnd() {
        if (!this.drag) return
        this.drag = null
        this.$('#buffer').classList.remove('drop-highlight')
        this.$('#work').classList.remove('drop-highlight')
    }
}

customElements.define('app-root', AppRoot)
