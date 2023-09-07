export default class Env {
  
  public getEnv() {
    return JSON.stringify(process.env);
  }

  public getArg() {
    return JSON.stringify(process.argv);
  }


}