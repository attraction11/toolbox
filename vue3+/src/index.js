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
// import { ref, computed } from './reactivity/index.js';
// const num = (window.num = ref(0));
// window.d = computed({
//   get() {
//     console.log('calculate num.value * 2');
//     return num.value * 2;
//   },
//   set(newVal) {
//     console.log('update num.value');
//     num.value = newVal;
//   },
// });

// console.log(window.d.value);

/***************************运行时模块(runtime)***************************/
// import { render, h, Text, Fragment } from "./runtime/index.js";

// const vnode = h(
//     'div',
//     {
//         class: 'a b',
//         style: {
//             border: '1px solid',
//             fontSize: '14px',
//         },
//         onClick: () => console.log('click'),
//         id: 'foo',
//         checked: '',
//         custom: false
//     },
//     [h('ul', null, [
//         h('li', { style: { color: 'red' } }, 1),
//         h('li', null, 2),
//         h('li', { style: { color: 'blue' } }, 3),
//         h(Fragment, null, [h('li', null, '4'), h('li')]),
//         h('li', null, [h(Text, null, 'hello world')])
//     ])]
// )

// console.log('xx')
// render(vnode, document.body)

/***************************执行调度（scheduler）***************************/
import { ref } from './reactivity/ref.js';
import { h, createApp } from './runtime/index.js';
import { nextTick } from './runtime/scheduler.js';

createApp({
  setup() {
    const count = ref(0);
    const add = () => {
      count.value++;
      count.value++;
      count.value++;
    };
    return {
      count,
      add,
    };
  },
  render(ctx) {
    console.log('render');
    return [
      h('div', { id: 'div' }, `count: ${ctx.count.value}`),
      h(
        'button',
        {
          id: 'btn',
          onClick: ctx.add,
        },
        'add'
      ),
    ];
  },
}).mount(document.body);

const div = document.getElementById('div');
const btn = document.getElementById('btn');
console.log('init num', div.innerHTML);

btn.click();
console.log('click num', div.innerHTML);

setTimeout(() => {
  // 异步宏任务
  console.log('async click num', div.innerHTML);
}, 0);

nextTick(() => {
  // 异步微任务
  console.log('nextTick click num', div.innerHTML);
});
