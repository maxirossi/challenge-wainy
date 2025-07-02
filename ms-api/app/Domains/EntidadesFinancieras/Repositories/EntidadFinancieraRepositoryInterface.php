<?php

namespace App\Domains\EntidadesFinancieras\Repositories;

use App\Domains\EntidadesFinancieras\Entities\EntidadFinanciera;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use Illuminate\Support\Collection;

interface EntidadFinancieraRepositoryInterface
{
    public function save(EntidadFinanciera $entidad): EntidadFinanciera;
    
    public function findByCodigo(CodigoEntidad $codigo): ?EntidadFinanciera;
    
    public function findAll(): Collection;
    
    public function findActivas(): Collection;
    
    public function findByTipo(string $tipo): Collection;
    
    public function delete(CodigoEntidad $codigo): bool;
    
    public function exists(CodigoEntidad $codigo): bool;
} 