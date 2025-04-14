
# rzf 

**Как оно работает:**

1.  `State` представляет собой хранилище для какого-то значения и `Observable` паттерн для установки, вызова и очистки колбеков на изменения этого значения.
	-
	1.  `addCallback` добавляет колбек на изменение значения

	2.  `removeCallbacks` убирает колбеки

	3.  `setState` изменяет значение и вызывает колбеки в порядке обратном добавлению

	4.  `getState` возвращает текущее хранимое значение
	
	Чаще всего стейты будут использоваться вместе с компонентами, потому что это удобный способ хранить значения, обновление которых должно привести к обновлению компонента. Но стейт может объявляться и вне компонента.
	Например стейт для информации о пользователе в текущей сессии
	
		// userState.ts
		export  const  userState:  State<YourUser> =  new  State(...);
		// login.ts
		const  response  =  await  API.postSignup(data);
		userState.setState(response.body);

2.  `Component` - базовый класс для компонентов.
	- 
	-  К каждому компоненту привязывается html элемент, который является корнем дерева компонента.
	-  `element` - геттер для получения основного элемента компонента (этот элемент создаётся автоматически), по умолчанию это div, но этот элемент можно переопределить с помощью `static BASE_ELEMENT = 'form'` - поменяли элемент, который будет создан при создании на форму
	- В наследуемых классах можно переопределить методы: 
		- `build` - метод для построения компонента. Вызывается 1 раз автоматически. Этот метод будет вызван с аргументами, переданными в конструктор при создании компонента
		- `render` - метод для небольших изменений в компоненте, например отображаемых данных, или 
		- `init` - метод для пользовательской инициализации компонента до автоматического вызова
		- `destroy` - метод вызываемый автоматически, когда `component.element пропадает` из `DOM`, при изменении этого метода в наследовании **ВСЕГДА ВЫЗЫВАЙТЕ `super.destroy()`**
	- Методы для работы с `State` внутри компонента, т.к. компоненты должны автоматически удалять все созданные ими стейты и колбеки, что бы упростить жизнь в контроле этого процесса вводятся 2 метода.
		- `createState<T>(value:  T): State<T>` - метод для создания состояния и инициализацией указаным значением. Компонент автоматически удалит это состояние при своём удалении. Созданные стейты сразу получают колбек, вызывающий метод `render`.
		- `createCallback<T>(state:  State<T>, callback:  CallbackType<T>)` - метод для создания колбека на любом стейте, при удалении компонента удалится только созданные им колбеки
	-  `RootComponent` - Особый класс, являющийся потомком `Component`. Его `element` устанавливается по селектору `div#root`. В вашем приложении **ОБЯЗАТЕЛЬНО ДОЛЖЕН БЫТЬ ЕДИНИНСТВЕННЫЙ** экземпля /потомок этого класса. Он нужен для корретного удаления компонентов со страницы.
	Пример использования:
	
			// App.ts
			export  default  class  App  extends  RootComponent {
				protected  init() {
					console.log('App init');
				}
				protected  build() {
					// добавляем компонент с разметкой
					this.element.appendChild(new  MainLayout().element); 
				}
			}
			// MainLayout.ts
			export  class  MainLayout  extends  Component  implements  Routable {
				сontent: State<Component>;
				  
				protected  init() {
					this.element.classList.add('main-layout');  // добавляем класс с лейаутом
					this.content  =  this.createState(null)
				}
				protected build() {
					this.element.appendChild(new  Header());
					// отображаем 1ую страницу в которой например кнопка для смены страницы
					this.content.setState(new Page1(this.content));
					this.element.append(Child(new  Footer());
				}
				protected  render(state:  State<any>, prev:  any, cur:  any) {
					prev && prev.element.remove(); // удаляем старую страницу
					cur && this.element.appendChild(cur); // добавляем новую (Page2, на которую переключил Page1)
				}
			}
3. `Router` - роутер
	-
	- `class Route` - класс представляющий собой хранилище для регулярного выражения url и удобный способ для конструирования ссылки в приложении.
		- `constructor(path:  string, build?: (params:  any)=>string)` - path - регулярное выражение, к которому будет применяться текущий путь + хэш, build - ваша функция для преобразования роута в url с помощью метода `build(params: any): string`
		- `get path` - возвращает path
		- `match(url: string)` - буквально делает `return url.match(this.path + '(?!\\w)')`
	- `Router` - ещё один `Observable` с особым функционалом, зависящем от ссылки в адресной строке. Он экспортируется синглтоном, то есть имеется доступ только к уже созданному экземпляру.
		- `Routable` - интерфейс с методом `onRoute(data:  CallbackData):  void;`
		- `CallbackData`
				
				type  CallbackData  = {
					  route:  Route,  // объект сработевшего роута
					  params:  RegExpMatchArray,  // результат route.match(url)
					  searchParams:  URLSearchParams,  // параметры после ?
					  data:  any  // данные сохранённый по текущему url 
				};
		- `addCallback(route: Route, routable: Routable)` - добавляет `routable.onRoute(...)` к списку вызываемых колбеков при изменении url на `route.path`
		- `removeCallback(route: Route, routable: Routable)` - соотвественно удаляет колбек, этот метод не вызывается автоматически, вызывайте его вручную, если используете `rzf.Component`, то это удобно делать в `destroy`!
		- `callCallback(route:  Route, routable:  Routable)` - метод нужный, что бы инициализировать ваш `Routable` текущим роутом (получить все данные CallbackData)
		- `pushUrl(url:  string, data:  any)` - метод, меняющий url в поисковой строки через `pushState` `HistoryApi`, data - данные которые положить в историю
		- `replaceUrl(url:  string, data:  any)` - метод, меняющий url в поисковой строки через `replaceState` `HistoryApi`, data - данные которые положить в историю
		- **Так же роутер содержит несколько полезных методов для получения информации о текущем url**
			- `getRoute():  string` - возвращает path + hash
			- `getPath(): string` - возвращает path
			- `getSearch():  URLSearchParams` - возвращает queryParams ( то что после ? )
			- `getHash():  string` - возвращает хэш ( с # до ? )
		
			Пример (продолжение предыдущего примера):
				
				// routes.ts
				export const routes = {
				    pageRoute: new Route('^/(tracks|albums|artists|)'),
				    authRoute: new Route('#(login|register)'),
				}
				
				// MainLayout
				export class MainLayout extends Component implements Routable {
				    header: Header;
				    playlists: Playlists;
				    child: State<Component>;
				    popup: State<Component>;

				    protected init() {
				        this.element.classList.add('main-layout');

				        this.child = this.createState(null);
				        this.popup = this.createState(null);
				        Router.addCallback(routes.pageRoute, this);
				        Router.addCallback(routes.authRoute, this);
				    }

				    protected build() {
				        this.header = new Header();
				        this.playlists = new Playlists();

				        this.element.appendChild(this.header.element);
				        this.element.appendChild(this.playlists.element);

				        Router.callCallback(routes.pageRoute, this);
				        Router.callCallback(routes.authRoute, this);
				    }

				    protected render(state: State<any>, prev: any, cur: any): void {
				        switch (state) {
				            case this.child:
				                prev && prev.element.remove();
				                this.element.appendChild(cur.element);
				                break;
				            case this.popup:
				                prev && prev.destroy();
				                cur && this.element.appendChild(cur.element);
				                break;
				        }
				    }

				    destroy() {
				        super.destroy();

				        Router.removeCallback(routes.pageRoute, this);
				        Router.removeCallback(routes.authRoute, this);
				    }

				    onRoute({ route, params }: CallbackData) {
				        switch (route) {
				            case routes.authRoute:
				                switch (params[1]) {
				                    case 'login':
				                        this.popup.setState(new AuthForm('login'));
				                        break;
				                    case 'register':
				                        this.popup.setState(new AuthForm('register'));
				                        break;
				                    default:
				                        this.popup.setState(null);
				                }
				                break;
				            case routes.pageRoute:
				                switch (params[1]) {
				                    case '':
				                        this.child.setState(new MainPage());
				                        break;
				                    case 'tracks':
				                        this.child.setState(new TracksPage());
				                        break;
				                    case 'albums':
				                        this.child.setState(new AlbumsPage());
				                        break;
				                    case 'artists':
				                        this.child.setState(new ArtistsLayout());
				                        break;
				                }
				                break;
						    }
				 	    }
					}

