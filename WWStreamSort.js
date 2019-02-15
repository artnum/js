/*
 * Stream Sort Web Worker (merge/heap sort)
 * ========================================
 *
 * The idea is as follow : you are going through your DOM to pick up value that
 * you want to sort. Each time you pick up a value, you format it into an
 * object with :
 *   {
 *     op: 'add'
 *     args: {
 *       value: [<whatever values you want>],
 *       ... <what ever too> ...
 *     }
 *   }
 * and post it too the web worker. On receiving that, this worker will put into
 * an array and preflight (heapify for heap sort, first merge serie for merge
 * sort). When you are done, you send :
 *   {
 *     op: 'run'
 *   }
 * And the worker start sending you result. Before sending "run" you knew how
 * many element you had, so you array is ready to receive data. As soon as one
 * item is sorted, the worker send you :
 *   {
 *     op: 'result',
 *     pos: <x>,
 *     element: <add's args sent>
 *   }
 * When you receive that, just put it into you array with :
 *   `my_array[msg.data.pos] = msg.data.element`
 * And when you have receveid all your elements, you just count that you have
 * all your elements, you have got all your elements sorted in the background.
 *
 * Before you add data, you have to init (in a way it follows hashing functions
 * with init/update/finalize. `{op: 'init'}` initialize for ASC Heap Sort. You
 * can add `args : { reverse: true|false, algo: 'merge'|'heap'}`. Heap is
 * faster overall, but merge sort is stable. As you can pass multiple value to
 * compare against, I don't see any reason to use merge sort, but some might
 * have good reasons to do it.
 *
 * At the very end, the worker send you `{op: 'execution'}` with different time
 * in [ms]. When you receive that, you can terminate the worker (or restart
 * with a new init/add/run sequence).
 * Times sent are :
 *   - run: for run time
 *   - add: for add time, but not the elapsed time between first add and last
 *          add, only time taken to add an element with preflight accounted for
 *          all elements.
 *   - init: time to init (marginal)
 *   - algo: algorithm used
 *   - length : total elements it sorted
 *   - total : run + add + init
 *
 * Note
 * ----
 * args.value is an array, so it can sort multiple value. Returned value are
 * in ascending order. During init you can set to reverse mode, so to sort
 * descending.
 *
 * Heap sort is a classic implementation. The only advantage it has is that the
 * heapify is done while the data are coming, so this part will be almost done
 * when last element come in, so you gain some time.
 *
 * Merge sort use bottom-up implementation. Might need some more work at time
 * of writing (2019-02-14).
 *
 * LICENCE
 * =======
 *
 * Copyright 2019 Etienne Bagnoud <etienne@artnum.ch>. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  - Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *  - Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

/* eslint-env worker */
'use strict'

var inited = false
var algo = 'merge'
var data = []
var reverse = false

function compare (a, b) {
  if (!Array.isArray(a)) { a = [ a ] }
  if (!Array.isArray(b)) { b = [ b ] }

  var op = function (a, b) { return a > b }
  if (reverse) {
    op = function (a, b) { return b > a }
  }

  var len = (a.length > b.length) ? b.length : a.length
  for (var i = 0; i < len; i++) {
    if (op(a[i], b[i])) return 1
    if (op(b[i], a[i])) return -1
  }

  if (op(a.length, b.length)) {
    return 1
  } else if (op(b.length, a.length)) {
    return -1
  }

  return 0
}

function sift (o, end) {
  var i = o
  while (i < end) {
    var s = i
    var c1 = (2 * i) + 1
    var c2 = c1 + 1

    if (c1 < end && compare(data[c1].value, data[s].value) > 0) { s = c1 }
    if (c2 < end && compare(data[c2].value, data[s].value) > 0) { s = c2 }
    if (s === i) { return }

    var t = data[i]
    data[i] = data[s]
    data[s] = t
    i = s
  }
}

function mergesort () {
  for (var width = 4; width / 2 < data.length; width *= 2) {
    var lastround = false

    var tmp = new Array(data.length)
    var oi = 0
    for (var i = 0; i < data.length; i += width) {
      var li = i
      var ri = i + width / 2

      if (i + width >= data.length && width >= data.length) {
        lastround = true
      }

      while (li < (i + width / 2) && ri < (i + width) && ri < data.length && li < data.length) {
        if (compare(data[li].value, data[ri].value) > 0) {
          if (lastround) {
            self.postMessage({op: 'result', pos: oi++, element: data[ri++]})
          } else { tmp[oi++] = data[ri++] }
        } else {
          if (lastround) {
            self.postMessage({op: 'result', pos: oi++, element: data[li++]})
          } else { tmp[oi++] = data[li++] }
        }
      }
      while (oi < data.length && li < (i + width / 2)) {
        if (lastround) {
          self.postMessage({op: 'result', pos: oi++, element: data[li++]})
        } else { tmp[oi++] = data[li++] }
      }
      while (oi < data.length && ri < (i + width)) {
        if (lastround) {
          self.postMessage({op: 'result', pos: oi++, element: data[ri++]})
        } else { tmp[oi++] = data[ri++] }
      }
    }
    data = tmp
  }
}

var addtime = 0
var inittime = 0
self.onmessage = async function (msg) {
  var start = 0
  if (!msg.data.op) { return }
  switch (msg.data.op) {
    default:
      self.postMessage({op: 'error', errstr: `Unkown operation ${msg.data.op}`})
      return
    case 'init':
      start = performance.now()
      inited = true
      if (msg.data.args) {
        switch (msg.data.args.algo) {
          default:
          case 'merge':
            algo = 'merge'
            data = []
            break
          case 'heap':
            data = []
            algo = 'heap'
            break
        }
        if (msg.data.args.reverse) {
          reverse = true
        }
      }
      self.postMessage({op: 'initialized'})
      inittime += performance.now() - start
      break
    case 'add':
      start = performance.now()
      var opts = {}
      if (!inited) { self.postMessage({op: 'error', errstr: 'Not initialized'}); return }
      if (!msg.data.args || !msg.data.args.value) { self.postMessage({op: 'error', errstr: 'Invalid argument'}); return }

      if (msg.data.id) {
        opts.id = msg.data.id
      }

      switch (algo) {
        case 'heap':
          data.unshift(msg.data.args)
          sift(Math.floor(data.length / 2), data.length)
          self.postMessage(Object.assign({op: 'ready', size: data.length}, opts))
          break
        case 'merge':
          data.push(msg.data.args)
          if (data.length % 2 === 0) {
            if (compare(data[data.length - 2].value, data[data.length - 1].value) > 0) {
              var t = data[data.length - 2]
              data[data.length - 2] = data[data.length - 1]
              data[data.length - 1] = t
            }
          }
          self.postMessage(Object.assign({op: 'ready', size: data.length}, opts))
          break
      }
      addtime += performance.now() - start
      break
    case 'run':
      start = performance.now()
      if (!inited) { self.postMessage({op: 'error', errstr: 'Not initialized'}); return }
      switch (algo) {
        case 'heap':
          var end = data.length - 1
          while (end > 0) {
            self.postMessage({op: 'result', pos: end, element: data[0]})
            data[0] = data[end]
            sift(0, end)
            end--
          }
          self.postMessage({op: 'result', pos: 0, element: data[0]})
          break
        case 'merge':
          mergesort()
          break
      }
      var runtime = performance.now() - start
      self.postMessage({op: 'execution', run: runtime, init: inittime, add: addtime, total: runtime + inittime + addtime, algo: algo, length: data.length})
      break
  }
}
