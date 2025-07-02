export class Debtor {
  constructor(
    public readonly cuit: string,
    public maxSituation: number,
    public totalLoans: number,
  ) {
    if (!/^\d{11}$/.test(cuit)) throw new Error('Invalid CUIT format');
  }

  updateLoans(situation: number, amount: number): void {
    this.maxSituation = Math.max(this.maxSituation, situation);
    this.totalLoans += amount;
  }
} 