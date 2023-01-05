/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/compiler/ast.js":
/*!*****************************!*\
  !*** ./src/compiler/ast.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ElementTypes": () => (/* binding */ ElementTypes),
/* harmony export */   "NodeTypes": () => (/* binding */ NodeTypes),
/* harmony export */   "createRoot": () => (/* binding */ createRoot)
/* harmony export */ });
const NodeTypes = {
  ROOT: 'ROOT',
  ELEMENT: 'ELEMENT',
  TEXT: 'TEXT',
  SIMPLE_EXPRESSION: 'SIMPLE_EXPRESSION',
  INTERPOLATION: 'INTERPOLATION',
  ATTRIBUTE: 'ATTRIBUTE',
  DIRECTIVE: 'DIRECTIVE',
};

const ElementTypes = {
  ELEMENT: 'ELEMENT',
  COMPONENT: 'COMPONENT',
};

function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
  };
}


/***/ }),

/***/ "./src/compiler/codegen.js":
/*!*********************************!*\
  !*** ./src/compiler/codegen.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "generate": () => (/* binding */ generate),
/* harmony export */   "traverseNode": () => (/* binding */ traverseNode)
/* harmony export */ });
/* harmony import */ var _ast__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ast */ "./src/compiler/ast.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");



function generate(ast) {
  const returns = traverseNode(ast);
  const code = `
with (ctx) {
    const { h, Text, Fragment, renderList, resolveComponent, withModel } = MiniVue
    return ${returns}
}`;
  return code;
}

function traverseNode(node, parent) {
  switch (node.type) {
    case _ast__WEBPACK_IMPORTED_MODULE_0__.NodeTypes.ROOT:
      if (node.children.length === 1) {
        return traverseNode(node.children[0], node);
      }
      const result = traverseChildren(node);
      return node.children.length > 1 ? `[${result}]` : result;
    case _ast__WEBPACK_IMPORTED_MODULE_0__.NodeTypes.ELEMENT:
      return resolveElementASTNode(node, parent);
    case _ast__WEBPACK_IMPORTED_MODULE_0__.NodeTypes.TEXT:
      return createTextVNode(node);
    case _ast__WEBPACK_IMPORTED_MODULE_0__.NodeTypes.INTERPOLATION:
      return createTextVNode(node.content);
  }
}

function traverseChildren(node) {
  const { children } = node;

  if (children.length === 1) {
    const child = children[0];
    if (child.type === _ast__WEBPACK_IMPORTED_MODULE_0__.NodeTypes.TEXT) {
      return createText(child);
    }
    if (child.type === _ast__WEBPACK_IMPORTED_MODULE_0__.NodeTypes.INTERPOLATION) {
      return createText(child.content);
    }
  }

  const results = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    results.push(traverseNode(child, node));
  }

  return results.join(', ');
}

// 这里parent是必然存在的
function resolveElementASTNode(node, parent) {
  const ifNode =
    pluck(node.directives, 'if') || pluck(node.directives, 'else-if');

  if (ifNode) {
    // 递归必须用resolveElementASTNode，因为一个元素可能有多个指令
    // 所以处理指令时，移除当下指令也是必须的
    const consequent = resolveElementASTNode(node, parent);
    let alternate;

    // 如果有ifNode，则需要看它的下一个元素节点是否有else-if或else
    const { children } = parent;
    let i = children.findIndex((child) => child === node) + 1;
    for (; i < children.length; i++) {
      const sibling = children[i];

      // <div v-if="ok"/> <p v-else-if="no"/> <span v-else/>
      // 为了处理上面的例子，需要将空节点删除
      // 也因此，才需要用上for循环
      if (sibling.type === _ast__WEBPACK_IMPORTED_MODULE_0__.NodeTypes.TEXT && !sibling.content.trim()) {
        children.splice(i, 1);
        i--;
        continue;
      }

      if (
        sibling.type === _ast__WEBPACK_IMPORTED_MODULE_0__.NodeTypes.ELEMENT &&
        (pluck(sibling.directives, 'else') ||
          // else-if 既是上一个条件语句的 alternate，又是新语句的 condition
          // 因此pluck时不删除指令，下一次循环时当作ifNode处理
          pluck(sibling.directives, 'else-if', false))
      ) {
        alternate = resolveElementASTNode(sibling, parent);
        children.splice(i, 1);
      }
      // 只用向前寻找一个相临的元素，因此for循环到这里可以立即退出
      break;
    }

    const { exp } = ifNode;
    return `${exp.content} ? ${consequent} : ${alternate || createTextVNode()}`;
  }

  const forNode = pluck(node.directives, 'for');
  if (forNode) {
    const { exp } = forNode;
    const [args, source] = exp.content.split(/\sin\s|\sof\s/);
    return `h(Fragment, null, renderList(${source.trim()}, ${args.trim()} => ${resolveElementASTNode(
      node
    )}))`;
  }

  return createElementVNode(node);
}

