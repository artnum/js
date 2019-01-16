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

    /* broadcast channel name */
    my.bcname = function (id) {
      var origin = this.o()
      return String(origin + '/' + id).replace('//', '/')
    }

    /* build url for fetch relative to first level dir, return an URL object */
    my.url = function (str, options = {}) {
      var dir = this.o()
      var url = new URL(global.location.origin + '/' + dir + '/' + str)

      if (typeof options.params === 'object') {
        for (var param in options.params) {
          if (Array.isArray(options.params[param])) {
            for (var i = 0; i < options.params[param].length; i++) {
              url.searchParams.append(param + '[]', options.params[param][i])
            }
          } else {
            url.searchParams.set(param, options.params[param])
          }
        }
      }

      return url
    }

    return my
  }())

  if (typeof define === 'function' && define.amd) {
    define(['artnum/Path'], function () { return global.Artnum.Path })
  }
}())
