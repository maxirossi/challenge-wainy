<?php

namespace App\Domains\Deudores\Services;

use App\Domains\Deudores\Entities\Deudor;
use App\Domains\Deudores\Repositories\DeudorRepositoryInterface;
use App\Domains\Deudores\ValueObjects\Cuit;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use Illuminate\Support\Collection;

class DeudorDomainService
{
    public function __construct(
        private DeudorRepositoryInterface $deudorRepository
    ) {}

    /**
     * Obtiene el resumen consolidado de un deudor por CUIT
     */
    public function obtenerResumenPorCuit(Cuit $cuit): array
    {
        $deudores = $this->deudorRepository->findByCuit($cuit);
        
        if ($deudores->isEmpty()) {
            return [
                'cuit' => $cuit->getValue(),
                'total_deuda' => 0,
                'cantidad_prestamos' => 0,
                'situacion_maxima' => null,
                'entidades' => []
            ];
        }

        $totalDeuda = $deudores->sum(fn($deudor) => $deudor->getMontoDeuda());
        $situacionMaxima = $this->determinarSituacionMaxima($deudores);
        $entidades = $this->agruparPorEntidades($deudores);

        return [
            'cuit' => $cuit->getValue(),
            'total_deuda' => $totalDeuda,
            'cantidad_prestamos' => $deudores->count(),
            'situacion_maxima' => $situacionMaxima,
            'entidades' => $entidades
        ];
    }

    /**
     * Obtiene el resumen consolidado por entidad financiera
     */
    public function obtenerResumenPorEntidad(CodigoEntidad $codigoEntidad): array
    {
        $deudores = $this->deudorRepository->findByEntidad($codigoEntidad);
        
        if ($deudores->isEmpty()) {
            return [
                'codigo_entidad' => $codigoEntidad->getValue(),
                'total_deuda' => 0,
                'cantidad_deudores' => 0,
                'deudores_irregulares' => 0,
                'deudores_vencidos' => 0
            ];
        }

        $totalDeuda = $deudores->sum(fn($deudor) => $deudor->getMontoDeuda());
        $deudoresIrregulares = $deudores->filter(fn($deudor) => $deudor->esSituacionIrregular())->count();
        $deudoresVencidos = $deudores->filter(fn($deudor) => $deudor->esDeudaVencida())->count();

        return [
            'codigo_entidad' => $codigoEntidad->getValue(),
            'total_deuda' => $totalDeuda,
            'cantidad_deudores' => $deudores->count(),
            'deudores_irregulares' => $deudoresIrregulares,
            'deudores_vencidos' => $deudoresVencidos
        ];
    }

    /**
     * Obtiene los top N deudores con mayor deuda
     */
    public function obtenerTopDeudores(int $limit): Collection
    {
        return $this->deudorRepository->findTopDeudores($limit);
    }

    /**
     * Determina la situación máxima entre varios deudores
     */
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
            $situacion = strtolower($deudor->getSituacion());
            $prioridad = $prioridades[$situacion] ?? 1;

            if ($prioridad > $prioridadMaxima) {
                $prioridadMaxima = $prioridad;
                $situacionMaxima = $situacion;
            }
        }

        return $situacionMaxima;
    }

    /**
     * Agrupa los deudores por entidades financieras
     */
    private function agruparPorEntidades(Collection $deudores): array
    {
        $entidades = [];

        foreach ($deudores as $deudor) {
            $codigoEntidad = $deudor->getCodigoEntidad()->getValue();
            
            if (!isset($entidades[$codigoEntidad])) {
                $entidades[$codigoEntidad] = [
                    'codigo' => $codigoEntidad,
                    'total_deuda' => 0,
                    'cantidad_prestamos' => 0
                ];
            }

            $entidades[$codigoEntidad]['total_deuda'] += $deudor->getMontoDeuda();
            $entidades[$codigoEntidad]['cantidad_prestamos']++;
        }

        return array_values($entidades);
    }
} 