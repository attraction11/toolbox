import { hasChanged, isObject } from '../utils/index.js';
import { track, trigger } from './effect.js';
import { reactive } from './reactive.js';

function isRef(value) {
  return !!(value && value.__isRef);
}

export function ref(value) {
  if (isRef(value)) {
    return value;
  }

  return new RefClass(value);
}

// 将复杂类型对象转为响应式对象，简单类型不做处理
function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

/* 实现 ref 类 */
class RefClass {
  constructor(value) {
    this.__isRef = true;
    this._value = convert(value);
  }

  get value() {
    // 收集依赖（key为value）
    track(this, 'value');
    return this._value;
  }

  set value(newValue) {
    if (hasChanged(newValue, this._value)) {
      this._value = convert(newValue);
      trigger(this, 'value');
    }
  }
}
