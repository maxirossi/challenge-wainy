<?php

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domains\Deudores\Entities\Deudor;
use App\Domains\Deudores\Repositories\DeudorRepositoryInterface;
use App\Domains\Deudores\ValueObjects\Cuit;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use App\Models\Deudor as DeudorModel;
use Illuminate\Support\Collection;

class EloquentDeudorRepository implements DeudorRepositoryInterface
{
    public function save(Deudor $deudor): Deudor
    {
        $model = DeudorModel::fromDomainEntity($deudor);
        $model->save();
        
        return $model->toDomainEntity();
    }
    
    public function getAll(): Collection
    {
        return DeudorModel::all()
            ->map(fn($model) => $model->toDomainEntity());
    }
    
    public function findByCuit(Cuit $cuit): Collection
    {
        return DeudorModel::where('cuit', $cuit->getValue())
            ->get()
            ->map(fn($model) => $model->toDomainEntity());
    }
    
    public function findByEntidad(CodigoEntidad $codigoEntidad): Collection
    {
        return DeudorModel::where('codigo_entidad', $codigoEntidad->getValue())
            ->get()
            ->map(fn($model) => $model->toDomainEntity());
    }
    
    public function findTopDeudores(int $limit, ?string $situacion = null): Collection
    {
        $query = DeudorModel::select('cuit')
            ->selectRaw('SUM(monto_deuda) as total_deuda')
            ->selectRaw('COUNT(*) as cantidad_prestamos');
        if ($situacion) {
            $query->where('situacion', $situacion);
        }
        $query->groupBy('cuit')
            ->orderByDesc('total_deuda')
            ->limit($limit);
        return $query->get()
            ->map(function ($item) {
                return [
                    'cuit' => $item->cuit,
                    'total_deuda' => (float) $item->total_deuda,
                    'cantidad_prestamos' => $item->cantidad_prestamos
                ];
            });
    }
    
    public function findBySituacion(string $situacion): Collection
    {
        return DeudorModel::where('situacion', $situacion)
            ->get()
            ->map(fn($model) => $model->toDomainEntity());
    }
    
    public function getResumenPorCuit(Cuit $cuit): array
    {
        $deudores = DeudorModel::where('cuit', $cuit->getValue())->get();
        
        if ($deudores->isEmpty()) {
            return [
                'cuit' => $cuit->getValue(),
                'total_deuda' => 0,
                'cantidad_prestamos' => 0,
                'situacion_maxima' => null
            ];
        }
        
        $totalDeuda = $deudores->sum('monto_deuda');
        $situacionMaxima = $this->determinarSituacionMaxima($deudores);
        
        return [
            'cuit' => $cuit->getValue(),
            'total_deuda' => (float) $totalDeuda,
            'cantidad_prestamos' => $deudores->count(),
            'situacion_maxima' => $situacionMaxima
        ];
    }
    
    public function getResumenPorEntidad(CodigoEntidad $codigoEntidad): array
    {
        $deudores = DeudorModel::where('codigo_entidad', $codigoEntidad->getValue())->get();
        
        if ($deudores->isEmpty()) {
            return [
                'codigo_entidad' => $codigoEntidad->getValue(),
                'total_deuda' => 0,
                'cantidad_deudores' => 0,
                'deudores_irregulares' => 0
            ];
        }
        
        $totalDeuda = $deudores->sum('monto_deuda');
        $deudoresIrregulares = $deudores->whereIn('situacion', ['irregular', 'vencida', 'morosa'])->count();
        
        return [
            'codigo_entidad' => $codigoEntidad->getValue(),
            'total_deuda' => (float) $totalDeuda,
            'cantidad_deudores' => $deudores->count(),
            'deudores_irregulares' => $deudoresIrregulares
        ];
    }
    
    public function deleteByCuit(Cuit $cuit): bool
    {
        return DeudorModel::where('cuit', $cuit->getValue())->delete() > 0;
    }
    
    public function deleteByEntidad(CodigoEntidad $codigoEntidad): bool
    {
        return DeudorModel::where('codigo_entidad', $codigoEntidad->getValue())->delete() > 0;
    }
    
    private function determinarSituacionMaxima(Collection $deudores): string
    {
        $prioridades = [
            'irregular' => 4,
            'vencida' => 3,
            'morosa' => 2,
            'normal' => 1
        ];
        
        $situacionMaxima = 'normal';
        $prioridadMaxima = 1;
        
        foreach ($deudores as $deudor) {
            $situacion = strtolower($deudor->situacion);
            $prioridad = $prioridades[$situacion] ?? 1;
            
            if ($prioridad > $prioridadMaxima) {
                $prioridadMaxima = $prioridad;
                $situacionMaxima = $situacion;
            }
        }
        
        return $situacionMaxima;
    }
} 