/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/reactivity/computed.js":
/*!************************************!*\
  !*** ./src/reactivity/computed.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "computed": () => (/* binding */ computed)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./src/utils/index.js");
/* harmony import */ var _effect_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect.js */ "./src/reactivity/effect.js");



function computed(getterOrOption) {
  let getter, setter;
  if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isFunction)(getterOrOption)) {
    getter = getterOrOption;
    setter = () => {
      console.warn('computed is readonly');
    };
  } else {
    getter = getterOrOption.get;
    setter = getterOrOption.set;
  }
  return new ComputedRefImpl(getter, setter);
}

class ComputedRefImpl {
  constructor(getter, setter) {
    this._setter = setter;
    this._value = undefined;
    // _dirty 计算属性中的缓存标识，如果依赖有变化重新执行（this.effect的 调度函数执行）没变化不重新执行
    this._dirty = true;
    // 对getter函数 使用到的属性进行依赖收集 activeEffect会变为 getter
    this.effect = (0,_effect_js__WEBPACK_IMPORTED_MODULE_1__.effect)(getter, {
      lazy: true,
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true;
          (0,_effect_js__WEBPACK_IMPORTED_MODULE_1__.trigger)(this, 'value');
        }
      },
    });
  }

  get value() {
    // 多次取值 如果依赖的属性未发生变化是不会重新计算的，直接返回 _value
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect();
      // 取值的时候进行依赖收集
      (0,_effect_js__WEBPACK_IMPORTED_MODULE_1__.track)(this, 'value');
    }
    return this._value;
  }

  set value(newValue) {
    this._setter(newValue);
  }
}


/***/ }),

/***/ "./src/reactivity/effect.js":
/*!**********************************!*\
  !*** ./src/reactivity/effect.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "effect": () => (/* binding */ effect),
/* harmony export */   "track": () => (/* binding */ track),
/* harmony export */   "trigger": () => (/* binding */ trigger)
/* harmony export */ });
// 作用：记录当前在执行的副作用函数（同时建立依赖收集和副作用函数间的联系，妙啊~）
let activeEffect;
// 采用effect调用栈，解决effect的嵌套问题
// const obj = { x: 1 }; reactive(reactive(obj));
const effectStack = [];

/* 执行并记录当前副作用函数 */
function effect(fn, options = {}) {
  const effectFn = () => {
    try {
      activeEffect = effectFn;
      effectStack.push(activeEffect);
      return fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  };

  // 默认首次副作用会执行
  if (!options.lazy) {
    effectFn();
  }

  effectFn.scheduler = options.scheduler;
  return effectFn;
}

/* 
    targetMap用于储存副作用，并建立 响应式对象 ==> 副作用函数 的映射关系
    使用WeakMap的原因是：当响应式对象或其属性移除，不再使用后，不必手动删除WeakMap中对应的副作用，GC会自动回收
    一个副作用函数 --> 多个响应式对象（依赖）
    一个响应式对象（依赖） --> 存在多个属性
    一个属性 --> 多个副作用函数
*/

const targetMap = new WeakMap();

/* 收集依赖 */
function track(target, key) {
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }

  deps.add(activeEffect);
}

/* 触发依赖 */
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const deps = depsMap.get(key);
  if (!deps) return;

  deps.forEach((effectFn) => {
    if (effectFn.scheduler) {
      effectFn.scheduler(effectFn);
    } else {
      effectFn();
    }
  });
}


/***/ }),

/***/ "./src/reactivity/index.js":
/*!*********************************!*\
  !*** ./src/reactivity/index.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "computed": () => (/* reexport safe */ _computed_js__WEBPACK_IMPORTED_MODULE_3__.computed),
/* harmony export */   "effect": () => (/* reexport safe */ _effect_js__WEBPACK_IMPORTED_MODULE_0__.effect),
/* harmony export */   "isReactive": () => (/* reexport safe */ _reactive_js__WEBPACK_IMPORTED_MODULE_1__.isReactive),
/* harmony export */   "reactive": () => (/* reexport safe */ _reactive_js__WEBPACK_IMPORTED_MODULE_1__.reactive),
/* harmony export */   "ref": () => (/* reexport safe */ _ref_js__WEBPACK_IMPORTED_MODULE_2__.ref)
/* harmony export */ });
/* harmony import */ var _effect_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./effect.js */ "./src/reactivity/effect.js");
/* harmony import */ var _reactive_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./reactive.js */ "./src/reactivity/reactive.js");
/* harmony import */ var _ref_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ref.js */ "./src/reactivity/ref.js");
/* harmony import */ var _computed_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./computed.js */ "./src/reactivity/computed.js");






/***/ }),

