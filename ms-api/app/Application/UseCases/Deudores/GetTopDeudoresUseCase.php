<?php

namespace App\Application\UseCases\Deudores;

use App\Domains\Deudores\Services\DeudorDomainService;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class GetTopDeudoresUseCase
{
    public function __construct(
        private DeudorDomainService $deudorDomainService
    ) {}

    public function execute(int $limit): Collection
    {
        if ($limit <= 0 || $limit > 100) {
            throw new InvalidArgumentException('El límite debe estar entre 1 y 100');
        }

        return $this->deudorDomainService->obtenerTopDeudores($limit);
    }
} 