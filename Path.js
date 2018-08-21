/* eslint-env amd, browser */
(function () {
  if (typeof window.Artnum === 'undefined') {
    this.Artnum = {}
  }

  this.Artnum.Path = (function () {
    var my = {}

    /* return origin directory */
    my.o = function () {
      var o = window.location.pathname.split('/')
      for (var i = 0; i < o.length; i++) {
        if (o[i]) { break }
      }

      return '/' + o[i]
    }

    /* build url for fetch relative to first level dir, return an URL object */
    my.url = function (str) {
      var dir = this.o()
      return new URL(window.location.origin + '/' + dir + '/' + str)
    }

    return my
  }())

  if (typeof define === 'function' && define.amd) {
    define(['artnum/Path'], function () { return this.Artnum.Path })
  }
}())
