/*
 * Time different sort algorithm for random array
 * Demo : https://artnum.ch/code/demos/Sort.html
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
/* eslint-env browser */
'use strict'

function siftDown (array, i, max) {
  while (i < max) {
    var iBig = i
    var c1 = 2 * i + 1
    var c2 = c1 + 1
    if (c1 < max && array[c1] > array[iBig]) { iBig = c1 }
    if (c2 < max && array[c2] > array[iBig]) { iBig = c2 }
    if (iBig === i) { return }
    var tmp = array[i]
    array[i] = array[iBig]
    array[iBig] = tmp
    i = iBig
  }
}

function heapSort (array) {
  var i = Math.floor(array.length / 2 - 1)
  while (i >= 0) {
    siftDown(array, i, array.length)
    i--
  }
  var end = array.length - 1
  while (end > 0) {
    var tmp = array[end]
    array[end] = array[0]
    array[0] = tmp
    siftDown(array, 0, end)
    end--
  }
}

function merge (left, right, array) {
  var i = 0
  while (left.length && right.length) {
    array[i++] = (right[0] < left[0]) ? right.shift() : left.shift()
  }
  while (left.length) {
    array[i++] = left.shift()
  }
  while (right.length) {
    array[i++] = right.shift()
  }
}

function rMergeSort2 (array) {
  if (array.length === 1) { return }

  var l = array.slice(0, Math.floor(array.length / 2))
  var r = array.slice(Math.floor(array.length / 2))

  rMergeSort2(l)
  rMergeSort2(r)

  merge(l, r, array)
}

var mSortBlob = new Blob([ 'function m(l, r, a) { var i=0; var iR=0; var iL=0; while (iL < l.length && iR < r.length) { a[i++] = (r[iR] < l[iL]) ? r[iR++] : l[iL++] }; ' +
  'while (iL < l.length) { a[i++] = l[iL++] }; while (iR < r.length) { a[i++] = r[iR++] }; }; ' +
  'function ms (a) { if (a.length === 1) { return }; var l = a.slice(0, Math.floor(a.length / 2)); var r = a.slice(Math.floor(a.length / 2)); ' +
  'ms (l); ms (r); m(l, r, a) } ' +
      'self.onmessage = function (msg) { var time = performance.now(); ms(msg.data.array); time = performance.now() - time;  self.postMessage({time: time, array: msg.data.array}, [msg.data.array.buffer]) }' ], {type: 'application/javascript'})
var mWorker1 = new Worker(URL.createObjectURL(mSortBlob))
var mWorker2 = new Worker(URL.createObjectURL(mSortBlob))

function rMergeSort (array) {
  if (array.length === 1) { return }

  var aLeft = new Int16Array(array.slice(0, Math.floor(array.length / 2)))
  var aRight = new Int16Array(array.slice(Math.floor(array.length / 2)))

  return new Promise(function (resolve, reject) {
    var p1 = new Promise(function (resolve, reject) {
      mWorker1.onmessage = function (e) {
        resolve(e.data.array)
      }
    })
    var p2 = new Promise(function (resolve, reject) {
      mWorker2.onmessage = function (e) {
        resolve(e.data.array)
      }
    })

    mWorker1.postMessage({array: aLeft}, [aLeft.buffer])
    mWorker2.postMessage({array: aRight}, [aRight.buffer])
    p1.then(function (l) {
      p2.then(function (r) {
        var i = 0
        var iR = 0
        var iL = 0
        while (iR < l.length && iL < r.length) {
          array[i++] = (r[iR] < l[iL]) ? r[iR++] : l[iL++]
        }
        while (iL < l.length) {
          array[i++] = l[iL++]
        }
        while (iR < r.length) {
          array[i++] = r[iR++]
        }
        resolve(array)
      })
    })
  })
}

function selectionSort (array) {
  for (var j = 0; j < array.length - 1; j++) {
    var min = j
    for (var i = j; i < array.length; i++) {
      if (array[min] > array[i]) { min = i }
    }

    if (min !== j) {
      var t = array[min]
      array[min] = array[j]
      array[j] = t
    }
  }
}

function gnomeSort (array) {
  for (var i = 0; i < array.length; i++) {
    if (i + 1 < array.length && array[i] > array[i + 1]) {
      for (var j = i; j >= 0 && array[j] > array[j + 1]; j--) {
        var t = array[j + 1]
        array[j + 1] = array[j]
        array[j] = t
      }
    }
  }
}

function bubbleSort (array) {
  var sorted = false
  while (!sorted) {
    sorted = true
    for (var i = 0; i < array.length - 1; i++) {
      if (array[i] > array[i + 1]) {
        sorted = false
        var t = array[i + 1]
        array[i + 1] = array[i]
        array[i] = t
      }
    }
  }
}

/* 0 ... 500 */
function random500 () {
  return Math.floor(Math.random() * 100) +
    Math.floor(Math.random() * 100) +
    Math.floor(Math.random() * 100) +
    Math.floor(Math.random() * 100) +
    Math.floor(Math.random() * 100)
}

function swap (a, idx1, idx2) {
  var t = a[idx1]
  a[idx1] = a[idx2]
  a[idx2] = t
}

