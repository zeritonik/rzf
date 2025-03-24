import { Component } from "../build/Component.js";

import { userState } from "./UserState.js";

// Навигация
export class Nav extends Component {
    static BASE_ELEMENT = "nav" // установка базового элемента
    init(pageState) {
        this.createCallback(userState, () => this.build()); // перестраиваем навигацию при изменении пользователя

        this.pageState = pageState;
        this.createCallback(this.pageState, () => this.build()); // меняем активную навигацию при изменении страницы

        this.element.addEventListener("click", e => { // меняем страницу при клике
            if (e.target.dataset.page) {
                e.preventDefault();
                this.pageState.setState(e.target.dataset.page);
            }
        })
    }

    build() {
        this.element.innerHTML = "";

        const items = userState.getState() ? { // если пользователь авторизован
            "home": {
                text: "Home",
                href: "/",
            },
            "logout": {
                text: "Logout",
                href: "/logout",
            },
            "profile": {
                text: userState.getState().login,
                href: "",
            }
        } : { // если пользователь не авторизован
            "home": {
                text: "Home",
                href: "/",
            },
            "login": {
                text: "Login",
                href: "/login",
            }
        };

        for (let [key, item] of Object.entries(items)) {
            const a = document.createElement("a");
            a.href = item.href;
            a.textContent = item.text;
            a.dataset.page = key;
            this.pageState.getState() === key && a.classList.add("active");

            this.element.appendChild(a);
        }
    }

    render (state, prev, cur) {
        switch (state) {
            case this.pageState:
                // меняем активную навигацию
                const prev_link = this.element.querySelector(`a[data-page="${prev}"]`)
                const cur_link = this.element.querySelector(`a[data-page="${cur}"]`)
        
                prev_link && prev_link.classList.remove("active");
                cur_link && cur_link.classList.add("active");
                break;
        }
    }
}
