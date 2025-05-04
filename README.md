
# RZF - Lightweight Virtual DOM

A minimalistic, performant Virtual DOM library for building reactive UI components with full JSX and TypeScript support.

## Features

- **Component-based architecture** with lifecycle methods
- **Efficient DOM updates** with keyed diffing algorithm
- **Integrated router** for single-page applications
- **TypeScript-first** design with complete JSX typings
- **Tiny footprint** (~10KB minified)
- **No external dependencies**

## Usage Examples

### 1. Basic Component
	import { Component } from './Component';

	class Counter extends Component {
	  state = { count: 0 };

	  increment = () => this.setState({ count: this.state.count + 1 });

	  render() {
	    return [
	      <div class="counter">
	        <p>Count: {this.state.count}</p>
	        <button onClick={this.increment}>Increment</button>
	      </div>
	    ];
	  }
	}

###  2. Conditional Rendering
	class UserGreeting extends Component {
	  render() {
	    return [
	      <div>
	        {this.props.isLoggedIn ? (
	          <h1>Welcome back!</h1>
	        ) : (
	          <button onClick={this.props.onLogin}>Log In</button>
	        )}
	      </div>
	    ];
	  }
	}

### 3. List Rendering with Keys
	class TodoList extends Component {
	  state = {
	    todos: [
	      { id: 1, text: 'Learn VDOM' },
	      { id: 2, text: 'Build app' }
	    ]
	  };

	  render() {
	    return [
	      <ul>
	        {this.state.todos.map(todo => (
	          <li key={todo.id}>{todo.text}</li>
	        ))}
	      </ul>
	    ];
	  }
	}

### 4. Form Handling
	class ContactForm extends Component {
	  state = { name: '', email: '' };

	  handleSubmit = (e: Event) => {
	    e.preventDefault();
	    console.log('Submitted:', this.state);
	  };

	  render() {
	    return [
	      <form onSubmit={this.handleSubmit}>
	        <input
	          type="text"
	          value={this.state.name}
	          onChange={(e) => this.setState({ name: e.target.value })}
	          placeholder="Name"
	        />
	        <input
	          type="email"
	          value={this.state.email}
	          onChange={(e) => this.setState({ email: e.target.value })}
	          placeholder="Email"
	        />
	        <button type="submit">Send</button>
	      </form>
	    ];
	  }
	}

### 5. Lifecycle Methods
	class DataLoader extends Component {
	  state = { data: null, loading: true };

	  componentDidMount() {
	    fetch('/api/data')
	      .then(res => res.json())
	      .then(data => this.setState({ data, loading: false }))
	      .catch(() => this.setState({ loading: false }));
	  }

	  componentWillUnmount() {
	    // Clean up resources
	  }

	  render() {
	    if (this.state.loading) return [<div>Loading...</div>];
	    if (!this.state.data) return [<div>Error loading data</div>];
	    return [<div>{JSON.stringify(this.state.data)}</div>];
	  }
	}

### 6. Router Implementation
	import { Route, Link } from './Router';

	class App extends Component {
		render = () => [
			<nav>
				<Link to="/">Home</Link>
				<Link to="/about">About</Link>
				<Link to="/users/42">User Profile</Link>
			</nav>,
			<main>
				<Route path="/" exact component={HomePage} />
				<Route path="/about" component={AboutPage} />
				<Route path="/users/:id<int>" component={UserProfile} />
			</main>
		];
	}

	class UserProfile extends Component {
	  render() {
	    const { id } = this.props; // Access route params
	    return [<h1>User ID: {id}</h1>];
	  }
	}

## Core API Reference

### Virtual DOM Functions

`h()`

Creates VNodes (used by JSX transpiler)

`render()`

Mounts VDOM tree to real DOM

`update()`

Efficiently patches DOM based on VDOM changes

### Component Class
	abstract class Component {
	  // Current component props
	  props: Record<string, any>;
	  
	  // Current component state
	  state: Record<string, any>;
	  
	  // Update state and trigger re-render
	  setState(state: Partial<this['state']>): void;
	  
	  // Lifecycle methods
	  componentDidMount(): void;
	  componentWillUnmount(): void;
	  componentShouldUpdate?(nextProps: any, nextState: any): boolean;
	  
	  // Required render method
	  abstract render(): VNode[];
	}

### Router API
`<Route>`

Renders component when path matches

`<Link>`

Navigation link that doesn't reload page

`router.push()`

Programmatic navigation

`router.replace()`

Navigation without history entry
    

## TypeScript Integration
1.  Add to `tsconfig.json`:
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "./src/vdom"
  }
