/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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
      effectStack.push(effectFn);
      activeEffect = effectFn;
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
  if (deps) return;

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
/* harmony export */   "effect": () => (/* reexport safe */ _effect_js__WEBPACK_IMPORTED_MODULE_0__.effect),
/* harmony export */   "isReactive": () => (/* reexport safe */ _reactive_js__WEBPACK_IMPORTED_MODULE_1__.isReactive),
/* harmony export */   "reactive": () => (/* reexport safe */ _reactive_js__WEBPACK_IMPORTED_MODULE_1__.reactive)
/* harmony export */ });
/* harmony import */ var _effect_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./effect.js */ "./src/reactivity/effect.js");
/* harmony import */ var _reactive_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./reactive.js */ "./src/reactivity/reactive.js");




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
/* harmony import */ var _reactivity_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./reactivity/index.js */ "./src/reactivity/index.js");
/***************************响应式模块(reactive)***************************/
/* 一、reactive的实现 */


// 1、重复代理
const obj = { x: 1 };
(0,_reactivity_index_js__WEBPACK_IMPORTED_MODULE_0__.reactive)((0,_reactivity_index_js__WEBPACK_IMPORTED_MODULE_0__.reactive)(obj));
const observed = (window.observed = (0,_reactivity_index_js__WEBPACK_IMPORTED_MODULE_0__.reactive)(
  (0,_reactivity_index_js__WEBPACK_IMPORTED_MODULE_0__.reactive)({
    count: 1,
  })
));

(0,_reactivity_index_js__WEBPACK_IMPORTED_MODULE_0__.effect)(() => {
  console.log('observed.count: ', observed.count + 5);
});

})();

/******/ })()
;