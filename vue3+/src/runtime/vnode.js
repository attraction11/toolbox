import { isArray, isNumber, isObject, isString } from '../utils/index.js';

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

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');

// 使用 render(h(rootComponent), rootContainer)
export function h(type, props, children) {
  let shapeFlag = 0;
  // 判断根节点的类型
  if (isString(type)) {
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
  if (isString(children) || isNumber(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    children = children.toString();
  } else if (isArray(children)) {
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

// 处理节点嵌套（数组外嵌套占位节点）
export function normalizeVNode(result) {
  if (isArray(result)) {
    return h(Fragment, null, result);
  }

  if (isObject(result)) {
    return result;
  }

  return h(Text, null, result.toString());
}
