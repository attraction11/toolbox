import { ShapeFlags } from './vnode.js';
import { patchProps } from './patchProps.js';
import { mountComponent } from './component.js';

export function render(vnode, container) {
  // 获取旧的虚拟 dom 节点（_vnode 属性用于储存旧的虚拟节点）
  const prevVNode = container._vnode;
  if (!vnode) {
    if (prevVNode) {
      // 新虚拟节点不存在，旧虚拟节点存在，卸载旧虚拟节点
      unmount(prevVNode);
    }
  } else {
    // 新虚拟节点存在(旧节点不一定存在)，进行对比
    patch(prevVNode, vnode, container);
  }

  // 将当前虚拟节点保存在父级节点上
  container._vnode = vnode;
}

function unmount(vnode) {
  const { shapeFlag, el } = vnode;
  // 逻辑与运算，判断当前节点类型是否为指定类型
  if (shapeFlag & ShapeFlags.COMPONENT) {
    // 卸载组件节点
    unmountComponent(vnode);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    // 卸载占位符节点
    unmountFragment(vnode);
  } else {
    // 卸载普通节点
    el.parentNode.removeChild(el);
  }
}

function unmountComponent(vnode) {
  const { component } = vnode;
  // 递归卸载组件节点的子组件
  unmount(component.subTree);
}

function unmountFragment(vnode) {
  // eslint-disable-next-line prefer-const
  let { el: cur, anchor: end } = vnode;
  while (cur !== end) {
    const next = cur.nextSibling;
    // 获取当前节点的父级节点，从父级中移除占位符
    cur.parentNode.removeChild(cur);
    cur = next;
  }
  end.parentNode.removeChild(end);
}

// n1为旧虚拟节点，n2为新虚拟节点，container为父级容器，anchor为标识以哪个节点为参照物
function patch(n1, n2, container, anchor) {
  if (n1 && !isSameVNodeType(n1, n2)) {
    // 新旧节点为不同类型的节点
    // 注意：n1被卸载后，n2将会被创建，因此anchor至关重要，需要将它设置为n1的洗一个兄弟节点
    anchor = (n1.anchor || n1.el).nextSibling;
    unmount(n1);
    n1 = null;
  }

  const { shapeFlag } = n2;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    // 新节点为普通节点
    processElement(n1, n2, container, anchor);
  } else if (shapeFlag & ShapeFlags.TEXT) {
    processText(n1, n2, container, anchor);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    processFragment(n1, n2, container, anchor);
  } else if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponent(n1, n2, container, anchor);
  }
}

function isSameVNodeType(n1, n2) {
  return n1.type === n2.type;
  //   return n1.type === n2.type && n1.key === n2.key;
}

// 处理普通节点的对比和挂载
function processElement(n1, n2, container, anchor) {
  if (n1 === null) {
    // 旧虚拟节点不存在的情况，挂载新节点
    mountElement(n2, container, anchor);
  } else {
    // 旧新节点都存在，对比属性和子节点
    patchElement(n1, n2);
  }
}

// 挂载普通节点到容器 container 上
function mountElement(vnode, container, anchor) {
  const { type, props, shapeFlag, children } = vnode;
  const el = document.createElement(type);

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // 子节点为文本节点时，赋值给 el
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // 这里不能传anchor。因为anchor限制的是当前的element ??
    // 作为本element的children，不用指定anchor，append就行 ??
    mountChildren(children, el);
  }

  if (props) {
    // 调用属性对比函数，赋值属性给节点（无需对比）
    patchProps(el, null, props);
  }

  // 将当前真实节点保存到虚拟节点的属性上
  vnode.el = el;
  container.insertBefore(el, anchor);
}

function mountChildren(children, container, anchor) {
  // 遍历挂载新节点的子节点到 container 上
  children.forEach((child) => {
    patch(null, child, container, anchor);
  });
}

function patchElement(n1, n2) {
  n2.el = n1.el;
  patchProps(n2.el, n1.props, n2.props);
  patchChildren(n1, n2, n2.el);
}

