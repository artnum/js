/* eslint-env browser, amd */
define([
  'dojo/_base/lang',
  'dojo/_base/declare',
  'dojo/Deferred',
  'dojo/request/xhr'
], function (
  djLang,
  djDeclare,
  DjDeferred,
  djXhr
) {
  return {
    _options: function () {
      var options = { handleAs: 'json', cacheTimeout: 240 }
      if (arguments[0]) {
        if (arguments[0].query) {
          options.query = arguments[0].query
        }
        if (arguments[0].headers) {
          options.headers = arguments[0].headers
        }
        if (arguments[0].data) {
          options.data = arguments[0].data
        }
        if (arguments[0].cacheTimeout) {
          options.data = arguments[0].cacheTimeout
        }
      }

      return options
    },

    get: function (url) {
      var xhr
      var def = new DjDeferred((reason) => { xhr.cancel() })
      var options = this._options(arguments[1])
      options.method = 'GET'

      xhr = djXhr(url, options)
      xhr.then(function (r) {
        def.resolve(r)
      }, function (r) {
        def.reject(r)
      })

      return def.promise
    },

    post: function (url) {
      var xhr
      var def = new DjDeferred((reason) => { xhr.cancel() })
      var options = this._options(arguments[1])
      options.method = 'POST'

      xhr = djXhr(url, options)
      xhr.then(function (r) {
        def.resolve(r)
      }, function (r) {
        def.reject(r)
      })

      return def.promise
    },

    put: function (url) {
      var xhr
      var def = new DjDeferred((reason) => { xhr.cancel() })
      var options = this._options(arguments[1])
      options.method = 'PUT'

      xhr = djXhr(url, options)
      xhr.then(function (r) {
        def.resolve(r)
      }, function (r) {
        def.reject(r)
      })

      return def.promise
    },

    del: function (url) {
      var xhr
      var def = new DjDeferred((reason) => { xhr.cancel() })
      var options = this._options(arguments[1])
      options.method = 'DELETE'

      xhr = djXhr(url, options)
      xhr.then(function (r) {
        def.resolve(r)
      }, function (r) {
        def.reject(r)
      })

      return def.promise
    },

    head: function (url) {
      var xhr = new XMLHttpRequest()
      var def = new DjDeferred((reason) => { xhr.abort() })

      window.setTimeout(function () {
        xhr.onreadystatechange = function (event) {
          if (this.readyState === XMLHttpRequest.DONE) {
            if (this.status === 200) {
              var hArtnum = /X-Artnum-([^:]+):([^\r\n]*)/
              var hGeneric = /([^:]+):([^\r\n]*)/
              var headers = this.getAllResponseHeaders()
              var result = {}
              headers.split(/[\r\n]/).forEach(function (header) {
                if (hArtnum.test(header)) {
                  var s = hArtnum.exec(header)
                  result[s[1]] = s[2]
                } else if (hGeneric.test(header)) {
                  s = hGeneric.exec(header)
                  result[s[1]] = s[2]
                }
              })
              def.resolve(result)
            } else {
              def.resolve(null)
            }
          }
        }

        xhr.open('HEAD', url, true)
        xhr.send()
      }, 0)

      return def.promise
    }
  }
})
