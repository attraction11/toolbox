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
}

function updateProps(instance, vnode) {}
