import { Key, Props, ReactElement, Ref } from 'shared/ReactTypes';
import { Flags, NoFlags } from './fiberFlags';
import { Effect } from './fiberHooks';
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes';
import { Container } from 'hostConfig';
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	WorkTag
} from './workTags';
import { CallbackNode } from 'scheduler';

export class FiberNode {
	pendingProps: Props;
	memoizedProps: Props | null;
	key: Key;
	stateNode: any;
	type: any;
	ref: Ref;
	tag: WorkTag;
	flags: Flags;
	subtreeFlags: Flags;
	deletions: FiberNode[] | null;

	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;

	updateQueue: unknown;
	memoizedState: any;

	alternate: FiberNode | null;

	lanes: Lanes;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// 实例
		this.tag = tag;
		this.key = key || null;
		this.stateNode = null;
		this.type = null;

		// 树结构
		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;

		this.ref = null;

		// 状态
		this.pendingProps = pendingProps; // 从`ReactElement`对象传入的 props. 用于和`fiber.memoizedProps`比较可以得出属性是否变动
		this.memoizedProps = null; // 上一次生成子节点时用到的属性, 生成子节点之后保持在内存中
		this.updateQueue = null; // 存储state更新的队列, 当前节点的state改动之后, 都会创建一个update对象添加到这个队列中
		this.memoizedState = null; // 用于输出的state, 最终渲染所使用的state

		// 副作用
		this.flags = NoFlags; // 标志位(在ReactFiberFlags.js中定义了所有的标志位),reconciler阶段会将所有拥有flags标记的节点添加到副作用链表中, 等待 commit 阶段的处理.
		this.subtreeFlags = NoFlags; //替代16.x版本中的 firstEffect, nextEffect. 当设置了 enableNewReconciler=true 才会启用
		this.deletions = null; // 存储将要被删除的子节点. 当设置了 enableNewReconciler=true 才会启用

		// 调度
		this.lanes = NoLane; // 本fiber节点的优先级
		// this.childLanes = NoLanes; // 子节点的优先级

		this.alternate = null; // 指向内存中的另一个fiber, 每个被更新过fiber节点在内存中都是成对出现(current和workInProgress)
	}
}

export interface PendingPassiveEffects {
	unmount: Effect[];
	update: Effect[];
}

export class FiberRootNode {
	container: Container;
	current: FiberNode;
	finishedWork: FiberNode | null;
	pendingLanes: Lanes;
	finishedLanes: Lanes;
	callbackNode: CallbackNode | null;
	callbackPriority: Lane;
	pendingPassiveEffects: PendingPassiveEffects;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
		// 保存未执行的effect
		this.pendingPassiveEffects = {
			// 属于卸载组件的
			unmount: [],
			// 属于更新组件的
			update: []
		};

		// 所有未执行的lane的集合
		this.pendingLanes = NoLanes;
		// 本轮更新执行的lanes
		this.finishedLanes = NoLane;

		// 调度的回调函数
		this.callbackNode = null;
		// 调度的回调函数优先级
		this.callbackPriority = NoLane;
	}
}

export function createFiberFromElement(
	element: ReactElement,
	lanes: Lanes
): FiberNode {
	const { type, key, props } = element;
	let fiberTag: WorkTag = FunctionComponent;

	if (typeof type === 'string') {
		fiberTag = HostComponent;
	} else if (typeof type !== 'function') {
		console.error('未定义的type类型', element);
	}
	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	fiber.lanes = lanes;

	return fiber;
}

export function createFiberFromFragment(
	elements: ReactElement[],
	lanes: Lanes,
	key: Key
): FiberNode {
	const fiber = new FiberNode(Fragment, elements, key);
	fiber.lanes = lanes;
	return fiber;
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate;

	if (wip === null) {
		// mount
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.type = current.type;
		wip.stateNode = current.stateNode;

		wip.alternate = current;
		current.alternate = wip;
	} else {
		// update
		wip.pendingProps = pendingProps;
		wip.flags = NoFlags;
		wip.subtreeFlags = NoFlags;
		wip.deletions = null;
		wip.type = current.type;
	}
	wip.updateQueue = current.updateQueue;
	wip.flags = current.flags;
	wip.child = current.child;

	// 数据
	wip.memoizedProps = current.memoizedProps;
	wip.memoizedState = current.memoizedState;

	wip.lanes = current.lanes;

	return wip;
};
