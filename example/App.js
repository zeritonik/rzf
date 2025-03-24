import { RootComponent } from "../build/Component.js";

import { Nav } from "./Nav.js";
import { Home, Login, Logout } from "./Pages.js";

import { userState } from "./UserState.js";

// Корневой компонент приложения
export class App extends RootComponent {
    init() {
        // стейт активной страницы
        this.pageState = this.createState("home");

        // при изменении пользователя переключаемся на главную
        this.createCallback(userState, () => this.pageState.setState("home"));
    }

    build() {
        this.element.appendChild(new Nav(this.pageState).element);
        this.element.appendChild(new Home(this.pageState).element);
    }

    render(state, prev, cur) {
        const prev_page = this.element.querySelector(`.${prev}`);
        prev_page && prev_page.remove(); // убираем старую страницу

        switch (cur) { // добавляем новую
            case "home":
                this.element.appendChild(new Home(this.pageState).element);
                break;
            case "login":
                this.element.appendChild(new Login(this.pageState).element);
                break;
            case "logout":
                this.element.appendChild(new Logout(this.pageState).element);
                break;
        }
    }
}
