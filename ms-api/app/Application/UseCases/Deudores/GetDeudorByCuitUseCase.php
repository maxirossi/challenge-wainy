<?php

namespace App\Application\UseCases\Deudores;

use App\Domains\Deudores\Services\DeudorDomainService;
use App\Domains\Deudores\ValueObjects\Cuit;
use InvalidArgumentException;

class GetDeudorByCuitUseCase
{
    public function __construct(
        private DeudorDomainService $deudorDomainService
    ) {}

    public function execute(string $cuitString): array
    {
        try {
            $cuit = new Cuit($cuitString);
            return $this->deudorDomainService->obtenerResumenPorCuit($cuit);
        } catch (InvalidArgumentException $e) {
            throw new InvalidArgumentException('CUIT inválido: ' . $e->getMessage());
        }
    }
} 