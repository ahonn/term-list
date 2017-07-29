/**
 * @Author: Ahonn Jiang
 * @Date:   2017-07-28 20:40:38
 * @Email:  ahonn95@outlook.com
 *
 * scrollable interactive terminal list for Node.js
 */

const { EventEmitter } = require('events')
const Canvas = require('term-canvas')

const stdin = process.stdin
require('keypress')(stdin)

class ListPager extends EventEmitter {
  constructor(opts = {}) {
    super()
    this.items = []
    this.selected = null

    this.marker = opts.marker || '› '
    this.width = opts.width || 100
    this.height = opts.height || 200
    this.length = opts.length || 10

    const canvas = new Canvas(this.width, this.height)
    this.ctx = canvas.getContext('2d')
  }

  onkeypress(ch, key) {
    if (!key) return

    this.emit('keypress', key, this.selected)
    switch (key.name) {
      case 'up':
        this.up()
        break
      case 'down':
        this.down()
        break
      case 'c':
        key.ctrl && this.stop()
        break
      default:
    }
  }

  at(i) {
    return this.items[i]
  }

  get(id) {
    const ids = this.items.map(({ id }) => id)
    const i = ids.indexOf(id)
    return this.at(i)
  }

  add(id, label) {
    if (this.selected === null) {
      this.select(id)
    }
    this.items.push({ id, label })
  }

  remove(id) {
    this.emit('remove', id)
    const ids = this.items.map(({ id }) => id)
    if (id === undefined) id = this.selected

    const i = ids.indexOf(id)
    this.items.splice(i, 1)

    if (!this.items.length) this.emit('empty')
    const prevItem = this.at(i - 1)
    prevItem ? this.select(prevItem.id) : this.draw()
  }

  update(id, newLabel) {
    const ids = this.items.map(({ id }) => id)
    const i = ids.indexOf(id)
    this.items[i].label = newLabel
    this.draw()
  }

  select(id) {
    this.emit('select', id)
    this.selected = id
    this.draw()
  }

  up() {
    const ids = this.items.map(({ id }) => id)
    const i = ids.indexOf(this.selected)
    if (i > 0) {
      this.select(ids[i - 1])
    }
  }

  down() {
    const ids = this.items.map(({ id }) => id)
    const i = ids.indexOf(this.selected)
    if (i < ids.length - 1) {
      this.select(ids[i + 1])
    }
  }

  clear() {
    this.ctx.clear()
    this.ctx.save()
    this.ctx.translate(6, 8)
  }

  draw() {
    let line = 0
    const padding = Array(this.marker.length + 1).join(' ')

    const ids = this.items.map(({ id }) => id)
    const i = ids.indexOf(this.selected)
    const start = Math.floor(i / this.length) * this.length
    const end = (start + 1) * this.length

    this.clear()
    this.items.slice(start, end).forEach(({ id, label }) => {
      const prefix = this.selected === id ? this.marker : padding
      this.ctx.fillText(prefix + label, 0, line++)
    })
    this.ctx.restore()
  }

  start() {
    stdin.on('keypress', this.onkeypress.bind(this))
    this.draw()
    this.ctx.hideCursor()
    stdin.setRawMode(true)
    stdin.resume()
  }

  stop() {
    this.ctx.reset()
    process.stdin.pause()
    stdin.removeListener('keypress', this.onkeypress)
  }
}

module.exports = ListPager
