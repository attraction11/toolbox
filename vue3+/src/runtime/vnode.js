import { isArray, isNumber, isObject, isString } from '../utils/index.js';
import { isReactive } from '../reactivity/index.js';

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');

// 用于标识不同的节点类型
export const ShapeFlags = {
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
export function h(type, props = null, children = null) {
  let shapeFlag = 0;
  // 判断根节点的类型
  if (isString(type)) {
    // 普通标签节点 如：<div>xx</div>
    shapeFlag = ShapeFlags.ELEMENT;
  } else if (type === Text) {
    shapeFlag = ShapeFlags.TEXT;
  } else if (type === Fragment) {
    // 占位符节点<></>
    shapeFlag = ShapeFlags.FRAGMENT;
  } else {
    shapeFlag = ShapeFlags.COMPONENT;
  }

  // 采用 |= 合并节点的类型和子节点类型
  if (isString(children) || isNumber(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    children = children.toString();
  } else if (isArray(children)) {
    shapeFlag = ShapeFlags.ARRAY_CHILDREN;
  }

  if (props) {
    // 其实是因为，vnode要求immutable，这里如果直接赋值的话是浅引用
    // 如果使用者复用了props的话，就不再immutable了，因此这里要复制一下。style同理
    // for reactive or proxy objects, we need to clone it to enable mutation.
    if (isReactive(props)) {
      props = Object.assign({}, props);
    }
    // reactive state objects need to be cloned since they are likely to be
    // mutated
    if (isReactive(props.style)) {
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
export function normalizeVNode(result) {
  if (isArray(result)) {
    return h(Fragment, null, result);
  }

  if (isObject(result)) {
    return result;
  }

  return h(Text, null, result.toString());
}
