/* eslint-env worker, browser */

function Hour (initValue = null) { // eslint-disable-line
  var Hour = {value: 0} // up to second

  Hour.format = function (separator = ':') {
    var hour = Math.trunc(this.value / 3600)
    var minute = Math.trunc(((this.value / 3600) - hour) * 60)
    var second = Math.trunc(((((this.value / 3600) - hour) * 60) - minute) * 60)

    if (hour < 10) { hour = '0' + String(hour) } else { hour = String(hour) }
    if (minute < 10) { minute = '0' + String(minute) } else { minute = String(minute) }

    if (second === 0) {
      return hour + separator + minute
    }

    if (second < 10) { second = '0' + String(second) } else { second = String(second) }
    return hour + separator + minute + separator + second
  }

  Hour.parse = function (value) {
    var r = /\s*([0-9]*)\s*(?:(?:([m|M]|[h|H]){1}\s*([0-9]*))|(?:([.:,]{1})\s*([0-9]*))){0,1}\s*/
    var intValue
    if (r.test(value)) {
      value = r.exec(value)
      if (!value[2] && !value[4]) {
        intValue = Number(value[1])
      } else if (String(value[2]).toLowerCase() === 'h' || String(value[2]).toLowerCase() === 'm') {
        intValue = Number(value[1]) * Number(String(value[2]).toLowerCase() === 'h' ? 60 : 1)
        if (String(value[2]).toLowerCase() === 'h' && value[3]) {
          if (value[3].length === 1) {
            value[3] += '0'
          } else if (value[3].length > 2) {
            value[3] = value[3].substr(0, 2)
          }
          intValue += Number(value[3])
        }
      } else {
        intValue = Number(value[1]) * 60
        if (value[5].length === 1) {
          value[5] += '0'
        } else if (value[5].length > 2) {
          value[5] = value[5].substr(0, 2)
        }
        switch (value[4]) {
          case ':':
            if (value[5]) {
              intValue += Number(value[5])
            }
            break
          case ',': case '.':
            if (value[5]) {
              intValue += 0.6 * Number(value[5])
            }
            break
        }
      }
    }
    return intValue * 60
  }

  if (initValue) {
    if (typeof initValue === 'string') {
      Hour.value = Hour.parse(initValue)
    } else if (typeof initValue === 'number') {
      Hour.value = Math.trunc(initValue)
    }
  }

  return Hour
}