function createElementVNode(node) {
  const { children, directives } = node;

  const tag =
    node.tagType === _ast__WEBPACK_IMPORTED_MODULE_0__.ElementTypes.ELEMENT
      ? `"${node.tag}"`
      : `resolveComponent("${node.tag}")`;

  const propArr = createPropArr(node);
  let propStr = propArr.length ? `{ ${propArr.join(', ')} }` : 'null';

  const vModel = pluck(directives, 'model');
  if (vModel) {
    const getter = `() => ${createText(vModel.exp)}`;
    const setter = `value => ${createText(vModel.exp)} = value`;
    propStr = `withModel(${tag}, ${propStr}, ${getter}, ${setter})`;
  }

  if (!children.length) {
    if (propStr === 'null') {
      return `h(${tag})`;
    }
    return `h(${tag}, ${propStr})`;
  }

  let childrenStr = traverseChildren(node);
  if (children[0].type === _ast__WEBPACK_IMPORTED_MODULE_0__.NodeTypes.ELEMENT) {
    childrenStr = `[${childrenStr}]`;
  }
  return `h(${tag}, ${propStr}, ${childrenStr})`;
}

function createPropArr(node) {
  const { props, directives } = node;
  return [
    ...props.map((prop) => `${prop.name}: ${createText(prop.value)}`),
    ...directives.map((dir) => {
      const content = dir.arg?.content;
      switch (dir.name) {
        case 'bind':
          return `${content}: ${createText(dir.exp)}`;
        case 'on':
          const eventName = `on${(0,_utils__WEBPACK_IMPORTED_MODULE_1__.capitalize)(content)}`;
          let exp = dir.exp.content;

          // 以括号结尾，并且不含'=>'的情况，如 @click="foo()"
          // 当然，判断很不严谨，比如不支持 @click="i++"
          if (/\([^)]*?\)$/.test(exp) && !exp.includes('=>')) {
            exp = `$event => (${exp})`;
          }
          return `${eventName}: ${exp}`;
        case 'html':
          return `innerHTML: ${createText(dir.exp)}`;
        default:
          return `${dir.name}: ${createText(dir.exp)}`;
      }
    }),
  ];
}

// 可以不remove吗？不可以
function pluck(directives, name, remove = true) {
  const index = directives.findIndex((dir) => dir.name === name);
  const dir = directives[index];
  if (remove && index > -1) {
    directives.splice(index, 1);
  }
  return dir;
}

// node只接收text和simpleExpresstion
function createTextVNode(node) {
  const child = createText(node);
  return `h(Text, null, ${child})`;
}

function createText({ content = '', isStatic = true } = {}) {
  return isStatic ? JSON.stringify(content) : content;
}


/***/ }),

/***/ "./src/compiler/compile.js":
/*!*********************************!*\
  !*** ./src/compiler/compile.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "compile": () => (/* binding */ compile)
/* harmony export */ });
/* harmony import */ var _parse__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./parse */ "./src/compiler/parse.js");
/* harmony import */ var _codegen__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./codegen */ "./src/compiler/codegen.js");



function compile(template) {
  const ast = (0,_parse__WEBPACK_IMPORTED_MODULE_0__.parse)(template);
  return (0,_codegen__WEBPACK_IMPORTED_MODULE_1__.generate)(ast);
}


/***/ }),

/***/ "./src/compiler/index.js":
/*!*******************************!*\
  !*** ./src/compiler/index.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NodeTypes": () => (/* reexport safe */ _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes),
