# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## react源码调试环境
参考1：https://gitee.com/machinist_wq/react-source-code/tree/master
参考2：https://www.alchemistmeta.com/react-source-dev
参考3：https://juejin.cn/post/7030673003583111176


## React技术揭秘
参考1：https://react.iamkasong.com/

## mini-react
参考1：https://github.com/zh-lx/mini-react
参考2：https://github.com/bubucuo/mini-react

## big-react
参考1：https://github.com/BetaSu/big-react

## React18源码
参考0：https://github.com/neroneroffy/react-source-code-debug
参考1：https://juejin.cn/post/7080854114141208612
参考2：https://juejin.cn/post/7094037148088664078
参考3：https://github.com/bubucuo/react18-ice/blob/master/%E6%8F%90%E5%89%8D%E6%8E%8C%E6%8F%A1React%2018%20.md

## 代数效应
参考： https://overreacted.io/zh-hans/algebraic-effects-for-the-rest-of-us/

## reat 源码分层
- 第一层：掌握术语、基本实现思路
    - 参考：https://pomb.us/build-your-own-react/

- 第二层：掌握整体工作流程、局部细节 
    - schedule 调度(scheduler) ==> 消息队列
    - render 协调  (reconciler)  ==> 操作fiber
    - commit 渲染 （renderer）==> reactDom、reactNative、ReactArt
    - 学习理念、架构、实现 https://react.iamkasong.com/
    - 深刻感受到 function 与 class 的区别

- 第三层：掌握关键流程的细节(探索前端边界)
    - diff 算法
    - hook
    - lane 模型 二进制 掩码
    - fiber  dfs（深度遍历）
    - scheduler ==> 消息队列 用到小顶堆
    - 探索、IM应用、可视化、框架、工具

- 第四层：掌握思想
    - clasComponent --> 面向对象  FunctionComponent --> 函数式
    - 函数式编程 --> hooks 实现了代数效应  react是践行代数效应

- 第五层: 神级大佬
    - https://zh-hans.reactjs.org/community/team.html

## react技术揭秘
- 参考：https://react.iamkasong.com/
    - update 数据结构：环状单向链表
    - Hook 数据结构：无环的单向链表
    - 每个 useState 对应一个 hook 对象，而没有 hook 对象中的更新可以为多个。
## 调试 react
- 参考：https://github.com/neroneroffy/react-source-code-debug
#### react-reconciler包的主要作用
- 将主要功能分为 4 个方面:
    - 输入：暴露api函数（如：scheduleUpdateOnFiber）、供给其他包（如react包）调用
    - 注册调度任务：与调度中心（scheduler包）交互，注册调度任务task，等待任务的调用
    - 执行任务回调：在内存中构造出fiber树，同时与渲染器交互，在内存中创建出与fiber对应的DOM节点
    - 输出：与渲染器（react-dom）交互，渲染dom节点

