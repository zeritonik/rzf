import { State } from "../build/State.js";

// стейт пользователя
export const userState = new class UserState extends State {
    constructor() {
        super(undefined);
    }
}(); // сделал так чтобы логи были с именем класса
