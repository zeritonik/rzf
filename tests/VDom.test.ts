import { VDom } from '../src/VDom';
import { config } from '../src/rzf_config';

// Helper type assertions
function assertIsTextNode(node: VDom.Node): asserts node is VDom.TextNode {
    if (!('text' in node)) throw new Error('Node is not a TextNode');
}

function assertIsTagNode(node: VDom.Node): asserts node is VDom.TagNode {
    if (!('tag' in node)) throw new Error('Node is not a TagNode');
}

describe('VDom Implementation', () => {
    beforeEach(() => {
        config.verbose = false; // Disable verbose logging for tests
    });

    describe('Node Creation', () => {
        test('createText should return a valid TextNode', () => {
            const textContent = 'Hello World';
            const textNode = VDom.createText({ text: textContent });
            
            assertIsTextNode(textNode);
            expect(textNode.text).toBe(textContent);
            expect(textNode.element).toBeUndefined();
        });

        test('createTag should return a valid TagNode with defaults', () => {
            const tagName = 'div';
            const tagNode = VDom.createTag({ tag: tagName });
            
            assertIsTagNode(tagNode);
            expect(tagNode.tag).toBe(tagName);
            expect(tagNode.props.classes).toEqual([]);
            expect(tagNode.props.styles).toEqual({});
            expect(tagNode.children).toEqual([]);
        });
    });

    describe('DOM Building', () => {
        test('build should create Text node for TextNode', () => {
            const textNode = VDom.createText({ text: 'Test' });
            const domNode = VDom.build(textNode);
            
            expect(domNode).toBeInstanceOf(Text);
            expect(domNode.textContent).toBe('Test');
        });

        test('build should create Element node for TagNode', () => {
            const tagNode = VDom.createTag({ tag: 'section' });
            const domNode = VDom.build(tagNode);
            
            expect(domNode).toBeInstanceOf(HTMLElement);
            expect((domNode as HTMLElement).tagName).toBe('SECTION');
        });

        test('build should handle nested structures', () => {
            const childText = VDom.createText({ text: 'Child' });
            const parentNode = VDom.createTag({
                tag: 'div',
                children: [
                    VDom.createTag({
                        tag: 'span',
                        children: [childText]
                    })
                ]
            });

            const domNode = VDom.build(parentNode) as HTMLElement;
            const span = domNode.firstChild as HTMLElement;
            
            expect(span.tagName).toBe('SPAN');
            expect(span.firstChild?.textContent).toBe('Child');
        });
    });

    describe('DOM Linking', () => {
        test('link should associate DOM nodes with VDom nodes', () => {
            const textNode = VDom.createText({ text: 'Linked' });
            const tagNode = VDom.createTag({
                tag: 'div',
                children: [textNode]
            });

            const domDiv = document.createElement('div');
            const domText = document.createTextNode('Linked');
            domDiv.appendChild(domText);

            VDom.link(domDiv, tagNode);
            
            expect(tagNode.element).toBe(domDiv);
            expect(textNode.element).toBe(domText);
        });
    });

    describe('Node Updates', () => {
        let container: HTMLElement;

        beforeEach(() => {
            container = document.createElement('div');
            document.body.appendChild(container);
        });

        afterEach(() => {
            document.body.removeChild(container);
        });

        test('update should modify text content', () => {
            const oldNode = VDom.createText({ text: 'Old' });
            const newNode = VDom.createText({ text: 'New' });
            
            const domNode = VDom.build(oldNode);
            VDom.link(domNode, oldNode);
            container.appendChild(domNode);
            
            VDom.update(oldNode, newNode);
            expect(domNode.textContent).toBe('New');
        });

        test('update should handle class changes', () => {
            const oldNode = VDom.createTag({
                tag: 'div',
                props: { classes: ['old-class'] }
            });
            const newNode = VDom.createTag({
                tag: 'div',
                props: { classes: ['new-class'] }
            });
            
            const domNode = VDom.build(oldNode) as HTMLElement;
            VDom.link(domNode, oldNode);
            container.appendChild(domNode);
            
            VDom.update(oldNode, newNode);
            expect(domNode.classList.contains('old-class')).toBe(false);
            expect(domNode.classList.contains('new-class')).toBe(true);
        });

        test('update should handle keyed children', () => {
            const oldNode = VDom.createTag({
                tag: 'ul',
                children: [
                    VDom.createTag({ tag: 'li', key: '1', children: [VDom.createText({ text: 'Item 1' })] }),
                    VDom.createTag({ tag: 'li', key: '2', children: [VDom.createText({ text: 'Item 2' })] })
                ]
            });

            const newNode = VDom.createTag({
                tag: 'ul',
                children: [
                    VDom.createTag({ tag: 'li', key: '2', children: [VDom.createText({ text: 'Item 2 Updated' })] }),
                    VDom.createTag({ tag: 'li', key: '3', children: [VDom.createText({ text: 'Item 3' })] })
                ]
            });

            const domNode = VDom.build(oldNode) as HTMLElement;
            VDom.link(domNode, oldNode);
            container.appendChild(domNode);

            // Store references to original elements
            const originalItem2 = (oldNode.children[1] as VDom.TagNode).element;

            VDom.update(oldNode, newNode);
            VDom.link(domNode, newNode);

            // Should preserve element with key="2" but update content
            expect(domNode.children.length).toBe(2);
            expect(domNode.children[0].textContent).toBe('Item 2 Updated');
            expect(domNode.children[1].textContent).toBe('Item 3');
            expect((newNode.children[0] as VDom.TagNode).element).toBe(originalItem2);
        });
    });
});

describe('Edge Cases', () => {
    test('should handle empty text nodes', () => {
        const node = VDom.createText({ text: '' });
        const domNode = VDom.build(node);
        expect(domNode.textContent).toBe('');
    });

    test('should update from text node to element node', () => {
        const oldNode = VDom.createText({ text: 'text' });
        const newNode = VDom.createTag({ tag: 'div' });
        
        const domNode = VDom.build(oldNode);
        VDom.link(domNode, oldNode);
        
        VDom.update(oldNode, newNode);
        expect((domNode as HTMLElement).tagName).toBe('DIV');
    });

    test('should handle undefined/null props gracefully', () => {
        const node = VDom.createTag({
            tag: 'div',
            props: undefined as any,
            children: undefined as any
        });
        expect(node.props.classes).toEqual([]);
        expect(node.props.styles).toEqual({});
        expect(node.children).toEqual([]);
    });
});

describe('Performance', () => {
    test('should handle 1000 nodes efficiently', () => {
        const start = performance.now();
        
        let root = VDom.createTag({ tag: 'div' });
        for (let i = 0; i < 1000; i++) {
            root.children.push(VDom.createTag({
                tag: 'span',
                key: `node-${i}`,
                props: { classes: [`class-${i % 10}`] }
            }));
        }
        
        const domRoot = VDom.build(root);
        VDom.link(domRoot, root);
        
        console.log(`1000 nodes took ${performance.now() - start}ms`);
        expect(domRoot.childNodes.length).toBe(1000);
    });
});