/***/ "./src/reactivity/reactive.js":
/*!************************************!*\
  !*** ./src/reactivity/reactive.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isReactive": () => (/* binding */ isReactive),
/* harmony export */   "reactive": () => (/* binding */ reactive)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./src/utils/index.js");
/* harmony import */ var _effect_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect.js */ "./src/reactivity/effect.js");



/* 声明代理响应式对象(也就是说 proxy 仅对响应式对象进行代理) */
const proxyMap = new WeakMap();

function reactive(target) {
  if (!target) return;

  // 解决对象的重复代理，仅第一次生效
  if (isReactive(target)) {
    console.log('注意：对象被重复代理了哦~');
    return target;
  }

  // 解决不同 reactive 代理同一个对象，只代理一次
  if (proxyMap.has(target)) {
    return proxyMap.get(target);
  }

  // 开始代理响应式对象
  const proxy = new Proxy(target, {
    // 代理对象属性的读取, receiver ==> Proxy 或者继承 Proxy 的对象
    get(target, key, receiver) {
      // 排除自定义的标识字段
      if (key === '__isReactive') {
        return true;
      }
      console.log('获取代理key的值');
      const res = Reflect.get(target, key, receiver);
      // 调用收集依赖
      (0,_effect_js__WEBPACK_IMPORTED_MODULE_1__.track)(target, key);
      // 对深层对象做递归代理处理
      return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isObject)(res) ? reactive(res) : res;
    },
    // 代理对象属性的写入
    set(target, key, value, receiver) {
      const oldValue = target[key]; // 会触发依赖收集??
      const res = Reflect.set(target, key, value, receiver);

      // 判断对象的值是否变更
      if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(oldValue, value)) {
        // 触发依赖
        (0,_effect_js__WEBPACK_IMPORTED_MODULE_1__.trigger)(target, key);
        const oldLength = target.length;
        // 判断 target 是否为数组，需要做特殊处理
        if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isArray)(target) && (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(oldLength, target.length)) {
          // 触发数组长度相关的副作用函数
          (0,_effect_js__WEBPACK_IMPORTED_MODULE_1__.trigger)(target, 'length');
        }
      }
      return res;
    },
  });

  proxyMap.set(target, proxy);
  return proxy;
}

/* 判断对象是否是响应式对象 */
function isReactive(target) {
  return !!(target && target.__isReactive);
}


/***/ }),

/***/ "./src/reactivity/ref.js":
/*!*******************************!*\
  !*** ./src/reactivity/ref.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ref": () => (/* binding */ ref)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./src/utils/index.js");
/* harmony import */ var _effect_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect.js */ "./src/reactivity/effect.js");
/* harmony import */ var _reactive_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reactive.js */ "./src/reactivity/reactive.js");




function isRef(value) {
  return !!(value && value.__isRef);
}

function ref(value) {
  if (isRef(value)) {
    return value;
  }

  return new RefImpl(value);
}

// 将复杂类型对象转为响应式对象，简单类型不做处理
function convert(value) {
  return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isObject)(value) ? (0,_reactive_js__WEBPACK_IMPORTED_MODULE_2__.reactive)(value) : value;
}

/* 实现 ref 类 */
class RefImpl {
  constructor(value) {
    this.__isRef = true;
    this._value = convert(value);
  }

  get value() {
    // 收集依赖（key为value）
    (0,_effect_js__WEBPACK_IMPORTED_MODULE_1__.track)(this, 'value');
    return this._value;
  }

  set value(newValue) {
    if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(newValue, this._value)) {
      this._value = convert(newValue);
      (0,_effect_js__WEBPACK_IMPORTED_MODULE_1__.trigger)(this, 'value');
    }
  }
}


/***/ }),

/***/ "./src/runtime/component.js":
/*!**********************************!*\
  !*** ./src/runtime/component.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mountComponent": () => (/* binding */ mountComponent)
/* harmony export */ });
/* harmony import */ var _reactivity_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reactivity/index.js */ "./src/reactivity/index.js");
/* harmony import */ var _scheduler_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./scheduler.js */ "./src/runtime/scheduler.js");
/* harmony import */ var _vnode_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./vnode.js */ "./src/runtime/vnode.js");




