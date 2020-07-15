/* eslint no-extend-native: ["error", { "exceptions": ["Date"] }] */
/* *** From https://weeknumber.net/how-to/javascript *** */
Date.prototype.getWeek = function () {
  var date = new Date(this.getTime())
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
  var week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}

Date.prototype.getWeekYear = function () {
  var date = new Date(this.getTime())
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
  return date.getFullYear()
}

/* *** From myself *** */
/* join date part with hour part and return a new date */
Date.prototype.join = function (hour) {
  var date = new Date(this.getTime())

  date.setHours(hour.getHours())
  date.setMinutes(hour.getMinutes())
  date.setSeconds(hour.getSeconds())
  date.setMilliseconds(hour.getMilliseconds())

  return date
}

Date.prototype.hours = function () {
  return this.getHours() + (this.getMinutes() / 60) + (this.getSeconds() / 60 / 60)
}

Date.prototype.shortDate = function (prefix = false) {
  if (!prefix) {
    return this.getDate() + '.' + (this.getMonth() + 1)
  } else {
    var m = this.getMonth() + 1
    var d = this.getDate()
    if (m < 10) { m = `0${m}` }
    if (d < 10) { d = `0${d}` }
    return `${d}.${m}`
  }
}

Date.prototype.fullDate = function () {
  var d = this.getDate()
  var m = this.getMonth() + 1
  var y = this.getFullYear()
  if (d < 10) { d = '0' + d }
  if (m < 10) { m = '0' + m }

  return d + '.' + m + '.' + y
}

Date.prototype.dateStamp = function () {
  let d = this.getDate()
  let m = this.getMonth() + 1
  let y = this.getFullYear()

  return `${y}-${m < 10 ? '0' + m : m }-${d < 10 ? '0' + d : d}`
}

Date.prototype.shortHour = function () {
  var h = this.getHours()
  var m = this.getMinutes()
  if (h < 10) { h = '0' + h }
  if (m < 10) { m = '0' + m }
  return h + ':' + m
}

/* italian, french, german, english month name for parsing */
Date.EUMonths = {
  'gennaio': 1,
  'janvier': 1,
  'january': 1,
  'januar': 1,
  'febbraio': 2,
  'fevrier': 2,
  'février': 2,
  'february': 2,
  'feburar': 2,
  'marzo': 3,
  'mars': 3,
  'march': 3,
  'marz': 3,
  'märz': 3,
  'aprile': 4,
  'avril': 4,
  'april': 4,
  'maggio': 5,
  'mai': 5,
  'may': 5,
  'guigno': 6,
  'juin': 6,
  'june': 6,
  'juni': 6,
  'luglio': 7,
  'juillet': 7,
  'july': 7,
  'juli': 7,
  'agosto': 8,
  'aout': 8,
  'août': 8,
  'august': 8,
  'settembre': 9,
  'septembre': 9,
  'september': 9,
  'ottobre': 10,
  'octobre': 10,
  'october': 10,
  'oktober': 10,
  'novembre': 11,
  'november': 11,
  'dicembre': 12,
  'decembre': 12,
  'décembre': 12,
  'dezember': 12,
  'december': 12
}

Date.EUParse = function (txt, origin = null) {
  const durationReg = /^\s*([0-9]+)\s*(ja|j|s|m|a|d|y|w|g|t)?\s*$/gi
  const dateReg = /^\s*([0-9]+)\s*[\.\/\-]?\s*([0-9]+|[a-zäéû]+)\s*[\.\/\-]?\s*([0-9]+)?\s*$/gi
  let duration = durationReg.exec(txt)
  let date = dateReg.exec(txt)
  if (date !== null && duration === null) {
      if (date) {
          let d = parseInt(date[1])
          let m = parseInt(date[2])
          if (isNaN(m)) {
              date[2] = date[2].toLocaleLowerCase()
              if (Date.EUMonths[date[2]] !== undefined) {
                  m = Date.EUMonths[date[2]]
              } else {
                  for(let month in Date.EUMonths) {
                      if (month.indexOf(date[2]) === 0) {
                          m = Date.EUMonths[month]
                          break
                      }
                  }
              }
          }
          let y = (new Date()).getFullYear()
          if (date[3] !== undefined) {
              y = parseInt(date[3])
              if (date[3].length < 4) {
                  y += 2000
              }
          }
          return new Date(y, m - 1, d)
      }
  } else if (duration !== null) {
      if (!origin) {
          origin = new Date()
      }
      if (duration[2] === undefined) {
          duration[2] = 'j'
      }
      switch (duration[2].toLowerCase()) {
          // Jour or Day
          case 'j':
          case 'd':
          case 't':
          case 'g':
              return new Date(origin.getFullYear(), origin.getMonth(), origin.getDate() + parseInt(duration[1]))
          // Semaine or Week
          case 's':
          case 'w':
              return new Date(origin.getFullYear(), origin.getMonth(), origin.getDate() + (parseInt(duration[1]) * 7))
          // Mois or Month
          case 'm':
              return new Date(origin.getFullYear(), origin.getMonth() + parseInt(duration[1]), origin.getDate())
          // An or Year
          case 'a':
          case 'y':
          case 'ja':
              return new Date(origin.getFullYear() + parseInt(duration[1]), origin.getMonth(), origin.getDate())
      }
  } else {
    return new Date(undefined)
  }
}

/* DateRange object has a begining and an end */
var DateRange = function (begin, end) {
  if (begin instanceof Date) {
    this.begin = begin
  } else {
    this.begin = new Date(begin)
  }

  if (end instanceof Date) {
    this.end = end
  } else {
    this.end = new Date(end)
  }
}

/* Check if a date is within a DateRange */
DateRange.prototype.within = function (value) {
  if (this.begin.getTime() <= value.getTime() && this.end.getTime() >= value.getTime()) {
    return true
  }
  return false
}

/* Check if a range contains another range */
DateRange.prototype.contains = function (daterange) {
  if (this.within(daterange.begin) && this.within(daterange.end)) {
    return true
  }
  return false
}

/* Check if two DateRange overlap */
DateRange.prototype.overlap = function (daterange) {
  if (daterange instanceof DateRange) {
    if (this.within(daterange.begin) || this.within(daterange.end) ||
      daterange.within(this.begin) || daterange.within(this.end)) {
      return true
    }
  }

  return false
}

/* Return new DateRange containing both overlaping DateRange */
DateRange.prototype.merge = function (daterange) {
  var begin, end
  if (this.overlap(daterange)) {
    if (this.begin.getTime() < daterange.begin.getTime()) {
      begin = this.begin
    } else {
      begin = daterange.begin
    }

    if (this.end.getTime() > daterange.end.getTime()) {
      end = this.end
    } else {
      end = daterange.end
    }

    return new DateRange(begin, end)
  }

  return null
}

var Hour = function () {
  this.MS = 0
  if (arguments[0] && !Number.isNaN(arguments[0])) {
    this.MS = arguments[0] * 1000
  }
}

Hour.prototype.toMinStr = function () {
  var sec = this.MS / 1000
  var mins = (sec / 60) % 60
  var hours = Math.floor(sec / 3600)

  if (mins < 10) {
    return hours + ':0' + mins
  } else {
    return hours + ':' + mins
  }
}
