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