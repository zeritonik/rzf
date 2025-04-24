import { h, render, destroy, VNodeType, VNode, TagVNode, ComponentVNode, TextVNode } from '../src/VDom';
import { Component } from '../src/Component';

// Mock Component for testing
class TestComponent extends Component {
    componentDidMount = jest.fn(); // Mock lifecycle method

    render(): VNode[] {
        const name = this.props.name || 'World';
        const children = this.props.children || [];
        return [
            h('span', null, { dataTestid: 'component-span' }, `Hello ${name}`),
            ...children
        ];
    }
}

describe('VDom Creation (h function)', () => {
    it('should create a TextVNode implicitly for string children', () => {
        const vnode = h('div', null, {}, 'Hello Text');
        expect(vnode.type).toBe(VNodeType.TAG);
        const tagVNode = vnode as TagVNode;
        expect(tagVNode.children.length).toBe(1);
        const textChild = tagVNode.children[0] as TextVNode;
        expect(textChild.type).toBe(VNodeType.TEXT);
        expect(textChild.value).toBe('Hello Text');
    });

    it('should create a simple TagVNode', () => {
        const vnode = h('div', 'myKey', {});
        expect(vnode.type).toBe(VNodeType.TAG);
        const tagVNode = vnode as TagVNode;
        expect(tagVNode.tag).toBe('div');
        expect(tagVNode.key).toBe('myKey');
        expect(tagVNode.props).toEqual({ classes: [], style: {}, on: {}, data: {} }); // Check processed props
        expect(tagVNode.children).toEqual([]);
    });

    it('should create a TagVNode with props (className, style, attrs, data, events)', () => {
        const handleClick = jest.fn();
        const vnode = h('button', null, {
            className: 'btn btn-primary',
            style: { color: 'red', backgroundColor: 'blue' },
            dataId: '123',
            onClick: handleClick, // Note: 'onClick' becomes 'onclick' in props.on
            disabled: true,
        });

        expect(vnode.type).toBe(VNodeType.TAG);
        const tagVNode = vnode as TagVNode;
        expect(tagVNode.tag).toBe('button');
        expect(tagVNode.props.classes).toEqual(['btn', 'btn-primary']);
        expect(tagVNode.props.style).toEqual({ color: 'red', 'background-color': 'blue' });
        expect(tagVNode.props.data).toEqual({ id: '123' });
        expect(tagVNode.props.on.click).toBe(handleClick);
        expect(tagVNode.props.disabled).toBe(true); // Direct attribute
    });

    it('should create a TagVNode with various children types', () => {
        const vnode = h('ul', null, {},
            h('li', 'item1', {}, 'Item 1'),
            'Raw Text', // Should become TextVNode
            null,       // Should be filtered out
            undefined,  // Should be filtered out
            h('li', 'item2', {}, 'Item 2'),
            123,        // Should become TextVNode
            false       // Should become TextVNode
        );

        expect(vnode.type).toBe(VNodeType.TAG);
        const tagVNode = vnode as TagVNode;
        expect(tagVNode.children.length).toBe(5); // null/undefined filtered

        // Check children types and values/tags
        expect(tagVNode.children[0].type).toBe(VNodeType.TAG);
        expect((tagVNode.children[0] as TagVNode).tag).toBe('li');
        expect((tagVNode.children[0] as TagVNode).key).toBe('item1');

        expect(tagVNode.children[1].type).toBe(VNodeType.TEXT);
        expect((tagVNode.children[1] as TextVNode).value).toBe('Raw Text');

        expect(tagVNode.children[2].type).toBe(VNodeType.TAG);
        expect((tagVNode.children[2] as TagVNode).tag).toBe('li');
        expect((tagVNode.children[2] as TagVNode).key).toBe('item2');

        expect(tagVNode.children[3].type).toBe(VNodeType.TEXT);
        expect((tagVNode.children[3] as TextVNode).value).toBe('123');

        expect(tagVNode.children[4].type).toBe(VNodeType.TEXT);
        expect((tagVNode.children[4] as TextVNode).value).toBe('false');
    });

    it('should create a ComponentVNode', () => {
        const vnode = h(TestComponent, 'compKey', { name: 'Tester' });
        expect(vnode.type).toBe(VNodeType.COMPONENT);
        const compVNode = vnode as ComponentVNode;
        expect(compVNode.key).toBe('compKey');
        expect(compVNode.component).toBe(TestComponent);
        expect(compVNode.props).toEqual({ name: 'Tester', children: [] }); // Children prop added automatically
        expect(compVNode.children).toEqual([]); // Children array initialized empty
        expect(compVNode.instance).toBeUndefined(); // Instance not created yet
    });

     it('should create a ComponentVNode with children', () => {
        const childVNode = h('p', null, {}, 'Child paragraph');
        const vnode = h(TestComponent, 'compKey', { name: 'Tester' }, childVNode);
        expect(vnode.type).toBe(VNodeType.COMPONENT);
        const compVNode = vnode as ComponentVNode;
        expect(compVNode.props.name).toBe('Tester');
        expect(compVNode.props.children).toBeDefined();
        expect(compVNode.props.children.length).toBe(1);
        expect(compVNode.props.children[0]).toBe(childVNode);
        expect(compVNode.children).toEqual([]); // Instance children are empty until render
    });
});

