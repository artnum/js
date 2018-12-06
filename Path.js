/* eslint-env amd */
'use strict';

(function () {
  /* work in browser and webworker */
  var global = Function('return this')() // eslint-disable-line

  if (typeof global.Artnum === 'undefined') {
    global.Artnum = {}
  }

  global.Artnum.Path = (function () {
    var Path = function (src, options = {}) {
      return this.url(src, options)
    }

    /* return origin directory */
    Path.prototype.o = function () {
      var o = global.location.pathname.split('/')
      for (var i = 0; i < o.length; i++) {
        if (o[i]) { break }
      }

      return '/' + o[i]
    }

    /* build url for fetch relative to first level dir, return an URL object */
    Path.prototype.url = function (str, options = {}) {
      var dir = this.o()
      var url = new URL(global.location.origin + '/' + dir + '/' + str)

      if (typeof options.params === 'object') {
        for (var param in options.params) {
          url.searchParams.set(param, options.params[param])
        }
      }

      return url
    }

    return Path
  }())

  if (typeof define === 'function' && define.amd) {
    define(['artnum/Path'], function () { return global.Artnum.Path })
  }
}())
