<?php

namespace Tests\Unit\Domains\Deudores\ValueObjects;

use App\Domains\Deudores\ValueObjects\Cuit;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class CuitTest extends TestCase
{
    /**
     * @dataProvider validCuitProvider
     */
    public function test_creates_valid_cuit(string $input, string $expected): void
    {
        $cuit = new Cuit($input);
        
        $this->assertEquals($expected, $cuit->getValue());
        $this->assertEquals($expected, (string) $cuit);
    }

    /**
     * @dataProvider invalidCuitProvider
     */
    public function test_throws_exception_for_invalid_cuit(string $invalidCuit, string $expectedMessage): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage($expectedMessage);
        
        new Cuit($invalidCuit);
    }

    public function test_equals_method_works_correctly(): void
    {
        $cuit1 = new Cuit('20-12345678-9');
        $cuit2 = new Cuit('20-12345678-9');
        $cuit3 = new Cuit('30-98765432-1');

        $this->assertTrue($cuit1->equals($cuit2));
        $this->assertFalse($cuit1->equals($cuit3));
    }

    public function test_formats_cuit_with_different_input_formats(): void
    {
        $formats = [
            '20123456789' => '20-12345678-9',
            '20-12345678-9' => '20-12345678-9',
            '20 12345678 9' => '20-12345678-9',
            '20-12345678-9' => '20-12345678-9',
        ];

        foreach ($formats as $input => $expected) {
            $cuit = new Cuit($input);
            $this->assertEquals($expected, $cuit->getValue());
        }
    }

    public static function validCuitProvider(): array
    {
        return [
            'persona física' => ['20-12345678-9', '20-12345678-9'],
            'persona jurídica' => ['30-98765432-1', '30-98765432-1'],
            'empresa extranjera' => ['33-11111111-1', '33-11111111-1'],
            'monotributista' => ['23-22222222-2', '23-22222222-2'],
            'empleador' => ['24-33333333-3', '24-33333333-3'],
            'trabajador independiente' => ['27-44444444-4', '27-44444444-4'],
            'empresa estatal' => ['34-55555555-5', '34-55555555-5'],
        ];
    }

    public static function invalidCuitProvider(): array
    {
        return [
            'cuit muy corto' => ['123456', 'El CUIT debe tener 11 dígitos'],
            'cuit muy largo' => ['20-123456789-1', 'El CUIT debe tener 11 dígitos'],
            'cuit con letras' => ['20-ABCD5678-9', 'El CUIT debe contener solo números'],
            'tipo persona inválido' => ['25-12345678-9', 'Tipo de persona inválido en el CUIT'],
            'dígito verificador incorrecto' => ['20-12345678-1', 'Dígito verificador inválido'],
            'cuit vacío' => ['', 'El CUIT debe tener 11 dígitos'],
            'cuit con caracteres especiales' => ['20-123@5678-9', 'El CUIT debe contener solo números'],
        ];
    }

    public function test_validates_digit_verifier_correctly(): void
    {
        // CUIT válido: 20-12345678-9
        // Cálculo: (2*5 + 0*4 + 1*3 + 2*2 + 3*7 + 4*6 + 5*5 + 6*4 + 7*3 + 8*2) % 11 = 9
        $validCuit = new Cuit('20-12345678-9');
        $this->assertEquals('20-12345678-9', $validCuit->getValue());

        // CUIT inválido con dígito verificador incorrecto
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Dígito verificador inválido');
        new Cuit('20-12345678-1');
    }

    public function test_handles_edge_cases(): void
    {
        // CUIT con todos los dígitos iguales (caso especial)
        $this->expectException(InvalidArgumentException::class);
        new Cuit('20-11111111-1');
    }
}
