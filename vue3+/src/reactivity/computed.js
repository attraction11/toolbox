import { isFunction } from '../utils/index.js';
import { effect, track, trigger } from './effect.js';

export function computed(getterOrOption) {
  let getter, setter;
  if (isFunction(getterOrOption)) {
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
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true;
          trigger(this, 'value');
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
      track(this, 'value');
    }
    return this._value;
  }

  set value(newValue) {
    this._setter(newValue);
  }
}
