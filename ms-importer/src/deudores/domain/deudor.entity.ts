import { CuitValueObject } from './value-objects/cuit.value-object';
import { SituacionValueObject } from './value-objects/situacion.value-object';
import { MontoValueObject } from './value-objects/monto.value-object';

export class Deudor {
  private readonly _cuit: CuitValueObject;
  private readonly _maxSituation: SituacionValueObject;
  private readonly _totalLoans: MontoValueObject;

  constructor(cuit: string, situation: number, amount: number) {
    this._cuit = new CuitValueObject(cuit);
    this._maxSituation = new SituacionValueObject(situation);
    this._totalLoans = new MontoValueObject(amount);
  }

  get cuit(): string {
    return this._cuit.valor;
  }

  get maxSituation(): number {
    return this._maxSituation.valor;
  }

  get totalLoans(): number {
    return this._totalLoans.valor;
  }

  get formattedTotalLoans(): string {
    return this._totalLoans.formatearComoMoneda();
  }

  updateLoans(situation: number, amount: number): void {
    const newSituation = new SituacionValueObject(situation);
    const newAmount = new MontoValueObject(amount);

    // Actualizar la situación máxima si la nueva es mayor
    if (newSituation.valor > this._maxSituation.valor) {
      Object.assign(this, { _maxSituation: newSituation });
    }

    // Sumar el nuevo monto al total
    const updatedAmount = this._totalLoans.sumar(newAmount);
    Object.assign(this, { _totalLoans: updatedAmount });
  }
} 