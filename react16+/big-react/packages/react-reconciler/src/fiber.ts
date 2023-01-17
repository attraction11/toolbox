import { Key, Props, ReactElement, Ref } from 'shared/ReactTypes';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from './hostConfig';
import { UpdateQueue } from './updateQueue';
import { FunctionComponent, HostComponent, WorkTag } from './workTags';

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

	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;

	updateQueue: UpdateQueue | null;
	memoizedState: any;

	alternate: FiberNode | null;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// 实例--作为静态数据结构的属性
		this.tag = tag;
		this.key = key; // fiber的key
		this.stateNode = null; // fiber的实例，类组件场景下，是组件的类，HostComponent场景，是dom元素
		this.type = null; // fiber对应的DOM元素的标签类型，div、p...

		// 树结构--用于连接其他Fiber节点形成Fiber树
		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;

		this.ref = null;

		// 状态--作为动态的工作单元的属性
		this.pendingProps = pendingProps;
		this.memoizedProps = null;
		this.updateQueue = null; // 存储update的链表
		this.memoizedState = null; // 类组件存储fiber的状态，函数组件存储hooks链表

		// 副作用
		this.flags = NoFlags; // flags原为effectTag，表示当前这个fiber节点变化的类型：增、删、改
		this.subtreeFlags = NoFlags;
		// this.deletions = null;

		// 调度优先级相关
		// this.lanes = NoLanes; // 该fiber中的优先级，它可以判断当前节点是否需要更新
		// this.childLanes = NoLanes; // 子树中的优先级，它可以判断当前节点的子树是否需要更新

		// 指向该fiber在另一次更新时对应的fiber
		/*
		 * 可以看成是workInProgress（或current）树中的和它一样的节点，
		 * 可以通过这个字段是否为null判断当前这个fiber处在更新还是创建过程
		 * */
		this.alternate = null;
	}
}

export class FiberRootNode {
	container: Container;
	current: FiberNode;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
	}
}

export function createFiberFromElement(element: ReactElement): FiberNode {
	const { type, key, props } = element;
	let fiberTag: WorkTag = FunctionComponent;

	if (typeof type === 'string') {
		fiberTag = HostComponent;
	}
	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;

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
	}
	wip.updateQueue = current.updateQueue;
	wip.flags = current.flags;
	wip.child = current.child;

	// 数据
	wip.memoizedProps = current.memoizedProps;
	wip.memoizedState = current.memoizedState;

	return wip;
};
