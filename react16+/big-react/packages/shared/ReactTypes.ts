export type Ref = any;
export type ElementType = any;
export type Key = string | null;
export type Props = {
	[key: string]: any;
	children?: any;
};

export interface ReactElement {
	// 用于辨别ReactElement对象
	$$typeof: symbol | number;

	// 内部属性
	type: ElementType; // 表明节点的种类
	key: Key; // 默认值 null
	ref: Ref;
	props: Props;

	// ReactFiber 记录创建本对象的Fiber节点, 还未与Fiber树关联之前, 该属性为null
	_owner: any,

	__mark: 'KaSong';
}

export type Action<State> = State | ((prevState: State) => State);
