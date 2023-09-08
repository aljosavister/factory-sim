export default class Env {
    getEnv() {
        return JSON.stringify(process.env);
    }
    getArg() {
        return JSON.stringify(process.argv);
    }
}
//# sourceMappingURL=env.js.map