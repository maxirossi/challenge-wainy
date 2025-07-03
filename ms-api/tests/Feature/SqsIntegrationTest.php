<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Domains\Deudores\Repositories\DeudorRepositoryInterface;
use App\Domains\EntidadesFinancieras\Repositories\EntidadFinancieraRepositoryInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SqsIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_sqs_to_database_flow(): void
    {
        $testData = [
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
                ],
                [
                    'cuit' => '20-87654321-0',
                    'codigo_entidad' => 'BANCO002',
                    'tipo_deuda' => 'tarjeta de crédito',
                    'monto_deuda' => 75000.50,
                    'situacion' => 'irregular',
                    'fecha_procesamiento' => '2024-01-01T00:00:00Z',
                    'nombre_entidad' => 'Banco Santander',
                    'tipo_entidad' => 'banco'
                ]
            ]
        ];

        // Test 1: Endpoint recibe datos correctamente
        $response = $this->postJson('/process-sqs', $testData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Datos procesados correctamente',
                    'deudores_recibidos' => 2
                ]);
    }

    public function test_sqs_endpoint_validates_message_structure(): void
    {
        $invalidData = [
            'invalid_key' => 'invalid_value'
        ];

        $response = $this->postJson('/process-sqs', $invalidData);

        $response->assertStatus(500)
                ->assertJson([
                    'success' => false
                ])
                ->assertJsonStructure([
                    'success',
                    'error'
                ]);

        $responseData = json_decode($response->getContent(), true);
        $this->assertStringContainsString('Estructura de mensaje inválida', $responseData['error']);
    }

    public function test_sqs_endpoint_validates_required_fields(): void
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

        $response = $this->postJson('/process-sqs', $invalidData);

        $response->assertStatus(500)
                ->assertJson([
                    'success' => false
                ]);

        $responseData = json_decode($response->getContent(), true);
        $this->assertStringContainsString('Campo requerido faltante', $responseData['error']);
    }

    public function test_deudor_api_endpoint_returns_correct_data(): void
    {
        // Primero crear datos de prueba en la base de datos
        $this->seedTestData();

        // Test consulta por CUIT
        $response = $this->getJson('/api/deudores/20-12345678-9');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true
                ])
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'cuit',
                        'total_deuda',
                        'situacion',
                        'tipo_deuda',
                        'codigo_entidad'
                    ]
                ]);
    }

    public function test_deudor_api_endpoint_returns_404_for_nonexistent_cuit(): void
    {
        $response = $this->getJson('/api/deudores/99-99999999-9');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => false,
                    'message' => 'Deudor no encontrado'
                ]);
    }

    public function test_top_deudores_endpoint(): void
    {
        // Primero crear datos de prueba en la base de datos
        $this->seedTestData();

        $response = $this->getJson('/top/5');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true
                ])
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'cuit',
                            'total_deuda'
                        ]
                    ]
                ]);
    }

    public function test_top_deudores_with_situacion_filter(): void
    {
        // Primero crear datos de prueba en la base de datos
        $this->seedTestData();

        $response = $this->getJson('/top/5?situacion=normal');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true
                ]);
    }

    private function seedTestData(): void
    {
        // Crear entidades financieras
        $entidad1 = new \App\Domains\EntidadesFinancieras\Entities\EntidadFinanciera(
            new \App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad('BANCO001'),
            'Banco de la Nación Argentina',
            true,
            'banco'
        );

        $entidad2 = new \App\Domains\EntidadesFinancieras\Entities\EntidadFinanciera(
            new \App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad('BANCO002'),
            'Banco Santander',
            true,
            'banco'
        );

        $entidadRepository = app(EntidadFinancieraRepositoryInterface::class);
        $entidadRepository->save($entidad1);
        $entidadRepository->save($entidad2);

        // Crear deudores
        $deudor1 = new \App\Domains\Deudores\Entities\Deudor(
            new \App\Domains\Deudores\ValueObjects\Cuit('20-12345678-9'),
            new \App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad('BANCO001'),
            'préstamo personal',
            150000.00,
            'normal',
            new \DateTime('2024-01-01T00:00:00Z')
        );

        $deudor2 = new \App\Domains\Deudores\Entities\Deudor(
            new \App\Domains\Deudores\ValueObjects\Cuit('20-87654321-0'),
            new \App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad('BANCO002'),
            'tarjeta de crédito',
            75000.50,
            'irregular',
            new \DateTime('2024-01-01T00:00:00Z')
        );

        $deudorRepository = app(DeudorRepositoryInterface::class);
        $deudorRepository->save($deudor1);
        $deudorRepository->save($deudor2);
    }
} 