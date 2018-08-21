/* eslint-env amd, browser */
define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/_base/lang',
  'dojo/text!./templates/Button.html',

  'dojo/dom-class'
], function (
  djDeclare,
  _dtWidgetBase,
  _dtTemplatedMixin,
  _dtWidgetsInTemplateMixin,
  djLang,
  template,

  djDomClass
) {
  return djDeclare('artnum.Button', [
    _dtWidgetBase, _dtTemplatedMixin, _dtWidgetsInTemplateMixin
  ], {
    templateString: template,
    baseClass: 'artnumButton',

    type: '',
    _setTypeAttr: { node: 'nRoot', type: 'class' },

    selected: false,
    _setSelectedAttr: function (selected) {
      this.selected = selected
      if (selected) {
        djDomClass.add(this.domNode, 'selected')
      } else {
        djDomClass.remove(this.domNode, 'selected')
      }
    }
  })
})