function mountComponent(vnode, container, anchor, patch) {
  const { type: Component } = vnode;
  const instance = (vnode.component = {
    props: null,
    attrs: null,
    setupState: null,
    ctx: null,
    mount: null,
    update: null,
    subTree: null,
    isMounted: false,
    next: null, // 储存n2
  });

  updateProps(instance, vnode);

  instance.setupState = Component.setup?.(instance.props, {
    attrs: instance.attrs,
  });

  instance.ctx = {
    ...instance.props,
    ...instance.setupState,
  };

  // 组件更新函数
  instance.update = (0,_reactivity_index_js__WEBPACK_IMPORTED_MODULE_0__.effect)(
    () => {
      if (!instance.isMounted) {
        // 挂载组件(接收组件产出的vnode)
        const subTree = (instance.subTree = (0,_vnode_js__WEBPACK_IMPORTED_MODULE_2__.normalizeVNode)(
          Component.render(instance.ctx)
        ));

        fallThrough(instance, subTree);

        patch(null, subTree, container, anchor);
        vnode = subTree.el;
        instance.isMounted = true;
      } else {
        // 更新组件
        if (instance.next) {
          vnode = instance.next; // 新组件（储存的n2）
          instance.next = null;
          updateProps(instance, vnode);
          instance.ctx = {
            ...instance.props,
            ...instance.setupState,
          };
        }

        const prev = instance.subTree;
        const subTree = (instance.subTree = (0,_vnode_js__WEBPACK_IMPORTED_MODULE_2__.normalizeVNode)(
          Component.render(instance.ctx)
        ));
        fallThrough(instance, subTree);

        patch(prev, subTree.container, anchor);
        vnode = subTree.el;
      }
    },
    {
      scheduler: _scheduler_js__WEBPACK_IMPORTED_MODULE_1__.queueJob,
    }
  );
}

function updateProps(instance, vnode) {
  const { type: commonent, props: vnodeProps } = vnode;
  const props = (instance.props = {});
  const attrs = (instance.attrs = {});

  // 用虚拟节点的属性赋值给组件实例
  for (const key in vnodeProps) {
    if (commonent.props?.includes(key)) {
      props[key] = vnodeProps[key];
    } else {
      attrs[key] = vnodeProps[key];
    }
  }

  // 将组件的 props 变为响应式对象
  instance.props = (0,_reactivity_index_js__WEBPACK_IMPORTED_MODULE_0__.reactive)(instance.props);
}

function fallThrough(instance, subTree) {
  if (Object.keys(instance.attrs).length) {
    subTree.props = {
      ...subTree.props,
      ...subTree.attrs,
    };
  }
}


/***/ }),

/***/ "./src/runtime/createApp.js":
/*!**********************************!*\
  !*** ./src/runtime/createApp.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "createApp": () => (/* binding */ createApp)
/* harmony export */ });
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./index.js */ "./src/runtime/index.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./src/utils/index.js");



function createApp(rootComponent) {
  const app = {
    mount(rootContainer) {
      if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.isString)(rootContainer)) {
        rootContainer = document.querySelector(rootContainer);
      }
      (0,_index_js__WEBPACK_IMPORTED_MODULE_0__.render)((0,_index_js__WEBPACK_IMPORTED_MODULE_0__.h)(rootComponent), rootContainer);
    },
  };

  return app;
}


/***/ }),

/***/ "./src/runtime/index.js":
/*!******************************!*\
  !*** ./src/runtime/index.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Fragment": () => (/* reexport safe */ _vnode_js__WEBPACK_IMPORTED_MODULE_1__.Fragment),
/* harmony export */   "Text": () => (/* reexport safe */ _vnode_js__WEBPACK_IMPORTED_MODULE_1__.Text),
/* harmony export */   "createApp": () => (/* reexport safe */ _createApp_js__WEBPACK_IMPORTED_MODULE_0__.createApp),
/* harmony export */   "h": () => (/* reexport safe */ _vnode_js__WEBPACK_IMPORTED_MODULE_1__.h),
/* harmony export */   "queueJob": () => (/* reexport safe */ _scheduler_js__WEBPACK_IMPORTED_MODULE_3__.queueJob),
/* harmony export */   "render": () => (/* reexport safe */ _render_js__WEBPACK_IMPORTED_MODULE_2__.render)
/* harmony export */ });
/* harmony import */ var _createApp_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./createApp.js */ "./src/runtime/createApp.js");
/* harmony import */ var _vnode_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vnode.js */ "./src/runtime/vnode.js");
/* harmony import */ var _render_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./render.js */ "./src/runtime/render.js");
/* harmony import */ var _scheduler_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./scheduler.js */ "./src/runtime/scheduler.js");






/***/ }),

/***/ "./src/runtime/patchProps.js":
/*!***********************************!*\
  !*** ./src/runtime/patchProps.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "patchProps": () => (/* binding */ patchProps)
/* harmony export */ });
// 对比新旧属性并赋值
function patchProps(el, oldProps, newProps) {
  if (oldProps === newProps) {
    return;
  }
  oldProps = oldProps || {};
  newProps = newProps || {};
  for (const key in newProps) {
    if (key === 'key') {
      continue;
    }
    const prev = oldProps[key];
    const next = newProps[key];
    if (prev !== next) {
      patchDomProp(el, key, prev, next);
    }
  }
  for (const key in oldProps) {
    if (key !== 'key' && !(key in newProps)) {
      patchDomProp(el, key, oldProps[key], null);
    }
  }
}

