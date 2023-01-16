function render(element, container) {
    const dom = renderDom(element);
    container.appendChild(dom);
}

// 将 React.Element 渲染为真实 dom
function renderDom(element) {
    let dom = null; // 要返回的dom

    if (!element && element !== 0) {
        // 条件渲染，返回 null
        return null;
    }

    if (typeof element === "string") {
        // 如果 element 为 string，则返回文本节点
        dom = document.createTextNode(element);
        return dom;
    }

    if (typeof element === "number") {
        dom = document.createTextNode(String(element));
        return dom;
    }

    if (Array.isArray(element)) {
        // 列表渲染
        dom = document.createDocumentFragment();
        for (const item of element) {
            const child = renderDom(item);
            if (child) {
                dom.appendChild(child);
            }
        }
        return dom;
    }

    const {
        type,
        props: { children, ...attributes },
    } = element;

    if (typeof type === "string") {
        // 常规 dom 节点的渲染
        dom = document.createElement(type);
    } else if (typeof type === "function") {
        // React 组件渲染
        if (type.prototype.isReactComponent) {
            // 类组件
            const { props, type: Comp } = element;
            const component = new Comp(props);
            const jsx = component.render();
            dom = renderDom(jsx);
        } else {
            // 函数组件
            const { props, type: fn } = element;
            const jsx = fn(props);
            dom = renderDom(jsx);
        }
    } else {
        // 其他情况暂不考虑
        return null;
    }

    if (children) {
        // 如果存在 children， 对子节点进行递归渲染
        const childrenDOM = renderDom(children);
        if (childrenDOM) {
            dom.appendChild(childrenDOM);
        }
    }

    updateAttributes(dom, attributes)

    return dom;
}

// 更新 DOM 属性
function updateAttributes(dom, attributes) {
    Object.keys(attributes).forEach((key) => {
        if (key.startsWith("on")) {
            // 事件的处理
            const eventName = key.slice(2).toLowerCase();
            dom.addEventListener(eventName, attributes[key]);
        } else if (key === "className") {
            // className 的处理
            const classes = attributes[key].split(" ");
            classes.forEach((classKey) => {
                dom.classList.add(classKey);
            });
        } else if (key === "style") {
            // style处理
            const style = attributes[key];
            Object.keys(style).forEach((styleName) => {
                dom.style[styleName] = style[styleName];
            });
        } else {
            // 其他属性的处理
            dom[key] = attributes[key];
        }
    });
}

const ReactDOM = {
    render,
};
export default ReactDOM;