/* harmony export */   "compile": () => (/* reexport safe */ _compile__WEBPACK_IMPORTED_MODULE_2__.compile),
/* harmony export */   "isNativeTag": () => (/* binding */ isNativeTag),
/* harmony export */   "isVoidTag": () => (/* binding */ isVoidTag),
/* harmony export */   "parse": () => (/* reexport safe */ _parse__WEBPACK_IMPORTED_MODULE_0__.parse)
/* harmony export */ });
/* harmony import */ var _parse__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./parse */ "./src/compiler/parse.js");
/* harmony import */ var _ast__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ast */ "./src/compiler/ast.js");
/* harmony import */ var _compile__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./compile */ "./src/compiler/compile.js");
const HTML_TAGS =
  'html,body,base,head,link,meta,style,title,address,article,aside,footer,' +
  'header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,div,dd,dl,dt,figcaption,' +
  'figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,' +
  'data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,s,samp,small,span,strong,sub,sup,' +
  'time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,' +
  'canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,' +
  'th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,' +
  'option,output,progress,select,textarea,details,dialog,menu,' +
  'summary,template,blockquote,iframe,tfoot';

const VOID_TAGS =
  'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr';

function makeMap(str) {
  const map = str
    .split(',')
    .reduce((map, item) => ((map[item] = true), map), Object.create(null));
  return (val) => !!map[val];
}

const isVoidTag = makeMap(VOID_TAGS);
const isNativeTag = makeMap(HTML_TAGS);






/***/ }),

/***/ "./src/compiler/parse.js":
/*!*******************************!*\
  !*** ./src/compiler/parse.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "parse": () => (/* binding */ parse)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _ast__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ast */ "./src/compiler/ast.js");
/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./index */ "./src/compiler/index.js");




function parse(content) {
  const context = createParserContext(content);
  return (0,_ast__WEBPACK_IMPORTED_MODULE_1__.createRoot)(parseChildren(context));
}

function createParserContext(content) {
  return {
    options: {
      delimiters: ['{{', '}}'],
      isVoidTag: _index__WEBPACK_IMPORTED_MODULE_2__.isVoidTag,
      isNativeTag: _index__WEBPACK_IMPORTED_MODULE_2__.isNativeTag,
    },
    source: content,
  };
}

function parseChildren(context) {
  const nodes = [];

  while (!isEnd(context)) {
    const s = context.source;
    let node;
    if (s.startsWith(context.options.delimiters[0])) {
      // '{{'
      node = parseInterpolation(context);
    } else if (s[0] === '<') {
      node = parseElement(context);
    } else {
      node = parseText(context);
    }
    nodes.push(node);
  }

  let removedWhitespace = false;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.TEXT) {
      // 全是空白的节点
      if (!/[^\t\r\n\f ]/.test(node.content)) {
        const prev = nodes[i - 1];
        const next = nodes[i + 1];
        if (
          !prev ||
          !next ||
          (prev.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ELEMENT &&
            next.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ELEMENT &&
            /[\r\n]/.test(node.content))
        ) {
          removedWhitespace = true;
          nodes[i] = null;
        } else {
          // Otherwise, the whitespace is condensed into a single space
          node.content = ' ';
        }
      } else {
        node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ');
      }
    }
  }

  return removedWhitespace ? nodes.filter(Boolean) : nodes;
}

function isEnd(context) {
  const s = context.source;
  return s.startsWith('</') || !s;
}

function parseInterpolation(context) {
  const [open, close] = context.options.delimiters;

  advanceBy(context, open.length);
  const closeIndex = context.source.indexOf(close);

  const content = parseTextData(context, closeIndex).trim();
  advanceBy(context, close.length);

  return {
    type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.INTERPOLATION,
    content: {
      type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      content,
    },
  };
}

function advanceBy(context, numberOfCharacters) {
  const { source } = context;
  context.source = source.slice(numberOfCharacters);
}

// 没有trim
function parseTextData(context, length) {
  const rawText = context.source.slice(0, length);
  advanceBy(context, length);
  return rawText;
}

// 不支持文本节点中带有'<'符号
function parseText(context) {
  const endTokens = ['<', context.options.delimiters[0]];

  // 寻找text最近的endIndex。因为遇到'<'或'{{'都可能结束
  let endIndex = context.source.length;
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  return {
    type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.TEXT,
    content,
  };
}

function parseElement(context) {
  // Start tag.
  const element = parseTag(context);

  if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
    return element;
  }

  // Children.
  element.children = parseChildren(context);

  // End tag.
  parseTag(context);

  return element;
}

