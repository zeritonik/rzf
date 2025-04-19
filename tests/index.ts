import { VDom } from "../src/VDom.js";

const node = VDom.createText({ text: '' });
const domNode = VDom.build(node);
VDom.link(domNode, node);

document.body.appendChild(domNode);