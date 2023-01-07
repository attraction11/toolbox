/********************** Step 0  **********************/
// const element = {
//     type: "h1",
//     props: {
//         title: "foo",
//         children: "hello"
//     }
// }
// const container = document.getElementById("root")

// const node = document.createElement(element.type)
// node['title'] = element.props.title

// const text = document.createTextNode('')
// text["nodeValue"] = element.props.children

// node.appendChild(text)
// container.appendChild(node)

/********************* Step 1  **********************/
/*
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)

const element = React.createElement(
    "div", 
    {id: "foo"}, 
    React.createElement(createElement("a", null, "bar")),
    React.createElement("b")
)
*/

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object" ? child : createTextElement(child)
      )
    }
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  };
}

function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);
  const isProperty = key => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name];
    });
  element.props.children.forEach(child => render(child, dom));
  container.appendChild(dom);
}

const Didact = {
  createElement,
  render
};

/** @jsx Didact.createElement */
const element = (
  <div style="background: salmon">
    <h1>Hello World</h1>
    <h2 style="text-align:right">from Didact</h2>
  </div>
);
const container = document.getElementById("root");
Didact.render(element, container);