const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;
function patchDomProp(el, key, prev, next) {
  switch (key) {
    case 'class':
      // 暂时认为class就是字符串
      // next可能为null，会变成'null'，因此要设成''
      el.className = next || '';
      break;
    case 'style':
      // style为对象
      if (!next) {
        el.removeAttribute('style');
      } else {
        for (const styleName in next) {
          el.style[styleName] = next[styleName];
        }
        if (prev) {
          for (const styleName in prev) {
            if (next[styleName] == null) {
              el.style[styleName] = '';
            }
          }
        }
      }
      break;
    default:
      if (/^on[^a-z]/.test(key)) {
        // 事件
        if (prev !== next) {
          const eventName = key.slice(2).toLowerCase();
          if (prev) {
            el.removeEventListener(eventName, prev);
          }
          if (next) {
            el.addEventListener(eventName, next);
          }
        }
      } else if (domPropsRE.test(key)) {
        if (next === '' && typeof el[key] === 'boolean') {
          next = true;
        }
        el[key] = next;
      } else {
        // 例如自定义属性{custom: ''}，应该用setAttribute设置为<input custom />
        // 而{custom: null}，应用removeAttribute设置为<input />
        if (next == null || next === false) {
          el.removeAttribute(key);
        } else {
          el.setAttribute(key, next);
        }
      }
      break;
  }
}


/***/ }),

/***/ "./src/runtime/render.js":
/*!*******************************!*\
  !*** ./src/runtime/render.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* binding */ render)
/* harmony export */ });
/* harmony import */ var _vnode_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./vnode.js */ "./src/runtime/vnode.js");
/* harmony import */ var _patchProps_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./patchProps.js */ "./src/runtime/patchProps.js");
/* harmony import */ var _component_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./component.js */ "./src/runtime/component.js");




function render(vnode, container) {
  // 获取旧的虚拟 dom 节点（_vnode 属性用于储存旧的虚拟节点）
  const prevVNode = container._vnode;
  if (!vnode) {
    if (prevVNode) {
      // 新虚拟节点不存在，旧虚拟节点存在，卸载旧虚拟节点
      unmount(prevVNode);
    }
  } else {
    // 新虚拟节点存在(旧节点不一定存在)，进行对比
    patch(prevVNode, vnode, container);
  }

  // 将当前虚拟节点保存在父级节点上
  container._vnode = vnode;
}

function unmount(vnode) {
  const { shapeFlag, el } = vnode;
  // 逻辑与运算，判断当前节点类型是否为指定类型
  if (shapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.COMPONENT) {
    // 卸载组件节点
    unmountComponent(vnode);
  } else if (shapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.FRAGMENT) {
    // 卸载占位符节点
    unmountFragment(vnode);
  } else {
    // 卸载普通节点
    el.parentNode.removeChild(el);
  }
}

function unmountComponent(vnode) {
  const { component } = vnode;
  // 递归卸载组件节点的子组件
  unmount(component.subTree);
}

function unmountFragment(vnode) {
  // eslint-disable-next-line prefer-const
  let { el: cur, anchor: end } = vnode;
  while (cur !== end) {
    const next = cur.nextSibling;
    // 获取当前节点的父级节点，从父级中移除占位符
    cur.parentNode.removeChild(cur);
    cur = next;
  }
  end.parentNode.removeChild(end);
}

// n1为旧虚拟节点，n2为新虚拟节点，container为父级容器，anchor为标识以哪个节点为参照物
function patch(n1, n2, container, anchor) {
  if (n1 && !isSameVNodeType(n1, n2)) {
    // 新旧节点为不同类型的节点
    // 注意：n1被卸载后，n2将会被创建，因此anchor至关重要，需要将它设置为n1的洗一个兄弟节点
    anchor = (n1.anchor || n1.el).nextSibling;
    unmount(n1);
    n1 = null;
  }

  const { shapeFlag } = n2;
  if (shapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ELEMENT) {
    // 新节点为普通节点
    processElement(n1, n2, container, anchor);
  } else if (shapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT) {
    processText(n1, n2, container, anchor);
  } else if (shapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.FRAGMENT) {
    processFragment(n1, n2, container, anchor);
  } else if (shapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.COMPONENT) {
    processComponent(n1, n2, container, anchor);
  }
}

function isSameVNodeType(n1, n2) {
  return n1.type === n2.type;
  //   return n1.type === n2.type && n1.key === n2.key;
}

// 处理普通节点的对比和挂载
function processElement(n1, n2, container, anchor) {
  if (n1 === null) {
    // 旧虚拟节点不存在的情况，挂载新节点
    mountElement(n2, container, anchor);
  } else {
    // 旧新节点都存在，对比属性和子节点
    patchElement(n1, n2);
  }
}

