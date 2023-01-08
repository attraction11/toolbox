/********************** Step 0  **********************/
// const element = {
//     type: "h1",
//     props: {
//         title: "foo",
//         children: "hello"
//     }
// }
// const container = document.getElementById("root")

// const node = document.createElement(element.type)
// node['title'] = element.props.title

// const text = document.createTextNode('')
// text["nodeValue"] = element.props.children

// node.appendChild(text)
// container.appendChild(node)

/********************* Step 1  **********************/
/*
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)

const element = React.createElement(
    "div", 
    {id: "foo"}, 
    React.createElement(createElement("a", null, "bar")),
    React.createElement("b")
)
*/

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object" ? child : createTextElement(child)
      )
    }
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  };
}

function createDom(fiber) {
  const dom =
  fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  
  updateDom(dom, {}, fiber.props)
  
  return dom
}

const isEvent = key => key.startsWith("on")
const isProperty = key => key !== 'children' && !isEvent(key)
const isNew = (prev, next) => key => prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)

function updateDom(dom, prevProps, nextProps) {
  // remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => 
      !(key in nextProps) || isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name])
    })

  // add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })

  // remove old props
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })

  // Set new or changed props
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }

  const domParent = fiber.parent.dom

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {    
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function render(element, container) {
   wipRoot  = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  }

  deletions = []
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
let deletions = null

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    // 执行当前工作单元，并返回下一个工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

// 当主线程空闲时，浏览器会运行回调函数
requestIdleCallback(workLoop)


function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  // if (fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom)
  // }

  const elements = fiber.props.children
  reconcileChildren(fiber, elements)

  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

function reconcileChildren(wipFiber, elements) {
  let index = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null

  while (index < elements.length || oldFiber != null) {
    let newFiber = null
    const element = elements[index]
    const sameType = 
      oldFiber &&
      element &&
      element.type === oldFiber.type

    if (sameType) { // update
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE'
      }
    }
    if (element && !sameType) { // add
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT'
      }
    }
    if (oldFiber && !sameType) { // delete
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }
    if (index === 0) {
      wipFiber.child = newFiber
    } else if (element) {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
}

const Didact = {
  createElement,
  render
};

/** @jsx Didact.createElement */
const container = document.getElementById("root")

const updateValue = e => {
  rerender(e.target.value)
}

const rerender = value => {
  const element = (
    <div>
      <input onInput={updateValue} value={value} />
      <h2>Hello {value}</h2>
    </div>
  )
  Didact.render(element, container)
}

rerender("World")

