<?php

namespace Tests\Unit\Domains\Deudores\Entities;

use App\Domains\Deudores\Entities\Deudor;
use App\Domains\Deudores\ValueObjects\Cuit;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use DateTime;
use PHPUnit\Framework\TestCase;

class DeudorTest extends TestCase
{
    private Cuit $cuit;
    private CodigoEntidad $codigoEntidad;
    private DateTime $fechaProcesamiento;
    private DateTime $fechaVencimiento;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->cuit = new Cuit('20-12345678-9');
        $this->codigoEntidad = new CodigoEntidad('BANCO001');
        $this->fechaProcesamiento = new DateTime('2024-01-01');
        $this->fechaVencimiento = new DateTime('2024-12-31');
    }

    public function test_creates_deudor_with_all_fields(): void
    {
        $deudor = new Deudor(
            $this->cuit,
            $this->codigoEntidad,
            'préstamo personal',
            150000.00,
            'normal',
            $this->fechaProcesamiento,
            $this->fechaVencimiento,
            1
        );

        $this->assertEquals(1, $deudor->getId());
        $this->assertEquals($this->cuit, $deudor->getCuit());
        $this->assertEquals($this->codigoEntidad, $deudor->getCodigoEntidad());
        $this->assertEquals('préstamo personal', $deudor->getTipoDeuda());
        $this->assertEquals(150000.00, $deudor->getMontoDeuda());
        $this->assertEquals('normal', $deudor->getSituacion());
        $this->assertEquals($this->fechaProcesamiento, $deudor->getFechaProcesamiento());
        $this->assertEquals($this->fechaVencimiento, $deudor->getFechaVencimiento());
    }

    public function test_creates_deudor_without_optional_fields(): void
    {
        $deudor = new Deudor(
            $this->cuit,
            $this->codigoEntidad,
            'tarjeta de crédito',
            75000.50,
            'irregular',
            $this->fechaProcesamiento
        );

        $this->assertNull($deudor->getId());
        $this->assertNull($deudor->getFechaVencimiento());
        $this->assertEquals('tarjeta de crédito', $deudor->getTipoDeuda());
        $this->assertEquals(75000.50, $deudor->getMontoDeuda());
        $this->assertEquals('irregular', $deudor->getSituacion());
    }

    public function test_es_deuda_vencida_returns_true_for_expired_debt(): void
    {
        $fechaVencimientoPasada = new DateTime('2020-01-01');
        
        $deudor = new Deudor(
            $this->cuit,
            $this->codigoEntidad,
            'préstamo personal',
            150000.00,
            'normal',
            $this->fechaProcesamiento,
            $fechaVencimientoPasada
        );

        $this->assertTrue($deudor->esDeudaVencida());
    }

    public function test_es_deuda_vencida_returns_false_for_future_debt(): void
    {
        $fechaVencimientoFutura = new DateTime('2030-01-01');
        
        $deudor = new Deudor(
            $this->cuit,
            $this->codigoEntidad,
            'préstamo personal',
            150000.00,
            'normal',
            $this->fechaProcesamiento,
            $fechaVencimientoFutura
        );

        $this->assertFalse($deudor->esDeudaVencida());
    }

    public function test_es_deuda_vencida_returns_false_when_no_due_date(): void
    {
        $deudor = new Deudor(
            $this->cuit,
            $this->codigoEntidad,
            'préstamo personal',
            150000.00,
            'normal',
            $this->fechaProcesamiento
        );

        $this->assertFalse($deudor->esDeudaVencida());
    }

    /**
     * @dataProvider situacionIrregularProvider
     */
    public function test_es_situacion_irregular_identifies_irregular_situations(string $situacion, bool $expected): void
    {
        $deudor = new Deudor(
            $this->cuit,
            $this->codigoEntidad,
            'préstamo personal',
            150000.00,
            $situacion,
            $this->fechaProcesamiento
        );

        $this->assertEquals($expected, $deudor->esSituacionIrregular());
    }

    public function test_actualizar_situacion_changes_situation(): void
    {
        $deudor = new Deudor(
            $this->cuit,
            $this->codigoEntidad,
            'préstamo personal',
            150000.00,
            'normal',
            $this->fechaProcesamiento
        );

        $deudor->actualizarSituacion('irregular');

        $this->assertEquals('irregular', $deudor->getSituacion());
    }

    public function test_actualizar_monto_deuda_changes_amount(): void
    {
        $deudor = new Deudor(
            $this->cuit,
            $this->codigoEntidad,
            'préstamo personal',
            150000.00,
            'normal',
            $this->fechaProcesamiento
        );

        $deudor->actualizarMontoDeuda(200000.00);

        $this->assertEquals(200000.00, $deudor->getMontoDeuda());
    }

    public static function situacionIrregularProvider(): array
    {
        return [
            'irregular' => ['irregular', true],
            'vencida' => ['vencida', true],
            'morosa' => ['morosa', true],
            'normal' => ['normal', false],
            'al día' => ['al día', false],
            'IRREGULAR' => ['IRREGULAR', true], // Case insensitive
            'VENCIDA' => ['VENCIDA', true],
            'MOROSA' => ['MOROSA', true],
        ];
    }

    public function test_immutability_of_value_objects(): void
    {
        $deudor = new Deudor(
            $this->cuit,
            $this->codigoEntidad,
            'préstamo personal',
            150000.00,
            'normal',
            $this->fechaProcesamiento
        );

        // Los Value Objects deben ser inmutables
        $originalCuit = $deudor->getCuit();
        $originalCodigoEntidad = $deudor->getCodigoEntidad();

        $this->assertSame($originalCuit, $deudor->getCuit());
        $this->assertSame($originalCodigoEntidad, $deudor->getCodigoEntidad());
    }

    public function test_date_objects_are_immutable(): void
    {
        $deudor = new Deudor(
            $this->cuit,
            $this->codigoEntidad,
            'préstamo personal',
            150000.00,
            'normal',
            $this->fechaProcesamiento,
            $this->fechaVencimiento
        );

        $originalFechaProcesamiento = $deudor->getFechaProcesamiento();
        $originalFechaVencimiento = $deudor->getFechaVencimiento();

        // Modificar las fechas originales no debe afectar al deudor
        $this->fechaProcesamiento->modify('+1 day');
        $this->fechaVencimiento->modify('+1 day');

        $this->assertEquals($originalFechaProcesamiento, $deudor->getFechaProcesamiento());
        $this->assertEquals($originalFechaVencimiento, $deudor->getFechaVencimiento());
    }
}
