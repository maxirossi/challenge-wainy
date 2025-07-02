<?php

namespace Tests\Unit\Domains\Deudores\Services;

use App\Domains\Deudores\Entities\Deudor;
use App\Domains\Deudores\Repositories\DeudorRepositoryInterface;
use App\Domains\Deudores\Services\DeudorDomainService;
use App\Domains\Deudores\ValueObjects\Cuit;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class DeudorDomainServiceTest extends TestCase
{
    private DeudorDomainService $service;
    private DeudorRepositoryInterface $repository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->repository = $this->createMock(DeudorRepositoryInterface::class);
        $this->service = new DeudorDomainService($this->repository);
    }

    public function test_obtener_resumen_por_cuit_returns_empty_data_when_no_deudores(): void
    {
        $cuit = new Cuit('20-12345678-9');
        
        $this->repository
            ->expects($this->once())
            ->method('findByCuit')
            ->with($cuit)
            ->willReturn(new Collection());

        $result = $this->service->obtenerResumenPorCuit($cuit);

        $this->assertEquals([
            'cuit' => '20-12345678-9',
            'total_deuda' => 0,
            'cantidad_prestamos' => 0,
            'situacion_maxima' => null,
            'entidades' => []
        ], $result);
    }

    public function test_obtener_resumen_por_cuit_returns_consolidated_data(): void
    {
        $cuit = new Cuit('20-12345678-9');
        $codigoEntidad1 = new CodigoEntidad('BANCO001');
        $codigoEntidad2 = new CodigoEntidad('BANCO002');
        
        $deudores = new Collection([
            $this->createDeudor($cuit, $codigoEntidad1, 'préstamo personal', 150000.00, 'normal'),
            $this->createDeudor($cuit, $codigoEntidad2, 'tarjeta de crédito', 75000.50, 'irregular'),
            $this->createDeudor($cuit, $codigoEntidad1, 'préstamo hipotecario', 500000.00, 'normal'),
        ]);

        $this->repository
            ->expects($this->once())
            ->method('findByCuit')
            ->with($cuit)
            ->willReturn($deudores);

        $result = $this->service->obtenerResumenPorCuit($cuit);

        $this->assertEquals('20-12345678-9', $result['cuit']);
        $this->assertEquals(725000.50, $result['total_deuda']);
        $this->assertEquals(3, $result['cantidad_prestamos']);
        $this->assertEquals('irregular', $result['situacion_maxima']);
        $this->assertCount(2, $result['entidades']);
        
        // Verificar entidades
        $entidades = $result['entidades'];
        $banco1 = collect($entidades)->firstWhere('codigo', 'BANCO001');
        $banco2 = collect($entidades)->firstWhere('codigo', 'BANCO002');
        
        $this->assertEquals(650000.00, $banco1['total_deuda']);
        $this->assertEquals(2, $banco1['cantidad_prestamos']);
        $this->assertEquals(75000.50, $banco2['total_deuda']);
        $this->assertEquals(1, $banco2['cantidad_prestamos']);
    }

    public function test_obtener_resumen_por_entidad_returns_empty_data_when_no_deudores(): void
    {
        $codigoEntidad = new CodigoEntidad('BANCO001');
        
        $this->repository
            ->expects($this->once())
            ->method('findByEntidad')
            ->with($codigoEntidad)
            ->willReturn(new Collection());

        $result = $this->service->obtenerResumenPorEntidad($codigoEntidad);

        $this->assertEquals([
            'codigo_entidad' => 'BANCO001',
            'total_deuda' => 0,
            'cantidad_deudores' => 0,
            'deudores_irregulares' => 0,
            'deudores_vencidos' => 0
        ], $result);
    }

    public function test_obtener_resumen_por_entidad_returns_consolidated_data(): void
    {
        $codigoEntidad = new CodigoEntidad('BANCO001');
        $cuit1 = new Cuit('20-12345678-9');
        $cuit2 = new Cuit('30-98765432-1');
        
        $deudores = new Collection([
            $this->createDeudor($cuit1, $codigoEntidad, 'préstamo personal', 150000.00, 'normal'),
            $this->createDeudor($cuit1, $codigoEntidad, 'tarjeta de crédito', 75000.50, 'irregular'),
            $this->createDeudor($cuit2, $codigoEntidad, 'préstamo hipotecario', 500000.00, 'vencida'),
        ]);

        $this->repository
            ->expects($this->once())
            ->method('findByEntidad')
            ->with($codigoEntidad)
            ->willReturn($deudores);

        $result = $this->service->obtenerResumenPorEntidad($codigoEntidad);

        $this->assertEquals('BANCO001', $result['codigo_entidad']);
        $this->assertEquals(725000.50, $result['total_deuda']);
        $this->assertEquals(3, $result['cantidad_deudores']);
        $this->assertEquals(2, $result['deudores_irregulares']); // irregular + vencida
        $this->assertEquals(1, $result['deudores_vencidos']); // solo vencida
    }

    public function test_obtener_top_deudores_calls_repository(): void
    {
        $expectedCollection = new Collection([
            ['cuit' => '20-12345678-9', 'total_deuda' => 1000000.00, 'cantidad_prestamos' => 3],
            ['cuit' => '30-98765432-1', 'total_deuda' => 500000.00, 'cantidad_prestamos' => 2],
        ]);

        $this->repository
            ->expects($this->once())
            ->method('findTopDeudores')
            ->with(5)
            ->willReturn($expectedCollection);

        $result = $this->service->obtenerTopDeudores(5);

        $this->assertSame($expectedCollection, $result);
    }

    public function test_determina_situacion_maxima_correctly(): void
    {
        $cuit = new Cuit('20-12345678-9');
        $codigoEntidad = new CodigoEntidad('BANCO001');
        
        $deudores = new Collection([
            $this->createDeudor($cuit, $codigoEntidad, 'préstamo 1', 100000.00, 'normal'),
            $this->createDeudor($cuit, $codigoEntidad, 'préstamo 2', 200000.00, 'morosa'),
            $this->createDeudor($cuit, $codigoEntidad, 'préstamo 3', 300000.00, 'irregular'),
        ]);

        $this->repository
            ->expects($this->once())
            ->method('findByCuit')
            ->willReturn($deudores);

        $result = $this->service->obtenerResumenPorCuit($cuit);

        $this->assertEquals('irregular', $result['situacion_maxima']);
    }

    public function test_agrupa_por_entidades_correctly(): void
    {
        $cuit = new Cuit('20-12345678-9');
        $codigoEntidad1 = new CodigoEntidad('BANCO001');
        $codigoEntidad2 = new CodigoEntidad('BANCO002');
        
        $deudores = new Collection([
            $this->createDeudor($cuit, $codigoEntidad1, 'préstamo 1', 100000.00, 'normal'),
            $this->createDeudor($cuit, $codigoEntidad1, 'préstamo 2', 200000.00, 'normal'),
            $this->createDeudor($cuit, $codigoEntidad2, 'préstamo 3', 300000.00, 'normal'),
        ]);

        $this->repository
            ->expects($this->once())
            ->method('findByCuit')
            ->willReturn($deudores);

        $result = $this->service->obtenerResumenPorCuit($cuit);

        $this->assertCount(2, $result['entidades']);
        
        $entidades = $result['entidades'];
        $banco1 = collect($entidades)->firstWhere('codigo', 'BANCO001');
        $banco2 = collect($entidades)->firstWhere('codigo', 'BANCO002');
        
        $this->assertEquals(300000.00, $banco1['total_deuda']);
        $this->assertEquals(2, $banco1['cantidad_prestamos']);
        $this->assertEquals(300000.00, $banco2['total_deuda']);
        $this->assertEquals(1, $banco2['cantidad_prestamos']);
    }

    private function createDeudor(
        Cuit $cuit,
        CodigoEntidad $codigoEntidad,
        string $tipoDeuda,
        float $montoDeuda,
        string $situacion,
        ?DateTime $fechaVencimiento = null
    ): Deudor {
        return new Deudor(
            $cuit,
            $codigoEntidad,
            $tipoDeuda,
            $montoDeuda,
            $situacion,
            new DateTime('2024-01-01'),
            $fechaVencimiento
        );
    }
}
