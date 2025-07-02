export interface IUnitOfWork {
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

export interface IUnitOfWorkFactory {
  create(): Promise<IUnitOfWork>;
}
