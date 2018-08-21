/* eslint-env amd,browser */
define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/_base/lang',
  'dojo/text!./templates/Hour.html'
], function (
  djDeclare,
  _dtWidgetBase,
  _dtTemplatedMixin,
  _dtWidgetsInTemplateMixin,
  djLang,
  template
) {
  return djDeclare('artnum.Hour', [
    _dtWidgetBase, _dtTemplatedMixin, _dtWidgetsInTemplateMixin
  ], {
    templateString: template,
    baseClass: 'artnumHour',

    _setNameAttr: function (name) {
      this.nValue.setAttribute('name', name)
    },

    _setValueAttr: function (value) {
      if (value) {

      } else {
        this.nValue.value = ''
      }
    },

    _getValueAttr: function () {
      var intValue = 0
      if (!this.nValue) { return intValue }
      var value = this.nValue.value
      var r = /\s*([0-9]*)\s*(?:(?:([m|M]|[h|H]){1}\s*([0-9]*))|(?:([.:,]{1})\s*([0-9]*))){0,1}\s*/

      if (r.test(value)) {
        value = r.exec(value)
        if (!value[2] && !value[4]) {
          intValue = Number(value[1])
        } else if (String(value[2]).toLowerCase() === 'h' || String(value[2]).toLowerCase() === 'm') {
          intValue = Number(value[1]) * Number(String(value[2]).toLowerCase() === 'h' ? 60 : 1)
          if (String(value[2]).toLowerCase() === 'h' && value[3]) {
            if (value[3].length === 1) {
              value[3] += '0'
            } else if (value[3].length > 2) {
              value[3] = value[3].substr(0, 2)
            }
            intValue += Number(value[3])
          }
        } else {
          intValue = Number(value[1]) * 60
          if (value[5].length === 1) {
            value[5] += '0'
          } else if (value[5].length > 2) {
            value[5] = value[5].substr(0, 2)
          }
          switch (value[4]) {
            case ':':
              if (value[5]) {
                intValue += Number(value[5])
              }
              break
            case ',': case '.':
              if (value[5]) {
                intValue += 0.6 * Number(value[5])
              }
              break
          }
        }
      }
      return intValue * 60
    },
    focus: function () {
      this.nValue.focus()
    }
  })
})