// 挂载普通节点到容器 container 上
function mountElement(vnode, container, anchor) {
  const { type, props, shapeFlag, children } = vnode;
  const el = document.createElement(type);

  if (shapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT_CHILDREN) {
    // 子节点为文本节点时，赋值给 el
    el.textContent = children;
  } else if (shapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
    // 这里不能传anchor。因为anchor限制的是当前的element ??
    // 作为本element的children，不用指定anchor，append就行 ??
    mountChildren(children, el);
  }

  if (props) {
    // 调用属性对比函数，赋值属性给节点（无需对比）
    (0,_patchProps_js__WEBPACK_IMPORTED_MODULE_1__.patchProps)(el, null, props);
  }

  // 将当前真实节点保存到虚拟节点的属性上
  vnode.el = el;
  container.insertBefore(el, anchor);
}

function mountChildren(children, container, anchor) {
  // 遍历挂载新节点的子节点到 container 上
  children.forEach((child) => {
    patch(null, child, container, anchor);
  });
}

function patchElement(n1, n2) {
  n2.el = n1.el;
  (0,_patchProps_js__WEBPACK_IMPORTED_MODULE_1__.patchProps)(n2.el, n1.props, n2.props);
  patchChildren(n1, n2, n2.el);
}

// 对比新旧节点的差异
function patchChildren(n1, n2, container, anchor) {
  const { shapeFlag: prevShapeFlag, children: c1 } = n1;
  const { shapeFlag, children: c2 } = n2;

  if (shapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT_CHILDREN) {
    // 新节点为文本节点，旧节点为含子节点的数组
    if (prevShapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
      // 遍历移除子节点
      unmountChildren(c1);
    }
    if (c2 !== c1) {
      // 采用新节点文本内容覆盖旧文本
      container.textContent = c2;
    }
  } else {
    if (prevShapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
      if (shapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
        // 新旧节点都有子节点（简单认为头一个元素有key就都有key）最核心的对比
        if (c1[0] && c1[0].key != null && c2[0] && c2[0].key != null) {
          // 有key的diff算法
          patchKeyedChildren(c1, c2, container, anchor);
        } else {
          // 无key的diff算法
          patchUnkeyedChildren(c1, c2, container, anchor);
        }
      } else {
        // 新节点不存在
        unmountChildren(c1);
      }
    } else {
      // 旧节点没有子节点。旧节点为文本节点
      if (prevShapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT_CHILDREN) {
        container.textContent = '';
      }
      // 新节点有子节点
      if (shapeFlag & _vnode_js__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(c2, container, anchor);
      }
    }
  }
}

function unmountChildren(children) {
  children.forEach((child) => unmount(child));
}

