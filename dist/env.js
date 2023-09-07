"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Env {
    getEnv() {
        return JSON.stringify(process.env);
    }
    getArg() {
        return JSON.stringify(process.argv);
    }
}
exports.default = Env;
//# sourceMappingURL=env.js.map