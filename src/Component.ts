import { State } from "./State.js";
import { CallbackType } from "./State.js";


export type RzfElementType = HTMLElement & {
    rzf_component: Component
}


export class Component {
    protected static BASE_ELEMENT: string = "div";
    protected static BASE_ELEMENT_FUNCTION(): HTMLElement { return document.createElement(this.BASE_ELEMENT) };

    private _element: RzfElementType;
    private states: Map<State<any>, CallbackType<any>[]>;

    constructor(...args: any[]) {   
        this._element = (this.constructor as typeof Component).BASE_ELEMENT_FUNCTION() as RzfElementType;
        this._element.rzf_component = this;
        this._element.classList.add(this.constructor.name.toLowerCase());
        console.log(`Created component ${this.constructor.name}`);

        this.states = new Map();
        
        this.init(...args);

        this.build();
    }

    protected get element() {
        return this._element;
    }

    protected createState<T>(value: T) {
        console.log(`Created state for ${this.constructor.name}`);

        const state = new State(value);
        this.createCallback(state, (state: State<T>, prev: T, cur: T) => this.render(state, prev, cur));
        return state;
    }

    protected createCallback<T>(state: State<T>, callback: CallbackType<T>) {
        console.log(`Created callback "${callback}" on ${state.constructor.name} for ${this.constructor.name}`);

        this.states.set(state, this.states.get(state) || []);
        this.states.get(state).push(callback);

        state.addCallback(callback);
    }

    destroy() {
        console.log(`Destroying component ${this.constructor.name}`);

        this._element.remove();

        for (const [state, callbacks] of this.states.entries()) {
            console.log(`Removing [${callbacks}] callbacks from ${state.constructor.name} for ${this.constructor.name}`);
            state.removeCallbacks(callbacks);
        }
    }

    private init(...args: any[]) {
    }
    
    private build() {
    }

    private render<T>(state: State<T>, prev: T, cur: T) {
    }
}

export class RootComponent extends Component {
    protected static BASE_ELEMENT_FUNCTION(): HTMLElement { 
        return document.getElementById("root") ?? (()=>{throw new Error("Root element not found")})();
    };

    private observer: MutationObserver;

    constructor() {
        super();

        this.observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type !== "childList") {
                    return
                }

                mutation.removedNodes.forEach((node: RzfElementType) => {
                    node.rzf_component && node.rzf_component.destroy()
                }); // чистим за нашими компонентами
            })
        });

        this.observer.observe(this.element, { childList: true, subtree: true });
    }
}
