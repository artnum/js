/* eslint-env browser,amd */
define([
  'dojo/_base/declare',
  'dojo/Evented',
  'dijit/_WidgetBase',
  'dojo/_base/lang',
  'dojo/on',

  'dijit/registry',

  'artnum/dojo/Button'
], function (
  djDeclare,
  djEvented,
  _dtWidgetBase,
  djLang,
  djOn,

  dtRegistry,

  Button
) {
  return djDeclare('artnum.ButtonGroup', [
    _dtWidgetBase, djEvented
  ], {
    baseClass: 'artnumButtonGroup',

    constructor: function () {
      this.moveNodeTop = false
      this.domNode = document.createElement('DIV')
      this.domNode.setAttribute('class', this.baseClass)

      var input = document.createElement('INPUT')
      input.setAttribute('type', 'text')
      input.setAttribute('style', 'display: none')

      this.Input = input
      this.domNode.appendChild(input)

      if (arguments[0]) {
        if (arguments[0].moveNode) {
          this.moveNodeTop = true
        }
      }
    },
    _setNameAttr: function (name) {
      this.Input.setAttribute('name', name)
    },
    _getLabelAttr: function () {
      var btns = dtRegistry.findWidgets(this.domNode)
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].get('selected')) {
          return btns[i].get('label')
        }
      }
      return null
    },
    _getValueAttr: function () {
      var btns = dtRegistry.findWidgets(this.domNode)
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].get('selected')) {
          return btns[i].get('value')
        }
      }
      return null
    },
    _setValueAttr: function (value) {
      var input = this.Input
      var btns = dtRegistry.findWidgets(this.domNode)
      btns.forEach(function (btn) {
        if (btn.get('value') === value) {
          btn.set('selected', true)
          input.value = btn.get('value')
        } else {
          btn.set('selected', false)
        }
      })
    },
    eSelectBtn: function (event) {
      var btn = dtRegistry.getEnclosingWidget(event.target)
      this.set('value', btn.get('value'))
      this.emit('change', btn.get('value'))

      if (this.moveNodeTop) {
        window.requestAnimationFrame(function () {
          var pNode = btn.domNode.parentNode
          pNode.removeChild(btn.domNode)
          pNode.insertBefore(btn.domNode, pNode.firstChild)
        })
      }
    },
    removeValue: function (value) {
      var btn = dtRegistry.findWidgets(this.domNode).find(function (e, idx, arr) {
        return e.get('value') === value
      })
      var domNode = this.domNode

      window.requestAnimationFrame(function () {
        domNode.removeChild(btn.domNode)
        btn.destroy()
      })
    },
    addValue: function (value) {
      var label = value
      var type = ''
      if (arguments[1]) {
        if (arguments[1]['type']) {
          type = arguments[1]['type']
        }
        if (arguments[1]['label']) {
          label = arguments[1]['label']
        }
      }

      var btn = new Button({ label: label, value: value, type: type })
      this.own(btn)
      djOn(btn, 'click', djLang.hitch(this, this.eSelectBtn))

      var domNode = this.domNode
      window.requestAnimationFrame(function () {
        domNode.appendChild(btn.domNode)
      })
    }
  })
})
