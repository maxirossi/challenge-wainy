<?php

namespace App\Domains\Deudores\Repositories;

use App\Domains\Deudores\Entities\Deudor;
use App\Domains\Deudores\ValueObjects\Cuit;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use Illuminate\Support\Collection;

interface DeudorRepositoryInterface
{
    public function save(Deudor $deudor): Deudor;
    
    public function findByCuit(Cuit $cuit): Collection;
    
    public function findByEntidad(CodigoEntidad $codigoEntidad): Collection;
    
    public function findTopDeudores(int $limit): Collection;
    
    public function findBySituacion(string $situacion): Collection;
    
    public function getResumenPorCuit(Cuit $cuit): array;
    
    public function getResumenPorEntidad(CodigoEntidad $codigoEntidad): array;
    
    public function deleteByCuit(Cuit $cuit): bool;
    
    public function deleteByEntidad(CodigoEntidad $codigoEntidad): bool;
} 