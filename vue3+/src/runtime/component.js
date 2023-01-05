import { reactive, effect } from '../reactivity/index.js';
import { normalizeVNode } from './vnode.js';
import { queueJob } from './scheduler.js';
import { compile } from '../compiler/index.js';

export function mountComponent(vnode, container, anchor, patch) {
  const { type: Component } = vnode;
  const instance = (vnode.component = {
    props: {},
    attrs: {},
    setupState: null,
    ctx: null,
    update: null,
    isMounted: false,
    subTree: null,
    next: null, // 组件更新时，把新vnode暂放在这里
  });

  updateProps(instance, vnode);

  instance.setupState = Component.setup?.(instance.props, {
    attrs: instance.attrs,
  });

  instance.ctx = {
    ...instance.props,
    ...instance.setupState,
  };

  if (!Component.render && Component.template) {
    let { template } = Component;
    if (template[0] === '#') {
      const el = document.querySelector(template);
      template = el ? el.innerHTML : '';
    }
    Component.render = new Function('ctx', compile(template));
  }

  // 组件更新函数 ==> setupRenderEffect
  instance.update = effect(
    () => {
      if (!instance.isMounted) {
        // 挂载组件(接收组件产出的vnode)
        const subTree = (instance.subTree = normalizeVNode(
          Component.render(instance.ctx)
        ));

        fallThrough(instance, subTree);

        patch(null, subTree, container, anchor);
        instance.isMounted = true;
        vnode = subTree.el;
      } else {
        // 更新组件
        if (instance.next) {
          vnode = instance.next; // 新组件（储存的n2）
          instance.next = null;
          updateProps(instance, vnode);
          instance.ctx = {
            ...instance.props,
            ...instance.setupState,
          };
        }

        const prev = instance.subTree;
        const subTree = (instance.subTree = normalizeVNode(
          Component.render(instance.ctx)
        ));
        fallThrough(instance, subTree);

        patch(prev, subTree.container, anchor);
        vnode.el = subTree.el;
      }
    },
    {
      scheduler: queueJob,
    }
  );
}

function updateProps(instance, vnode) {
  const { type: Commonent, props: vnodeProps } = vnode;
  const props = (instance.props = {});
  const attrs = (instance.attrs = {});

  // 用虚拟节点的属性赋值给组件实例
  for (const key in vnodeProps) {
    if (Commonent.props?.includes(key)) {
      props[key] = vnodeProps[key];
    } else {
      attrs[key] = vnodeProps[key];
    }
  }

  // toThink: props源码是shallowReactive，确实需要吗?
  // 需要。否则子组件修改props不会触发更新
  // 将组件的 props 变为响应式对象
  instance.props = reactive(instance.props);
}

function fallThrough(instance, subTree) {
  if (Object.keys(instance.attrs).length) {
    subTree.props = {
      ...subTree.props,
      ...subTree.attrs,
    };
  }
}
