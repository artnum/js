/* eslint-env browser */
/* global Popper */
var Select = function (input, store, options = {allowFreeText: true, realSelect: false}) {
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Not an Input element')
  }
  input.classList.add('select')
  input.setAttribute('autocomplete', 'off')
  let popper = null
  let originalValue = input.value
  let obj = new Proxy(this, {
    get: function (obj, prop) {
      switch (prop) {
        case 'value':
          if (!input.dataset.value) {
            return input.value ? input.value : ''
          } else {
            return input.dataset.value
          }
        case 'domNode':
          return input
        default:
          return obj[prop] ? obj[prop] : ''
      }
    },
    set: function (obj, prop, value) {
      switch (prop) {
        case 'value':
          if (!value) { break }
          input.dataset.loading = '1'
          store.get(value).then((entry) => {
            if (entry) {
              this.lastEntry = entry
              input.value = entry.label
              this.value = input.value
              input.dataset.value = entry.value
            } else {
              if (options.allowFreeText) {
                input.value = value
              } else {
                if (!this.lastEntry) {
                  this.value = ''
                  input.value = ''
                } else {
                  this.value = this.lastEntry.value
                  input.value = this.lastEntry.label
                }
              }
            }
            input.dataset.loading = '0'
          })
          break
        default:
          input[prop] = value
      }
    }
  })

  var list = document.createElement('DIV')
  list.classList.add('dropdown')

  /* taken from https://stackoverflow.com/posts/35173443/revisions */
  var focusNextElement = function (current = null) {
    if (!current) {
      current = document.activeElement
    }
    //add all elements we want to include in our selection
    let focussableElements = 'a:not([disabled]), button:not([disabled]), input[type=text]:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])';
    if (document.activeElement && document.activeElement.form) {
      let focussable = Array.prototype.filter.call(document.activeElement.form.querySelectorAll(focussableElements),
        function (element) {
          //check for visibility while always include the current activeElement 
          return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement
        });
      let index = focussable.indexOf(current);
      if (index > -1) {
        let element = focussable[index + 1] || focussable[0]
        element.focus()
      }
    }
  }

  var select = (target, dontMessValue = false) => {
    if (!dontMessValue) {
      input.value = target.textContent
    }
    input.dataset.value = target.dataset.value
    target.dataset.hover = '1'
    let ev = new Event('change')
    ev.value = input.dataset.value
    this.Events.dispatchEvent(ev)
  }

  this.Events = new EventTarget()
  
  var move = (k) => {
    let current = null
    for (let i = list.firstElementChild; i; i = i.nextElementSibling) {
      if (i.dataset.hover === '1') {
        current = i
        break
      }
    }
    let set = null
    let reset = null
    let moveStep = 1
    let wrapTarget = null
    switch (k) {
      case 'PageDown':
        if (list.firstElementChild) {
          moveStep = Math.floor(list.getBoundingClientRect().height / list.firstElementChild.getBoundingClientRect().height)
        }
        wrapTarget = list.lastElementChild
      /* Fall through */
      case 'ArrowDown':
        if (!wrapTarget) {
          wrapTarget = list.firstElementChild
        }
        if (current === null) {
          current = list.firstElementChild
          moveStep--
        }
        reset = current

        for (let i = 0; i < moveStep && current; i++) {
          current = current.nextElementSibling
        }

        if (current) {
          set = current
        } else {
          set = wrapTarget
        }
        break
      case 'PageUp':
        if (list.firstElementChild) {
          moveStep = Math.floor(list.getBoundingClientRect().height / list.firstElementChild.getBoundingClientRect().height)
        }
        wrapTarget = list.firstElementChild
      /* Fall through */
      case 'ArrowUp':
        if (!wrapTarget) {
          wrapTarget = list.lastElementChild
        }
        if (current === null) {
          current = list.lastElementChild
          moveStep--
        }
        reset = current

        for (let i = 0; i < moveStep && current; i++) {
          current = current.previousElementSibling
        }

        if (current) {
          set = current
        } else {
          set = wrapTarget
        }
        break
    }
    if (set) {
      set.dataset.hover = '1'
      if (set.getBoundingClientRect().bottom > list.getBoundingClientRect().bottom) {
        set.scrollIntoView()
      } else if (set.getBoundingClientRect().top < list.getBoundingClientRect().top) {
        set.scrollIntoView(false)
      }
      if (!options.allowFreeText) {
        select(set, true)
      }
    }
    if (reset && set !== reset) {
      reset.dataset.hover = '0'
    }
  }

  var degenerate = (event) => {
    if (popper) { popper.destroy(); popper = null }
    if (list.parentNode) {
      window.requestAnimationFrame(() => list.parentNode.removeChild(list))
    }
  }

  var handleTab = (event) => {
    switch (event.key) {
      case 'Enter':
        event.stopPropagation()
        event.preventDefault()
        return
      case 'Tab':
        for (let n = list.firstElementChild; n; n = n.nextElementSibling) {
          if (n.dataset.hover === '1') {
            select(n)
            break
          }
        }
        degenerate()
        break
    }
  }

  var generate = (event) => {
    if (event.type === 'focus') {
      input.setSelectionRange(0, input.value.length)
    }
    switch (event.key) {
      case 'Tab': return
      case 'Enter':
        for (let n = list.firstElementChild; n; n = n.nextElementSibling) {
          if (n.dataset.hover === '1') {
            /* select item in the list and block some on keyup enter that send form if 
             * listener setup as so (if setup before this one it has no effet)
             */
            event.stopPropagation()
            select(n)
            degenerate()
            focusNextElement(input)
          }
        }
        return
      case 'ArrowUp':
      case 'ArrowDown':
      case 'PageUp':
      case 'PageDown':
        event.preventDefault()
        return move(event.key)
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Escape':
      case 'Alt':
      case 'AltGraph':
        return
      case 'Backspace':
      case 'Delete':
        if (input.value.length === 0 && !options.realSelect) { 
          return degenerate() 
        }
    }
    /* avoid generating another list over the old one, triggering a nasty visual bug when you select
     * an item the list disappear and nothing is selected
     */
    if (!popper) {
      window.requestAnimationFrame((event) => {
        if (!list.parentNode) {
          input.parentNode.insertBefore(list, input.nextSiblingElement)
        }
        popper = new Popper(input, list, { removeOnDestroy: true, positionFixed: true, placement: 'bottom-start' })
      })
    }

    store.query(input.value).then((data) => {
      let frag = document.createDocumentFragment()
      if (data.length < 1) {
        degenerate()
      } else {
        window.requestAnimationFrame(() => {
          list.innerHTML = ''
        })
        data.forEach((entry) => {
          let s = document.createElement('DIV')
          s.dataset.value = entry.value
          s.innerHTML = entry.label
          s.addEventListener('mouseover', (event) => {
            for (let i = list.firstElementChild; i; i = i.nextElementSibling) {
              if (i !== event.target) {
                i.dataset.hover = '0'
              }
            }
            event.target.dataset.hover = '1'
          })
          s.addEventListener('mousedown', (event) => {
            event.preventDefault()
            select(event.target)
            degenerate()
            focusNextElement(input)
          })
          frag.appendChild(s)
        })
        window.requestAnimationFrame(() => {
          list.appendChild(frag)
          if (!options.allowFreeText) {
            select(list.firstElementChild, true)
          }
        })
      }
    })
  }

  /* must catch onchange and redispatch a new onchange for form listening on that
   * event. Not doing so lead, in some cases, to strange behavior
   */
  input.addEventListener('change', (event) => {
    if (event.detail && event.detail.resent) { return }
    event.stopPropagation()
    if (input.dataset.value) {
      store.get(input.dataset.value).then((entry) => {
        if (entry) {
          input.value = entry.label
        }
      })
    }
    input.dispatchEvent(new CustomEvent('change', {detail: {resent: true}}))
  }, {capture: true})

  input.addEventListener('blur', degenerate)
  input.addEventListener('keyup', generate, {capture: true})
  input.addEventListener('keydown', handleTab, {capture: true})
  input.addEventListener('focus', generate)

  obj.value = originalValue
  return obj
}

Select.prototype.addEventListener = function (type, callback, options = {}) {
  this.Events.addEventListener(type, callback, options)
}