function patchKeyedChildren(c1, c2, container, anchor) {
  let i = 0,
    e1 = c1.length - 1,
    e2 = c2.length - 1;

  // 1、从左至右依次对比（key 的判断采用 isSameVNodeType）
  // (a b) c
  // (a b) d e
  while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
    patch(c1[i], c2[i], container, anchor);
    i++;
  }

  // 2、从右至左依次对比
  // a (b c)
  // d e (b c)
  while ((i <= e1) & (i <= e2) & (c1[e1].key === c2[e2].key)) {
    patch(c1[e1], c2[e2], container, anchor);
    e1--;
    e2--;
  }

  // 情况描述：
  // (a b)
  // (a b) c
  // i = 2, e1 = 1, e2 = 2
  // (a b)
  // c (a b)
  // i = 0, e1 = -1, e2 = 0
  if (i > e1) {
    // 3.1、经过1、2直接将旧节点对比完了，则剩余的新节点直接 挂载（mount）
    const nextPos = e2 + 1;
    const curAnchor = (c2[nextPos] && c2[nextPos].e1) || anchor;
    for (let j = i; j <= e2; j++) {
      patch(null, c2[j], container, curAnchor);
    }
  }
  // 情况描述：
  // (a b) c
  // (a b)
  // i = 2, e1 = 2, e2 = 1
  // a (b c)
  // (b c)
  // i = 0, e1 = 0, e2 = -1
  else if (i > e2) {
    // 3.2、经过1、2直接将新节点对比完了，则剩余的旧节点直接 卸载（unmount）
    for (let j = i; j <= e1; j++) {
      unmount(c1[j]);
    }
  } else {
    // 4、采用传统的diff算法，但不真的添加和移动，只做标记和删除
    const map = new Map();
    for (let j = i; j <= e1; j++) {
      const prev = c1[j];
      map.set(prev.key, { prev, j });
    }

    // 用来跟踪任何节点是否有被移动
    // 设置一个变量 `maxNewIndexSoFar`，记录当前的 `next` 在 `c1` 中找到的 `index` 的最大值。
    let maxNewIndexSoFar = 0;
    let move = false;
    const toMounted = [];
    const source = new Array(e2 - i + 1).fill(-1);
    for (let k = 0; k < e2 - i + 1; k++) {
      const next = c2[k + i];
      if (map.has(next.key)) {
        const { prev, j } = map.get(next.key);
        patch(prev, next, container, anchor);
        if (j < maxNewIndexSoFar) {
          /* 
            若 `index` 小于 `maxNewIndexSoFar`，说明需要移动。它应该移动到上一个 `next` 之后。
            因此 `anchor` 设置为 `c2[i-1].el.nextSibling`。
          */
          move = true;
        } else {
          /* 
            若新找到的 `index` 大于等于 `maxNewIndexSoFar`，说明 `index` 呈升序，
            不需要移动，并更新 `maxNewIndexSoFar` 为 `index`（增大）。 
          */
          maxNewIndexSoFar = j;
        }
        source[k] = j;
        // 记录需要删除的 key
        map.delete(next.key);
      } else {
        /* 
          再考虑没 `c1` 中没有找到相同 `key` 的情况，将待新添加的节点放入toMounted
         */
        toMounted.push(k + i);
      }
    }

    map.forEach(({ prev }) => {
      unmount(prev);
    });

    if (move) {
      // 5.需要移动，则采用新的最长上升子序列算法
      const seq = getSequence(source);
      let j = seq.length - 1;
      for (let k = source.length - 1; k >= 0; k--) {
        if (k === seq[j]) {
          // 不用移动
          j--;
        } else {
          const pos = k + i;
          const nextPos = pos + 1;
          const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor;
          if (source[k] === -1) {
            // mount
            patch(null, c2[pos], container, curAnchor);
          } else {
            // 移动
            container.insertBefore(c2[pos].el, curAnchor);
          }
        }
      }
    } else if (toMounted.length) {
      // 6.不需要移动，但还有未添加的元素
      for (let k = toMounted.length - 1; k >= 0; k--) {
        const pos = toMounted[k];
        const nextPos = pos + 1;
        const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor;
        patch(null, c2[pos], container, curAnchor);
      }
    }
  }
}

function patchUnkeyedChildren(c1, c2, container, anchor) {
  const oldLength = c1.length;
  const newLength = c2.length;
  const commonLength = Math.min(oldLength, newLength);
  for (let i = 0; i < commonLength; i++) {
    patch(c1[i], c2[i], container, anchor);
  }
  if (newLength > oldLength) {
    mountChildren(c2.slice(commonLength), container, anchor);
  } else if (newLength < oldLength) {
    unmountChildren(c1.slice(commonLength));
  }
}

function getSequence(nums) {
  const result = [];
  const position = [];
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === -1) {
      continue;
    }
    // result[result.length - 1]可能为undefined，此时nums[i] > undefined为false
    if (nums[i] > result[result.length - 1]) {
      result.push(nums[i]);
      position.push(result.length - 1);
    } else {
      let l = 0,
        r = result.length - 1;
      while (l <= r) {
        const mid = ~~((l + r) / 2);
        if (nums[i] > result[mid]) {
          l = mid + 1;
        } else if (nums[i] < result[mid]) {
          r = mid - 1;
        } else {
          l = mid;
          break;
        }
      }
      result[l] = nums[i];
      position.push(l);
    }
  }
  let cur = result.length - 1;
  // 这里复用了result，它本身已经没用了
  for (let i = position.length - 1; i >= 0 && cur >= 0; i--) {
    if (position[i] === cur) {
      result[cur--] = i;
    }
  }
  return result;
}

function processText(n1, n2, container, anchor) {
  if (n1 == null) {
    // 旧文本节点不存在，挂载新文本节点
    mountTextNode(n2, container, anchor);
  } else {
    // 旧文本节点存在,用新文本覆盖旧文本节点的 textContent 属性
    n2.el = n1.el;
    n2.el.textContent = n2.children;
  }
}

function mountTextNode(vnode, container, anchor) {
  const textNode = document.createTextNode(vnode.children);
  vnode.el = textNode;
  container.insertBefore(textNode, anchor);
}

// anchor 是 Fragment 的专有属性
function processFragment(n1, n2, container, anchor) {
  const fragmentStartAnchor = (n2.el = n1
    ? n1.el
    : document.createTextNode(''));
  const fragmentEndAnchor = (n2.anchor = n1
    ? n1.anchor
    : document.createTextNode(''));

  if (n1 == null) {
    container.insertBefore(fragmentStartAnchor, anchor);
    container.insertBefore(fragmentEndAnchor, anchor);
    mountChildren(n2.children, container, fragmentEndAnchor);
  } else {
    patchChildren(n1, n2, container, fragmentEndAnchor);
  }
}

