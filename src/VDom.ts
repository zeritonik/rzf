import { config } from "./rzf_config.js";

export namespace VDom {
    export interface TagNode {
        tag: string,
        key?: string,
        props: NodeProps,
        children: Node[],
        element?: HTMLElement
    }

    export interface TextNode {
        text: string,
        key?: string,
        element?: Text
    }

    export type Node = TagNode | TextNode;

    export type NodeProps = {
        [key: string]: any,
        classes: string[],
        styles: {
            [key: string]: string
        },
    }

    export type NodePropsArg = {
        [key: string]: any,
        classes?: string[],
        styles?: {
            [key: string]: string
        },
    }

    export function createTag(info: {
        tag: string, 
        key?: string,
        props?: NodePropsArg, 
        children?: Node[]
    })
    {
        info.props = info.props || {};
        info.children = info.children || [];

        info.props.classes = info.props.classes || [];
        info.props.styles = info.props.styles || {};

        return info as TagNode;
    }

    export function createText(info: {text: string, key?: string}): TextNode {
        return info as TextNode;
    }


    export function link(el: HTMLElement|Text, node: Node) {
        config.verbose && console.log("Link", node, el)
        node.element = el;

        if (!(node as TagNode).children) return;  // no children
        node = node as TagNode;
        
        node.children.forEach((child, index) => {
            link(el.childNodes[index] as HTMLElement, child);
        })
    }
    
    export function build(node: Node) {
        if (!(node as TagNode).children) {
            config.verbose && console.log("Build text", node)
            return document.createTextNode((node as TextNode).text);
        }
        // @ts-ignore
        node = node as TagNode;

        config.verbose && console.log("Build tag", node)
        const htmlNode = document.createElement(node.tag);
        
        for (const className in node.props.classes) {
            htmlNode.classList.add(className);
        }
        for (const style of Object.keys(node.props.styles)) {
            const value = node.props.styles[style];
            htmlNode.style.setProperty(style, value);
        }

        for (const child of node.children) {
            htmlNode.appendChild(build(child));
        }

        // htmlNode._vnode = node;
        return htmlNode;
    }
    
    
    function checkNodesLink(...nodes: Node[]) {
        for (const node of nodes) {
            if (!node.element) {
                config.verbose && console.error("Error not linked node",node)
                throw "checkElements: element is undefined"; 
            }
        }
    }

    function checkNodesKeyed(...nodes: Node[]): boolean {
        let keys = 0;
        for (const node of nodes) {
            keys += node.key ? 1 : 0;
        }
        if (keys > 1 && keys !== nodes.length) {
            config.verbose && console.error("All or none nodes must have keys", nodes)
        }
        return keys > 0;
    }
    
    export function update(oldNode: Node, newNode: Node) {
        checkNodesLink(oldNode)

        const el = oldNode.element!;

        if (!(oldNode as TagNode).children && !(newNode as TagNode).children) {
            if ((oldNode as TextNode).text !== (newNode as TextNode).text) {
                (el as Text).textContent = (newNode as TextNode).text;
            }
            return;
        }
        if (!(oldNode as TagNode).children || !(newNode as TagNode).children) {
            el.replaceWith(build(newNode))
            return;
        }

        oldNode = oldNode as TagNode;
        newNode = newNode as TagNode;

        if (oldNode.tag != newNode.tag) {
            el.replaceWith(build(newNode));
            return;
        }
        
        updateClasses(oldNode, newNode);
        updateStyles(oldNode, newNode);
        updateChildren(oldNode, newNode);
    }

    function updateClasses(oldNode: TagNode, newNode: TagNode) {
        const el = oldNode.element!;
        const classesToRemove = oldNode.props.classes.filter(className => !newNode.props.classes.includes(className));
        const classesToAdd = newNode.props.classes.filter(className => !oldNode.props.classes.includes(className));
        config.verbose && console.log("Classes to add:", classesToAdd, ". Classes to remove:", classesToRemove)
        for (const className of classesToRemove) 
            el.classList.remove(className);
        for (const className of classesToAdd) 
            el.classList.add(className);
    }

    function updateStyles(oldNode: TagNode, newNode: TagNode) {
        const el = oldNode.element!;
        const stylesToRemove = Object.keys(oldNode.props.styles).filter(style => !Object.keys(newNode.props.styles).includes(style));
        const stylesToAdd = Object.keys(newNode.props.styles).filter(style => !Object.keys(oldNode.props.styles).includes(style) || oldNode.props.styles[style] != newNode.props.styles[style]);
        config.verbose && console.log("Styles to add:", stylesToAdd, ". Styles to remove:", stylesToRemove)
        for (const style of stylesToRemove)
            el.style.removeProperty(style);
        for (const style of stylesToAdd)
            el.style.setProperty(style, newNode.props.styles[style]);
    }

    function updateChildren(oldNode: TagNode, newNode: TagNode) {
        checkNodesLink(...oldNode.children);
        const keyed = checkNodesKeyed(...oldNode.children, ...newNode.children);

        if (!keyed) {
            newNode.children.forEach((child, index) => {
                if (index > oldNode.children.length - 1) {
                    oldNode.element!.appendChild(build(child));
                    return;
                }
                update(oldNode.children[index], child);
            })
            return;
        }

        const oldChildren = oldNode.children.reduce((acc, child) => {
            acc[child.key!] = child;
            return acc;
        }, {} as {[key: string]: Node});
        const newChildren = newNode.children.reduce((acc, child) => {
            acc[child.key!] = child;
            return acc;
        }, {} as {[key: string]: Node});

        // remove unused
        oldNode.children.forEach(child => {
            if (!newChildren[child.key!]) {
                oldNode.element!.removeChild(child.element!);
            }
        })
        // updated and add
        newNode.children.forEach(child => {
            if (oldChildren[child.key!]) {
                update(oldChildren[child.key!], child);
                oldNode.element!.appendChild(oldChildren[child.key!].element!);
                return;
            }
            oldNode.element!.appendChild(build(child));
        })
    }
}