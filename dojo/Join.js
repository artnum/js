/* eslint-env browser,amd */
define([
  'dojo/_base/declare', 'dojo/_base/lang', 'dojo/Deferred', 'dojo/promise/all',
  'artnum/dojo/Request'

], function (
  djDeclare, djLang, DjDeferred, djAll,
  Request) {
  return function (req1, req2) {
    var def1 = new DjDeferred()
    var getDataCB = function (data) { return data }
    if (arguments[2]) {
      getDataCB = arguments[2]
    }

    if (!req1.options) { req1.options = {} }
    if (!req2.options) { req2.options = {} }

    Request.get(req1.url, req1.options).then(function (results) {
      var def2 = new DjDeferred()
      window.setTimeout(function () {
        var data = getDataCB(results)
        var promises = []
        for (var i = 0; i < data.length; i++) {
          var entry = data[i]

          promises.push(Request.get(entry[req2.attribute], req2.options).then(djLang.hitch(Object.assign({}, entry), function (results) {
            var entry = this
            var def3 = new DjDeferred()

            window.setTimeout(function () {
              var out = []
              var data = getDataCB(results)
              for (var i = 0; i < data.length; i++) {
                entry[req2.attribute] = data[i]
                out.push(entry)
              }
              def3.resolve(out)
            }, 0)

            return def3.promise
          })))
        }

        djAll(promises).then(function (results) {
          var merge = []
          for (var i = 0; i < results.length; i++) {
            merge = merge.concat(results[i])
          }
          def2.resolve(merge)
        })
      }, 0)

      return def2.promise
    }).then(function (result) { def1.resolve(result) })

    return def1.promise
  }
}) /* define */
