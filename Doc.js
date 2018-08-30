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
    var doc = {}

    ;(function () {
      var css = document.getElementById('ArtnumDocCSS')
      if (css) { return }
      css = document.createElement('STYLE')
      css.setAttribute('id', 'ArtnumDocCSS')
      css.innerHTML = '.docUnderlay { background-color: #666; }\n' +
        '.docOverlay { background-color: white; position: fixed; border: 3px inset #666; position: fixed; }'
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

    var underlay = function () {
      if (document.getElementById('ArtnumDocUnderlay')) { return }
      var zindex = initZindex() - 1
      var div = document.createElement('DIV')
      div.setAttribute('style', 'top: 0; bottom: 0; left: 0; right: 0; position: fixed; z-index: ' + zindex)
      div.setAttribute('class', 'docUnderlay')
      div.setAttribute('id', 'ArtnumDocUnderlay')
      document.body.appendChild(div)
    }

    var Doc = function () {
      underlay()

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
      document.body.appendChild(div)
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
        doc.div.setAttribute('style', 'width: ' + doc.width + 'px; height: ' + doc.height + 'px;top: ' + doc.top + 'px; left: ' + doc.left + 'px; z-index: ' + zindex + ';' + doc.style)
      })
    }

    Doc.prototype.content = function (node) {
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

    return Doc
  }())

  if (typeof define === 'function' && define.amd) {
    define(['artnum/Doc'], function () { return global.Artnum.Doc })
  }
}())
