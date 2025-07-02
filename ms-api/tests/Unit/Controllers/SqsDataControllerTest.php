<?php

namespace Tests\Unit\Controllers;

use App\Http\Controllers\SqsDataController;
use App\Domains\Deudores\Repositories\DeudorRepositoryInterface;
use App\Domains\EntidadesFinancieras\Repositories\EntidadFinancieraRepositoryInterface;
use App\Domains\EntidadesFinancieras\Entities\EntidadFinanciera;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use PHPUnit\Framework\TestCase;
use Mockery;

class SqsDataControllerTest extends TestCase
{
    private SqsDataController $controller;
    private DeudorRepositoryInterface $mockDeudorRepository;
    private EntidadFinancieraRepositoryInterface $mockEntidadRepository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockDeudorRepository = Mockery::mock(DeudorRepositoryInterface::class);
        $this->mockEntidadRepository = Mockery::mock(EntidadFinancieraRepositoryInterface::class);
        
        $this->controller = new SqsDataController(
            $this->mockDeudorRepository,
            $this->mockEntidadRepository
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_processes_valid_deudores_data(): void
    {
        $validData = [
            'deudores' => [
                [
                    'cuit' => '20-12345678-9',
                    'codigo_entidad' => 'BANCO001',
                    'tipo_deuda' => 'préstamo personal',
                    'monto_deuda' => 150000.00,
                    'situacion' => 'normal',
                    'fecha_procesamiento' => '2024-01-01T00:00:00Z',
                    'nombre_entidad' => 'Banco de la Nación Argentina',
                    'tipo_entidad' => 'banco'
                ]
            ]
        ];

        $entidad = new EntidadFinanciera(
            new CodigoEntidad('BANCO001'),
            'Banco de la Nación Argentina',
            true,
            'banco'
        );

        $this->mockEntidadRepository
            ->shouldReceive('findByCodigo')
            ->once()
            ->andReturn($entidad);

        $this->mockDeudorRepository
            ->shouldReceive('save')
            ->once();

        $request = new Request();
        $request->merge($validData);

        $response = $this->controller->processDeudores($request);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals(1, $responseData['deudores_procesados']);
        $this->assertEquals(1, $responseData['total_deudores']);
    }

    public function test_creates_entidad_financiera_if_not_exists(): void
    {
        $validData = [
            'deudores' => [
                [
                    'cuit' => '20-12345678-9',
                    'codigo_entidad' => 'NUEVO001',
                    'tipo_deuda' => 'préstamo personal',
                    'monto_deuda' => 150000.00,
                    'situacion' => 'normal',
                    'fecha_procesamiento' => '2024-01-01T00:00:00Z',
                    'nombre_entidad' => 'Nueva Entidad',
                    'tipo_entidad' => 'financiera'
                ]
            ]
        ];

        // Mock entidad no encontrada
        $this->mockEntidadRepository
            ->shouldReceive('findByCodigo')
            ->once()
            ->andReturn(null);

        $this->mockEntidadRepository
            ->shouldReceive('save')
            ->once();

        $this->mockDeudorRepository
            ->shouldReceive('save')
            ->once();

        $request = new Request();
        $request->merge($validData);

        $response = $this->controller->processDeudores($request);

        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
    }

    public function test_throws_exception_for_invalid_message_structure(): void
    {
        $invalidData = [
            'invalid_key' => 'invalid_value'
        ];

        $request = new Request();
        $request->merge($invalidData);

        $response = $this->controller->processDeudores($request);

        $this->assertEquals(500, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertFalse($responseData['success']);
        $this->assertStringContainsString('Estructura de mensaje inválida', $responseData['error']);
    }

    public function test_throws_exception_for_missing_required_fields(): void
    {
        $invalidData = [
            'deudores' => [
                [
                    'cuit' => '20-12345678-9',
                    // Falta codigo_entidad
                    'tipo_deuda' => 'préstamo personal',
                    'monto_deuda' => 150000.00,
                    'situacion' => 'normal'
                ]
            ]
        ];

        $request = new Request();
        $request->merge($invalidData);

        $response = $this->controller->processDeudores($request);

        $this->assertEquals(500, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertFalse($responseData['success']);
        $this->assertStringContainsString('Campo requerido faltante', $responseData['error']);
    }

    public function test_processes_multiple_deudores_in_message(): void
    {
        $validData = [
            'deudores' => [
                [
                    'cuit' => '20-11111111-1',
                    'codigo_entidad' => 'BANCO001',
                    'tipo_deuda' => 'préstamo personal',
                    'monto_deuda' => 150000.00,
                    'situacion' => 'normal',
                    'fecha_procesamiento' => '2024-01-01T00:00:00Z'
                ],
                [
                    'cuit' => '20-22222222-2',
                    'codigo_entidad' => 'BANCO002',
                    'tipo_deuda' => 'tarjeta de crédito',
                    'monto_deuda' => 75000.50,
                    'situacion' => 'irregular',
                    'fecha_procesamiento' => '2024-01-01T00:00:00Z'
                ]
            ]
        ];

        $entidad1 = new EntidadFinanciera(
            new CodigoEntidad('BANCO001'),
            'Banco 1',
            true,
            'banco'
        );

        $entidad2 = new EntidadFinanciera(
            new CodigoEntidad('BANCO002'),
            'Banco 2',
            true,
            'banco'
        );

        $this->mockEntidadRepository
            ->shouldReceive('findByCodigo')
            ->twice()
            ->andReturn($entidad1, $entidad2);

        $this->mockDeudorRepository
            ->shouldReceive('save')
            ->twice();

        $request = new Request();
        $request->merge($validData);

        $response = $this->controller->processDeudores($request);

        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals(2, $responseData['deudores_procesados']);
        $this->assertEquals(2, $responseData['total_deudores']);
    }

    public function test_handles_partial_failures_gracefully(): void
    {
        $mixedData = [
            'deudores' => [
                [
                    'cuit' => '20-11111111-1',
                    'codigo_entidad' => 'BANCO001',
                    'tipo_deuda' => 'préstamo personal',
                    'monto_deuda' => 150000.00,
                    'situacion' => 'normal',
                    'fecha_procesamiento' => '2024-01-01T00:00:00Z'
                ],
                [
                    'cuit' => 'invalid-cuit',
                    'codigo_entidad' => 'BANCO002',
                    'tipo_deuda' => 'tarjeta de crédito',
                    'monto_deuda' => 75000.50,
                    'situacion' => 'irregular',
                    'fecha_procesamiento' => '2024-01-01T00:00:00Z'
                ]
            ]
        ];

        $entidad = new EntidadFinanciera(
            new CodigoEntidad('BANCO001'),
            'Banco 1',
            true,
            'banco'
        );

        $this->mockEntidadRepository
            ->shouldReceive('findByCodigo')
            ->once()
            ->andReturn($entidad);

        $this->mockDeudorRepository
            ->shouldReceive('save')
            ->once();

        $request = new Request();
        $request->merge($mixedData);

        $response = $this->controller->processDeudores($request);

        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals(1, $responseData['deudores_procesados']);
        $this->assertEquals(1, count($responseData['errores']));
    }
} 