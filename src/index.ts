import Env from "./env";

const env = new Env();

console.log(`Argv: ${env.getArg()}`);
console.log(`Env: ${env.getEnv()}`);
