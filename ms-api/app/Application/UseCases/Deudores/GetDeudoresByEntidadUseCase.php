<?php

namespace App\Application\UseCases\Deudores;

use App\Domains\Deudores\Services\DeudorDomainService;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use InvalidArgumentException;

class GetDeudoresByEntidadUseCase
{
    public function __construct(
        private DeudorDomainService $deudorDomainService
    ) {}

    public function execute(string $codigoEntidad): array
    {
        try {
            $codigo = new CodigoEntidad($codigoEntidad);
            return $this->deudorDomainService->obtenerResumenPorEntidad($codigo);
        } catch (InvalidArgumentException $e) {
            throw new InvalidArgumentException('Código de entidad inválido: ' . $e->getMessage());
        }
    }
} 