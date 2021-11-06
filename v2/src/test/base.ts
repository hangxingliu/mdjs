
export class Logger {
  private readonly name: string
  private readonly startedAt: number
  constructor(name: string) {
    this.startedAt = Date.now();
    this.name = `[${name}]`;
  }
  getElapsed = () => {
    const seconds = Math.floor((Date.now() - this.startedAt) / 1000).toFixed(2);
    return `+${seconds}s`
  }
  log = (...args: any[]) => console.log(this.name, ...args, this.getElapsed());
  error = (...args: any[]) => console.error(this.name, ...args, this.getElapsed());
  warn = (...args: any[]) => console.warn(this.name, ...args, this.getElapsed());
  fatal = (...args: any[]) => {
    console.error(this.name, ...args, this.getElapsed());
    console.error(`test exit with code 1`);
    process.exit(1);
  }
}
