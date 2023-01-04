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
    // 标识计算属性值是否缓存
    this._dirty = true;
    // 对getter函数 使用到的属性进行依赖收集 activeEffect会变为 getter
    this.effect = effect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        trigger(this, 'value');
      }
    });
  }

  get value() {
    console.log('yyy this._dirty: ', this._dirty);
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect();
      // 收集依赖
      track(this, 'value');
    }
    return this._value;
  }

  set value(newValue) {
    this._setter(newValue);
  }
}
