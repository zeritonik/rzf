// /src/jsx-runtime.ts - CORRECT version
import { h, VNode } from "./VDom";

// Adapter function if h needs different signature
function jsxAdapter(type: any, props: any, key?: any): VNode {
    const { children, ...restProps } = props || {}; // Handle null props, extract children
    // Call the original h with its expected signature
    return h(type, key ?? null, restProps || {}, ...(Array.isArray(children) ? children : (children != null ? [children] : [])));
}

export { jsxAdapter as jsx };
export { jsxAdapter as jsxs }; // Use same adapter for simplicity