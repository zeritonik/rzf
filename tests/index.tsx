import { initAt } from '@rzf/VDom';
import { Component } from '@rzf/Component';
import router, { Link, Route } from '@rzf/Router';

class App extends Component {
    state = {
        color: 'red'
    }

    componentDidMount(): void {
    }

    handleClick() {
        this.setState({ color: (this.state.color === 'red' ? 'blue' : 'red') });
    }

    render() {
        return [
            <div>
                <Route path="^/" exact component={Page} text="Home"/>
                <Route path="^/page/" component={Page} text="Page" />
                <Route path="^/about/" component={Page} text="About" />
    
                <Link to="/" style={{display: 'block'}}>Home</Link>
                <Link to="/page" style={{display: 'block'}}>Page</Link>
                <Link to="/about" style={{display: 'block'}}>About</Link>
            </div>
        ];
    }
}

class Page extends Component {
    render() {
        return [
            <div>
                <h1>{this.props.text}</h1>
            </div>
        ];
    }
}

const root = initAt(<App />, document.querySelector('#root')!);
console.log(root)
router.callRoutes();