export class Reservation {

  constructor(
    private _id: number,
    private _owner: User,
    private _courseName: string,
    private _vmPool: VMPoolShort,
    private _machinesNumber: number,
    private _startTime: string,
    private _endTime: string,
    private _dates: string[]) {
  }

  get id(): number {
    return this._id;
  }

  get owner(): User {
    return this._owner;
  }

  get courseName(): string {
    return this._courseName;
  }

  get vmPool(): VMPoolShort {
    return this._vmPool;
  }

  get machinesNumber(): number {
    return this._machinesNumber;
  }

  get startTime(): string {
    return this._startTime;
  }

  get endTime(): string {
    return this._endTime;
  }

  get dates(): string[] {
    return this._dates;
  }

}