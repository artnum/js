/* eslint-env amd */
'use strict';

(function () {
  /* work in browser and webworker */
  var global = Function('return this')() // eslint-disable-line

  if (typeof global.Artnum === 'undefined') {
    global.Artnum = {}
  }

  global.Artnum.Path = (function () {
    var my = {}

    /* return origin directory */
    my.o = function () {
      var o = global.location.pathname.split('/')
      for (var i = 0; i < o.length; i++) {
        if (o[i]) { break }
      }

      return '/' + o[i]
    }

    /* build url for fetch relative to first level dir, return an URL object */
    my.url = function (str) {
      var dir = this.o()
      return new URL(global.location.origin + '/' + dir + '/' + str)
    }

    return my
  }())

  if (typeof define === 'function' && define.amd) {
    define(['artnum/Path'], function () { return global.Artnum.Path })
  }
}())