// 对比新旧节点的差异
function patchChildren(n1, n2, container, anchor) {
  const { shapeFlag: prevShapeFlag, children: c1 } = n1;
  const { shapeFlag, children: c2 } = n2;

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // 新节点为文本节点，旧节点为含子节点的数组
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 遍历移除子节点
      unmountChildren(c1);
    }
    if (c2 !== c1) {
      // 采用新节点文本内容覆盖旧文本
      container.textContent = c2;
    }
  } else {
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新旧节点都有子节点（简单认为头一个元素有key就都有key）最核心的对比
        if (c1[0] && c1[0].key != null && c2[0] && c2[0].key != null) {
          // 有key的diff算法
          patchKeyedChildren(c1, c2, container, anchor);
        } else {
          // 无key的diff算法
          patchUnkeyedChildren(c1, c2, container, anchor);
        }
      } else {
        // 新节点不存在
        unmountChildren(c1);
      }
    } else {
      // 旧节点没有子节点。旧节点为文本节点
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        container.textContent = '';
      }
      // 新节点有子节点
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(c2, container, anchor);
      }
    }
  }
}

function unmountChildren(children) {
  children.forEach((child) => unmount(child));
}

function patchKeyedChildren(c1, c2, container, anchor) {
  let i = 0,
    e1 = c1.length - 1,
    e2 = c2.length - 1;

  // 1、从左至右依次对比（key 的判断采用 isSameVNodeType）
  // (a b) c
  // (a b) d e
  while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
    patch(c1[i], c2[i], container, anchor);
    i++;
  }

  // 2、从右至左依次对比
  // a (b c)
  // d e (b c)
  while ((i <= e1) & (i <= e2) & (c1[e1].key === c2[e2].key)) {
    patch(c1[e1], c2[e2], container, anchor);
    e1--;
    e2--;
  }

  // 情况描述：
  // (a b)
  // (a b) c
  // i = 2, e1 = 1, e2 = 2
  // (a b)
  // c (a b)
  // i = 0, e1 = -1, e2 = 0
  if (i > e1) {
    // 3.1、经过1、2直接将旧节点对比完了，则剩余的新节点直接 挂载（mount）
    const nextPos = e2 + 1;
    const curAnchor = (c2[nextPos] && c2[nextPos].e1) || anchor;
    for (let j = i; j <= e2; j++) {
      patch(null, c2[j], container, curAnchor);
    }
  }
  // 情况描述：
  // (a b) c
  // (a b)
  // i = 2, e1 = 2, e2 = 1
  // a (b c)
  // (b c)
  // i = 0, e1 = 0, e2 = -1
  else if (i > e2) {
    // 3.2、经过1、2直接将新节点对比完了，则剩余的旧节点直接 卸载（unmount）
    for (let j = i; j <= e1; j++) {
      unmount(c1[j]);
    }
  } else {
    // 4、采用传统的diff算法，但不真的添加和移动，只做标记和删除
    const map = new Map();
    for (let j = i; j <= e1; j++) {
      const prev = c1[j];
      map.set(prev.key, { prev, j });
    }

    // 用来跟踪任何节点是否有被移动
    // 设置一个变量 `maxNewIndexSoFar`，记录当前的 `next` 在 `c1` 中找到的 `index` 的最大值。
    let maxNewIndexSoFar = 0;
    let move = false;
    const toMounted = [];
    const source = new Array(e2 - i + 1).fill(-1);
    for (let k = 0; k < e2 - i + 1; k++) {
      const next = c2[k + i];
      if (map.has(next.key)) {
        const { prev, j } = map.get(next.key);
        patch(prev, next, container, anchor);
        if (j < maxNewIndexSoFar) {
          /* 
            若 `index` 小于 `maxNewIndexSoFar`，说明需要移动。它应该移动到上一个 `next` 之后。
            因此 `anchor` 设置为 `c2[i-1].el.nextSibling`。
          */
          move = true;
        } else {
          /* 
            若新找到的 `index` 大于等于 `maxNewIndexSoFar`，说明 `index` 呈升序，
            不需要移动，并更新 `maxNewIndexSoFar` 为 `index`（增大）。 
          */
          maxNewIndexSoFar = j;
        }
        source[k] = j;
        // 记录需要删除的 key
        map.delete(next.key);
      } else {
        /* 
          再考虑没 `c1` 中没有找到相同 `key` 的情况，将待新添加的节点放入toMounted
         */
        toMounted.push(k + i);
      }
    }

    map.forEach(({ prev }) => {
      unmount(prev);
    });

    if (move) {
      // 5.需要移动，则采用新的最长上升子序列算法
      const seq = getSequence(source);
      let j = seq.length - 1;
      for (let k = source.length - 1; k >= 0; k--) {
        if (k === seq[j]) {
          // 不用移动
          j--;
        } else {
          const pos = k + i;
          const nextPos = pos + 1;
          const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor;
          if (source[k] === -1) {
            // mount
            patch(null, c2[pos], container, curAnchor);
          } else {
            // 移动
            container.insertBefore(c2[pos].el, curAnchor);
          }
        }
      }
    } else if (toMounted.length) {
      // 6.不需要移动，但还有未添加的元素
      for (let k = toMounted.length - 1; k >= 0; k--) {
        const pos = toMounted[k];
        const nextPos = pos + 1;
        const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor;
        patch(null, c2[pos], container, curAnchor);
      }
    }
  }
}

