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

Date.prototype.shortHour = function () {
  var h = this.getHours()
  var m = this.getMinutes()
  if (h < 10) { h = '0' + h }
  if (m < 10) { m = '0' + m }
  return h + ':' + m
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
