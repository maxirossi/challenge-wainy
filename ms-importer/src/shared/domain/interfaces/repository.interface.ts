export interface IRepository<T, ID = string> {
  save(entity: T): Promise<void>;
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  delete(id: ID): Promise<void>;
  exists(id: ID): Promise<boolean>;
}

export interface IReadRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  exists(id: ID): Promise<boolean>;
}

export interface IWriteRepository<T, ID = string> {
  save(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}