function parseTag(context) {
  // Tag open.
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  const tag = match[1];

  advanceBy(context, match[0].length);
  advanceSpaces(context);

  // Attributes.
  const { props, directives } = parseAttributes(context);

  // Tag close.
  const isSelfClosing = context.source.startsWith('/>');

  advanceBy(context, isSelfClosing ? 2 : 1);

  const tagType = isComponent(tag, context)
    ? _ast__WEBPACK_IMPORTED_MODULE_1__.ElementTypes.COMPONENT
    : _ast__WEBPACK_IMPORTED_MODULE_1__.ElementTypes.ELEMENT;

  return {
    type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ELEMENT,
    tag,
    tagType,
    props,
    directives,
    isSelfClosing,
    children: [],
  };
}

function isComponent(tag, context) {
  const { options } = context;
  return !options.isNativeTag(tag);
}

function advanceSpaces(context) {
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length);
  }
}

function parseAttributes(context) {
  const props = [];
  const directives = [];
  while (
    context.source.length &&
    !context.source.startsWith('>') &&
    !context.source.startsWith('/>')
  ) {
    const attr = parseAttribute(context);
    if (attr.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ATTRIBUTE) {
      props.push(attr);
    } else {
      directives.push(attr);
    }
  }
  return { props, directives };
}

function parseAttribute(context) {
  // Name.
  // name判断很宽除了下述几个字符外都支持
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  const name = match[0];

  advanceBy(context, name.length);
  advanceSpaces(context);

  // Value
  let value;
  if (context.source[0] === '=') {
    advanceBy(context, 1);
    advanceSpaces(context);
    value = parseAttributeValue(context);
    advanceSpaces(context);
  }

  // Directive
  if (/^(v-|:|@)/.test(name)) {
    let dirName, argContent;
    if (name[0] === ':') {
      dirName = 'bind';
      argContent = name.slice(1);
    } else if (name[0] === '@') {
      dirName = 'on';
      argContent = name.slice(1);
    } else if (name.startsWith('v-')) {
      [dirName, argContent] = name.slice(2).split(':');
    }

    return {
      type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
      },
      arg: argContent && {
        type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.SIMPLE_EXPRESSION,
        content: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.camelize)(argContent),
        isStatic: true,
      }
    };
  }

  // Attribute
  return {
    type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.TEXT,
      content: value.content,
    },
  };
}

function parseAttributeValue(context) {
  // 不考虑没有引号的情况
  const quote = context.source[0];
  advanceBy(context, 1);

  const endIndex = context.source.indexOf(quote);
  const content = parseTextData(context, endIndex);

  advanceBy(context, 1);

  return { content };
}


/***/ }),

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
/* harmony export */   "isRef": () => (/* reexport safe */ _ref_js__WEBPACK_IMPORTED_MODULE_2__.isRef),
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
  if (!(0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isObject)(target)) {
    return target;
  }

  // 解决对象的重复代理，仅第一次生效
  if (isReactive(target)) {
    // console.log('注意：对象被重复代理了哦~');
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
      // 调用收集依赖
      (0,_effect_js__WEBPACK_IMPORTED_MODULE_1__.track)(target, key);
      const res = Reflect.get(target, key, receiver);
      // 对深层对象做递归代理处理
      return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isObject)(res) ? reactive(res) : res;
    },
    // 代理对象属性的写入
    set(target, key, value, receiver) {
      const oldValue = target[key]; // 会触发依赖收集??
      const res = Reflect.set(target, key, value, receiver);

      // 判断对象的值是否变更
      if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(value, oldValue)) {
        // 触发依赖
        (0,_effect_js__WEBPACK_IMPORTED_MODULE_1__.trigger)(target, key);
        const oldLength = target.length;
        // 判断 target 是否为数组，需要做特殊处理
        if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isArray)(target) && target.length !== oldLength) {
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
/* harmony export */   "isRef": () => (/* binding */ isRef),
/* harmony export */   "ref": () => (/* binding */ ref)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./src/utils/index.js");
/* harmony import */ var _effect_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect.js */ "./src/reactivity/effect.js");
/* harmony import */ var _reactive_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reactive.js */ "./src/reactivity/reactive.js");




function ref(value) {
  if (isRef(value)) {
    return value;
  }

  return new RefImpl(value);
}

