/* eslint-env amd, webworker, browser */
/* global sjcl */
'use strict';

(function () {
  var global = Function('return this')() // eslint-disable-line

  if (typeof global.sjcl === 'undefined') {
    throw new Error('Rely on "Stanford Javascript Crypto Library" defined as a global "sjcl"\nFind it at https://bitwiseshiftleft.github.io/sjcl/')
  }

  if (typeof global.Artnum === 'undefined') {
    global.Artnum = {}
  }

  global.Artnum.Query = (function () {
    var my = {}

    var id = new Uint8Array(8)
    window.crypto.getRandomValues(id)
    id = id.join('')
    var count = 0

    my.exec = function (url, options = {}) {
      return new Promise(function (resolve, reject) {
        count++
        if (!options.credentials) {
          options.credentials = 'same-origin'
        }

        if (options.headers) {
          if (!options.headers['Content-Type']) {
            options.headers['Content-Type'] = 'application/json; charset=utf-8'
          }
        } else {
          options.headers = {'Content-Type': 'application/json; charset=utf-8'}
        }
        options.headers['X-Artnum-Reqid'] = id + String(count)

        if (options.body) {
          if (typeof options.body !== 'string') {
            options.body = JSON.stringify(options.body)
          }
        }

        fetch(url, options).then(function (response) {
          if (options.method && options.method.toLowerCase() === 'head') {
            var r = /^x-artnum-(.+)$/i // eslint-disable-line
            var results = {}
            for (var h of response.headers) {
              if (r.test(h[0])) {
                results[r.exec(h[0])[1].toLowerCase()] = h[1]
              }
            }

            resolve({success: true, type: 'results', 'message': 'OK', data: results, length: 1})
          } else {
            response.text().then(function (body) {
              var hash = {}
              var sign = {}
              for (var h of response.headers) {
                switch (h[0].toLowerCase()) {
                  case 'x-artnum-hash': hash.value = h[1]; break
                  case 'x-artnum-hash-algo': hash.algo = h[1]; break
                  case 'x-artnum-sign': sign.value = h[1]; break
                  case 'x-artnum-sign-algo': sign.algo = h[1]; break
                }
              }
              var valid = true
              if (hash.value && hash.algo) {
                if (sjcl.hash[hash.algo]) {
                  var value = sjcl.hash[hash.algo].hash(body)
                  if (sjcl.codec.base64.fromBits(value) !== hash.value) {
                    valid = false
                  }
                }
              }

              if (sign.value && sign.algo) {
                // Not implemented
              }

              if (valid) {
                resolve(JSON.parse(body))
              } else {
                resolve({success: false, type: 'error', message: 'Invalid data from server', data: [], length: 0})
              }
            })
          }
        })
      })
    }
    return my
  }())

  if (typeof define === 'function' && define.amd) {
    define(['artnum/Query'], function () { return global.Artnum.Query })
  }
}())
