import h from '../src/jsx';
import { Component } from '../src/Component';
import { Route, Link } from '../src/Router';
import vdom from '../src/VDom';

class App extends Component {
    render() {
        return (
            <div>
                <Route path="/home">
                    <h1>Home</h1>
                </Route>
                <Route path="/about">
                    <h1>About</h1>
                </Route>
                <Link to="/home">Home</Link>
                <Link to="/about">About</Link>
            </div>
        );
    }
}

// Mount to DOM
const rootElement = document.querySelector('div#root') as HTMLDivElement;
vdom.bind(rootElement);
const app = <App />
vdom.build(app);
console.log(vdom);


// setInterval(() => {
//     console.log(app.toString());
// }, 3000)