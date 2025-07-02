<?php

namespace App\Application\UseCases\EntidadesFinancieras;

use App\Domains\Deudores\Services\DeudorDomainService;
use App\Domains\EntidadesFinancieras\Repositories\EntidadFinancieraRepositoryInterface;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use InvalidArgumentException;

class GetEntidadByCodigoUseCase
{
    public function __construct(
        private EntidadFinancieraRepositoryInterface $entidadRepository,
        private DeudorDomainService $deudorDomainService
    ) {}

    public function execute(string $codigoString): array
    {
        try {
            $codigo = new CodigoEntidad($codigoString);
            $entidad = $this->entidadRepository->findByCodigo($codigo);
            
            if (!$entidad) {
                return [
                    'codigo' => $codigo->getValue(),
                    'nombre' => null,
                    'tipo_entidad' => null,
                    'activa' => false,
                    'resumen_deudores' => $this->deudorDomainService->obtenerResumenPorEntidad($codigo)
                ];
            }

            return [
                'codigo' => $entidad->getCodigo()->getValue(),
                'nombre' => $entidad->getNombre(),
                'tipo_entidad' => $entidad->getTipoEntidad(),
                'activa' => $entidad->isActiva(),
                'resumen_deudores' => $this->deudorDomainService->obtenerResumenPorEntidad($codigo)
            ];
        } catch (InvalidArgumentException $e) {
            throw new InvalidArgumentException('Código de entidad inválido: ' . $e->getMessage());
        }
    }
} 