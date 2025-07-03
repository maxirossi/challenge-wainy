<?php

namespace Tests\Unit\Controllers;

use App\Modules\Deudores\Infrastructure\Http\Controllers\DeudorController;
use App\Application\UseCases\Deudores\GetDeudorByCuitUseCase;
use App\Application\UseCases\Deudores\GetTopDeudoresUseCase;
use App\Application\UseCases\Deudores\GetDeudoresByEntidadUseCase;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use PHPUnit\Framework\TestCase;
use Mockery;
use InvalidArgumentException;

class DeudorControllerTest extends TestCase
{
    private DeudorController $controller;
    private GetDeudorByCuitUseCase $mockGetDeudorUseCase;
    private GetTopDeudoresUseCase $mockGetTopDeudoresUseCase;
    private GetDeudoresByEntidadUseCase $mockGetDeudoresByEntidadUseCase;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockGetDeudorUseCase = Mockery::mock(GetDeudorByCuitUseCase::class);
        $this->mockGetTopDeudoresUseCase = Mockery::mock(GetTopDeudoresUseCase::class);
        $this->mockGetDeudoresByEntidadUseCase = Mockery::mock(GetDeudoresByEntidadUseCase::class);
        
        $this->controller = new DeudorController(
            $this->mockGetDeudorUseCase,
            $this->mockGetTopDeudoresUseCase,
            $this->mockGetDeudoresByEntidadUseCase
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_process_sqs_messages_with_valid_data(): void
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

        $request = new Request();
        $request->merge($validData);

        $response = $this->controller->processSqsMessages($request);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals('Datos procesados correctamente', $responseData['message']);
        $this->assertEquals(1, $responseData['deudores_recibidos']);
    }

    public function test_process_sqs_messages_with_multiple_deudores(): void
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

        $request = new Request();
        $request->merge($validData);

        $response = $this->controller->processSqsMessages($request);

        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals(2, $responseData['deudores_recibidos']);
    }

    public function test_process_sqs_messages_throws_exception_for_invalid_structure(): void
    {
        $invalidData = [
            'invalid_key' => 'invalid_value'
        ];

        $request = new Request();
        $request->merge($invalidData);

        $response = $this->controller->processSqsMessages($request);

        $this->assertEquals(500, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertFalse($responseData['success']);
        $this->assertStringContainsString('Estructura de mensaje inválida', $responseData['error']);
    }

    public function test_process_sqs_messages_throws_exception_for_missing_deudores_array(): void
    {
        $invalidData = [
            'deudores' => 'not_an_array'
        ];

        $request = new Request();
        $request->merge($invalidData);

        $response = $this->controller->processSqsMessages($request);

        $this->assertEquals(500, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertFalse($responseData['success']);
        $this->assertStringContainsString('Estructura de mensaje inválida', $responseData['error']);
    }

    public function test_show_deudor_successfully(): void
    {
        $cuit = '20-12345678-9';
        $expectedData = [
            'cuit' => $cuit,
            'total_deuda' => 150000,
            'situacion' => 'normal',
            'tipo_deuda' => 'préstamo personal',
            'codigo_entidad' => 'BANCO001'
        ];

        $this->mockGetDeudorUseCase
            ->shouldReceive('execute')
            ->once()
            ->with($cuit)
            ->andReturn($expectedData);

        $response = $this->controller->show($cuit);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals($expectedData, $responseData['data']);
    }

    public function test_show_deudor_throws_invalid_argument_exception(): void
    {
        $cuit = 'invalid-cuit';

        $this->mockGetDeudorUseCase
            ->shouldReceive('execute')
            ->once()
            ->with($cuit)
            ->andThrow(new InvalidArgumentException('CUIT inválido'));

        $response = $this->controller->show($cuit);

        $this->assertEquals(400, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertFalse($responseData['success']);
        $this->assertEquals('CUIT inválido', $responseData['message']);
    }

    public function test_show_deudor_throws_general_exception(): void
    {
        $cuit = '20-12345678-9';

        $this->mockGetDeudorUseCase
            ->shouldReceive('execute')
            ->once()
            ->with($cuit)
            ->andThrow(new \Exception('Error interno'));

        $response = $this->controller->show($cuit);

        $this->assertEquals(500, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertFalse($responseData['success']);
        $this->assertEquals('Error interno del servidor', $responseData['message']);
    }

    public function test_top_deudores_successfully(): void
    {
        $n = 5;
        $expectedData = [
            ['cuit' => '20-11111111-1', 'total_deuda' => 200000],
            ['cuit' => '20-22222222-2', 'total_deuda' => 150000]
        ];

        $request = new Request();

        $this->mockGetTopDeudoresUseCase
            ->shouldReceive('execute')
            ->once()
            ->with($n, null)
            ->andReturn($expectedData);

        $response = $this->controller->top($request, $n);

        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals($expectedData, $responseData['data']);
    }

    public function test_top_deudores_with_situacion_filter(): void
    {
        $n = 5;
        $situacion = 'normal';
        $expectedData = [
            ['cuit' => '20-11111111-1', 'total_deuda' => 200000, 'situacion' => 'normal']
        ];

        $request = new Request();
        $request->query->set('situacion', $situacion);

        $this->mockGetTopDeudoresUseCase
            ->shouldReceive('execute')
            ->once()
            ->with($n, $situacion)
            ->andReturn($expectedData);

        $response = $this->controller->top($request, $n);

        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals($expectedData, $responseData['data']);
    }
} 