function isRef(value) {
  return !!(value && value.__isRef);
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

// 将复杂类型对象转为响应式对象，简单类型不做处理
function convert(value) {
  return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isObject)(value) ? (0,_reactive_js__WEBPACK_IMPORTED_MODULE_2__.reactive)(value) : value;
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
/* harmony import */ var _reactivity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reactivity */ "./src/reactivity/index.js");
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");
/* harmony import */ var _scheduler__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./scheduler */ "./src/runtime/scheduler.js");
/* harmony import */ var _compiler__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../compiler */ "./src/compiler/index.js");





function mountComponent(vnode, container, anchor, patch) {
  const { type: Component } = vnode;

  // createComponentInstance
  const instance = (vnode.component = {
    props: {},
    attrs: {},
    setupState: null,
    ctx: null,
    update: null,
    isMounted: false,
    subTree: null,
    next: null, // 组件更新时，把新vnode暂放在这里
  });

  // setupComponent
  updateProps(instance, vnode);

  // 源码：instance.setupState = proxyRefs(setupResult)
  instance.setupState = Component.setup?.(instance.props, {
    attrs: instance.attrs,
  });

  instance.ctx = {
    ...instance.props,
    ...instance.setupState,
  };

  if (!Component.render && Component.template) {
    let { template } = Component;
    if (template[0] === '#') {
      const el = document.querySelector(template);
      template = el ? el.innerHTML : '';
    }
    Component.render = new Function('ctx', (0,_compiler__WEBPACK_IMPORTED_MODULE_3__.compile)(template));
  }

  // 组件更新函数 ==> setupRenderEffect
  instance.update = (0,_reactivity__WEBPACK_IMPORTED_MODULE_0__.effect)(
    () => {
      if (!instance.isMounted) {
        // 挂载组件(接收组件产出的vnode)
        const subTree = (instance.subTree = (0,_vnode__WEBPACK_IMPORTED_MODULE_1__.normalizeVNode)(
          Component.render(instance.ctx)
        ));

        fallThrough(instance, subTree);

        patch(null, subTree, container, anchor);
        instance.isMounted = true;
        vnode.el = subTree.el;
      } else {
        // update

        // instance.next存在，代表是被动更新。否则是主动更新
        if (instance.next) {
          vnode = instance.next;
          instance.next = null;
          updateProps(instance, vnode);
          instance.ctx = {
            ...instance.props,
            ...instance.setupState,
          };
        }

        const prev = instance.subTree;
        const subTree = (instance.subTree = (0,_vnode__WEBPACK_IMPORTED_MODULE_1__.normalizeVNode)(
          Component.render(instance.ctx)
        ));

        fallThrough(instance, subTree);

        patch(prev, subTree, container, anchor);
        vnode.el = subTree.el;
      }
    },
    {
      scheduler: _scheduler__WEBPACK_IMPORTED_MODULE_2__.queueJob,
    }
  );
}

function updateProps(instance, vnode) {
  const { type: Component, props: vnodeProps } = vnode;
  const props = (instance.props = {});
  const attrs = (instance.attrs = {});
  for (const key in vnodeProps) {
    if (Component.props?.includes(key)) {
      props[key] = vnodeProps[key];
    } else {
      attrs[key] = vnodeProps[key];
    }
  }
  // toThink: props源码是shallowReactive，确实需要吗?
  // 需要。否则子组件修改props不会触发更新
  instance.props = (0,_reactivity__WEBPACK_IMPORTED_MODULE_0__.reactive)(instance.props);
}

function fallThrough(instance, subTree) {
  if (Object.keys(instance.attrs).length) {
    subTree.props = {
      ...subTree.props,
      ...instance.attrs,
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
/* harmony export */   "createApp": () => (/* binding */ createApp),
/* harmony export */   "resolveComponent": () => (/* binding */ resolveComponent)
/* harmony export */ });
/* harmony import */ var _render__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./render */ "./src/runtime/render.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");




let components;
function createApp(rootComponent) {
  components = rootComponent.components || {};
  const app = {
    mount(rootContainer) {
      if (typeof rootContainer === 'string') {
        rootContainer = document.querySelector(rootContainer);
      }

      if (!(0,_utils__WEBPACK_IMPORTED_MODULE_1__.isFunction)(rootComponent.render) && !rootComponent.template) {
        rootComponent.template = rootContainer.innerHTML;
      }
      rootContainer.innerHTML = '';

      (0,_render__WEBPACK_IMPORTED_MODULE_0__.render)((0,_vnode__WEBPACK_IMPORTED_MODULE_2__.h)(rootComponent), rootContainer);
    },
  };
  return app;
}