describe('VDom Rendering (render function)', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        // Clean up rendered VNodes and container
        // Note: A more robust cleanup might involve tracking rendered roots
        // and calling destroy, but for isolated tests, clearing innerHTML is often sufficient.
        container.innerHTML = '';
        document.body.removeChild(container);
        // container = null!; // Help GC - causes issues if tests run async?
    });

    it('should render a TextVNode', () => {
        const textNode: TextVNode = { type: VNodeType.TEXT, value: 'Just Text' };
        render(textNode, container);
        expect(container.childNodes.length).toBe(1);
        expect(container.firstChild?.nodeType).toBe(Node.TEXT_NODE);
        expect(container.firstChild?.textContent).toBe('Just Text');
        expect(textNode.firstDom).toBe(container.firstChild); // Check if firstDom is linked
    });

    it('should render a simple TagVNode', () => {
        const vnode = h('div', null, {});
        render(vnode, container);
        expect(container.childNodes.length).toBe(1);
        const element = container.firstChild as HTMLElement;
        expect(element.tagName).toBe('DIV');
        expect((vnode as TagVNode).firstDom).toBe(element); // Check if firstDom is linked
    });

    it('should render a TagVNode with props (attributes, style, class, data)', () => {
        const handleClick = jest.fn();
        const vnode = h('button', null, {
            className: 'btn active',
            style: { color: 'rgb(255, 0, 0)', fontWeight: 'bold' }, // Use rgb for easier comparison
            dataValue: 'submit',
            id: 'submit-btn',
            disabled: true,
            onClick: handleClick,
        });
        render(vnode, container);

        const element = container.firstChild as HTMLButtonElement;
        expect(element.tagName).toBe('BUTTON');
        expect(element.classList.contains('btn')).toBe(true);
        expect(element.classList.contains('active')).toBe(true);
        expect(element.style.color).toBe('rgb(255, 0, 0)');
        expect(element.style.fontWeight).toBe('bold');
        expect(element.dataset.value).toBe('submit');
        expect(element.id).toBe('submit-btn');
        expect(element.disabled).toBe(true);

        // Test event listener
        element.click();
        expect(handleClick).toHaveBeenCalledTimes(0);

        expect((vnode as TagVNode).firstDom).toBe(element);
    });

    it('should render a TagVNode with children (tags and text)', () => {
        const vnode = h('ul', null, { id: 'my-list' },
            h('li', 'item1', {}, 'Item 1'),
            h('li', 'item2', { className: 'special' }, 'Item 2')
        );
        render(vnode, container);

        const ulElement = container.firstChild as HTMLUListElement;
        expect(ulElement.tagName).toBe('UL');
        expect(ulElement.id).toBe('my-list');
        expect(ulElement.childNodes.length).toBe(2);

        const li1 = ulElement.childNodes[0] as HTMLLIElement;
        expect(li1.tagName).toBe('LI');
        expect(li1.textContent).toBe('Item 1');

        const li2 = ulElement.childNodes[1] as HTMLLIElement;
        expect(li2.tagName).toBe('LI');
        expect(li2.classList.contains('special')).toBe(true);
        expect(li2.textContent).toBe('Item 2');

        // Check VNode linking (optional but good)
        const tagVNode = vnode as TagVNode;
        expect(tagVNode.firstDom).toBe(ulElement);
        expect((tagVNode.children[0] as TagVNode).firstDom).toBe(li1);
        expect((tagVNode.children[1] as TagVNode).firstDom).toBe(li2);
        expect(((tagVNode.children[0] as TagVNode).children[0] as TextVNode).firstDom).toBe(li1.firstChild);
    });

    it('should render a ComponentVNode', () => {
        const vnode = h(TestComponent, null, { name: 'Component Tester' });
        render(vnode, container);

        expect(container.childNodes.length).toBe(1); // Component renders one span
        const spanElement = container.firstChild as HTMLSpanElement;
        expect(spanElement.tagName).toBe('SPAN');
        expect(spanElement.textContent).toBe('Hello Component Tester');
        expect(spanElement.dataset.testid).toBe('component-span');

        // Check component instance and lifecycle
        const compVNode = vnode as ComponentVNode;
        expect(compVNode.instance).toBeInstanceOf(TestComponent);
        expect(compVNode.instance?.props.name).toBe('Component Tester');
        expect(compVNode.instance?.componentDidMount).toHaveBeenCalledTimes(1);

        // Check VNode linking
        expect(compVNode.firstDom).toBe(spanElement); // Component's firstDom points to its first rendered DOM node
        expect(compVNode.children.length).toBe(1); // Component's children are its rendered VNodes
        expect((compVNode.children[0] as TagVNode).firstDom).toBe(spanElement);
    });

     it('should render a ComponentVNode with children passed as props', () => {
        const childParagraph = h('p', 'p1', {}, 'Passed Child');
        const vnode = h(TestComponent, null, { name: 'Parent' }, childParagraph);
        render(vnode, container);

        expect(container.childNodes.length).toBe(2); // Component renders span + passed child

        const spanElement = container.childNodes[0] as HTMLSpanElement;
        expect(spanElement.tagName).toBe('SPAN');
        expect(spanElement.textContent).toBe('Hello Parent');

        const pElement = container.childNodes[1] as HTMLParagraphElement;
        expect(pElement.tagName).toBe('P');
        expect(pElement.textContent).toBe('Passed Child');

        // Check VNode linking
        const compVNode = vnode as ComponentVNode;
        expect(compVNode.firstDom).toBe(spanElement); // Still points to the first DOM node rendered *by the component*
        expect(compVNode.children.length).toBe(2); // Component's children are span + p
        expect((compVNode.children[0] as TagVNode).firstDom).toBe(spanElement);
        expect((compVNode.children[1] as TagVNode).firstDom).toBe(pElement);
    });

    it('should render nested components', () => {
        class InnerComponent extends Component {
            render(): VNode[] { return [h('em', null, {}, `Inner ${this.props.value}`)]; }
        }
        class OuterComponent extends Component {
            render(): VNode[] { return [h('div', null, {}, h(InnerComponent, null, { value: 'Data' }))]; }
            componentDidMount = jest.fn();
        }

        const vnode = h(OuterComponent, null, {});
        render(vnode, container);

        expect(container.childNodes.length).toBe(1);
        const divElement = container.firstChild as HTMLDivElement;
        expect(divElement.tagName).toBe('DIV');
        expect(divElement.childNodes.length).toBe(1);
        const emElement = divElement.firstChild as HTMLElement;
        expect(emElement.tagName).toBe('EM');
        expect(emElement.textContent).toBe('Inner Data');

        // Check outer component instance
        const outerCompVNode = vnode as ComponentVNode;
        expect(outerCompVNode.instance).toBeInstanceOf(OuterComponent);
        expect(outerCompVNode.instance?.componentDidMount).toHaveBeenCalledTimes(1);
        expect(outerCompVNode.firstDom).toBe(divElement);

        // Check inner component instance (optional, depends on how deep you want to test)
        const outerRenderedChildren = outerCompVNode.children; // VNodes rendered by OuterComponent
        expect(outerRenderedChildren.length).toBe(1);
        const divVNode = outerRenderedChildren[0] as TagVNode;
        expect(divVNode.children.length).toBe(1);
        const innerCompVNode = divVNode.children[0] as ComponentVNode;
        expect(innerCompVNode.instance).toBeInstanceOf(InnerComponent);
        expect(innerCompVNode.firstDom).toBe(emElement); // Inner component's firstDom
    });

    // Example of using destroy (though full destroy tests might be separate)
    it('should render and then allow destroy', () => {
         const vnode = h('div', null, {}, 'Temporary');
         render(vnode, container);
         expect(container.innerHTML).toBe('<div>Temporary</div>');
         destroy(vnode);
         expect(container.innerHTML).toBe('');
    });
});
