import { Action } from 'shared/ReactTypes';

export type Dispatch<State> = (action: Action<State>) => void;

export type Dispatcher = {
	useState: <T>(initialState: (() => T) | T) => [T, Dispatch<T>];
	useEffect: (callback: (() => void) | void, deps: any[] | void) => void;
};

const currentDispatcher: { current: null | Dispatcher } = {
	current: null
};

export const resolveDispatcher = () => {
	const dispatcher = currentDispatcher.current;

	if (dispatcher === null) {
		throw 'Hook只能在函数组件中执行';
	}
	return dispatcher;
};

export default currentDispatcher;