function resolveComponent(name) {
  return (
    components &&
    (components[name] ||
      components[(0,_utils__WEBPACK_IMPORTED_MODULE_1__.camelize)(name)] ||
      components[(0,_utils__WEBPACK_IMPORTED_MODULE_1__.capitalize)((0,_utils__WEBPACK_IMPORTED_MODULE_1__.camelize)(name))])
  );
}


/***/ }),

/***/ "./src/runtime/helpers/renderList.js":
/*!*******************************************!*\
  !*** ./src/runtime/helpers/renderList.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "renderList": () => (/* binding */ renderList)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils */ "./src/utils/index.js");


function renderList(source, renderItem) {
  const vnodes = [];
  if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isNumber)(source)) {
    for (let i = 0; i < source; i++) {
      vnodes.push(renderItem(i + 1, i));
    }
  } else if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isString)(source) || (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(source)) {
    for (let i = 0; i < source.length; i++) {
      vnodes.push(renderItem(source[i], i));
    }
  } else if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(source)) {
    const keys = Object.keys(source);
    keys.forEach((key, index) => {
      vnodes.push(renderItem(source[key], key, index));
    });
  }
  return vnodes;
}


/***/ }),

/***/ "./src/runtime/helpers/vModel.js":
/*!***************************************!*\
  !*** ./src/runtime/helpers/vModel.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "withModel": () => (/* binding */ withModel)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils */ "./src/utils/index.js");


function withModel(tag, props, getter, setter) {
  props = props || {};
  if (tag === 'input') {
    switch (props.type) {
      case 'radio':
        props.checked = getter() === props.value;
        props.onChange = (e) => setter(e.target.value);
        break;
      case 'checkbox':
        const modelValue = getter();
        if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(modelValue)) {
          props.checked = modelValue.includes(props.value);
          props.onChange = (e) => {
            const { value } = e.target;
            const values = new Set(getter());
            if (values.has(value)) {
              values.delete(value);
            } else {
              values.add(value);
            }
            props.checked = values.has(props.value);
            setter([...values]);
          };
        } else {
          props.checked = modelValue;
          props.onChange = (e) => {
            props.checked = e.target.checked;
            setter(e.target.checked);
          };
        }
        break;
      default:
        // 'input'
        props.value = getter();
        props.onInput = (e) => setter(e.target.value);
        break;
    }
  }
  return props;
}


/***/ }),

