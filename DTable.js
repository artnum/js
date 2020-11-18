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
    var CACHE = {}
    var ROWS = {}
    var isHTMLElement = function (x) {
      return (typeof HTMLElement === 'object' ? x instanceof HTMLElement : x && typeof x === 'object' && x !== null && x.nodeType === Node.ELEMENT_NODE && typeof x.nodeName === 'string')
    }
    /* parse json stored into attribute. Format is more like {key: 'value'}, so JSON.parse doesn't work */
    var toJSON = function (str) {
      str = str.replace(/'/g, '"').replace(/(['"])?([@a-zA-Z0-9_.]+)(['"])?:/g, '"$2": ')
      return JSON.parse(str)
    }

    var names = {
      sortName: 'data-sort-name',
      sortValue: 'data-sort-value',
      sortType: 'data-sort-type',
      source: 'data-source',
      options: 'data-options',
      attribute: 'data-attribute',
      process: 'data-process',
      entryId: 'data-entry-id',
      id: 'data-id',
      refresh: 'data-refresh',
      condition: 'data-condition',
      sortDirection: 'data-sort-direction',
      includeInSort: 'data-sort-include',
      filteredOut: 'data-filtered-out',
      classInfo: 'data-class',
      sortIgnore: 'data-sort-ignore',
      trIsHeader: 'data-header',
      filterValue: 'data-filter-value'
    }

    var dateValue = function (date, time = true) {
      try {
        var x = new Date(date)
        if (!isNaN(x.getTime())) {
          if (time) {
            return x.getTime()
          } else {
            x.setHours(12, 0, 0, 0)
            return x.getTime()
          }
        } else {
          return 0
        }
      } catch (e) {
        return 0
      }
    }

    var timeValue = function (value) {
      var v = 0
      if (value.indexOf(':') !== -1) {
        value = value.split(':')
        v = parseInt(value[0]) * 3600
        v += parseInt(value[1]) * 60
        if (value.length > 2) {
          v += parseInt(value[2])
        }
      } else if (value.indexOf('.') !== -1 || value.indexOf(',') !== -1) {
        if (value.indexOf('.') !== -1) {
          value = value.split('.')
        } else {
          value = value.split(',')
        }
        v = value[0] * 60
        v += value[1] * 60
        v *= 60
      }
      return v
    }

    var reOrderDate = function (strDate) {
      const regexp = /([0-9]{1,2})\.([0-9]{1,2})\.([0-9]{2,4})/g
      let m = regexp.exec(strDate)
      if (!m) {
        return strDate
      } else {
        if (m[3].length < 4) { m[3] = String(parseInt(m[3])+ 2000) }
      }
      return `${m[3]}/${m[2]}/${m[1]}`
    }

    var convertValue = function (value, type, transliterate = null) {
      let number = false
      switch (type) {
        case 'bool':
        case 'boolean':
          if (value.toLowerCase() === 'true') {
            value = true
          } else {
            value = false
          }
          break
        case 'number':
        case 'integer':
          value = parseInt(value)
          number = true
          break
        case 'money':
        case 'float':
          value = parseFloat(value)
          number = true
          break
        default:
        case 'string':
          value = String(value).toLowerCase().trim()
          if (transliterate) { value = transliterate(value)}
          break
        case 'date':
          let r = reOrderDate(value)
          r = dateValue(r, false)
          if (isNaN(value.getTime())) {
            value = dateValue(value, false)
          } else {
            value = r
          }
          number = true
          break
        case 'datetime':
          value = dateValue(value)
          number = true
          break
        case 'time':
          value = timeValue(value)
          number = true
          break
      }

      return [value, number]
    }

    var nodeValue = function (node, what, transliterate = null, filter = false) {
      if (!node) { return false }
      node = toNode(node, what.name)
      if (!node) { return false }
      let value
      if (filter) {
        value = node.getAttribute(names.filterValue) ? node.getAttribute(names.filterValue) : node.innerText
      } else {
        value = node.getAttribute(names.sortValue) ? node.getAttribute(names.sortValue) : node.innerText
      }
      var txtVal = value
      if (value === undefined) { return false }
      var number = false
      return [...convertValue(value, what.type, transliterate), txtVal]
    }
    
    var compareNumberNode = function (nodeVal, compareString, type) {
      let trueValue = true
      if (compareString[0] === '!') {
        compareString = compareString.substring(1).trim()
        trueValue = false
      }
      let v1 = nodeVal[0]
      switch (compareString[0]) {
        default:
          let v2 = convertValue(compareString, type)[0]
          if (v1 === v2) { return trueValue }
          return !trueValue
          break
        case '>':
          if (compareString[1] === '=') {
            let v2 = convertValue(compareString.substring(2), type)[0]
            if (v2 <= v1) { return trueValue}
          } else {
            let v2 = convertValue(compareString.substring(1), type)[0]
            if (v2 < v1) { return trueValue}
          }
          return !trueValue
        case '<':
          if (compareString[1] === '=') {
            let v2 = convertValue(compareString.substring(2), type)[0]
            if (v2 >= v1) { return trueValue}
          } else {
            let v2 = convertValue(compareString.substring(1), type)[0]
            if (v2 > v1) { return trueValue}
          }
          return !trueValue
      } 
    }

    var almostHasValue = function (tr, value, what, translit = null) {
      if (!tr) { return false }
      var nodeVal = nodeValue(tr, what, translit, true)
      if (!nodeVal) { return false }
      if (nodeVal[1]) {
        return compareNumberNode(nodeVal, value, what.type)
      }

      var v1 = String(nodeVal[0])
      var v2 = String(convertValue(value, 'string', translit)[0])

      if (v2.length === 0) { return true }

      var trueValue = true
      if (v2[0] === '!') {
        v2 = v2.substring(1).trim()
        trueValue = false
      }

      if (v2.length === 1) {
        switch (v2) {
          case '*':
            if (v1.length > 0) {
              return true
            }
            return false
          case '-':
            if (v1.length === 0) {
              return true
            }
            return false
        }
      } else {
        switch (v2[0]) {
          default:
            var special = '*?+'
            var regexp = false
            for (var i = 0; i < special.length; i++) {
              var pos = v2.indexOf(special[i])
              if (pos !== -1) {
                if (v2[pos - 1] !== '\\') {
                  regexp = true
                  v2 = v2.split(special[i]).join(`.${special[i]}`)
                } else {
                  v2 = v2.split(`\\${special[i]}`).join(special[i])
                }
              }
            }
            break
          case '>':
            if (v2[1] === '=') {
              if (v2.substring(2).localeCompare(v1.substring(0, v2.length - 2)) <= 0) {
                return trueValue
              }
            } else {
              if (v2.substring(1).localeCompare(v1.substring(0, v2.length - 1)) < 0) {
                return trueValue
              }
            }
            return !trueValue
          case '<':
            if (v2[1] === '=') {
              if (v2.substring(2).localeCompare(v1.substring(0, v2.length - 2)) >= 0) {
                return trueValue
              }
            } else {
              if (v2.substring(1).localeCompare(v1.substring(0, v2.length - 1)) > 0) {
                return trueValue
              }
            }
            return !trueValue
        }
      }

      if (regexp) {
        if ((new RegExp(v2)).test(v1)) {
          return trueValue
        }
      } else {
        if (v1.indexOf(v2) !== -1) {
          return trueValue
        }
      }
      return !trueValue
    }

    var cmpNode = function (tr1, tr2, what) {
      var direction = what.direction === 'ASC' ? 1 : -1
      let nv1 = nodeValue(tr1, what)
      let nv2 = nodeValue(tr2, what)
      if (nv1 === false && nv2 === false) { return direction }
      if (nv1 === false && nv2 !== false) { return direction }
      if (nv1 !== false && nv2 === false) { return -direction }
      var [attr1, number1, txt1] = nv1
      var [attr2, number2, txt2] = nv2

      switch (what.type.toLowerCase()) {
        case 'bool':
        case 'boolean':
          if (attr1) { return direction }
          if (attr2) { return -direction }
          return 0
      }

      if (attr1 && attr2 === undefined) { return direction }
      if (attr1 === undefined && attr2) { return -direction }

      var v1 = attr1
      var v2 = attr2

      if (number1 || number2) {
        if (isNaN(v1) || isNaN(v2)) {
          if (isNaN(v1) && !isNaN(v2)) {
            return direction
          } else if (!isNaN(v1) && isNaN(v2)) {
            return -direction
          } else {
            v1 = String(txt1).toLowerCase()
            v2 = String(txt2).toLowerCase()
          }
        } else {
          /* parseInt/parseFloat do their best so "12asd" will give 12, but it's not an integer. */
          /* var b1 = true
          var b2 = true
          if (b1 || b2) {
            if (!b1 && b2) {
              return -direction
            } else if (b1 && !b2) {
              return direction
            } else {
              v1 = String(txt1).toLowerCase()
              v2 = String(txt2).toLowerCase()
            }
          } */
        }
      }

      if (v1 === v2) {
        return 0
      }
      return v1 > v2 ? direction : -direction
    }

    var swapNode = function (htmlarray, n1, n2) {
      var tmp = htmlarray[n2]
      htmlarray[n2] = htmlarray[n1]
      htmlarray[n1] = tmp
    }

    var siftDown = function (htmlarray, i, max, what) {
      while (i < max) {
        var iBig = i
        var c1 = (2 * i) + 1
        var c2 = c1 + 1
        if (c1 < max && cmpNode(htmlarray[c1], htmlarray[iBig], what) < 0) {
          iBig = c1
        }
        if (c2 < max && cmpNode(htmlarray[c2], htmlarray[iBig], what) < 0) {
          iBig = c2
        }
        if (iBig === i) { return }
        swapNode(htmlarray, i, iBig)
        i = iBig
      }
    }

    var sort = function (htmlarray, options) {
      return new Promise(function (resolve, reject) {
        heapSort(htmlarray, options, 0, htmlarray.length, 0)

        if (options.what.length > 1) {
          for (var i = 1; i < options.what.length; i++) {
            var last = 0
            for (var j = 0; j <= htmlarray.length; j++) {
              if (!htmlarray[j] || cmpNode(htmlarray[last], htmlarray[j], options.what[i - 1]) !== 0) {
                var a = heapSort(htmlarray.slice(last, j), options, 0, j - last, i)
                for (var k = 0; k < a.length; k++) {
                  htmlarray[last + k] = a[k]
                }
                last = j
              }
            }
          }
        }
        resolve(htmlarray)
      })
    }

    var heapSort = function (htmlarray, options, offset, length, level) {
      var what = options.what[level]
      var i = Math.floor(length / 2 - 1)
      while (i >= 0) {
        siftDown(htmlarray, i + offset, length + offset, what)
        i--
      }
      var end = length - 1
      while (end > 0) {
        swapNode(htmlarray, offset, end + offset)
        siftDown(htmlarray, offset, end + offset, what)
        end--
      }
      return htmlarray
    }

    /* Not the fastest way of sorting (for the same dataset I could gain some 100ms) BUT :
     *  - Fast enough
     *  - Can sort a table while TR are added
     *  - Is multilevel sort (the 100ms gain was without that)
     *  - Use heap sort which is n log n
     *  - After test, heap sort is faster than built-in Array.sort on Chrome and nearly as fast as Firefox's Array.sort
     */
    var sortHTMLNodes = function (parent, o) {
      return new Promise(function (res, rej) {
        ;(function () {
          return new Promise(function (resolve, reject) {
            var array = []
            for (var i = parent.firstElementChild; i; i = i.nextElementSibling) {
              if (!i.getAttribute(names.trIsHeader) && !i.getAttribute(names.sortIgnore) && !i.getAttribute(names.filteredOut)) {
                array.push(i)
              }
            }
            resolve(array)
          })
        }()).then((array) => {
          sort(array, o).then((array) => {
            window.requestAnimationFrame(() => {
              let firstNode = parent.firstElementChild
              for (; firstNode && firstNode.getAttribute(names.trIsHeader); firstNode = firstNode.nextElementSibling) ;
              for (var i = array.length - 1; i >= 0; i--) {
                parent.insertBefore(array[i], firstNode)
                firstNode = array[i]
              }
              res()
            })
          })
        })
      })
    }
    var DTable = function () {
      this.sortOnly = false
      this.Table = null
      this.Thead = null
      this.Tbody = null
      this.EntryId = 'id'
      this.searchParams = {}
      this.refreshParams = {}
      this.Plist = []
      this.Actions = []

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
        this.sortOnly = arguments[0].sortOnly
      }

      if (arguments[0].search) {
        this.search = arguments[0].search
      }
      
      if (arguments[0].actions && Array.isArray(arguments[0].actions)) {
        this.Actions = arguments[0].actions
      }

      if (!this.Table) {
        throw Error('No table given')
      }
      if (!this.Table.getAttribute(names.source) && !this.sortOnly) {
        throw Error('No source given')
      }
      if (this.Table.getAttribute(names.entryId)) {
        this.Table.EntryId = this.Table.getAttribute(names.entryId)
      }

      if (this.Table.getAttribute(names.refresh)) {
        this.refreshParams = toJSON(this.Table.getAttribute(names.refresh))
      }

      if (arguments[0].postprocess) {
        this.postprocess = arguments[0].postprocess
      } else {
        this.postprocess = null
      }
      if (arguments[0].postsort) {
        this.postsort = arguments[0].postsort
      } else {
        this.postsort = null
      }

      if (arguments[0].checkUrl) {
        this.checkUrl = arguments[0].checkUrl
      } else {
        this.checkUrl = null
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

      var disabled = function (node) {
        for (; node && node.nodeName !== 'TH'; node = node.parentNode) ;
        if (node.getAttribute(names.sortType) && node.getAttribute(names.sortType).toLowerCase() === 'no') { return true }
        return false
      }

      /* setup events */
      var evFnUp = function (event) {
        if (this.mouseClickTimer !== null) {
          clearTimeout(this.mouseClickTimer)
          this.doSort(event)
        }
      }.bind(this)
      this.Thead.addEventListener('mouseup', function (event) {
        if (disabled(event.target)) { return }
        evFnUp(event)
      })
      this.Thead.addEventListener('touchend', function (event) {
        if (disabled(event.target)) { return }
        event.preventDefault()
        evFnUp(event)
      })

      var evFnDown = function (event, activateFilter = false) {
        if (!activateFilter) {
          this.mouseClickTimer = setTimeout(function () {
            this.doSort(event, true)
          }.bind(this), 250)
        } else {
          this.displayFilterBox(event.target).then((input) => {
            input.focus()
          })
        }
      }.bind(this)

      this.Thead.addEventListener('mousedown', function (event) {
        if (disabled(event.target)) { return }
        if (event.shiftKey) {
          this.doSort(event, true)
        } else {
          evFnDown(event, event.ctrlKey)
        }
      }.bind(this))
      this.Thead.addEventListener('touchstart', function (event) {
        if (disabled(event.target)) { return }
        event.preventDefault()
        evFnDown(event, event.touches.length > 1)
      })

      /* end init */
      if (!this.Tbody) {
        tbodys = this.Table.getElementsByTagName('TBODY')
        if (tbodys.length > 0) {
          this.Tbody = tbodys[0]
        } else {
          this.Tbody = document.createElement('TBODY')
          this.Table.insertBefore(this.Tbody, this.Thead.nextElementSibling)
        }
      }
      this.Table.classList.add('dtable')
      if (!arguments[1]) {
        this.run()
      }
    }

    DTable.prototype.checkURL = function (url) {
      if (this.checkUrl) {
        return this.checkUrl(url)
      } else {
        return true
      }
    }

    DTable.prototype.displayFilterBox = function (th) {
      this.mouseClickTimer = null // disable sort

      for (var n = th.firstElementChild; n; n = n.firstElementSibling) {
        if (n.nodeName === 'INPUT' && n.getAttribute('class') === 'filter') {
          return
        }
      }

      var input = document.createElement('INPUT')
      input.setAttribute('class', 'filter')
      input.addEventListener('mousedown', (e) => e.stopPropagation())
      input.addEventListener('mouseup', (e) => e.stopPropagation())
      input.addEventListener('keydown', function (event) {
        switch (event.key) {
          case 'Tab':
            this.runFilter(this.prepareFilter(event.target), event.target.value)
            break
          case 'Delete':
          case 'Backspace':
            let value = event.target.value
            if (value.substring(value.length - 1) === ' ') {
              let what = this.prepareFilter(event.target)
              this.runFilter(what, value.substring(0, value.length - 1))
            }
            break
        }
      }.bind(this))
      input.addEventListener('keyup', function (event) {
        let value = event.target.value
        let what = this.prepareFilter(event.target)
        switch (event.key) {
          case 'Escape':
            this.resetFilter(what, event.target)
            break
          case ' ':
            value = value.substring(0, value.length - 1)
            /* Fall through */
          case 'Enter':
            this.runFilter(what, value)
            break
        }
      }.bind(this))

      return new Promise((resolve, reject) => {
        window.requestAnimationFrame(() => {
          th.appendChild(input)
          resolve(input)
        })
      })
    }

    DTable.prototype.runFilter = function (what, value) {
      for (let tbody = this.Table.firstElementChild; tbody; tbody = tbody.nextElementSibling) {
        if (tbody.nodeName === 'TBODY') {
          for (let tr = tbody.firstElementChild; tr; tr = tr.nextElementSibling) {
            this.filterRow(tr, what, value)
          }
          if (this.postsort) {
            this.postsort(tbody)
          }
        }
      }
    }

    DTable.prototype.prepareFilter = function (th) {
      for (; th && th.nodeName !== 'TH'; th = th.parentNode) ;
      var what = {name: '', type: ''}
      what.name = th.getAttribute(names.sortName)
      what.type = th.getAttribute(names.sortType)
      return what
    }

    DTable.prototype.resetFilter = function (what, n) {
      for (; n && n.nodeName !== 'INPUT'; n = n.parentNode) ;
      n.parentNode.removeChild(n)
      for (let tbody = this.Table.firstElementChild; tbody; tbody = tbody.nextElementSibling) {
        if (tbody.nodeName === 'TBODY') {
          for (var tr = this.Tbody.firstElementChild; tr; tr = tr.nextElementSibling) {
            if (tr.getAttribute(names.filteredOut) &&
                tr.getAttribute(names.filteredOut) === what.name) {
              tr.removeAttribute(names.filteredOut)
            }
          }
        }
      }
    }

    DTable.prototype.getHeadByName = function (name) {
      let head = this.Thead.firstElementChild.firstElementChild
      for (; head && head.getAttribute(names.sortName) !== name; head = head.nextElementSibling) ;
      return head
    }

    DTable.prototype.run = function () {
      if (this.search) {
        for (const [key, value] of this.search) {
          let h = this.getHeadByName(key)
          if (h) {
            this.displayFilterBox(h).then((input) => {
              input.value = value
              let what = this.prepareFilter(h)
              this.runFilter(what, input.value)
            })
          }
        }
      }

      return new Promise((resolve, reject) => {
        this.processHead()
        if (!this.sortOnly) {
          this.query().then(() => resolve())
        } else {
          resolve()
        }
      })
    }

    /* Return true if row has to be filtered out */
    DTable.prototype.filterRow = function (row, what, value) {
      let name = false
      if (row.getAttribute(names.sortIgnore)) { return }
      if (!almostHasValue(row, value, what, this.transliterate ? this.transliterate : null)) {
        if (!row.getAttribute(names.filteredOut)) {
          name = what.name
        }
      } else {
        if (row.getAttribute(names.filteredOut) &&
            row.getAttribute(names.filteredOut) === what.name) {
          name = null
        }
      }
      if (name) {
        window.requestAnimationFrame(() => row.setAttribute(names.filteredOut, name))
      } else {
        if (name === null) {
          window.requestAnimationFrame(() => row.removeAttribute(names.filteredOut))
        }
      }
    }

    DTable.prototype.refreshFilter = function (row = null) {
      let tr = this.Thead.firstElementChild
      let what = {name: '', type: ''}
      for (let th = tr.firstElementChild; th; th = th.nextElementSibling) {
        let input = th.getElementsByTagName('INPUT')[0]
        if (input) {
          what.name = th.getAttribute(names.sortName)
          what.type = th.getAttribute(names.sortType)
          if (row) {
            let result = this.filterRow(row, what, input.value)
            for (let tbody = row; this.postsort && tbody; tbody = tbody.parentNode) {
              if (row.nodeName === 'TBODY') {
                this.postsort(row)
                break
              }
            }
            return result
          } else {
            for (let tbody = this.Table.firstElementChild; tbody; tbody = tbody.nextElementSibling) {
              if (tbody.nodeName === 'TBODY') {
                for (let line = tbody.firstElementChild; line; line = line.nextElementSibling) {
                  this.filterRow(line, what, input.value)
                }
                if (this.postsort) { this.postsort(tbody) }
              }
            }
          }
        }
      }
      return null
    }

    DTable.prototype.refreshSort = function () {
      let tr = null
      let nodesInSort = 0
      for (tr = this.Thead.firstElementChild; tr && tr.nodeName !== 'TR'; tr = tr.firstElementChild) ;

      for (var th = tr.firstElementChild; th; th = th.nextElementSibling) {
        if (th.getAttribute(names.includeInSort)) {
          nodesInSort++
        }
      }
      let what = new Array(nodesInSort)
      for (th = tr.firstElementChild; th; th = th.nextElementSibling) {
        if (th.getAttribute(names.includeInSort)) {
          var name = th.getAttribute(names.sortName)
          var idx = parseInt(th.getAttribute(names.includeInSort))
          if (name) {
            what[idx] = { name: name, direction: th.getAttribute(names.sortDirection) ? th.getAttribute(names.sortDirection) : 'ASC', type: th.getAttribute(names.sortType) ? th.getAttribute(names.sortType) : 'text' }
          }
        }
      }
      if (what.length > 0) {
        for (let tbody = this.Table.firstElementChild; tbody; tbody = tbody.nextElementSibling) {
          if (tbody.nodeName === 'TBODY') {
            sortHTMLNodes(this.Tbody, {what: what}).then(function () {
              this.refreshFilter()
            }.bind(this))
          }
        }
      } else {
        this.refreshFilter()
      }
    }

    DTable.prototype.doSort = function (event, long = false) {
      var node = event ? event.target : null
      var tr = null
      var nodesInSort = 0

      for (tr = this.Thead.firstElementChild; tr && tr.nodeName !== 'TR'; tr = tr.firstElementChild) ;

      for (var th = tr.firstElementChild; th; th = th.nextElementSibling) {
        if (th.getAttribute(names.includeInSort)) {
          nodesInSort++
        }
      }
      for (; node && node.nodeName !== 'TH'; node = node.parentNode) ;
      if (long) {
        this.mouseClickTimer = null
        if (node.getAttribute(names.includeInSort)) {
          var rmId = parseInt(node.getAttribute(names.includeInSort))
          node.removeAttribute(names.includeInSort)
          node.removeAttribute(names.sortDirection)
          nodesInSort--

          for (th = tr.firstElementChild; th; th = th.nextElementSibling) {
            var cId = th.getAttribute(names.includeInSort)
            if (cId) {
              if (parseInt(cId) > rmId) {
                th.setAttribute(names.includeInSort, cId - 1)
              }
            }
          }
        } else {
          node.setAttribute(names.includeInSort, nodesInSort)
          nodesInSort++
        }
      } else {
        if (!node.getAttribute(names.includeInSort)) {
          for (th = tr.firstElementChild; th; th = th.nextElementSibling) {
            th.removeAttribute(names.includeInSort)
            th.removeAttribute(names.sortDirection)
          }
          node.setAttribute(names.includeInSort, '0')
          nodesInSort = 1
        }
      }

      var what = new Array(nodesInSort)
      for (th = tr.firstElementChild; th; th = th.nextElementSibling) {
        var dir = 'ASC'
        if (th.getAttribute(names.includeInSort)) {
          var name = th.getAttribute(names.sortName)
          var idx = parseInt(th.getAttribute(names.includeInSort))
          if (name) {
            if ((dir = th.getAttribute(names.sortDirection))) {
              /* invert only clicked node if there are many nodes */
              if (node.getAttribute(names.sortName) === name) {
                if (dir === 'ASC') {
                  dir = 'DESC'
                } else {
                  dir = 'ASC'
                }
              }
            } else {
              dir = 'ASC'
            }
            th.setAttribute(names.sortDirection, dir)
            what[idx] = { name: name, direction: dir, type: th.getAttribute(names.sortType) ? th.getAttribute(names.sortType) : 'text' }
          }
        }
      }
      if (what.length > 0) {
        for (let tbody = this.Table.firstElementChild; tbody; tbody = tbody.nextSibling) {
          if (tbody.nodeName === 'TBODY') {
            sortHTMLNodes(tbody, {what: what}).then(() => {
              if (this.postsort) { this.postsort(tbody) }
            })
          }
        }
      }
    }

    DTable.prototype.reverseRows = function () {
      var firstChild = this.Tbody.firstElementChild
      for (; firstChild && firstChild.getAttribute(name.trIsHeader); firstChild = firstChild.nextElementSibling) ;
      var display = function () {
        var start = performance.now()
        while (firstChild !== this.Tbody.lastElementChild) {
          var x = this.Tbody.removeChild(this.Tbody.lastElementChild)
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
      var node = o.firstElementChild
      while (node && node.getAttribute(names.sortName) !== name) { node = node.nextElementSibling }
      if (!node) {
        var num = parseInt(name.split('-')[1])
        if (!isNaN(num)) {
          node = o.firstElementChild
          for (var i = 0; i < num; i++) {
            node = node.nextElementSibling
          }
        }
      }
      return node
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

    DTable.prototype.idInTable = function () {
      let tbodys = this.Table.getElementsByTagName('TBODY')
      let ids = []
      for (let i = 0; i < tbodys.length; i++) {
        for (let j = tbodys[i].firstElementChild; j; j = j.nextElementSibling) {
          ids.push(j.getAttribute(names.id))
        }
      }
      return ids
    }

    DTable.prototype.refresh = function () {
      let start = performance.now()
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

        var qparams = {}
        if (params.parameters) {
          qparams = Object.assign(qparams, params.parameters)
        }
        if (params.indicator.parameter) {
          if (!this.CurrentVal) {
            this.CurrentVal = Math.round((new Date()).getTime() / 1000)
          }
          qparams[params.indicator.parameter] = '>' + String(this.CurrentVal)
          Artnum.Query.exec(Artnum.Path.url(this.Table.getAttribute(names.source), {params: qparams})).then(async function (result) {
            if (result.success && result.length > 0) {
              var data = []
              for (var i = 0; i < result.length; i++) {
                this.isNewer(result.data[i])
                var p = this.searchParams
                p[`search.${this.EntryId}`] = result.data[i][this.EntryId]
                var x = await Artnum.Query.exec(Artnum.Path.url(this.Table.getAttribute(names.source), {params: p}))
                if (x.length > 0) {
                  data.push(result.data[i])
                } else {
                  this.dropRow(result.data[i][this.EntryId])
                }
              }
              this.processResult({success: true, length: data.length, data: data})
            }
            setTimeout(this.refresh.bind(this), 10000 - (performance.now() - start))
            this.refreshSort()
          }.bind(this))
        }
      } else if (params.absent) {
        Artnum.Query.exec(Artnum.Path.url(this.Table.getAttribute(names.source))).then(async function (result) {
          let ids = this.idInTable()
          let newEntries = []
          let oldEntries = []
          if (result.data === null) { return }
          for (let i = 0; i < result.data.length; i++) {
            if (ids.indexOf(result.data[i].id) === -1) {
              newEntries.push(result.data[i])
            } else {
              oldEntries.push(result.data[i].id)
            }
          }
          for (let i = ids.pop(); i; i = ids.pop()) {
            if (oldEntries.indexOf(i) === -1) {
              this.dropRow(i)
            }
          }
          if (newEntries.length > 0) {
            this.processResult({success: true, length: newEntries.length, data: newEntries})
          }
          setTimeout(this.refresh.bind(this), 10000 - (performance.now() - start))
          this.refreshSort()
        }.bind(this))
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

    var walkValueTree = (object, attribute) => {
      let value = null
      if (!object) { return value }
      if (object[attribute]) {
        value = object[attribute]
      } else {
        let path = attribute.split('.')
        if (path.length > 1) {
          let root = object
          value = null
          for (let i = 0; i < path.length; i++) {
            root = root[path[i]]
            if (!root) {
              break
            }
          }
          if (root) {
            value = root
          }
        }
      }
      return value
    }

    /* escape for regexp usage ... keep * as is */
    var REEscape = function (text) {
      const specials = [
        '/', '.', '+', '?', '|',
        '(', ')', '[', ']', '{', '}', '\\'
      ]
      const sRE = new RegExp(
        '(\\' + specials.join('|\\') + ')', 'g'
      )
      return text.replace(sRE, '\\$1')
    }
    var checkCondition = function (value, attribute) {
      let syntax = attribute.condition.syntax ? attribute.condition.syntax : attribute.syntax
      return compareValue(attribute.condition.operation, value, attribute.condition.value, syntax)
    }

    var compareValue = function (operation, v1, v2, syntax) {
      switch (syntax) {
        case 'bool':
        case 'boolean':
          if (!v1) { v1 = false; break }
          if (v1.toLowerCase() === 'true' || parseInt(v1)) {
            v1 = true
          } else {
            v1 = false
          }
          if (!v2) { v2 = false; break }
          if (v2.toLowerCase() === 'true' || parseInt(v2)) {
            v2 = true
          } else {
            v2 = false
          }
          break
        case 'number':
        case 'integer':
          v1 = parseInt(v1)
          v2 = parseInt(v2)
          break
        case 'money':
        case 'float':
          v1 = parseFloat(v1)
          v2 = parseFloat(v2)
          break
        case 'string':
        case 'text':
          v1 = String(v1)
          v2 = String(v2)
          break
        case 'date':
          v1 = dateValue(v1, false)
          v2 = dateValue(v2, false)
          break
        case 'datetime':
          v1 = dateValue(v1)
          v2 = dateValue(v2)
          break
        case 'time':
          v1 = timeValue(v1)
          v2 = timeValue(v2)
          break
      }

      switch (operation) {
        case 'eq': return v1 === v2
        case 'ne': return v1 !== v2
        case 'gt': return v1 > v2
        case 'lt': return v1 < v2
        case 'gte': return v1 >= v2
        case 'lte': return v1 <= v2
        case 'like':
        case 'unlike':
          v1 = String(v1)
          v2 = REEscape(String(v2)).replace(/\*/g, '.*')
          let exp = new RegExp(v2, 'i')
          if (operation === 'like') {
            return exp.test(v1)
          } else {
            return !exp.test(v1)
          }
      }
    }

    DTable.prototype.subQuery = function (subquery, entries) {
      return new Promise(async function (resolve, reject) {
        let firstSubVar = null
        let url = null
        let value = subquery.value
        let outValue = null
        while (value && value.type === 'query') {
          outValue = await this.subQuery(subquery.value, entries)
          value = value.value
        }
        if (subquery.vars) {
          for (let k in subquery.vars) {
            let subvar = null
            let i = 0
            while (subvar === null && i < entries.length) {
              subvar = walkValueTree(entries[i++], subquery.vars[k])
              if (subvar && !firstSubVar) { firstSubVar = subvar }
            }
            if (subvar === null) {
              if (firstSubVar) {
                resolve(firstSubVar)
              } else {
                resolve(outValue)
              }
              return
            }
            url = subquery.url.replace(k, subvar)
          }
        }
        if (firstSubVar !== null) { outValue = firstSubVar }
        if (this.URLPrefix) {
          url = this.URLPrefix + url
        }

        let p = new Promise((resolve, reject) => {
          if (CACHE[url]) {
            resolve(CACHE[url])
          } else {
            fetch(url).then((response) => {
              if (!response.ok) {
                CACHE[url] = outValue
                resolve(firstSubVar)
                return
              }
              response.json().then((results) => {
                CACHE[url] = results
                resolve(CACHE[url])
              })
            })
          }
        })

        p.then((results) => {
          let type = 'attr'
          if (!results) { resolve(null); return }
          /* we don't have an object we know, so let it pop back up,
             allows to have strings that still display in the end
           */
          if (!results.length) { resolve(null); return }
          if (results.length <= 0) { resolve(null); return }

          let entry = Array.isArray(results.data) ? results.data[0] : results.data
          entries.push(entry)
          if (value === null) { resolve(null); return }
          if (value.type !== 'attr') {
            resolve(null)
          } else {
            let retVal = null
            for (let i = entries.length - 1; i >= 0; i--) {
              retVal = walkValueTree(entries[i], value.value)
              if (retVal !== null) { break }
            }
            if (retVal === null) { 
              retVal = outValue 
              type = 'intermediate'
            }
            if (subquery.condition) {
              if (!checkCondition(retVal, subquery)) {
                resolve(null)
              } else {
                resolve([retVal, type])
              }
            } else {
              resolve([retVal, type])
            }
          }
        })
      }.bind(this))
    }

    DTable.prototype.processResult = async function (result) {
      if (result.success && result.length > 0) {
        for (var e = 0; e < result.data.length; e++) {
          let entry = result.data[e]
          this.isNewer(entry)
          let row = []
          let dropRow = false
          let substitution = null
          let subclass = null

          for (let i = 0; i < this.Column.length; i++) {
            substitution = null
            subclass = null
            let valueDescription = null
            let value = null
            let syntax = 'string'
            let entries = [entry]
            for (let j = 0; j < this.Column[i].value.length; j++) {
              valueDescription = this.Column[i].value[j]
              if (this.Column[i].value[j].syntax) {
                syntax = this.Column[i].value[j].syntax
              }
              let type = this.Column[i].value[j].type
              if (this.Column[i].value[j].substitution !== undefined &&
                this.Column[i].value[j].substitution !== null) {
                substitution = this.Column[i].value[j].substitution
              }
              switch (this.Column[i].value[j].type) {
                case 'string':
                  value = this.Column[i].value[j].value
                  if (this.Column[i].value[j].subclass !== undefined) {
                    subclass = this.Column[i].value[j].subclass
                  }
                  break
                case 'attr':
                  value = walkValueTree(entry, this.Column[i].value[j].value)
                  if (this.Column[i].value[j].subclass !== undefined) {
                    subclass = this.Column[i].value[j].subclass
                  }
                  break
                case 'query':
                  entries.push(entry)
                  value = await this.subQuery(this.Column[i].value[j], entries)
                  if (value) { 
                    type = value[1]
                    value = value[0]
                    if (this.Column[i].value[j].subclass !== undefined) {
                      subclass = this.Column[i].value[j].subclass
                    }
                  }
                  break
              }

              if (this.Column[i].value[j].condition) {
                dropRow = !checkCondition(value, this.Column[i].value[j])
                if (dropRow) { break }
              }
              /* first non-null value do the trick */
              if (value !== null && type === 'attr') { break }
            }
            if (dropRow) {
              this.dropRow(entry[this.EntryId])
              break
            }
            let sortValue = null
            if (this.Column[i].process) {
              [value, sortValue] = await this.Column[i].process(value, entries)
              if (sortValue === null) {
                sortValue = value
              }
            } else {
              sortValue = value
            }

            if (substitution !== null) {
              if (substitution[value] !== undefined) {
                value = substitution[value]
              }
            }

            row.push({
              value: value,
              valueDescription: valueDescription,
              sortValue: sortValue,
              type: syntax,
              entries: entries,
              sortName: this.Column[i].sortName,
              classInfo: `${this.Column[i].classInfo}${subclass === null ? '' : ' ' + subclass}`
            })
          }
          if (dropRow) { continue }
          this.row({id: entry[this.EntryId], content: row}).then(() => {
            this.refreshSort()
            this.refreshFilter()
          })
        }
      }
    }

    DTable.prototype.getQueryOpts = function () {
      let opts = {params: {}}
      if (this.Table.getAttribute(names.options)) {
        let _opts = toJSON(this.Table.getAttribute(names.options))
        for (let k in _opts) {
          switch (k) {
            default:
              opts[k] = _opts[k]
              break
            case 'parameters':
              opts.params = _opts[k]
              this.searchParams = _opts[k]
          }
        }
      }
      return opts
    }

    /* to use when app post data and want to load that value in table */
    DTable.prototype.queryOne = function (id) {
      let opts = this.getQueryOpts()
      if (opts.parameters) {
        delete opts.parameters // don't want we are not searching data 
      }
      Artnum.Query.exec(Artnum.Path.url(`${this.Table.getAttribute(names.source)}/${id}`, opts)).then(result => {
        if (result.length > 0) {
          if (!Array.isArray(result.data)) {
            result.data = [ result.data ]
          }
          this.processResult(result)
        } else {
          if (result.data === null) {
            this.dropRow(id)
          }
        }
      })
    }

    DTable.prototype.query = function (offset = 0, max = null) {
      const queryChunk = 1000
      return new Promise((resolve, reject) => {
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
          opts.params.limit = `${offset},${queryChunk}`
          Artnum.Query.exec(Artnum.Path.url(this.Table.getAttribute(names.source), opts)).then(function (result) {
            this.processResult(result)
            if (parseInt(result.length) > 0 && parseInt(result.length) === queryChunk) {
              setTimeout(() => { this.query(offset + parseInt(result.length)) }, 50)
            } else {
              this.refresh()
            }
            resolve()
          }.bind(this))
        }
      })
    }

    DTable.prototype.addPfunc = function (name, funktion) {
      if (funktion instanceof Function) {
        this.Plist[name] = funktion
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
            let date = new Date(value)
            if (date.fullDate === undefined) {
              return date.toLocaleDateString()
            } else {
              return date.fullDate()
            }
          } catch (e) {
            console.log(value, type, e)
            return 'Invalid date'
          }
        case 'money':
          value = parseFloat(value).toFixed(2)
          return String(value)
        case 'bool':
          return value ? 'Oui' : ''
      }
    }

    DTable.prototype.dropRow = function (rowid) {
      var current = this.Tbody.firstElementChild
      for (; current; current = current.nextElementSibling) {
        if (String(current.getAttribute(names.id)) === String(rowid)) {
          break
        }
      }
      if (current) {
        window.requestAnimationFrame(function () {
          current.parentNode.removeChild(current)
        })
      }
    }

    var ETarget = new EventTarget()
    DTable.prototype.addEventListener = function (e, f, o = false) {
      ETarget.addEventListener(e, f, o)
    }

    DTable.prototype.doEventClick = function (event) {
      let target = event.target
      let parent = target
      while (parent && parent.nodeName !== 'TR') { parent = parent.parentNode }
      let id = parent.getAttribute(names.id)
      if (!id) { return }
      if (!ROWS[id]) { return }
      let col = ROWS[id].content[target.dataset.colId]
      if (!col) { return }
      let attr = col.valueDescription
      while (attr) {
        if (attr.type && attr.type === 'attr') { attr = attr.value; break }
        attr = attr.value
      }
      ETarget.dispatchEvent(new CustomEvent(event.type, {detail: {
        name: target.dataset.name ? target.dataset.name : '',
        attribute: attr,
        value: col.value,
        entries: col.entries
      }}))
    }

    DTable.prototype.row = function (row) {
      var tr = document.createElement('TR')
      ROWS[row.id] = row
      tr.setAttribute(names.id, row.id)
      for (var i = 0; i < row.content.length; i++) {
        var td = document.createElement('TD')
        td.setAttribute('data-sort-name', row.content[i].sortName)
        td.dataset.colId = i
        td.classList.add(row.content[i].type)
        if (row.content[i].classInfo !== '') {
          row.content[i].classInfo.split(' ').forEach((c) => {
            if (c !== '') {
              td.classList.add(c)
            }
            switch (c) {
              case 'clickable':
                td.addEventListener('click', this.doEventClick.bind(this))
                break
            }
          })
        }
        if (Array.isArray(row.content[i].value)) {
          for (var j = 0; j < row.content[i].value.length; j++) {
            var span = document.createElement('SPAN')
            span.setAttribute('class', 'value multi')
            td.setAttribute(names.sortValue, row.content[i].sortValue !== null ? row.content[i].sortValue : row.content[i].value[0])
            span.appendChild(document.createTextNode(this.convert(row.content[i].value[j], row.content[i].type)))
            td.appendChild(span)
          }
        } else {
          td.setAttribute(names.sortValue, row.content[i].sortValue !== null ? row.content[i].sortValue : row.content[i].value)
          td.appendChild(document.createTextNode(this.convert(row.content[i].value, row.content[i].type)))
        }
        tr.appendChild(td)
      }

      if (this.Actions.length > 0) {
        let actionTd = document.createElement('TD')
        this.Actions.forEach(action => {
          let d = document.createElement('DIV')
          d.innerHTML = action.html
          let node
          if (d.children.length === 1) {
            node = d.firstElementChild
          } else {
            node = d
          }

          node.dataset.id = row.id
          action.events.forEach(event => {
            if (event.name && event.callback) {
              node.addEventListener(event.name, function (event) {
                this.callback(event, this.dtable)
              }.bind({callback: event.callback, dtable: this}), event.options ? event.options : {})
            }
          })
          actionTd.appendChild(node)
        })
        tr.appendChild(actionTd)
      }
      var current = this.Tbody.firstElementChild
      for (; current; current = current.nextElementSibling) {
        if (String(current.getAttribute(names.id)) === String(row.id)) {
          break
        }
      }
      if (this.postprocess) {
        this.postprocess(tr)
      }
      let p = new Promise((resolve, reject) => {
        window.requestAnimationFrame(() => {
          try {
            if (current) {
              this.Tbody.replaceChild(tr, current)
            } else {
              this.Tbody.appendChild(tr)
            }
            resolve()
          } catch (e) {
            reject(e)
            // node is not there anymore
          }
        })
      })
      return p
    }

    var parseCondition = function (any) {
      /* cond : anything{_op_:_syntax_>_value_ 
       * ex. : displayname{le:text>Jean-Paul
       */
      let cond = /(.+)\{([a-zA-Z]+)(?::([a-zA-Z]+))?>([^`]*)$/.exec(any)
      if (cond && cond[0] === any) {
        let c = {type: 'condition'}
        switch (cond[2].toLowerCase()) {
          case 'eq':
          case 'ne':
          case 'gt':
          case 'lt':
          case 'gte':
          case 'lte':
          case 'like':
          case 'unlike':
            c.operation = cond[2].toLowerCase()
            break
          default: return null
        }
        if (cond[3]) {
          switch (cond[3].toLowerCase()) {
            case 'bool':
            case 'boolean':
            case 'number':
            case 'integer':
            case 'money':
            case 'float':
            case 'string':
            case 'text':
            case 'date':
            case 'datetime':
            case 'time':
              c.syntax = cond[3].toLowerCase()
              break
            default:
              c.syntax = 'string'
              break
          }
        } else {
          c.syntax = 'string'
        }
        c.value = cond[4]
        return [cond[1], c]
      }
      return null
    }

    var parseSubQuery = function (subquery, syntax = 'string') {
      let subs = /^(?:@([^ ]+))\s(.*)/.exec(subquery)
      if (!subs) { return null }
      let attr = {
        type: 'query',
        url: subs[1],
        value: parseAttribute(subs[2], syntax),
        vars: parseUrlVariable(subs[1])
      }

      return attr
    }

    var parseString = function (string) {
      let str = /^(?:'([^'])'|#(.*))/.exec(string)
      if (!str) { return null }
      return str[1] ? str[1] : str[2]
    }

    var parseSubstitution = function (substitution) {
      const rsub = /([^=]+)=([^,]+),?/gm;
      let matches
      let subs = {}
      while ((matches = rsub.exec(substitution)) !== null) {
        if (matches.index === rsub.lastIndex) {
          rsub.lastIndex++
        }

        subs[matches[1]] = matches[2]
      }
      return subs
    }

    var parseAttr = function (attribute) {
      let substitution = /^([^\~]*)(?:\~(.*))?/.exec(attribute)
      let attr = substitution[1].split(':')

      let subs = null
      if (substitution[2] !== undefined) {
        subs = parseSubstitution(substitution[2])
      }

      if (attr.length >= 2) {
        return {type: 'attr', syntax: attr[1], value: attr[0], substitution: subs}
      } else {
        return {type: 'attr', syntax: 'string', value: attr[0], substitution: subs}
      }
    }

    var parseAttribute = function (attr) {
      let cond = parseCondition(attr)
      if (cond !== null) {
        attr = cond[0]
      }
      /* to block condition from applying at the upper level, we add ` at then end
       * of the condition. In those case :
       *
       *  @url @url2 x?eq>d -> the condition apply to @url
       *  @url @url2 x?eq>d` -> the condition apply to @url2
       */
      if (attr.substring(attr.length - 1) === '`') {
        attr = attr.substring(0, attr.length - 1)
      }
      let o = null
      switch (attr.substring(0, 1)) {
        /* subquery */
        case '@':
          o = parseSubQuery(attr)
          break
          /* string */
        case '\'':
          /* fall through */
        case '#':
          o = {type: 'string', value: parseString(attr)}
          break
          /* attribute */
        default:
          o = parseAttr(attr)
      }
      if (!o) { return null }
      if (cond) {
        o.condition = cond[1]
      }
      return o
    }

    var parseAttributes = function (attr) {
      if (!attr) { return null }
      let attrValues = []
      let values = attr.split('|')
      for (let i = 0; i < values.length; i++) {
        let o = parseAttribute(values[i])
        o.subclass = `alt_${i}`

        /* bubble up syntax of the attribute to get the right format */
        let a = o
        while (a && a.type !== 'attr') {
          a = a.value
        }
        if (a) {
          o.syntax = a.syntax
        }
        if (o !== null) {
          attrValues.push(o)
        }
      }

      return attrValues
    }

    var parseUrlVariable = function (url) {
      const regexp = /\$([a-zA-Z0-9:_\-.]+)/g
      let vars = {}
      let m
      while ((m = regexp.exec(url)) !== null) {
        if (m.index === regexp.lastIndex) {
          regexp.lastIndex++
        }
        vars[m[0]] = m[1]
      }
      return vars
    }

    DTable.prototype.processHead = function () {
      var th = this.Thead.getElementsByTagName('TH')
      this.Column = []

      for (var i = 0; i < th.length; i++) {
        var sortName = 'sort-' + i
        var classInfo = ''
        if (th[i].getAttribute(names.classInfo)) {
          classInfo = th[i].getAttribute(names.classInfo)
        }
        this.Column[i] = {classInfo: classInfo}
        if (th[i].getAttribute(names.sortName)) {
          sortName = th[i].getAttribute(names.sortName)
        } else {
          th[i].setAttribute(names.sortName, sortName)
        }
        this.Column[i].sortName = sortName
        let attr = th[i].getAttribute(names.attribute)
        if (attr) {
          this.Column[i].value = parseAttributes(attr)
        } else {
          this.Column[i].value = parseAttributes(th[i].innerText)
        }
        if (this.Column[i].type !== 'text' && !th[i].getAttribute(names.sortType)) {
          th[i].setAttribute(names.sortType, this.Column[i].type)
        }
        if (th[i].getAttribute(names.process) && this.Plist[th[i].getAttribute(names.process)] instanceof Function) {
          this.Column[i].process = this.Plist[th[i].getAttribute(names.process)]
        } else {
          this.Column[i].process = null
        }
      }

      if (this.Actions.length > 0) {
        let actionHead = document.createElement('TH')
        actionHead.setAttribute(names.sortType, 'no')
        let tr = this.Thead.getElementsByTagName('TR')[0]
        if (tr) {
          window.requestAnimationFrame(() => tr.appendChild(actionHead))
        }
      }
    }

    return DTable
  }())
}())
