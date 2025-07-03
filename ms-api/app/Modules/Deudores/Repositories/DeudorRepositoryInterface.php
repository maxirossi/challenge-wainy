<?php

namespace App\Modules\Deudores\Repositories;

use App\Modules\Deudores\Entities\Deudor;
use App\Modules\Deudores\ValueObjects\Cuit;
use App\Modules\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use Illuminate\Support\Collection;

interface DeudorRepositoryInterface
{
    public function save(Deudor $deudor): Deudor;
    
    public function getAll(): Collection;
    
    public function findByCuit(Cuit $cuit): Collection;
    
    public function findByEntidad(CodigoEntidad $codigoEntidad): Collection;
    
    public function findTopDeudores(int $limit, ?string $situacion = null): Collection;
    
    public function findBySituacion(string $situacion): Collection;
    
    public function getResumenPorCuit(Cuit $cuit): array;
    
    public function getResumenPorEntidad(CodigoEntidad $codigoEntidad): array;
    
    public function deleteByCuit(Cuit $cuit): bool;
    
    public function deleteByEntidad(CodigoEntidad $codigoEntidad): bool;
} 