<?php

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domains\EntidadesFinancieras\Entities\EntidadFinanciera;
use App\Domains\EntidadesFinancieras\Repositories\EntidadFinancieraRepositoryInterface;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use App\Models\EntidadFinanciera as EntidadFinancieraModel;
use Illuminate\Support\Collection;

class EloquentEntidadFinancieraRepository implements EntidadFinancieraRepositoryInterface
{
    public function save(EntidadFinanciera $entidad): EntidadFinanciera
    {
        $model = EntidadFinancieraModel::fromDomainEntity($entidad);
        $model->save();
        
        return $model->toDomainEntity();
    }
    
    public function findByCodigo(CodigoEntidad $codigo): ?EntidadFinanciera
    {
        $model = EntidadFinancieraModel::where('codigo', $codigo->getValue())->first();
        
        return $model ? $model->toDomainEntity() : null;
    }
    
    public function findAll(): Collection
    {
        return EntidadFinancieraModel::all()
            ->map(fn($model) => $model->toDomainEntity());
    }
    
    public function findActivas(): Collection
    {
        return EntidadFinancieraModel::activas()
            ->get()
            ->map(fn($model) => $model->toDomainEntity());
    }
    
    public function findByTipo(string $tipo): Collection
    {
        return EntidadFinancieraModel::where('tipo_entidad', $tipo)
            ->get()
            ->map(fn($model) => $model->toDomainEntity());
    }
    
    public function delete(CodigoEntidad $codigo): bool
    {
        return EntidadFinancieraModel::where('codigo', $codigo->getValue())->delete() > 0;
    }
    
    public function exists(CodigoEntidad $codigo): bool
    {
        return EntidadFinancieraModel::where('codigo', $codigo->getValue())->exists();
    }
} 