function processComponent(n1, n2, container, anchor) {
  if (n1 == null) {
    (0,_component_js__WEBPACK_IMPORTED_MODULE_2__.mountComponent)(n2, container, anchor, patch);
  } else {
    updateComponent(n1, n2);
  }
}

function updateComponent(n1, n2) {
  n2.component = n1.component;
  n2.commonent.next = n2;
  n2.commonent.update();
}


/***/ }),

/***/ "./src/runtime/scheduler.js":
/*!**********************************!*\
  !*** ./src/runtime/scheduler.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "nextTick": () => (/* binding */ nextTick),
/* harmony export */   "queueJob": () => (/* binding */ queueJob)
/* harmony export */ });
const queue = [];
let isFlushing = false;
const resolvedPromise = Promise.resolve();
let currentFlushPromise = null;

function nextTick(fn) {
  const p = currentFlushPromise || resolvedPromise;
  return fn ? p.then(fn) : p;
}

function queueJob(job) {
  if (!queue.length || !queue.includes(job)) {
    queue.push(job);
    queueFlush();
  }
}

function queueFlush() {
  if (!isFlushing) {
    isFlushing = true;
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}

function flushJobs() {
  try {
    for (let i = 0; i < queue.length; i++) {
      const job = queue[i];
      job();
    }
  } finally {
    isFlushing = false;
    queue.length = 0;
    currentFlushPromise = null;
  }
}


/***/ }),

/***/ "./src/runtime/vnode.js":
/*!******************************!*\
  !*** ./src/runtime/vnode.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Fragment": () => (/* binding */ Fragment),
/* harmony export */   "ShapeFlags": () => (/* binding */ ShapeFlags),
/* harmony export */   "Text": () => (/* binding */ Text),
/* harmony export */   "h": () => (/* binding */ h),
/* harmony export */   "normalizeVNode": () => (/* binding */ normalizeVNode)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./src/utils/index.js");


// 用于标识不同的节点类型
const ShapeFlags = {
  ELEMENT: 1, // 00000001
  TEXT: 1 << 1, // 00000010
  FRAGMENT: 1 << 2, // 00000100
  COMPONENT: 1 << 3, // 00001000
  TEXT_CHILDREN: 1 << 4, // 00010000
  ARRAY_CHILDREN: 1 << 5, // 00100000
  CHILDREN: (1 << 4) | (1 << 5), //00110000
};

const Text = Symbol('Text');
const Fragment = Symbol('Fragment');

// 使用 render(h(rootComponent), rootContainer)
function h(type, props, children) {
  let shapeFlag = 0;
  // 判断根节点的类型
  if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isString)(type)) {
    // 普通标签节点 如：<div>xx</div>
    shapeFlag = ShapeFlags.ELEMENT;
  } else if (type === Text) {
    shapeFlag = ShapeFlags.TEXT;
  } else if (type === Fragment) {
    // 占位符节点<></>
    shapeFlag = ShapeFlags.Fragment;
  } else {
    shapeFlag = ShapeFlags.COMPONENT;
  }

  // 采用 |= 合并节点的类型和子节点类型
  if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isString)(children) || (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isNumber)(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    children = children.toString();
  } else if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isArray)(children)) {
    shapeFlag = ShapeFlags.ARRAY_CHILDREN;
  }

  return {
    type,
    props,
    children,
    shapeFlag,
    el: null,
    anchor: null, // 用来标识当我们对新旧节点做增删或移动等操作时，以哪个节点为参照物。
    key: null,
    component: null, // 存储组件的实例
  };
}

// 处理节点嵌套（数组外嵌套占位节点）,方便函数能直接返回数组，字符串，数字
function normalizeVNode(result) {
  if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isArray)(result)) {
    return h(Fragment, null, result);
  }

  if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isObject)(result)) {
    return result;
  }

  return h(Text, null, result.toString());
}


/***/ }),

/***/ "./src/utils/index.js":
/*!****************************!*\
  !*** ./src/utils/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "camelize": () => (/* binding */ camelize),
/* harmony export */   "capitalize": () => (/* binding */ capitalize),
/* harmony export */   "hasChanged": () => (/* binding */ hasChanged),
/* harmony export */   "isArray": () => (/* binding */ isArray),
/* harmony export */   "isFunction": () => (/* binding */ isFunction),
/* harmony export */   "isNumber": () => (/* binding */ isNumber),
/* harmony export */   "isObject": () => (/* binding */ isObject),
/* harmony export */   "isString": () => (/* binding */ isString)
/* harmony export */ });
function isObject(value) {
  return typeof value === 'object' && value !== null;
}

