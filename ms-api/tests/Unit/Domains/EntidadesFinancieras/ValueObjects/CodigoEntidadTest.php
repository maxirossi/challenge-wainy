<?php

namespace Tests\Unit\Domains\EntidadesFinancieras\ValueObjects;

use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class CodigoEntidadTest extends TestCase
{
    /**
     * @dataProvider validCodigoProvider
     */
    public function test_creates_valid_codigo(string $input, string $expected): void
    {
        $codigo = new CodigoEntidad($input);
        
        $this->assertEquals($expected, $codigo->getValue());
        $this->assertEquals($expected, (string) $codigo);
    }

    /**
     * @dataProvider invalidCodigoProvider
     */
    public function test_throws_exception_for_invalid_codigo(string $invalidCodigo, string $expectedMessage): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage($expectedMessage);
        
        new CodigoEntidad($invalidCodigo);
    }

    public function test_equals_method_works_correctly(): void
    {
        $codigo1 = new CodigoEntidad('BANCO001');
        $codigo2 = new CodigoEntidad('BANCO001');
        $codigo3 = new CodigoEntidad('BANCO002');

        $this->assertTrue($codigo1->equals($codigo2));
        $this->assertFalse($codigo1->equals($codigo3));
    }

    public function test_normalizes_case_to_uppercase(): void
    {
        $codigo = new CodigoEntidad('banco001');
        $this->assertEquals('BANCO001', $codigo->getValue());
    }

    public function test_trims_whitespace(): void
    {
        $codigo = new CodigoEntidad('  BANCO001  ');
        $this->assertEquals('BANCO001', $codigo->getValue());
    }

    public function test_handles_hyphens_correctly(): void
    {
        $codigo = new CodigoEntidad('BANCO-001');
        $this->assertEquals('BANCO-001', $codigo->getValue());
    }

    public function test_handles_numbers_correctly(): void
    {
        $codigo = new CodigoEntidad('BANCO123');
        $this->assertEquals('BANCO123', $codigo->getValue());
    }

    public static function validCodigoProvider(): array
    {
        return [
            'código simple' => ['BANCO001', 'BANCO001'],
            'código con números' => ['BANCO123', 'BANCO123'],
            'código con guiones' => ['BANCO-001', 'BANCO-001'],
            'código solo números' => ['123456', '123456'],
            'código mixto' => ['BANCO-123', 'BANCO-123'],
            'código corto' => ['A', 'A'],
            'código largo' => ['BANCO12345', 'BANCO12345'],
        ];
    }

    public static function invalidCodigoProvider(): array
    {
        return [
            'código vacío' => ['', 'El código de entidad debe tener entre 1 y 10 caracteres'],
            'código muy largo' => ['BANCO123456', 'El código de entidad debe tener entre 1 y 10 caracteres'],
            'código con espacios' => ['BANCO 001', 'El código de entidad solo puede contener letras, números y guiones'],
            'código con caracteres especiales' => ['BANCO@001', 'El código de entidad solo puede contener letras, números y guiones'],
            'código con puntos' => ['BANCO.001', 'El código de entidad solo puede contener letras, números y guiones'],
            'código con guiones bajos' => ['BANCO_001', 'El código de entidad solo puede contener letras, números y guiones'],
        ];
    }

    public function test_handles_edge_cases(): void
    {
        // Código con solo guiones
        $codigo = new CodigoEntidad('---');
        $this->assertEquals('---', $codigo->getValue());

        // Código con solo números
        $codigo = new CodigoEntidad('123');
        $this->assertEquals('123', $codigo->getValue());

        // Código con solo letras
        $codigo = new CodigoEntidad('ABC');
        $this->assertEquals('ABC', $codigo->getValue());
    }

    public function test_case_insensitive_equality(): void
    {
        $codigo1 = new CodigoEntidad('banco001');
        $codigo2 = new CodigoEntidad('BANCO001');
        
        // Ambos se normalizan a mayúsculas
        $this->assertEquals('BANCO001', $codigo1->getValue());
        $this->assertEquals('BANCO001', $codigo2->getValue());
        $this->assertTrue($codigo1->equals($codigo2));
    }
}
