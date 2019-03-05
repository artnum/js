/* eslint-env browser */
'use strict'

;(function () {
  var global = Function('return this')() // eslint-disable-line
  if (!document) {
    throw Error('Must be used in browser')
  }

  if (typeof global.Artnum === 'undefined') {
    global.Artnum = {}
  }

  var Artnum = global.Artnum

  global.Artnum.DTable = (function () {
    var isHTMLElement = function (x) {
      return (typeof HTMLElement === 'object' ? x instanceof HTMLElement : x && typeof x === 'object' && x !== null && x.nodeType === Node.ELEMENT_NODE && typeof x.nodeName === 'string')
    }
    /* parse json stored into attribute. Format is more like {key: 'value'}, so JSON.parse doesn't work */
    var toJSON = function (str) {
      str = str.replace(/'/g, '"').replace(/(['"])?([a-zA-Z0-9_.]+)(['"])?:/g, '"$2": ')
      return JSON.parse(str)
    }

    var names = {
      sortName: 'data-sort-name',
      sortValue: 'data-sort-value',
      source: 'data-source',
      options: 'data-options',
      attribute: 'data-attribute',
      entryId: 'data-entry-id',
      id: 'data-id',
      refresh: 'data-refresh',
      condition: 'data-condition'
    }

    var dateValue = function (date) {
      try {
        var x = new Date(date)
        if (!isNaN(x.getTime())) { return x.getTime() } else { return 0 }
      } catch (e) {
        return 0
      }
    }

    var cmpNode = function (tr1, tr2, options, level = 0) {
      if (!Array.isArray(options.name)) {
        options.name = [options.name]
      }
      if (!Array.isArray(options.type)) {
        options.type = [options.type]
      }

      var nId = level < options.name.length ? level : options.name.length - 1
      var tId = level < options.type.length ? level : options.type.length - 1

      var node1 = toNode(tr1, options.name[nId])
      var node2 = toNode(tr2, options.name[nId])

      var attr1 = node1.getAttribute(names.sortValue) ? node1.getAttribute(names.sortValue) : node1.innerText
      var attr2 = node2.getAttribute(names.sortValue) ? node2.getAttribute(names.sortValue) : node2.innerText

      if (attr1 && !attr2) { return 1 }
      if (!attr1 && attr2) { return -1 }

      var v1 = attr1
      var v2 = attr2
      var number = false
      switch (options.type[tId]) {
        case 'integer':
          v1 = parseInt(attr1)
          v2 = parseInt(attr2)
          number = true
          break
        case 'float':
          v1 = parseFloat(attr1)
          v2 = parseFloat(attr2)
          number = true
          break
        case 'string':
          v1 = String(attr1).toLowerCase()
          v2 = String(attr2).toLowerCase()
          break
        case 'date':
          v1 = dateValue(attr1)
          v2 = dateValue(attr2)
          break
      }

      if (number) {
        if (isNaN(v1) || isNaN(v2)) {
          if (isNaN(v1) && !isNaN(v2)) {
            return 1
          } else if (!isNaN(v1) && isNaN(v2)) {
            return -1
          } else {
            v1 = String(attr1).toLowerCase()
            v2 = String(attr2).toLowerCase()
          }
        } else {
          /* parseInt/parseFloat do their best so "12asd" will give 12, but it's not an integer. */
          var b1 = v1.toString() !== attr1
          var b2 = v2.toString() !== attr2
          if (b1 || b2) {
            if (!b1 && b2) {
              return -1
            } else if (b1 && !b2) {
              return 1
            } else {
              v1 = String(attr1).toLowerCase()
              v2 = String(attr2).toLowerCase()
            }
          }
        }
      }

      if (v1 === v2) {
        if (options.name[level + 1]) {
          return cmpNode(tr1, tr1, options, level + 1)
        }
        return 0
      }
      return v1 < v2 ? -1 : 1
    }

    var swapNode = function (htmlarray, n1, n2) {
      var tmp = htmlarray[n2]
      htmlarray[n2] = htmlarray[n1]
      htmlarray[n1] = tmp
    }

    var siftDown = function (htmlarray, i, max, reverse, options) {
      while (i < max) {
        var iBig = i
        var c1 = (2 * i) + 1
        var c2 = c1 + 1
        if (reverse) {
          if (c1 < max && cmpNode(htmlarray[c1], htmlarray[iBig], options) < 0) {
            iBig = c1
          }
          if (c2 < max && cmpNode(htmlarray[c2], htmlarray[iBig], options) < 0) {
            iBig = c2
          }
        } else {
          if (c1 < max && cmpNode(htmlarray[c1], htmlarray[iBig], options) > 0) {
            iBig = c1
          }
          if (c2 < max && cmpNode(htmlarray[c2], htmlarray[iBig], options) > 0) {
            iBig = c2
          }
        }
        if (iBig === i) { return }
        swapNode(htmlarray, i, iBig)
        i = iBig
      }
    }

    var heapSort = function (htmlarray, options) {
      return new Promise(function (resolve, reject) {
        var reverse = options.reverse ? options.reverse : false
        var i = Math.floor(htmlarray.length / 2 - 1)
        while (i >= 0) {
          siftDown(htmlarray, i, htmlarray.length, reverse, options)
          i--
        }
        var end = htmlarray.length - 1
        while (end > 0) {
          swapNode(htmlarray, 0, end)
          siftDown(htmlarray, 0, end, reverse, options)
          end--
        }
        resolve(htmlarray)
      })
    }

    /* Not the fastest way of sorting (for the same dataset I could gain some 100ms) BUT :
     *  - Fast enough
     *  - Can sort a table while TR are added
     *  - Is multilevel sort (the 100ms gain was without that)
     *  - Use heap sort which is n log n
     *  - After test, heap sort is faster than built-in Array.sort on Chrome and nearly as fast as Firefox's Array.sort
     */
    var sortHTMLNodes = function (parent, o) {
      ;(function () {
        return new Promise(function (resolve, reject) {
          var array = []
          for (var i = parent.firstChild; i; i = i.nextSibling) {
            array.push(i)
          }
          resolve(array)
        })
      }()).then(function (array) {
        heapSort(array, o).then(function (array) {
          window.requestAnimationFrame(function () {
            for (var i = array.length - 1; i >= 0; i--) {
              parent.insertBefore(array[i], parent.firstChild)
            }
          })
        })
      })
    }
    var DTable = function () {
      this.Table = null
      this.Thead = null
      this.Tbody = null
      this.EntryId = 'id'
      this.searchParams = {}
      this.refreshParams = {}

      if (arguments[0]) {
        if (arguments[0].prefix) {
          if (typeof arguments[0].prefix !== 'string') {
            console.warn('Prefix not right type, ignoring')
          } else {
            for (var k in names) {
              names[k] = 'data-' + arguments[0].prefix + '-' + k
            }
          }
        }
        if (arguments[0].table) {
          if (typeof arguments[0].table === 'string') {
            this.Table = document.getElementById(arguments[0].table)
          } else if (isHTMLElement(arguments[0].table)) {
            this.Table = arguments[0].table
          }
        }
      }
      if (!this.Table) {
        throw Error('No table given')
      }
      if (!this.Table.getAttribute(names.source)) {
        throw Error('No source given')
      }
      if (this.Table.getAttribute(names.entryId)) {
        this.Table.EntryId = this.Table.getAttribute(names.entryId)
      }

      if (this.Table.getAttribute(names.refresh)) {
        this.refreshParams = toJSON(this.Table.getAttribute(names.refresh))
      }

      if (arguments[0].head) {
        if (isHTMLElement(arguments[0].head)) {
          this.Thead = arguments[0].head
        } else if (Number.isInteger(arguments[0].head)) {
          var theads = this.Table.getElementsByTagName('THEAD')
          if (theads.length >= arguments[0].head) {
            this.Thead = theads[arguments[0].head - 1]
          }
        }
      }

      if (arguments[0].body) {
        if (isHTMLElement(arguments[0].body)) {
          this.Tbody = arguments[0].body
        } else if (Number.isInteger(arguments[0].body)) {
          var tbodys = this.Table.getElementsByTagName('TBODY')
          if (tbodys.length >= arguments[0].body) {
            this.Tbody = tbodys[arguments[0].body - 1]
          }
        }
      }

      if (!this.Thead) {
        theads = this.Table.getElementsByTagName('THEAD')
        if (theads.length > 0) {
          this.Thead = theads[0]
        } else {
          throw Error('No head found')
        }
      }

      this.Thead.addEventListener('click', function (event) {
        var reverse = false
        if (!this.Thead.getAttribute('data-sort-dir')) {
          this.Thead.setAttribute('data-sort-dir', 'ASC')
        } else {
          if (this.Thead.getAttribute('data-sort-dir') === 'ASC') {
            reverse = true
          }
        }

        if (reverse) {
          this.Thead.setAttribute('data-sort-dir', 'DESC')
        } else {
          this.Thead.setAttribute('data-sort-dir', 'ASC')
        }

        this.sortFrom(event.target, reverse)
      }.bind(this))

      if (!this.Tbody) {
        tbodys = this.Table.getElementsByTagName('TBODY')
        if (tbodys.length > 0) {
          this.Tbody = tbodys[0]
        } else {
          this.Tbody = document.createElement('TBODY')
          this.Table.insertBefore(this.Tbody, this.Thead.nextSibling)
        }
      }
      this.processHead()
      this.query()
    }

    DTable.prototype.reverseRows = function () {
      var firstChild = this.Tbody.firstChild

      var display = function () {
        var start = performance.now()
        while (firstChild !== this.Tbody.lastChild) {
          var x = this.Tbody.removeChild(this.Tbody.lastChild)
          this.Tbody.insertBefore(x, firstChild)
          if (performance.now() - start > 100) {
            window.requestAnimationFrame(display)
            return
          }
        }
      }.bind(this)

      window.requestAnimationFrame(function () { display() })
    }

    var toNode = function (o, name) {
      var node = o.firstChild
      while (node && node.getAttribute('data-sort-name') !== name) { node = node.nextSibling }

      return node
    }

    DTable.prototype.sortFrom = function (head, reverse) {
      var name = head.getAttribute('data-sort-name')
      var type = head.getAttribute('data-sort-type') ? head.getAttribute('data-sort-type') : 'string'

      sortHTMLNodes(this.Tbody, {name: [name], type: [type], reverse: reverse})
    }

    DTable.prototype.isNewer = function (entry) {
      var current = null
      if (entry[this.Modified]) {
        current = entry[this.Modified]
      }
      if (!this.CurrentVal) {
        this.CurrentVal = current
        return true
      }
      if (this.ModifiedInt) {
        if (parseInt(this.CurrentVal) > parseInt(current)) {
          return false
        }
      } else {
        if (String(this.CurrentVal) > String(current)) {
          return false
        }
      }
      this.CurrentVal = current
      return true
    }

    DTable.prototype.refresh = function () {
      var params = this.refreshParams
      if (params.indicator) {
        if (params.indicator.name) {
          this.Modified = params.indicator.name
        }
        if (params.indicator.integer) {
          this.ModifiedInt = true
        } else {
          this.ModifiedInt = false
        }

        var qparams = Object.assign({}, this.searchParams)
        if (params.parameters) {
          qparams = Object.assign(qparams, params.parameters)
        }
        if (params.indicator.parameter) {
          qparams[params.indicator.parameter] = '>' + String(this.CurrentVal)
          Artnum.Query.exec(Artnum.Path.url(this.Table.getAttribute(names.source), {params: qparams})).then(function (result) {
            if (result.success && result.length > 0) {
              this.processResult(result)
            }
            this.refresh()
          }.bind(this))
        }
      }
    }

    var getVar2 = function (entry, varname) {
      var values = []
      if (varname[0] === '$') { varname = varname.substr(1) }
      var elements = varname.split('.')
      while (true) {
        var element = elements.shift()
        if (!element) { break }
        if (!entry[element]) { break }
        if (Array.isArray(entry[element])) {
          entry[element].forEach(function (subentry) {
            values = values.concat(getVar2(subentry, elements.join('.')))
          })
        } else if (typeof entry[element] === 'object') {
          entry = entry[element]
        } else {
          values.push(entry[element])
        }
      }

      return values
    }

    var getVar = function (entry, varname) {
      var v = varname.substr(1).split('.')
      var e = entry
      for (var i = 0; i < v.length; i++) {
        if (e[v[i]]) {
          e = e[v[i]]
        } else {
          e = null
          break
        }
      }
      return e
    }

    var parseSub = function (subquery) {
      var sub = subquery.split(';')
      if (sub.length > 0) {
        var url = sub[0].substr(1)
        var val = []
        for (var i = 1; i < sub.length; i++) {
          val.push(sub[i])
        }

        return {url: url, val: val}
      } else {
        return {url: subquery.substr(1), val: null}
      }
    }

    var getQueries = function (url, vars, idx) {
      var queries = []
      var q = url
      if (!vars[idx]) { return queries }
      for (var k = 0; k < vars[idx].val.length; k++) {
        q = url.replace(vars[idx].name, vars[idx].val[k])
        for (var i = 0; i < vars.length; i++) {
          if (idx !== i) {
            for (var j = 0; j < vars[i].val.length; j++) {
              q = q.replace(vars[i].name, vars[i].val[j])
            }
          }
        }
        queries.push(q)
      }

      if (++idx < vars.length) {
        queries = queries.concat(getQueries(url, vars, idx))
      }
      return queries
    }

    var getSub = async function (subquery, vars, entry) {
      var sub = null
      if (subquery[0] === '@') {
        sub = parseSub(subquery)
      }

      if (sub) {
        var queryCount = 0
        var varsData = []
        for (var i = 0; i < vars.length; i++) {
          var v = getVar2(entry, vars[i])
          if (v) {
            if (!Array.isArray(v)) {
              v = [v]
            }
            if (v.length > 0) {
              varsData.push({val: v, name: vars[i]})
              queryCount += v.length
            }
          } else {
            break
          }
        }

        if (queryCount > 0) {
          console.log('Number of needed query for condition ', queryCount, entry)
        } else if (queryCount > 5) {
          console.warn('Number of needed query for condition ', queryCount, entry)
        }
        var queries = getQueries(sub.url, varsData, 0)
        var retval = []
        for (i = 0; i < queries.length; i++) {
          var val = await Artnum.Query.exec(Artnum.Path.url(queries[i]))
          if (val.success && val.length > 0) {
            if (!sub.val) {
              val.data.forEach(function (v) {
                retval.push(String(v))
              })
            } else {
              val.data.forEach(function (val) {
                var vals = []
                sub.val.forEach(function (v) {
                  var _v = getVar(val, '_' + v)
                  if (_v) {
                    vals.push(_v)
                  }
                })
                if (vals.length === 1) {
                  retval.push(vals[0])
                } else if (vals.length > 1) {
                  retval.push(vals.join(' '))
                }
              })
            }
          }
        }
      }
      return retval
    }

    var getSub2 = async function (subquery, attr, vars, entry) {
      var sub = null
      if (subquery[0] === '@') {
        sub = parseSub(subquery)
      }
      if (sub) {
        for (var i = 0; i < vars.length; i++) {
          var v = getVar(entry, vars[i])
          if (v) {
            sub.url = sub.url.replace(vars[i], v)
          } else {
            sub = null
            break
          }
        }
        if (sub) {
          var val = await Artnum.Query.exec(Artnum.Path.url(sub.url))
          if (val.success && val.length > 0) {
            var _v = getVar(val.data[0], '_' + attr)
            if (_v) { return _v }
          }
        }
      }

      return null
    }

    DTable.prototype.processResult = function (result) {
      if (result.success && result.length > 0) {
        for (var e = 0; e < result.data.length; e++) {
          let entry = result.data[e]
          this.isNewer(entry)
          ;(new Promise(async function (resolve, reject) {
            var row = []
            for (var i = 0; i < this.Column.length; i++) {
              var value = null
              if (this.Column[i].condition) {
                var condition = this.Column[i].condition
                if (condition.values[0] && condition.values[1]) {
                  var val = [null, null]
                  for (var x = 0; x < condition.values.length; x++) {
                    var tmp = condition.values[x]
                    if (tmp.subquery) {
                      val[x] = await getSub(tmp.subquery, tmp.vars, entry)
                    } else {
                      val[x] = [getVar(entry, tmp.vars[0])]
                    }
                  }
                  if (val[0] && val[1] && val[0].length > 0 && val[1].length > 0) {
                    var res = false
                    for (var v1 = val[0].pop(); v1; v1 = val[0].pop()) {
                      for (var v2 = val[1].pop(); v2; v2 = val[1].pop()) {
                        switch (condition.operation) {
                          case 'lte': res = v2 <= v1; break
                          case 'gte': res = v2 >= v1; break
                          case 'ne': res = v2 !== v1; break
                          case 'eq': res = v2 === v1; break
                          case 'lt': res = v2 < v1; break
                          case 'gt': res = v2 > v1; break
                        }
                        if (!res) {
                          return
                        }
                      }
                    }
                  }
                }
              }
              if (this.Column[i].subquery !== null) {
                value = await getSub2(this.Column[i].subquery, this.Column[i].attr, this.Column[i].vars, entry)
              } else {
                if (entry[this.Column[i].attr]) {
                  value = entry[this.Column[i].attr]
                } else {
                  value = ''
                }
              }
              row.push({value: value, type: this.Column[i].type, sortName: this.Column[i].sortName})
            }
            if (entry[this.EntryId]) {
              resolve({id: entry[this.EntryId], content: row})
            } else {
              reject()
            }
          }.bind(this)).then(function (result) {
            this.row(result)
          }.bind(this)))
        }
      }
    }

    DTable.prototype.query = function () {
      var opts = {params: {}}
      if (this.Table.getAttribute(names.options)) {
        var _opts = toJSON(this.Table.getAttribute(names.options))
        for (var k in _opts) {
          switch (k) {
            default:
              opts[k] = _opts[k]
              break
            case 'parameters':
              opts.params = _opts[k]
              this.searchParams = _opts[k]
          }
        }
        Artnum.Query.exec(Artnum.Path.url(this.Table.getAttribute(names.source), opts)).then(function (result) {
          this.processResult(result)
          this.refresh()
        }.bind(this))
      }
    }

    DTable.prototype.convert = function (value, type) {
      if (!value) {
        return ''
      }
      switch (type) {
        default: case 'text':
          return String(value)
        case 'date':
          try {
            return (new Date(value)).fullDate()
          } catch (e) {
            console.log(value, type, e)
            return 'Invalid date'
          }
        case 'money':
          value = parseFloat(value).toFixed(2)
          return String(value)
      }
    }

    DTable.prototype.row = function (row) {
      var tr = document.createElement('TR')
      if (String(row.id) === '8016') { console.log(row) }
      tr.setAttribute(names.id, row.id)
      for (var i = 0; i < row.content.length; i++) {
        var td = document.createElement('TD')
        td.setAttribute('data-sort-name', row.content[i].sortName)
        if (Array.isArray(row.content[i].value)) {
          for (var j = 0; j < row.content[i].value.length; j++) {
            var span = document.createElement('SPAN')
            span.setAttribute('class', 'value multi')
            td.setAttribute(names.sortValue, row.content[i].value[0])
            span.appendChild(document.createTextNode(this.convert(row.content[i].value[j], row.content[i].type)))
            td.appendChild(span)
          }
        } else {
          td.setAttribute(names.sortValue, row.content[i].value)
          td.appendChild(document.createTextNode(this.convert(row.content[i].value, row.content[i].type)))
        }
        tr.appendChild(td)
      }
      var current = this.Tbody.firstChild
      for (; current; current = current.nextSibling) {
        if (String(current.getAttribute(names.id)) === String(row.id)) {
          break
        }
      }
      window.requestAnimationFrame(function () {
        if (current) {
          this.Tbody.replaceChild(tr, current)
        } else {
          this.Tbody.appendChild(tr)
        }
      }.bind(this))
    }

    DTable.prototype.processHead = function () {
      var th = this.Thead.getElementsByTagName('TH')
      this.Column = []
      for (var i = 0; i < th.length; i++) {
        var sortName = 'sort' + i
        if (th[i].getAttribute(names.sortName)) {
          sortName = th[i].getAttributes(names.sortName)
        } else {
          th[i].setAttribute(names.sortName, sortName)
        }
        if (th[i].getAttribute(names.attribute)) {
          var attr = th[i].getAttribute(names.attribute)
          if (attr[0] === '@') {
            attr = attr.split(' ', 2)
            var vars = attr[0].match(/(\$[a-zA-Z0-9._\-:]+)+/g)
            var at = attr[1].split(':', 2)
            this.Column[i] = {attr: at[0], subquery: attr[0], vars: vars, type: at[1] ? at[1] : 'text', sortName: sortName}
          } else {
            at = attr.split(':', 2)
            this.Column[i] = {attr: at[0], subquery: null, vars: [], type: at[1] ? at[1] : 'text', sortName: sortName}
          }
        } else {
          this.Column[i] = {attr: th[i].innerText, subquery: null, vars: [], type: 'text', sortName: sortName}
        }

        if (th[i].getAttribute(names.condition)) {
          attr = th[i].getAttribute(names.condition)
          attr = attr.split(' ', 3)

          var op = null
          if (attr.length === 3) {
            switch (attr[2].toLowerCase()) {
              case 'lt':
              case 'gt':
              case 'eq':
              case 'ne':
              case 'lte':
              case 'gte':
                op = attr[2].toLowerCase()
                break
            }
          }

          if (op) {
            var cond = {operation: op, values: [null, null], type: 'text'}
            for (var k = 0; k < 2; k++) {
              at = attr[k].split(':', 2)
              if (at.length < 2 && k > 0 && !cond.type) {
                cond.type = 'text'
              } else if (at.length > 1) {
                cond.type = at[1]
              }

              attr[k] = at[0]
              if (attr[k][0] === '@') {
                vars = attr[k].match(/(\$[a-zA-Z0-9._\-:]+)+/g)
                cond.values[k] = {subquery: attr[k], vars: vars}
              } else {
                if (attr[k][0] === '$') {
                  cond.values[k] = {subquery: null, vars: [attr[k]]}
                } else {
                  cond = null
                }
              }
            }
            if (cond) {
              this.Column[i].condition = cond
            }
          }
        }
      }
    }

    return DTable
  }())
}())
