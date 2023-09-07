"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = __importDefault(require("./env"));
const env = new env_1.default();
console.log(`Argv: ${env.getArg()}`);
console.log(`Env: ${env.getEnv()}`);
//# sourceMappingURL=index.js.map