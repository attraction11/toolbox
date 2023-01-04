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
import { ref, computed } from './reactivity/index.js';
const num = (window.num = ref(0));
window.d = computed({
  get() {
    console.log('calculate num.value * 2');
    return num.value * 2;
  },
  set(newVal) {
    console.log('update num.value');
    num.value = newVal;
  },
});

console.log(window.d.value);
