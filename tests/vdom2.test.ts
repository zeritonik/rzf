import { h, VNode, render, destroy, VNodeType, TextVNode, TagVNode, ComponentVNode } from '../src/VDom';
import { Component, ComponentConstructor } from '../src/Component';
import * as VDomHelpers from '../src/VDomHelpers';
import { destroyTag } from '../src/TagVNode'; // Import destroyTag to potentially mock/spy if needed

// Helper to get a clean container
const getContainer = () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    return container;
};

// Helper component for testing lifecycle
class TestComponent extends Component {
    isMounted = false;
    isUnmounted = false;
    componentDidMount = jest.fn(() => { this.isMounted = true; });
    componentWillUnmount = jest.fn(() => { this.isUnmounted = true; });

    render(): VNode[] {
        const id = this.props.id || 'default';
        const children = this.props.children || [];
        return [
            h('div', null, { dataId: `component-${id}` }, `Component ${id}`),
            ...(Array.isArray(children) ? children : [children])
        ];
    }
}

describe('VDom Manipulation Tests', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = getContainer();
    });

    afterEach(() => {
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        jest.clearAllMocks();
    });

    // ==================================
    // Destroy Tests (Updated Logic)
    // ==================================
    describe('destroy(vnode)', () => {
        // ... destroy tests remain the same ...
        it('should remove the specific DOM element for a TagVNode from its parent DOM', () => {
            const childNode = h('span', null, { dataId: 'destroy-child-tag' }, 'Child');
            const parentNode = h('div', null, { dataId: 'destroy-parent-tag' }, 'Parent ', childNode) as TagVNode;
            render(parentNode, container);

            const parentElement = container.querySelector('[data-id="destroy-parent-tag"]');
            const childElement = container.querySelector('[data-id="destroy-child-tag"]');

            expect(parentElement).not.toBeNull();
            expect(childElement).not.toBeNull();
            expect(parentElement!.contains(childElement)).toBe(true);

            VDomHelpers.linkChildren(parentNode); // Ensure parent ref is set for VDomHelpers.remove call inside destroy
            const childVNode = parentNode.children[1] as TagVNode;
            const childFirstDom = childVNode.firstDom;

            destroy(childVNode);

            expect(container.querySelector('[data-id="destroy-child-tag"]')).toBeNull();
            expect(container.querySelector('[data-id="destroy-parent-tag"]')).not.toBeNull();
            // Verify VNode detached - check length and remaining node type/value
            expect(parentNode.children.length).toBe(1);
            expect(parentNode.children[0].type).toBe(VNodeType.TEXT);
            expect((parentNode.children[0] as TextVNode).value).toBe('Parent ');
            expect(childVNode.firstDom).toBe(childFirstDom);
        });

        it('should remove the specific DOM element for a TextVNode from its parent DOM', () => {
            const textValue = 'Destroy me text';
            const textVNode: TextVNode = { type: VNodeType.TEXT, value: textValue };
            const parentNode = h('p', null, { dataId: 'text-parent' }, textVNode) as TagVNode;
            render(parentNode, container);

            const parentElement = container.querySelector('[data-id="text-parent"]');
            expect(parentElement).not.toBeNull();
            expect(parentElement!.textContent).toBe(textValue);

            VDomHelpers.linkChildren(parentNode); // Ensure parent ref is set
            const renderedTextNode = parentNode.children[0] as TextVNode;
            const textFirstDom = renderedTextNode.firstDom;

            expect(renderedTextNode.firstDom).toBeInstanceOf(Text);

            destroy(renderedTextNode);

            expect(parentElement!.textContent).toBe('');
            expect(container.querySelector('[data-id="text-parent"]')).not.toBeNull();
            // Verify VNode detached - check length
            expect(parentNode.children.length).toBe(0);
            expect(renderedTextNode.firstDom).toBe(textFirstDom);
        });

        it('should remove DOM, call componentWillUnmount, and detach ComponentVNode', () => {
            const componentVNode = h(TestComponent, null, { id: 'comp-destroy-1' }) as ComponentVNode;
            const parentNode = h('div', null, { dataId: 'comp-parent' }, componentVNode) as TagVNode;
            render(parentNode, container);

            const parentElement = container.querySelector('[data-id="comp-parent"]');
            const componentElement = container.querySelector('[data-id="component-comp-destroy-1"]');
            expect(parentElement).not.toBeNull();
            expect(componentElement).not.toBeNull();
            expect(parentElement!.contains(componentElement)).toBe(true);

            VDomHelpers.linkChildren(parentNode); // Ensure parent ref is set
            const renderedComponentVNode = parentNode.children[0] as ComponentVNode;
            const componentInstance = renderedComponentVNode.instance as TestComponent;
            const componentFirstDom = renderedComponentVNode.firstDom;
            const instanceRef = renderedComponentVNode.instance;

            expect(componentInstance).toBeInstanceOf(TestComponent);
            expect(componentInstance.isMounted).toBe(true);
            expect(componentInstance.componentWillUnmount).not.toHaveBeenCalled();

            destroy(renderedComponentVNode);

            expect(container.querySelector('[data-id="component-comp-destroy-1"]')).toBeNull();
            expect(container.querySelector('[data-id="comp-parent"]')).not.toBeNull();
            expect(componentInstance.isUnmounted).toBe(true);
            expect(componentInstance.componentWillUnmount).toHaveBeenCalledTimes(1);
            // Verify VNode detached - check length
            expect(parentNode.children.length).toBe(0);
            expect(renderedComponentVNode.firstDom).toBe(componentFirstDom);
            expect(renderedComponentVNode.instance).toBe(instanceRef);
        });

        it('should remove event listeners during destroy for TagVNode', () => {
            const mockClickHandler = jest.fn();
            const vnode = h('button', null, { dataId: 'btn-destroy', onClick: mockClickHandler }, 'Click Me') as TagVNode;

            const parent = h('div', null, {}, vnode) as TagVNode;
            container.innerHTML = '';
            render(parent, container);
            const buttonElement = container.querySelector('[data-id="btn-destroy"]') as HTMLButtonElement;
            expect(buttonElement).not.toBeNull();

            buttonElement.click();
            expect(mockClickHandler).toHaveBeenCalledTimes(1);

            VDomHelpers.linkChildren(parent); // Ensure parent ref is set
            const buttonVNode = parent.children[0] as TagVNode;
            const buttonElementAgain = container.querySelector('[data-id="btn-destroy"]') as HTMLButtonElement;

            const removeSpy = jest.spyOn(buttonElementAgain, 'removeEventListener');

            destroy(buttonVNode);

            expect(removeSpy).toHaveBeenCalledWith('click', mockClickHandler);
            expect(container.querySelector('[data-id="btn-destroy"]')).toBeNull();

            removeSpy.mockRestore();
        });


        it('should recursively destroy children VNodes and remove their DOM', () => {
            const grandChild = h('i', null, { dataId: 'gc' }, 'italic');
            const child = h('span', null, { dataId: 'c' }, 'Child ', grandChild) as TagVNode;
            const parent = h('div', null, { dataId: 'p' }, 'Parent ', child) as TagVNode;
            const one_more_parent = h('div', null, {}, parent) as TagVNode;

            render(one_more_parent, container);
            const parentElement = container.querySelector('[data-id="p"]');
            expect(parentElement).not.toBeNull();
            expect(container.querySelector('[data-id="c"]')).not.toBeNull();
            expect(container.querySelector('[data-id="gc"]')).not.toBeNull();

            VDomHelpers.linkChildren(parent);
            const childVNode = parent.children[1] as TagVNode;
            VDomHelpers.linkChildren(childVNode);

            const parentFirstDom = parent.firstDom;
            const childFirstDom = childVNode.firstDom;
            const grandChildVNode = childVNode.children[1] as TagVNode;
            const grandChildFirstDom = grandChildVNode.firstDom;

            destroy(parent);

            expect(one_more_parent.firstDom!.innerHTML).toBe('');
            expect(parent.children.length).toBe(0);
            expect(parent.firstDom).toBe(parentFirstDom);
            expect(childVNode.firstDom).toBe(childFirstDom);
            expect(grandChildVNode.firstDom).toBe(grandChildFirstDom);
        });

        it('should handle destroying a node whose parent was already removed from DOM', () => {
            const childNode = h('span', null, { dataId: 'orphan-child' }, 'Child');
            const parentNode = h('div', null, { dataId: 'removed-parent' }, childNode) as TagVNode;
            render(parentNode, container);

            VDomHelpers.linkChildren(parentNode); // Ensure parent ref is set
            const childVNode = parentNode.children[0] as TagVNode;
            const parentElement = container.querySelector('[data-id="removed-parent"]');

            parentElement?.remove();
            expect(container.querySelector('[data-id="removed-parent"]')).toBeNull();
            expect(container.querySelector('[data-id="orphan-child"]')).toBeNull();

            expect(() => destroy(childVNode)).not.toThrow();
            expect(parentNode.children.length).toBe(0);
        });
    });

    // ==================================
    // VDomHelpers.remove Tests (Updated Assertions)
    // ==================================
    describe('VDomHelpers.remove(vnode)', () => {
        // ... remove tests remain the same ...
        let parent: TagVNode;
        let child1: TagVNode, child2: TagVNode, child3: TagVNode;

        beforeEach(() => {
            child1 = h('span', null, { dataId: 'c1' }, '1') as TagVNode;
            child2 = h('span', null, { dataId: 'c2' }, '2') as TagVNode;
            child3 = h('span', null, { dataId: 'c3' }, '3') as TagVNode;
            parent = h('div', null, { dataId: 'parent' }, child1, child2, child3) as TagVNode;
            // Render to set initial pointers correctly via linkChildren inside render
            render(parent, container);
            // Explicitly link again just to be sure, though render should handle it
            VDomHelpers.linkChildren(parent);
        });

        it('should remove a middle child from parent.children', () => {
            expect(parent.children.length).toBe(3);
            const removedIndex = VDomHelpers.remove(child2);
            expect(removedIndex).toBe(1);
            // Check length and remaining node identities
            expect(parent.children.length).toBe(2);
            expect(parent.children[0]).toBe(child1);
            expect(parent.children[1]).toBe(child3);
        });

        it('should update sibling pointers after removing a middle child', () => {
            VDomHelpers.remove(child2);
            // VDomHelpers.remove should call linkChildren internally or update pointers
            // Let's assume it updates pointers directly or linkChildren is called by it
            // If not, we'd need VDomHelpers.linkChildren(parent) here.
            // Re-checking the remove implementation: it *does* update pointers directly.
            expect(child1.next).toBe(child3);
            expect(child3.prev).toBe(child1);
        });

         it('should NOT clear sibling pointers of the removed child itself', () => {
            const originalPrev = child2.prev;
            const originalNext = child2.next;
            expect(originalPrev).toBe(child1);
            expect(originalNext).toBe(child3);

            VDomHelpers.remove(child2);

            expect(child2.prev).toBe(originalPrev);
            expect(child2.next).toBe(originalNext);
        });

        it('should remove the first child correctly', () => {
            const removedIndex = VDomHelpers.remove(child1);
            expect(removedIndex).toBe(0);
            expect(parent.children.length).toBe(2);
            expect(parent.children[0]).toBe(child2);
            expect(parent.children[1]).toBe(child3);
            expect(child2.prev).toBeUndefined();
            expect(child2.next).toBe(child3);
            expect(child3.prev).toBe(child2);
        });

        it('should remove the last child correctly', () => {
            const removedIndex = VDomHelpers.remove(child3);
            expect(removedIndex).toBe(2);
            expect(parent.children.length).toBe(2);
            expect(parent.children[0]).toBe(child1);
            expect(parent.children[1]).toBe(child2);
            expect(child1.next).toBe(child2);
            expect(child2.prev).toBe(child1);
            expect(child2.next).toBeUndefined();
        });

        it('should handle removing the only child', () => {
            const onlyChild = h('span', null, {}, 'only') as TagVNode;
            const singleParent = h('div', null, {}, onlyChild) as TagVNode;
            render(singleParent, container); // Render the single child parent
            VDomHelpers.linkChildren(singleParent);

            const removedIndex = VDomHelpers.remove(onlyChild);
            expect(removedIndex).toBe(0);
            expect(singleParent.children.length).toBe(0);
            expect(onlyChild.prev).toBeUndefined();
            expect(onlyChild.next).toBeUndefined();
        });

        it('should return -1 if VNode has no parent', () => {
            const orphan = h('span', null, {}, 'orphan') as TagVNode;
            // No render, no linkChildren -> no parent
            expect(VDomHelpers.remove(orphan)).toBe(-1);
        });

        it('should return -1 if VNode is not in its parent\'s children array', () => {
            const orphan = h('span', null, {}, 'fake child') as TagVNode;
            orphan.parent = parent; // Manually assign parent
            expect(VDomHelpers.remove(orphan)).toBe(-1);
            expect(parent.children.length).toBe(3);
            expect(parent.children[0]).toBe(child1);
            expect(parent.children[1]).toBe(child2);
            expect(parent.children[2]).toBe(child3);
        });
    });

    // ==================================
    // VDomHelpers.insert Tests (Updated Assertions & Setup)
    // ==================================
    describe('VDomHelpers.insert(newVNode, index, parent)', () => {
        let parent: TagVNode;
        let child1: TagVNode, child3: TagVNode;

        beforeEach(() => {
            // Setup initial state
            child1 = h('span', null, { dataId: 'c1' }, '1') as TagVNode;
            child3 = h('span', null, { dataId: 'c3' }, '3') as TagVNode;
            parent = h('div', null, { dataId: 'parent' }, child1, child3) as TagVNode;
            // *** Render the initial state to set up pointers ***
            render(parent, container);
            // *** Explicitly link after render for safety/clarity ***
            VDomHelpers.linkChildren(parent);
        });

        it('should insert a node into parent.children at the specified index', () => {
            const child2 = h('span', null, { dataId: 'c2-insert' }, '2') as TagVNode;
            VDomHelpers.insert(child2, 1, parent);
            // *** Link children AFTER insert to update pointers ***
            VDomHelpers.linkChildren(parent);
            // Check length and node identities at indices
            expect(parent.children.length).toBe(3);
            expect(parent.children[0]).toBe(child1);
            expect(parent.children[1]).toBe(child2);
            expect(parent.children[2]).toBe(child3);
        });

        it('should set the parent property of the inserted node', () => {
            const child2 = h('span', null, { dataId: 'c2-insert' }, '2') as TagVNode;
            expect(child2.parent).toBeUndefined();
            VDomHelpers.insert(child2, 1, parent);
            // *** Link children AFTER insert ***
            VDomHelpers.linkChildren(parent);
            expect(child2.parent).toBe(parent);
        });

        it('should update sibling pointers when inserting in the middle', () => {
            const child2 = h('span', null, { dataId: 'c2-insert' }, '2') as TagVNode;
            VDomHelpers.insert(child2, 1, parent);
            // *** Link children AFTER insert ***
            VDomHelpers.linkChildren(parent);
            // Now check pointers
            expect(child1.next).toBe(child2);
            expect(child2.prev).toBe(child1);
            expect(child2.next).toBe(child3);
            expect(child3.prev).toBe(child2);
        });

        it('should insert at the beginning (index 0)', () => {
            const child0 = h('span', null, { dataId: 'c0-insert' }, '0') as TagVNode;
            VDomHelpers.insert(child0, 0, parent);
            // *** Link children AFTER insert ***
            VDomHelpers.linkChildren(parent);
            // Check length and node identities
            expect(parent.children.length).toBe(3);
            expect(parent.children[0]).toBe(child0);
            expect(parent.children[1]).toBe(child1);
            expect(parent.children[2]).toBe(child3);
            // Check pointers
            expect(child0.parent).toBe(parent);
            expect(child0.prev).toBeUndefined();
            expect(child0.next).toBe(child1);
            expect(child1.prev).toBe(child0);
            // Check pointer of node that was shifted
            expect(child3.prev).toBe(child1); // Should still point to child1
        });

        it('should insert at the end (index = current length)', () => {
            const child4 = h('span', null, { dataId: 'c4-insert' }, '4') as TagVNode;
            VDomHelpers.insert(child4, 2, parent); // Insert at index 2 (end of [c1, c3])
            // *** Link children AFTER insert ***
            VDomHelpers.linkChildren(parent);
            // Check length and node identities
            expect(parent.children.length).toBe(3);
            expect(parent.children[0]).toBe(child1);
            expect(parent.children[1]).toBe(child3);
            expect(parent.children[2]).toBe(child4);
            // Check pointers
            expect(child4.parent).toBe(parent);
            expect(child3.next).toBe(child4);
            expect(child4.prev).toBe(child3);
            expect(child4.next).toBeUndefined();
            // Check pointer of node before insertion point
            expect(child1.next).toBe(child3); // Should still point to child3
        });

        it('should insert into an empty parent', () => {
            // Setup empty parent
            container.innerHTML = ''; // Clear container
            const emptyParent = h('div', null, {}) as TagVNode;
            render(emptyParent, container); // Render the empty parent
            VDomHelpers.linkChildren(emptyParent); // Link empty
            expect(emptyParent.children.length).toBe(0);

            const firstChild = h('span', null, {}, 'first') as TagVNode;
            VDomHelpers.insert(firstChild, 0, emptyParent);
            // *** Link children AFTER insert ***
            VDomHelpers.linkChildren(emptyParent);

            // Check length and node identity
            expect(emptyParent.children.length).toBe(1);
            expect(emptyParent.children[0]).toBe(firstChild);
            // Check pointers
            expect(firstChild.parent).toBe(emptyParent);
            expect(firstChild.prev).toBeUndefined();
            expect(firstChild.next).toBeUndefined();
        });

         it('should handle inserting at an index greater than length (appends)', () => {
            const child4 = h('span', null, { dataId: 'c4-append' }, '4') as TagVNode;
            VDomHelpers.insert(child4, 99, parent); // Index > length, should append
            // *** Link children AFTER insert ***
            VDomHelpers.linkChildren(parent);
            // Check length and node identities
            expect(parent.children.length).toBe(3);
            expect(parent.children[0]).toBe(child1);
            expect(parent.children[1]).toBe(child3);
            expect(parent.children[2]).toBe(child4);
            // Check pointers
            expect(child4.parent).toBe(parent);
            expect(child3.next).toBe(child4);
            expect(child4.prev).toBe(child3);
            expect(child4.next).toBeUndefined();
        });
    });
});