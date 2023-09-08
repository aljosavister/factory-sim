export interface FurnaceInterface {
  running: boolean,
  sensors: {
    furnaceTemperature: number,
    power: number,
  }
}

export class Furnace {
  furnace: FurnaceInterface;

  constructor() {
    this.furnace = {
      running: false,
      sensors: {
        furnaceTemperature: 23,
        power: 0
      }
    }
  }

  /**
   * Start furnace simulator
   * @param ms time in between simulation delays
   */
  public start(ms: number) {
    setInterval(()=> {

    }, delay)
  }

  /**
   * Return status of the furnace
   * @returns furnace status
   */
  public status(): FurnaceInterface {

    return this.furnace;
  }


  private runSimulation() {
    this.furnace.sensors
  }


}