function isFunction(value) {
  return typeof value === 'function';
}

function isArray(value) {
  return Array.isArray(value);
}

function isString(value) {
  return typeof value === 'string';
}

function isNumber(value) {
  return typeof value === 'number';
}

function hasChanged(value, oldValue) {
  return value !== oldValue && (value === value || oldValue === oldValue);
}

const camelizeRE = /-(\w)/g;
function camelize(str) {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _reactivity_ref_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./reactivity/ref.js */ "./src/reactivity/ref.js");
/* harmony import */ var _runtime_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./runtime/index.js */ "./src/runtime/index.js");
/* harmony import */ var _runtime_scheduler_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./runtime/scheduler.js */ "./src/runtime/scheduler.js");
/***************************响应式模块(reactive)***************************/
/* 一、reactive的实现 */
// import { reactive, effect } from './reactivity/index.js';

// 1、重复代理
// const obj = { x: 1 };
// reactive(reactive(obj));
// const observed = (window.observed = reactive(
//   reactive({
//     count: 1,
//   })
// ));

// effect(() => {
//   console.log('observed.count: ', observed.count + 5);
// });

// 2. 不同值代理同一对象，应只代理一次
// const obj = { x: 1 };
// const a = reactive(obj);
// const b = reactive(obj);

// 3. 深层对象的代理
// 例：let a = reactive({ x: { y: { z: 1 } } })

// 4. 数组
// 例：let a = reactive([1, 2, 3])
// const observed = (window.observed = reactive([1, 2, 3, 4]))

// effect(() => {
//     console.log('index: ', observed[4])
// })
// effect(() => {
//     console.log('length: ', observed.length)
// })

// 5. 嵌套effect
// const observed = (window.observed = reactive({
//   count1: 1,
//   count2: 2,
// }));

// effect(() => {
//   effect(() => {
//     console.log('count2 --- ', observed.count2);
//   });
//   console.log('count1 ---- ', observed.count1);
// });

/* 二、 ref的实现 */
// import { ref, effect } from './reactivity/index.js';
// const foo = (window.foo = ref(1));

// effect(() => {
//   console.log('foo: ', foo.value);
// });

/* 三、computed的实现（缓存 + 懒计算） */
// import { ref, computed } from './reactivity/index.js';
// const num = (window.num = ref(0));
// window.d = computed({
//   get() {
//     console.log('calculate num.value * 2');
//     return num.value * 2;
//   },
//   set(newVal) {
//     console.log('update num.value');
//     num.value = newVal;
//   },
// });

// console.log(window.d.value);

/***************************运行时模块(runtime)***************************/
// import { render, h, Text, Fragment } from "./runtime/index.js";

// const vnode = h(
//     'div',
//     {
//         class: 'a b',
//         style: {
//             border: '1px solid',
//             fontSize: '14px',
//         },
//         onClick: () => console.log('click'),
//         id: 'foo',
//         checked: '',
//         custom: false
//     },
//     [h('ul', null, [
//         h('li', { style: { color: 'red' } }, 1),
//         h('li', null, 2),
//         h('li', { style: { color: 'blue' } }, 3),
//         h(Fragment, null, [h('li', null, '4'), h('li')]),
//         h('li', null, [h(Text, null, 'hello world')])
//     ])]
// )

// console.log('xx')
// render(vnode, document.body)

/***************************执行调度（scheduler）***************************/




(0,_runtime_index_js__WEBPACK_IMPORTED_MODULE_1__.createApp)({
  setup() {
    const count = (0,_reactivity_ref_js__WEBPACK_IMPORTED_MODULE_0__.ref)(0);
    const add = () => {
      count.value++;
      count.value++;
      count.value++;
    };
    return {
      count,
      add,
    };
  },
  render(ctx) {
    console.log('render');
    return [
      (0,_runtime_index_js__WEBPACK_IMPORTED_MODULE_1__.h)('div', { id: 'div' }, `count: ${ctx.count.value}`),
      (0,_runtime_index_js__WEBPACK_IMPORTED_MODULE_1__.h)(
        'button',
        {
          id: 'btn',
          onClick: ctx.add,
        },
        'add'
      ),
    ];
  },
}).mount(document.body);

const div = document.getElementById('div');
const btn = document.getElementById('btn');
console.log('init num', div.innerHTML);

btn.click();
console.log('click num', div.innerHTML);

setTimeout(() => {
  // 异步宏任务
  console.log('async click num', div.innerHTML);
}, 0);

(0,_runtime_scheduler_js__WEBPACK_IMPORTED_MODULE_2__.nextTick)(() => {
  // 异步微任务
  console.log('nextTick click num', div.innerHTML);
});

})();

/******/ })()
;