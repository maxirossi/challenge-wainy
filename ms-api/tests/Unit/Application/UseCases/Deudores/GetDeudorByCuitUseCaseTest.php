<?php

namespace Tests\Unit\Application\UseCases\Deudores;

use App\Application\UseCases\Deudores\GetDeudorByCuitUseCase;
use App\Domains\Deudores\Services\DeudorDomainService;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class GetDeudorByCuitUseCaseTest extends TestCase
{
    private GetDeudorByCuitUseCase $useCase;
    private DeudorDomainService $domainService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->domainService = $this->createMock(DeudorDomainService::class);
        $this->useCase = new GetDeudorByCuitUseCase($this->domainService);
    }

    public function test_execute_returns_deudor_data_when_found(): void
    {
        $cuitString = '20-12345678-9';
        $expectedData = [
            'cuit' => '20-12345678-9',
            'total_deuda' => 500000.00,
            'cantidad_prestamos' => 3,
            'situacion_maxima' => 'irregular',
            'entidades' => [
                [
                    'codigo' => 'BANCO001',
                    'total_deuda' => 300000.00,
                    'cantidad_prestamos' => 2
                ],
                [
                    'codigo' => 'BANCO002',
                    'total_deuda' => 200000.00,
                    'cantidad_prestamos' => 1
                ]
            ]
        ];

        $this->domainService
            ->expects($this->once())
            ->method('obtenerResumenPorCuit')
            ->willReturn($expectedData);

        $result = $this->useCase->execute($cuitString);

        $this->assertEquals($expectedData, $result);
    }

    public function test_execute_returns_empty_data_when_no_deudor_found(): void
    {
        $cuitString = '20-12345678-9';
        $emptyData = [
            'cuit' => '20-12345678-9',
            'total_deuda' => 0,
            'cantidad_prestamos' => 0,
            'situacion_maxima' => null,
            'entidades' => []
        ];

        $this->domainService
            ->expects($this->once())
            ->method('obtenerResumenPorCuit')
            ->willReturn($emptyData);

        $result = $this->useCase->execute($cuitString);

        $this->assertEquals($emptyData, $result);
    }

    public function test_execute_throws_exception_for_invalid_cuit(): void
    {
        $invalidCuit = 'invalid-cuit';

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('CUIT inválido');

        $this->useCase->execute($invalidCuit);
    }

    public function test_execute_throws_exception_for_empty_cuit(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('CUIT inválido');

        $this->useCase->execute('');
    }

    public function test_execute_throws_exception_for_null_cuit(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('CUIT inválido');

        $this->useCase->execute(null);
    }

    public function test_execute_handles_domain_service_exception(): void
    {
        $cuitString = '20-12345678-9';

        $this->domainService
            ->expects($this->once())
            ->method('obtenerResumenPorCuit')
            ->willThrowException(new \Exception('Error en el servicio de dominio'));

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Error en el servicio de dominio');

        $this->useCase->execute($cuitString);
    }

    public function test_execute_with_different_cuit_formats(): void
    {
        $formats = [
            '20-12345678-9',
            '20123456789',
            '20 12345678 9'
        ];

        $expectedData = [
            'cuit' => '20-12345678-9',
            'total_deuda' => 100000.00,
            'cantidad_prestamos' => 1,
            'situacion_maxima' => 'normal',
            'entidades' => []
        ];

        foreach ($formats as $format) {
            $this->domainService
                ->expects($this->once())
                ->method('obtenerResumenPorCuit')
                ->willReturn($expectedData);

            $result = $this->useCase->execute($format);
            $this->assertEquals($expectedData, $result);
        }
    }

    public function test_execute_validates_cuit_before_calling_domain_service(): void
    {
        $invalidCuit = 'invalid';

        // El servicio de dominio no debe ser llamado si el CUIT es inválido
        $this->domainService
            ->expects($this->never())
            ->method('obtenerResumenPorCuit');

        $this->expectException(InvalidArgumentException::class);

        $this->useCase->execute($invalidCuit);
    }

    public function test_execute_returns_correct_structure(): void
    {
        $cuitString = '20-12345678-9';
        $expectedData = [
            'cuit' => '20-12345678-9',
            'total_deuda' => 500000.00,
            'cantidad_prestamos' => 3,
            'situacion_maxima' => 'irregular',
            'entidades' => [
                [
                    'codigo' => 'BANCO001',
                    'total_deuda' => 300000.00,
                    'cantidad_prestamos' => 2
                ]
            ]
        ];

        $this->domainService
            ->expects($this->once())
            ->method('obtenerResumenPorCuit')
            ->willReturn($expectedData);

        $result = $this->useCase->execute($cuitString);

        // Verificar estructura
        $this->assertArrayHasKey('cuit', $result);
        $this->assertArrayHasKey('total_deuda', $result);
        $this->assertArrayHasKey('cantidad_prestamos', $result);
        $this->assertArrayHasKey('situacion_maxima', $result);
        $this->assertArrayHasKey('entidades', $result);
        $this->assertIsArray($result['entidades']);

        // Verificar tipos de datos
        $this->assertIsString($result['cuit']);
        $this->assertIsFloat($result['total_deuda']);
        $this->assertIsInt($result['cantidad_prestamos']);
        $this->assertIsString($result['situacion_maxima']);
    }
}
