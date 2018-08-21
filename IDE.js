/* eslint-env amd */
/* This is to verify the Swiss Entreprise Identifier. https://www.bfs.admin.ch/bfs/en/home/registers/enterprise-register/enterprise-identification/uid-general/uid.html */
'use strict';

(function () {
  var global = Function('return this')() // eslint-disable-line

  if (typeof global.Artnum === 'undefined') {
    global.Artnum = {}
  }

  global.Artnum.IDE = (function () {
    var my = {}

    my.verify = function (ide) {
      var re = /\s*[A-Za-z]{3}[\s\-\.]*([0-9]{3})[\s\-\.]*([0-9]{3})[\s\-\.]*([0-9]{3})[\s\-\.]*.*/ // eslint-disable-line
      if (re.test(ide)) {
        var m = re.exec(ide)
        var total = Number(m[1][0]) * 5 + Number(m[1][1]) * 4 + Number(m[1][2]) * 3 +
          Number(m[2][0]) * 2 + Number(m[2][1]) * 7 + Number(m[2][2]) * 6 +
          Number(m[3][0]) * 5 + Number(m[3][1]) * 4
        total = 11 - (total % 11)
        if (total >= 10) {
          return false
        } else if (total === Number(m[3][2])) {
          return true
        }
      }

      return false
    }

    return my
  }())

  if (typeof define === 'function' && define.amd) {
    define(['artnum/IDE'], function () { return global.Artnum.IDE })
  }
}())
