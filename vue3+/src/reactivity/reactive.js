import { hasChanged, isArray, isObject } from '../utils/index.js';
import { track, trigger } from './effect.js';

/* 声明代理响应式对象(也就是说 proxy 仅对响应式对象进行代理) */
const proxyMap = new WeakMap();

export function reactive(target) {
  if (!isObject(target)) {
    return target;
  }

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
      // 调用收集依赖
      track(target, key);
      const res = Reflect.get(target, key, receiver);
      // 对深层对象做递归代理处理
      return isObject(res) ? reactive(res) : res;
    },
    // 代理对象属性的写入
    set(target, key, value, receiver) {
      const oldValue = target[key]; // 会触发依赖收集??
      const res = Reflect.set(target, key, value, receiver);

      // 判断对象的值是否变更
      if (hasChanged(value, oldValue)) {
        // 触发依赖
        trigger(target, key);
        const oldLength = target.length;
        // 判断 target 是否为数组，需要做特殊处理
        if (isArray(target) && target.length !== oldLength) {
          // 触发数组长度相关的副作用函数
          trigger(target, 'length');
        }
      }
      return res;
    },
  });

  proxyMap.set(target, proxy);
  return proxy;
}

/* 判断对象是否是响应式对象 */
export function isReactive(target) {
  return !!(target && target.__isReactive);
}
