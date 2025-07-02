<?php

namespace Tests\Unit\Jobs;

use App\Domains\Deudores\Entities\Deudor;
use App\Domains\Deudores\Repositories\DeudorRepositoryInterface;
use App\Domains\EntidadesFinancieras\Entities\EntidadFinanciera;
use App\Domains\EntidadesFinancieras\Repositories\EntidadFinancieraRepositoryInterface;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use App\Jobs\ProcessSqsMessage;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class ProcessSqsMessageTest extends TestCase
{
    private DeudorRepositoryInterface $deudorRepository;
    private EntidadFinancieraRepositoryInterface $entidadRepository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->deudorRepository = $this->createMock(DeudorRepositoryInterface::class);
        $this->entidadRepository = $this->createMock(EntidadFinancieraRepositoryInterface::class);
    }

    public function test_processes_valid_message_successfully(): void
    {
        $messageData = [
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

        // Mock de la entidad financiera existente
        $entidad = new EntidadFinanciera(
            new CodigoEntidad('BANCO001'),
            'Banco de la Nación Argentina',
            true,
            'banco'
        );

        $this->entidadRepository
            ->expects($this->once())
            ->method('findByCodigo')
            ->willReturn($entidad);

        $this->deudorRepository
            ->expects($this->once())
            ->method('save');

        $job = new ProcessSqsMessage($messageData);

        $job->handle($this->deudorRepository, $this->entidadRepository);
    }

    public function test_throws_exception_for_invalid_message_structure(): void
    {
        $invalidMessageData = [
            'invalid_key' => 'invalid_value'
        ];

        $job = new ProcessSqsMessage($invalidMessageData);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Estructura de mensaje inválida: falta array de deudores');

        $job->handle($this->deudorRepository, $this->entidadRepository);
    }

    public function test_throws_exception_for_missing_required_fields(): void
    {
        $messageData = [
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

        $job = new ProcessSqsMessage($messageData);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Campo requerido faltante: codigo_entidad');

        $job->handle($this->deudorRepository, $this->entidadRepository);
    }

    public function test_creates_entidad_financiera_if_not_exists(): void
    {
        $messageData = [
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

        // Mock de entidad no encontrada
        $this->entidadRepository
            ->expects($this->once())
            ->method('findByCodigo')
            ->willReturn(null);

        $this->entidadRepository
            ->expects($this->once())
            ->method('save');

        $this->deudorRepository
            ->expects($this->once())
            ->method('save');

        $job = new ProcessSqsMessage($messageData);

        $job->handle($this->deudorRepository, $this->entidadRepository);
    }

    public function test_uses_existing_entidad_financiera(): void
    {
        // Crear entidad existente
        $entidadExistente = new EntidadFinanciera(
            new CodigoEntidad('BANCO001'),
            'Banco Existente',
            true,
            'banco'
        );

        $messageData = [
            'deudores' => [
                [
                    'cuit' => '20-12345678-9',
                    'codigo_entidad' => 'BANCO001',
                    'tipo_deuda' => 'préstamo personal',
                    'monto_deuda' => 150000.00,
                    'situacion' => 'normal',
                    'fecha_procesamiento' => '2024-01-01T00:00:00Z'
                ]
            ]
        ];

        $this->entidadRepository
            ->expects($this->once())
            ->method('findByCodigo')
            ->willReturn($entidadExistente);

        $this->deudorRepository
            ->expects($this->once())
            ->method('save');

        $job = new ProcessSqsMessage($messageData);

        $job->handle($this->deudorRepository, $this->entidadRepository);
    }

    public function test_processes_multiple_deudores_in_message(): void
    {
        $messageData = [
            'deudores' => [
                [
                    'cuit' => '20-12345678-9',
                    'codigo_entidad' => 'BANCO001',
                    'tipo_deuda' => 'préstamo personal',
                    'monto_deuda' => 150000.00,
                    'situacion' => 'normal',
                    'fecha_procesamiento' => '2024-01-01T00:00:00Z'
                ],
                [
                    'cuit' => '30-98765432-1',
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

        $this->entidadRepository
            ->expects($this->exactly(2))
            ->method('findByCodigo')
            ->willReturnOnConsecutiveCalls($entidad1, $entidad2);

        $this->deudorRepository
            ->expects($this->exactly(2))
            ->method('save');

        $job = new ProcessSqsMessage($messageData);

        $job->handle($this->deudorRepository, $this->entidadRepository);
    }

    public function test_handles_partial_failures_gracefully(): void
    {
        $messageData = [
            'deudores' => [
                [
                    'cuit' => '20-12345678-9',
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

        $this->entidadRepository
            ->expects($this->once())
            ->method('findByCodigo')
            ->willReturn($entidad);

        $this->deudorRepository
            ->expects($this->once())
            ->method('save');

        $job = new ProcessSqsMessage($messageData);

        // No debe lanzar excepción, debe procesar el primer deudor y fallar el segundo
        $job->handle($this->deudorRepository, $this->entidadRepository);
    }

    public function test_logs_processing_events(): void
    {
        Log::shouldReceive('info')->atLeast(2);
        Log::shouldReceive('error')->never();

        $messageData = [
            'deudores' => [
                [
                    'cuit' => '20-12345678-9',
                    'codigo_entidad' => 'BANCO001',
                    'tipo_deuda' => 'préstamo personal',
                    'monto_deuda' => 150000.00,
                    'situacion' => 'normal',
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

        $this->entidadRepository
            ->expects($this->once())
            ->method('findByCodigo')
            ->willReturn($entidad);

        $this->deudorRepository
            ->expects($this->once())
            ->method('save');

        $job = new ProcessSqsMessage($messageData);

        $job->handle($this->deudorRepository, $this->entidadRepository);
    }

    public function test_logs_errors_when_processing_fails(): void
    {
        Log::shouldReceive('info')->atLeast(1);
        Log::shouldReceive('error')->atLeast(1);

        $messageData = [
            'deudores' => [
                [
                    'cuit' => 'invalid-cuit',
                    'codigo_entidad' => 'BANCO001',
                    'tipo_deuda' => 'préstamo personal',
                    'monto_deuda' => 150000.00,
                    'situacion' => 'normal',
                    'fecha_procesamiento' => '2024-01-01T00:00:00Z'
                ]
            ]
        ];

        $job = new ProcessSqsMessage($messageData);

        $job->handle($this->deudorRepository, $this->entidadRepository);
    }
}
