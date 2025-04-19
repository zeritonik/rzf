import { VDom } from "../src/VDom.js";

const node: VDom.Node = VDom.createTag({
    tag: 'div',
    props: {
        classes: ['class1', 'class2'],
        styles: {
            color: 'red',
            display: 'flex',
            'flex-direction': 'column',
        }
    },
    children: [
        VDom.createTag({ tag: 'span', props: {}, children: [VDom.createText('aboba1')] }),
        VDom.createText('text1'),
        VDom.createTag({ tag: 'span', props: {}, children: [VDom.createText('aboba2')] }),
    ],
});

const html = VDom.build(node);
VDom.link(html, node);

document.body.appendChild(html);

setTimeout(() => {
    const newNode: VDom.Node = VDom.createTag({
        tag: 'div',
        props: {
            classes: ['class1', 'class2'],
            styles: {
                color: 'blue',
                display: 'flex',
                'flex-direction': 'column',
            }
        },
        children: [
            VDom.createTag({ tag: 'span', props: {}, children: [VDom.createText('aboba2')] }),
            VDom.createText('text2'),
            VDom.createTag({ tag: 'span', props: {}, children: [VDom.createText('aboba3')] }),
        ],
    });
    VDom.update(node, newNode);
    VDom.link(html, newNode);
}, 1000);