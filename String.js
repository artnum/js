/* eslint-env browser, amd */
/* eslint no-extend-native: ["error", { "exceptions": ["String"] }] */

String.prototype.unbreak = function () {
  var spacer = arguments[0] ? arguments[0] : ''
  var lines = this.split('\n')
  var res = []
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].trim().length > 0) {
      res.push(lines[i].trim())
    }
  }

  return res.join(spacer)
}
