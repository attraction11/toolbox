// 作用：记录当前在执行的副作用函数（同时建立依赖收集和副作用函数间的联系，妙啊~）
let activeEffect;
// 采用effect调用栈，解决effect的嵌套问题
// const obj = { x: 1 }; reactive(reactive(obj));
const effectStack = [];

/* 执行并记录当前副作用函数 */
export function effect(fn, options = {}) {
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
export function track(target, key) {
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
export function trigger(target, key) {
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