/***/ "./src/runtime/index.js":
/*!******************************!*\
  !*** ./src/runtime/index.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Fragment": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_0__.Fragment),
/* harmony export */   "Text": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_0__.Text),
/* harmony export */   "createApp": () => (/* reexport safe */ _createApp__WEBPACK_IMPORTED_MODULE_2__.createApp),
/* harmony export */   "h": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_0__.h),
/* harmony export */   "nextTick": () => (/* reexport safe */ _scheduler__WEBPACK_IMPORTED_MODULE_5__.nextTick),
/* harmony export */   "render": () => (/* reexport safe */ _render__WEBPACK_IMPORTED_MODULE_1__.render),
/* harmony export */   "renderList": () => (/* reexport safe */ _helpers_renderList__WEBPACK_IMPORTED_MODULE_3__.renderList),
/* harmony export */   "resolveComponent": () => (/* reexport safe */ _createApp__WEBPACK_IMPORTED_MODULE_2__.resolveComponent),
/* harmony export */   "withModel": () => (/* reexport safe */ _helpers_vModel__WEBPACK_IMPORTED_MODULE_4__.withModel)
/* harmony export */ });
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");
/* harmony import */ var _render__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./render */ "./src/runtime/render.js");
/* harmony import */ var _createApp__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./createApp */ "./src/runtime/createApp.js");
/* harmony import */ var _helpers_renderList__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./helpers/renderList */ "./src/runtime/helpers/renderList.js");
/* harmony import */ var _helpers_vModel__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./helpers/vModel */ "./src/runtime/helpers/vModel.js");
/* harmony import */ var _scheduler__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./scheduler */ "./src/runtime/scheduler.js");








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
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");
/* harmony import */ var _patchProps__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./patchProps */ "./src/runtime/patchProps.js");
/* harmony import */ var _component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./component */ "./src/runtime/component.js");




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
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.COMPONENT) {
    // 卸载组件节点
    unmountComponent(vnode);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.FRAGMENT) {
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

// n1可能为null，n2不可能为null
function patch(n1, n2, container, anchor) {
  if (n1 && !isSameVNodeType(n1, n2)) {
    // n1被卸载后，n2将会创建，因此anchor至关重要。需要将它设置为n1的下一个兄弟节点
    anchor = (n1.anchor || n1.el).nextSibling;
    unmount(n1);
    n1 = null;
  }

  const { shapeFlag } = n2;
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ELEMENT) {
    processElement(n1, n2, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT) {
    processText(n1, n2, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.FRAGMENT) {
    processFragment(n1, n2, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.COMPONENT) {
    processComponent(n1, n2, container, anchor);
  }
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type;
}

// 处理普通节点的对比和挂载
function processElement(n1, n2, container, anchor) {
  if (n1 == null) {
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

  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
    // 这里不能传anchor。因为anchor限制的是当前的element
    // 作为本element的children，不用指定anchor，append就行
    mountChildren(children, el);
  }

  if (props) {
    // 调用属性对比函数，赋值属性给节点（无需对比）
    (0,_patchProps__WEBPACK_IMPORTED_MODULE_1__.patchProps)(el, null, props);
  }

  vnode.el = el;
  container.insertBefore(el, anchor);
}

function mountChildren(children, container, anchor) {
  children.forEach((child) => {
    patch(null, child, container, anchor);
  });
}

function patchElement(n1, n2) {
  n2.el = n1.el;
  (0,_patchProps__WEBPACK_IMPORTED_MODULE_1__.patchProps)(n2.el, n1.props, n2.props);
  patchChildren(n1, n2, n2.el);
}

function patchChildren(n1, n2, container, anchor) {
  const { shapeFlag: prevShapeFlag, children: c1 } = n1;
  const { shapeFlag, children: c2 } = n2;

  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT_CHILDREN) {
    if (prevShapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(c1);
    }
    if (c2 !== c1) {
      container.textContent = c2;
    }
  } else {
    // c2 is array or null
    if (prevShapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
      // c1 was array
      if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
        // c2 is array
        // 简单认为头一个元素有key就都有key
        if (c1[0] && c1[0].key != null && c2[0] && c2[0].key != null) {
          patchKeyedChildren(c1, c2, container, anchor);
        } else {
          patchUnkeyedChildren(c1, c2, container, anchor);
        }
      } else {
        // c2 is null
        unmountChildren(c1);
      }
    } else {
      // c1 was text or null
      if (prevShapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT_CHILDREN) {
        container.textContent = '';
      }
      if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
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
  // 1.从左至右依次比对
  // key的判断可能要换成isSameVNodetype
  while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
    patch(c1[i], c2[i], container, anchor);
    i++;
  }

  // 2.从右至左依次比对
  while (i <= e1 && i <= e2 && c1[e1].key === c2[e2].key) {
    patch(c1[e1], c2[e2], container, anchor);
    e1--;
    e2--;
  }

  if (i > e1) {
    // 3.经过1、2直接将旧结点比对完，则剩下的新结点直接mount
    const nextPos = e2 + 1;
    const curAnchor = (c2[nextPos] && c2[nextPos].e1) || anchor;
    for (let j = i; j <= e2; j++) {
      patch(null, c2[j], container, curAnchor);
    }
  } else if (i > e2) {
    // 3.经过1、2直接将新结点比对完，则剩下的旧结点直接unmount
    for (let j = i; j <= e1; j++) {
      unmount(c1[j]);
    }
  } else {
    // 4.采用传统diff算法，但不真的添加和移动，只做标记和删除
    const map = new Map();
    for (let j = i; j <= e1; j++) {
      const prev = c1[j];
      map.set(prev.key, { prev, j });
    }
    // used to track whether any node has moved
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
          move = true;
        } else {
          maxNewIndexSoFar = j;
        }
        source[k] = j;
        map.delete(next.key);
      } else {
        // 将待新添加的节点放入toMounted
        toMounted.push(k + i);
      }
    }

    // 先刪除多余旧节点
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
    mountTextNode(n2, container, anchor);
  } else {
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
    (0,_component__WEBPACK_IMPORTED_MODULE_2__.mountComponent)(n2, container, anchor, patch);
  } else {
    updateComponent(n1, n2);
  }
}