function patchUnkeyedChildren(c1, c2, container, anchor) {
  const oldLength = c1.length;
  const newLength = c2.length;
  const commonLength = Math.min(oldLength, newLength);
  for (let i = 0; i < commonLength; i++) {
    patch(c1[i], c2[i], container, anchor);
  }
  if (newLength > oldLength) {
    mountChildren(c2.slice(commonLength), container, anchor);
  } else if (newLength < oldLength) {
    unmountChildren(c1.slice(commonLength));
  }
}

function getSequence(nums) {
  const result = [];
  const position = [];
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === -1) {
      continue;
    }
    // result[result.length - 1]可能为undefined，此时nums[i] > undefined为false
    if (nums[i] > result[result.length - 1]) {
      result.push(nums[i]);
      position.push(result.length - 1);
    } else {
      let l = 0,
        r = result.length - 1;
      while (l <= r) {
        const mid = ~~((l + r) / 2);
        if (nums[i] > result[mid]) {
          l = mid + 1;
        } else if (nums[i] < result[mid]) {
          r = mid - 1;
        } else {
          l = mid;
          break;
        }
      }
      result[l] = nums[i];
      position.push(l);
    }
  }
  let cur = result.length - 1;
  // 这里复用了result，它本身已经没用了
  for (let i = position.length - 1; i >= 0 && cur >= 0; i--) {
    if (position[i] === cur) {
      result[cur--] = i;
    }
  }
  return result;
}

function processText(n1, n2, container, anchor) {
  if (n1 == null) {
    // 旧文本节点不存在，挂载新文本节点
    mountTextNode(n2, container, anchor);
  } else {
    // 旧文本节点存在,用新文本覆盖旧文本节点的 textContent 属性
    n2.el = n1.el;
    n2.el.textContent = n2.children;
  }
}

function mountTextNode(vnode, container, anchor) {
  const textNode = document.createTextNode(vnode.children);
  vnode.el = textNode;
  container.insertBefore(textNode, anchor);
}

// anchor 是 Fragment 的专有属性
function processFragment(n1, n2, container, anchor) {
  const fragmentStartAnchor = (n2.el = n1
    ? n1.el
    : document.createTextNode(''));
  const fragmentEndAnchor = (n2.anchor = n1
    ? n1.anchor
    : document.createTextNode(''));

  if (n1 == null) {
    container.insertBefore(fragmentStartAnchor, anchor);
    container.insertBefore(fragmentEndAnchor, anchor);
    mountChildren(n2.children, container, fragmentEndAnchor);
  } else {
    patchChildren(n1, n2, container, fragmentEndAnchor);
  }
}

function processComponent(n1, n2, container, anchor) {
  if (n1 == null) {
    mountComponent(n2, container, anchor, patch);
  } else {
    updateComponent(n1, n2);
  }
}

function updateComponent(n1, n2) {
  n2.component = n1.component;
  n2.commonent.next = n2;
  n2.commonent.update();
}