async function run () {
  var max = 0
  var results = []
  var arrays = {}
  for (var w = 0; w <= 5; w++) {
    for (var z = 1; z <= 10; z++) {
      if (!arrays[z]) {
        arrays[z] = []
        for (var i = 0; i < z * 3000; i++) {
          arrays[z].push(random500())
        }
      }

      var arr = []
      var carr = []
      var r = {w: w, z: z, c: arrays[z].length, i1: 0, i2: 0, r: 0, h: 0, j: 0, max: 0}

      if (w === 2) {
        heapSort(arrays[z])
        arrays[z].reverse()
      }

      if (w === 3) {
        heapSort(arrays[z])
        for (var q = 1; q < arrays[z].length; q += 2) {
          swap(arrays[z], q, q - 1)
        }
      }
      if (w === 4) {
        heapSort(arrays[z])
        q = Math.floor(arrays[z] / 64)
        for (; q < arrays[z].length; q += q) {
          swap(arrays[z], q, q - 1)
        }
      }
      if (w === 5) {
        heapSort(arrays[z])
      }

      carr = arrays[z].slice()
      var jStart = performance.now()
      carr.sort(function (a, b) { return a - b })
      r.j = performance.now() - jStart
      if (r.j > max) { max = r.j }
      if (r.j > r.max) { r.max = r.j }
      r.max = max

      arr = arrays[z].slice()
      var iStart2 = performance.now()
      rMergeSort2(arr)
      r.i2 = performance.now() - iStart2
      if (r.i2 > max) { max = r.i2 }
      if (r.i2 > r.max) { r.max = r.i2 }

      if (carr[0] !== arr[0] || carr[Math.floor((carr.length - 1) / 2)] !== arr[Math.floor((arr.length - 1) / 2)] || carr[carr.length - 1] !== arr[arr.length - 1]) {
        alert('Implementation error in iMergeSort')
      }

      arr = arrays[z].slice()
      var rStart = performance.now()
      arr = await rMergeSort(arr)
      r.r = performance.now() - rStart
      if (r.r > max) { max = r.r }
      if (r.r > r.max) { r.max = r.r }

      if (carr[0] !== arr[0] || carr[Math.floor((carr.length - 1) / 2)] !== arr[Math.floor((arr.length - 1) / 2)] || carr[carr.length - 1] !== arr[arr.length - 1]) {
        alert('Implementation error in rMergeSort')
      }

      arr = arrays[z].slice()
      var hStart = performance.now()
      heapSort(arr)
      r.h = performance.now() - hStart
      if (r.h > max) { max = r.h }
      if (r.h > r.max) { r.max = r.h }

      if (carr[0] !== arr[0] || carr[Math.floor((carr.length - 1) / 2)] !== arr[Math.floor((arr.length - 1) / 2)] || carr[carr.length - 1] !== arr[arr.length - 1]) {
        alert('Implementation error in heapSort')
      }

      arr = arrays[z].slice()
      var start = performance.now()
      gnomeSort(arr)
      r.g = performance.now() - start
      if (r.g > max) { max = r.g }
      if (r.g > r.max) { r.max = r.g }

      if (carr[0] !== arr[0] || carr[Math.floor((carr.length - 1) / 2)] !== arr[Math.floor((arr.length - 1) / 2)] || carr[carr.length - 1] !== arr[arr.length - 1]) {
        alert('Implementation error in gnomeSort')
      }

      arr = arrays[z].slice()
      start = performance.now()
      bubbleSort(arr)
      r.b = performance.now() - start
      if (r.b > max) { max = r.b }
      if (r.b > r.max) { r.max = r.b }

      if (carr[0] !== arr[0] || carr[Math.floor((carr.length - 1) / 2)] !== arr[Math.floor((arr.length - 1) / 2)] || carr[carr.length - 1] !== arr[arr.length - 1]) {
        alert('Implementation error in bubbleSort')
      }

      arr = arrays[z].slice()
      start = performance.now()
      selectionSort(arr)
      r.s = performance.now() - start
      if (r.s > max) { max = r.s }
      if (r.s > r.max) { r.max = r.s }

      if (carr[0] !== arr[0] || carr[Math.floor((carr.length - 1) / 2)] !== arr[Math.floor((arr.length - 1) / 2)] || carr[carr.length - 1] !== arr[arr.length - 1]) {
        alert('Implementation error in selectionSort')
      }

      if (w > 0) { // first run as warm up, discard it
        results.push(r)
      }
    }
  }
  var tbody = document.body.getElementsByTagName('TBODY')[0]
  var serie = -1
  results.forEach(function (r) {
    var ci2 = 255 - Math.round((255 % max) * (r.i2 * 7.5 / r.max))
    var cr  = 255 - Math.round((255 % max) * (r.r * 7.5 / r.max))
    var ch  = 255 - Math.round((255 % max) * (r.h * 7.5 / r.max))
    var cj  = 255 - Math.round((255 % max) * (r.j * 7.5 / r.max))
    var cs  = 255 - Math.round((255 % max) * (r.s * 7.5 / r.max))
    var cg  = 255 - Math.round((255 % max) * (r.g * 7.5 / r.max))
    var cb  = 255 - Math.round((255 % max) * (r.b * 7.5 / r.max))
    if (serie !== r.w) {
      tbody.innerHTML += '<tr><th colspan="9">Serie ' + r.w + '</th></tr>'
    }
    serie = r.w
    tbody.innerHTML +=
        '<tr><td>' + r.z + '</td><td>' +
        r.c + '</td><td style="background-color: rgb(100, ' + ci2 + ', 75)">' +
        r.i2 + '</td><td style="background-color: rgb(120, ' + cr  + ', 75)">' +
        r.r +  '</td><td style="background-color: rgb(120, ' + ch  + ', 75)">' +
        r.h +  '</td><td style="background-color: rgb(120, ' + cb  + ', 75)">' +
        r.b +  '</td><td style="background-color: rgb(120, ' + cg  + ', 75)">' +
        r.g +  '</td><td style="background-color: rgb(120, ' + cj  + ', 75)">' +
        r.j +  '</td><td style="background-color: rgb(120, ' + cs  + ', 75)">' +
        r.s + '</td></tr>'
  })
}

run()