function updateComponent(n1, n2) {
  n2.component = n1.component;
  n2.component.next = n2;
  n2.component.update();
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
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _reactivity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../reactivity */ "./src/reactivity/index.js");



const Text = Symbol('Text');
const Fragment = Symbol('Fragment');

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

/**
 * vnode有四种类型：dom元素，纯文本，Fragment，组件
 * @param {string | Text | Fragment | Object } type
 * @param {Object | null} props
 * @param {string | array | null} children
 * @returns VNode
 */
// 使用 render(h(rootComponent), rootContainer)
function h(type, props = null, children = null) {
  let shapeFlag = 0;
  if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isString)(type)) {
    shapeFlag = ShapeFlags.ELEMENT;
  } else if (type === Text) {
    shapeFlag = ShapeFlags.TEXT;
  } else if (type === Fragment) {
    shapeFlag = ShapeFlags.FRAGMENT;
  } else {
    shapeFlag = ShapeFlags.COMPONENT;
  }

  if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isString)(children) || (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isNumber)(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    children = children.toString();
  } else if (Array.isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  if (props) {
    // 其实是因为，vnode要求immutable，这里如果直接赋值的话是浅引用
    // 如果使用者复用了props的话，就不再immutable了，因此这里要复制一下。style同理
    // for reactive or proxy objects, we need to clone it to enable mutation.
    if ((0,_reactivity__WEBPACK_IMPORTED_MODULE_1__.isReactive)(props)) {
      props = Object.assign({}, props);
    }
    // reactive state objects need to be cloned since they are likely to be
    // mutated
    if ((0,_reactivity__WEBPACK_IMPORTED_MODULE_1__.isReactive)(props.style)) {
      props.style = Object.assign({}, props.style);
    }
  }

  return {
    type,
    props,
    children,
    shapeFlag,
    el: null,
    anchor: null, // fragment专有
    key: props && (props.key != null ? props.key : null),
    component: null, // 组件的instance
  };
}

// 处理节点嵌套（数组外嵌套占位节点）,方便函数能直接返回数组，字符串，数字
function normalizeVNode(result) {
  if (Array.isArray(result)) {
    return h(Fragment, null, result);
  }
  if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(result)) {
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
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MiniVue": () => (/* binding */ MiniVue)
/* harmony export */ });
/* harmony import */ var _compiler_compile_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./compiler/compile.js */ "./src/compiler/compile.js");
/* harmony import */ var _runtime_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./runtime/index.js */ "./src/runtime/index.js");
/* harmony import */ var _reactivity_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reactivity/index.js */ "./src/reactivity/index.js");




const MiniVue = (window.MiniVue = {
  createApp: _runtime_index_js__WEBPACK_IMPORTED_MODULE_1__.createApp,
  render: _runtime_index_js__WEBPACK_IMPORTED_MODULE_1__.render,
  h: _runtime_index_js__WEBPACK_IMPORTED_MODULE_1__.h,
  Text: _runtime_index_js__WEBPACK_IMPORTED_MODULE_1__.Text,
  Fragment: _runtime_index_js__WEBPACK_IMPORTED_MODULE_1__.Fragment,
  renderList: _runtime_index_js__WEBPACK_IMPORTED_MODULE_1__.renderList,
  resolveComponent: _runtime_index_js__WEBPACK_IMPORTED_MODULE_1__.resolveComponent,
  withModel: _runtime_index_js__WEBPACK_IMPORTED_MODULE_1__.withModel,
  nextTick: _runtime_index_js__WEBPACK_IMPORTED_MODULE_1__.nextTick,
  reactive: _reactivity_index_js__WEBPACK_IMPORTED_MODULE_2__.reactive,
  ref: _reactivity_index_js__WEBPACK_IMPORTED_MODULE_2__.ref,
  computed: _reactivity_index_js__WEBPACK_IMPORTED_MODULE_2__.computed,
  effect: _reactivity_index_js__WEBPACK_IMPORTED_MODULE_2__.effect,
  compile: _compiler_compile_js__WEBPACK_IMPORTED_MODULE_0__.compile,
});

})();

/******/ })()
;