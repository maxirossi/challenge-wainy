<?php

namespace Tests\Unit\Repositories;

use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentDeudorRepository;
use App\Domains\Deudores\Entities\Deudor;
use App\Domains\Deudores\ValueObjects\Cuit;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use App\Domains\EntidadesFinancieras\Entities\EntidadFinanciera;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentEntidadFinancieraRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EloquentDeudorRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private EloquentDeudorRepository $repository;
    private EloquentEntidadFinancieraRepository $entidadRepository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->repository = new EloquentDeudorRepository();
        $this->entidadRepository = new EloquentEntidadFinancieraRepository();
    }

    public function test_saves_deudor_successfully(): void
    {
        // Crear entidad financiera primero
        $entidad = new EntidadFinanciera(
            new CodigoEntidad('BANCO001'),
            'Banco de la Nación Argentina',
            true,
            'banco'
        );
        $this->entidadRepository->save($entidad);

        // Crear deudor
        $deudor = new Deudor(
            new Cuit('20-12345678-9'),
            new CodigoEntidad('BANCO001'),
            'préstamo personal',
            150000.00,
            'normal',
            new \DateTime('2024-01-01T00:00:00Z')
        );

        $this->repository->save($deudor);

        // Verificar que se guardó en la base de datos
        $this->assertDatabaseHas('deudores', [
            'cuit' => '20-12345678-9',
            'codigo_entidad' => 'BANCO001',
            'tipo_deuda' => 'préstamo personal',
            'monto_deuda' => 150000.00,
            'situacion' => 'normal'
        ]);
    }

    public function test_finds_deudor_by_cuit(): void
    {
        // Crear entidad financiera
        $entidad = new EntidadFinanciera(
            new CodigoEntidad('BANCO001'),
            'Banco de la Nación Argentina',
            true,
            'banco'
        );
        $this->entidadRepository->save($entidad);

        // Crear y guardar deudor
        $deudor = new Deudor(
            new Cuit('20-12345678-9'),
            new CodigoEntidad('BANCO001'),
            'préstamo personal',
            150000.00,
            'normal',
            new \DateTime('2024-01-01T00:00:00Z')
        );
        $this->repository->save($deudor);

        // Buscar por CUIT
        $foundDeudor = $this->repository->findByCuit(new Cuit('20-12345678-9'));

        $this->assertNotNull($foundDeudor);
        $this->assertEquals('20-12345678-9', $foundDeudor->getCuit()->getValue());
        $this->assertEquals('BANCO001', $foundDeudor->getCodigoEntidad()->getValue());
        $this->assertEquals(150000.00, $foundDeudor->getMontoDeuda());
    }

    public function test_returns_null_for_nonexistent_cuit(): void
    {
        $foundDeudor = $this->repository->findByCuit(new Cuit('99-99999999-9'));

        $this->assertNull($foundDeudor);
    }

    public function test_finds_deudores_by_entidad(): void
    {
        // Crear entidad financiera
        $entidad = new EntidadFinanciera(
            new CodigoEntidad('BANCO001'),
            'Banco de la Nación Argentina',
            true,
            'banco'
        );
        $this->entidadRepository->save($entidad);

        // Crear múltiples deudores para la misma entidad
        $deudor1 = new Deudor(
            new Cuit('20-11111111-1'),
            new CodigoEntidad('BANCO001'),
            'préstamo personal',
            150000.00,
            'normal',
            new \DateTime('2024-01-01T00:00:00Z')
        );

        $deudor2 = new Deudor(
            new Cuit('20-22222222-2'),
            new CodigoEntidad('BANCO001'),
            'tarjeta de crédito',
            75000.50,
            'irregular',
            new \DateTime('2024-01-01T00:00:00Z')
        );

        $this->repository->save($deudor1);
        $this->repository->save($deudor2);

        // Buscar por entidad
        $deudores = $this->repository->findByEntidad(new CodigoEntidad('BANCO001'));

        $this->assertCount(2, $deudores);
        $this->assertEquals('20-11111111-1', $deudores[0]->getCuit()->getValue());
        $this->assertEquals('20-22222222-2', $deudores[1]->getCuit()->getValue());
    }

    public function test_finds_top_deudores(): void
    {
        // Crear entidad financiera
        $entidad = new EntidadFinanciera(
            new CodigoEntidad('BANCO001'),
            'Banco de la Nación Argentina',
            true,
            'banco'
        );
        $this->entidadRepository->save($entidad);

        // Crear múltiples deudores con diferentes montos
        $deudores = [
            new Deudor(new Cuit('20-11111111-1'), new CodigoEntidad('BANCO001'), 'préstamo', 200000.00, 'normal', new \DateTime()),
            new Deudor(new Cuit('20-22222222-2'), new CodigoEntidad('BANCO001'), 'préstamo', 150000.00, 'normal', new \DateTime()),
            new Deudor(new Cuit('20-33333333-3'), new CodigoEntidad('BANCO001'), 'préstamo', 300000.00, 'normal', new \DateTime()),
        ];

        foreach ($deudores as $deudor) {
            $this->repository->save($deudor);
        }

        // Buscar top 2 deudores
        $topDeudores = $this->repository->findTopDeudores(2);

        $this->assertCount(2, $topDeudores);
        $this->assertEquals('20-33333333-3', $topDeudores[0]->getCuit()->getValue()); // Mayor monto
        $this->assertEquals('20-11111111-1', $topDeudores[1]->getCuit()->getValue()); // Segundo mayor monto
    }

    public function test_finds_top_deudores_with_situacion_filter(): void
    {
        // Crear entidad financiera
        $entidad = new EntidadFinanciera(
            new CodigoEntidad('BANCO001'),
            'Banco de la Nación Argentina',
            true,
            'banco'
        );
        $this->entidadRepository->save($entidad);

        // Crear deudores con diferentes situaciones
        $deudores = [
            new Deudor(new Cuit('20-11111111-1'), new CodigoEntidad('BANCO001'), 'préstamo', 200000.00, 'normal', new \DateTime()),
            new Deudor(new Cuit('20-22222222-2'), new CodigoEntidad('BANCO001'), 'préstamo', 150000.00, 'irregular', new \DateTime()),
            new Deudor(new Cuit('20-33333333-3'), new CodigoEntidad('BANCO001'), 'préstamo', 300000.00, 'normal', new \DateTime()),
        ];

        foreach ($deudores as $deudor) {
            $this->repository->save($deudor);
        }

        // Buscar top deudores solo con situación 'normal'
        $topDeudores = $this->repository->findTopDeudores(5, 'normal');

        $this->assertCount(2, $topDeudores);
        $this->assertEquals('20-33333333-3', $topDeudores[0]->getCuit()->getValue());
        $this->assertEquals('20-11111111-1', $topDeudores[1]->getCuit()->getValue());
    }

    public function test_updates_existing_deudor(): void
    {
        // Crear entidad financiera
        $entidad = new EntidadFinanciera(
            new CodigoEntidad('BANCO001'),
            'Banco de la Nación Argentina',
            true,
            'banco'
        );
        $this->entidadRepository->save($entidad);

        // Crear deudor inicial
        $deudor = new Deudor(
            new Cuit('20-12345678-9'),
            new CodigoEntidad('BANCO001'),
            'préstamo personal',
            150000.00,
            'normal',
            new \DateTime('2024-01-01T00:00:00Z')
        );
        $this->repository->save($deudor);

        // Actualizar monto
        $deudorActualizado = new Deudor(
            new Cuit('20-12345678-9'),
            new CodigoEntidad('BANCO001'),
            'préstamo personal',
            200000.00, // Monto actualizado
            'normal',
            new \DateTime('2024-01-01T00:00:00Z')
        );
        $this->repository->save($deudorActualizado);

        // Verificar que se actualizó
        $foundDeudor = $this->repository->findByCuit(new Cuit('20-12345678-9'));
        $this->assertEquals(200000.00, $foundDeudor->getMontoDeuda());
    }

    public function test_calculates_total_deuda_by_cuit(): void
    {
        // Crear entidad financiera
        $entidad = new EntidadFinanciera(
            new CodigoEntidad('BANCO001'),
            'Banco de la Nación Argentina',
            true,
            'banco'
        );
        $this->entidadRepository->save($entidad);

        // Crear múltiples deudas para el mismo CUIT
        $deudores = [
            new Deudor(new Cuit('20-12345678-9'), new CodigoEntidad('BANCO001'), 'préstamo', 150000.00, 'normal', new \DateTime()),
            new Deudor(new Cuit('20-12345678-9'), new CodigoEntidad('BANCO001'), 'tarjeta', 75000.50, 'normal', new \DateTime()),
        ];

        foreach ($deudores as $deudor) {
            $this->repository->save($deudor);
        }

        $totalDeuda = $this->repository->getTotalDeudaByCuit(new Cuit('20-12345678-9'));

        $this->assertEquals(225000.50, $totalDeuda);
    }
} 