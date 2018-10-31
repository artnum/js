/* eslint-env amd, browser */
'use strict'

;(function () {
  var global = Function('return this')() // eslint-disable-line

  if (!document) {
    throw Error('Must be used in browser')
  }

  if (typeof global.Artnum === 'undefined') {
    global.Artnum = {}
  }

  global.Artnum.Doc = (function () {
    const ratio = 1.4142 // ISO paper size ratio ~= sqrt(2)

    ;(function () {
      var css = document.getElementById('ArtnumDocCSS')
      if (css) { return }
      css = document.createElement('STYLE')
      css.setAttribute('id', 'ArtnumDocCSS')
      css.innerHTML = '.docUnderlay { background-color: #666; }\n' +
        '.docOverlay { background-color: white; position: fixed; border: 3px inset #666; position: fixed; overflow: auto; }'
      document.head.appendChild(css)
    }())

    var initZindex = function () {
      if (global.Artnum.Doc.zindex) { return global.Artnum.Doc.zindex * 100 }
      var zindex = 0
      document.querySelectorAll('body *').forEach(function (element) {
        var x = Number(getComputedStyle(element, null).getPropertyValue('z-index'))
        if (x > zindex) {
          zindex = x
        }
      })
      global.Artnum.Doc.zindex = zindex
      return zindex * 100
    }

    var underlay = function (theDoc) {
      var zindex = initZindex() - 1
      var div = document.createElement('DIV')
      div.setAttribute('style', 'top: 0; bottom: 0; left: 0; right: 0; position: fixed; color: white; font-size: 32px; z-index: ' + zindex)
      div.setAttribute('class', 'docUnderlay')

      div.innerHTML = '<div style="position: absolute; right: 5px; top: 5px;"><i class="fas fa-window-close"></i></div>'
      div.addEventListener('click', function (event) {
        this.close()
      }.bind(theDoc))
      theDoc.doc.underlay = div
      document.body.appendChild(div)
    }

    var Doc = function () {
      this.doc = {}
      underlay(this)
      this.eventTarget = new EventTarget()
      var doc = this.doc

      var style = ''
      if (arguments[0]) {
        if (arguments[0].style) {
          style = arguments[0].style
        }
      }

      var zindex = initZindex()
      var wh = [window.innerWidth, window.innerHeight]
      doc.height = 0
      if (wh[0] < wh[1]) {
        doc.height = wh[0]
      } else {
        doc.height = wh[1]
      }

      doc.height -= 60
      doc.width = Math.round(doc.height * ratio)

      doc.left = Math.round((wh[0] / 2) - (doc.width / 2))
      doc.top = Math.round((wh[1] / 2) - (doc.height / 2))

      var div = document.createElement('DIV')
      div.setAttribute('class', 'docOverlay')
      div.setAttribute('style', 'width: ' + doc.width + 'px; height: ' + doc.height + 'px;top: ' + doc.top + 'px; left: ' + doc.left + 'px; z-index: ' + zindex + ';' + style)
      window.requestAnimationFrame(function () {
        document.body.appendChild(div)
      })
      doc.div = div
      doc.style = style

      window.addEventListener('resize', function (event) {
        var zindex = initZindex()
        var wh = [window.innerWidth, window.innerHeight]
        doc.height = 0
        if (wh[0] < wh[1]) {
          doc.height = wh[0]
        } else {
          doc.height = wh[1]
        }

        doc.height -= 60
        doc.width = Math.round(doc.height * ratio)

        doc.left = Math.round((wh[0] / 2) - (doc.width / 2))
        doc.top = Math.round((wh[1] / 2) - (doc.height / 2))
        window.requestAnimationFrame(function () {
          doc.div.setAttribute('style', 'width: ' + doc.width + 'px; height: ' + doc.height + 'px;top: ' + doc.top + 'px; left: ' + doc.left + 'px; z-index: ' + zindex + ';' + doc.style)
        })
      })
      this.doc = doc
    }

    Doc.prototype.addEventListener = function (type, listener, options = {}) {
      this.eventTarget.addEventListener(type, listener.bind(this), options)
    }

    /* Inspiration from from https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript */
    Doc.prototype.hash = function (str) {
      var hash = new Uint32Array(1)
      hash[0] = 0
      if (str.length === 0) return hash[0]
      for (var i = 0; i < str.length; i++) {
        var chr = str.charCodeAt(i)
        hash[0] = ((hash[0] << 5) - hash[0]) + chr
      }
      return hash[0].toString(16)
    }

    Doc.prototype.content = function (node) {
      this.id = this.hash(node.innerHTML)
      this.doc.div.setAttribute('id', 'ContentID-' + this.id)
      var doc = this.doc
      window.requestAnimationFrame(function () {
        for (var current = doc.div.firstChild; current;) {
          var r = current
          current = current.nextSibling
          doc.div.removeChild(r)
        }
        window.requestAnimationFrame(function () {
          if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) {
              doc.div.appendChild(node[i])
            }
          } else {
            doc.div.appendChild(node)
          }
        })
      })
    }

    Doc.prototype._style = function (target, prop, val) {
      var node = typeof target === 'string' ? document.getElementById(target) : target
      if (node) {
        console.log(node)
        var style = node.getAttribute('style')
        style = style.split(';')
        var newstyle = []
        var set = false
        for (var j = 0; j < style.length; j++) {
          if (style[j].trim().substring(0, prop.length).toLowerCase() === prop.toLowerCase()) {
            if (val) {
              newstyle.push(prop.toLowerCase() + ': ' + val)
              set = true
            }
          } else {
            newstyle.push(style[j])
          }
        }
        if (!set) {
          style.push(prop.toLowerCase() + ': ' + val)
        }
        node.setAttribute('style', newstyle)
      }
    }

    Doc.prototype.hide = function () {
      this._style('ArtnumDocUnderlay', 'display', 'none')
      this._style(this.doc.div, 'display', 'none')
    }

    Doc.prototype.show = function () {
      this._style('ArtnumDocUnderlay', 'display', 'block')
      this._style(this.doc.div, 'display', 'none')
    }

    Doc.prototype.close = function () {
      var doc = this.doc
      window.requestAnimationFrame(function () {
        if (doc.underlay) {
          doc.underlay.parentNode.removeChild(doc.underlay)
        }
        if (doc.div) {
          doc.div.parentNode.removeChild(doc.div)
        }
      })
      this.eventTarget.dispatchEvent(new Event('close'))
      this.doc = {}
    }

    return Doc
  }())

  if (typeof define === 'function' && define.amd) {
    define(['artnum/Doc'], function () { return global.Artnum.Doc })
  }
}())
