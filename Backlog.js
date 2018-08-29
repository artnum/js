/* eslint-env amd, browser */
/* global Artnum */
'use strict'

;(function () {
  var global = Function('return this')() // eslint-disable-line

  if (typeof global.Artnum === 'undefined' || typeof global.Artnum.Path === 'undefined') {
    throw Error('Artnum.Path not found')
  }

  global.Artnum.Backlog = (function () {
    var Backlog = function (msg, json) {
      try {
        fetch(Artnum.Path.url('backlog'), {method: 'POST', body: JSON.stringify({message: msg, details: json, trace: new Error().trace}), credential: 'same-origin'})
      } catch (e) {
        console.log('Backloging to server fail')
      }
    }

    return Backlog
  }())

  if (typeof define === 'function' && define.amd) {
    define(['artnum/Backlog'], function () { return global.Artnum.Doc })
  }
}())
