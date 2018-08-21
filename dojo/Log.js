/* eslint-env browser,amd */
define([
  /* dojo base */
  'dojo/_base/declare',
  'dojo/_base/lang',

  /* dijit widget base */
  'dijit/_WidgetBase',

  /* utils */
  'dojo/dom-construct',
  'dojo/dom-style',
  'dojo/dom-class'
], function (
  declare,
  djLang,

  dtWidgetBase,

  djDomConstruct,
  djDomStyle,
  djDomClass
) {
  return declare('artnum.Log', [dtWidgetBase], {
    destroy: function () {
      this.hide()
      this.inherited(arguments)
    },

    constructor: function () {
      this.inherited(arguments)
    },

    _getTimeoutAttr: function () {
      return this._get('timeout') * 1000
    },

    show: function () {
      if (this.get('Node')) {
        window.requestAnimationFrame(function () {
          document.body.appendChild(this.get('Node'))
        }.bind(this))
      }

      if (this.get('timeout')) {
        this._timeout = window.setTimeout(function () {
          this.destroy()
        }.bind(this), this.get('timeout'))
      }

      return this
    },

    cancel: function () {
      if (this._timeout) {
        window.clearTimeout(this._timeout)
      }
      this._timeout = null
    },

    hide: function () {
      if (this.get('Node')) {
        var node = this.get('Node')
        window.requestAnimationFrame(function () {
          if (node.parentNode) {
            node.parentNode.removeChild(node)
          }
        })
      }

      return this
    },

    postCreate: function () {
      var dom = document.createElement('DIV')
      var type = 'error'
      if (this.get('type')) {
        type = this.get('type')
      }
      dom.setAttribute('class', 'artnumLog ' + type)
      this.set('Node', dom)
      if (this.get('message')) {
        dom.appendChild(document.createTextNode(this.get('message')))
      }
    }
  })
})
