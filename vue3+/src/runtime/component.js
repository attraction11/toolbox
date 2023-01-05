import { reactive, effect } from '../reactivity/index.js';
import { queueJob } from './scheduler.js';
import { normalizeVNode } from './vnode.js';

export function mountComponent(vnode, container, anchor, patch) {
  const { type: Component } = vnode;
  const instance = (vnode.component = {
    props: null,
    attrs: null,
    setupState: null,
    ctx: null,
    mount: null,
    update: null,
    subTree: null,
    isMounted: false,
    next: null, // 储存n2
  });

  updateProps(instance, vnode);

  instance.setupState = Component.setup?.(instance.props, {
    attrs: instance.attrs,
  });

  instance.ctx = {
    ...instance.props,
    ...instance.setupState,
  };

  // 组件更新函数
  instance.update = effect(
    () => {
      if (!instance.isMounted) {
        // 挂载组件(接收组件产出的vnode)
        const subTree = (instance.subTree = normalizeVNode(
          Component.render(instance.ctx)
        ));

        fallThrough(instance, subTree);

        patch(null, subTree, container, anchor);
        vnode = subTree.el;
        instance.isMounted = true;
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
        vnode = subTree.el;
      }
    },
    {
      scheduler: queueJob,
    }
  );
}

function updateProps(instance, vnode) {
  const { type: commonent, props: vnodeProps } = vnode;
  const props = (instance.props = {});
  const attrs = (instance.attrs = {});

  // 用虚拟节点的属性赋值给组件实例
  for (const key in vnodeProps) {
    if (commonent.props?.includes(key)) {
      props[key] = vnodeProps[key];
    } else {
      attrs[key] = vnodeProps[key];
    }
  }

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
