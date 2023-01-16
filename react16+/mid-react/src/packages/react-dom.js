import { createRoot } from "./fiber";

function render(element, container) {
    createRoot(element, container);
}

// 将 React.Element 渲染为真实 dom
export function renderDom(element) {
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

    const {
        type,
        props: { children, ...attributes },
    } = element;

    if (typeof type === "string") {
        // 常规 dom 节点的渲染
        dom = document.createElement(type);
    } else if (typeof type === "function") {
        // React 组件的渲染
        dom = document.createDocumentFragment();
    } else {
        // 其他情况暂不考虑
        return null;
    }

    updateAttributes(dom, attributes);

    return dom;
}

// 更新 DOM 属性
export function updateAttributes(dom, attributes, oldAttributes) {
    if (oldAttributes) {
        // 有旧属性，移除旧属性
        Object.keys(oldAttributes).forEach((key) => {
            if (key.startsWith("on")) {
                // 移除旧事件
                const eventName = key.slice(2).toLowerCase();
                dom.removeEventListener(eventName, oldAttributes[key]);
            } else if (key === "className") {
                // className 的处理
                const classes = oldAttributes[key].split(" ");
                classes.forEach((classKey) => {
                    dom.classList.remove(classKey);
                });
            } else if (key === "style") {
                // style处理
                const style = oldAttributes[key];
                Object.keys(style).forEach((styleName) => {
                    dom.style[styleName] = "initial";
                });
            } else {
                // 其他属性的处理
                dom[key] = "";
            }
        });
    }

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
