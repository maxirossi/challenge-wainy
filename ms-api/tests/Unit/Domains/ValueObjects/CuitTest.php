<?php

namespace Tests\Unit\Domains\ValueObjects;

use App\Domains\Deudores\ValueObjects\Cuit;
use App\Domains\Deudores\Exceptions\CuitInvalidoException;
use PHPUnit\Framework\TestCase;

class CuitTest extends TestCase
{
    public function test_valid_cuit_creation(): void
    {
        $cuit = new Cuit('20-12345678-9');
        
        $this->assertEquals('20-12345678-9', $cuit->getValue());
    }

    public function test_cuit_without_dashes_is_valid(): void
    {
        $cuit = new Cuit('20123456789');
        
        $this->assertEquals('20-12345678-9', $cuit->getValue());
    }

    public function test_cuit_with_spaces_is_valid(): void
    {
        $cuit = new Cuit('20 12345678 9');
        
        $this->assertEquals('20-12345678-9', $cuit->getValue());
    }

    public function test_throws_exception_for_invalid_cuit_format(): void
    {
        $this->expectException(CuitInvalidoException::class);
        $this->expectExceptionMessage('El formato del CUIT es inválido');

        new Cuit('invalid-cuit');
    }

    public function test_throws_exception_for_cuit_with_wrong_length(): void
    {
        $this->expectException(CuitInvalidoException::class);
        $this->expectExceptionMessage('El CUIT debe tener 11 dígitos');

        new Cuit('20-1234567-8'); // Solo 9 dígitos
    }

    public function test_throws_exception_for_cuit_with_non_numeric_characters(): void
    {
        $this->expectException(CuitInvalidoException::class);
        $this->expectExceptionMessage('El CUIT debe contener solo números');

        new Cuit('20-1234567a-9');
    }

    public function test_throws_exception_for_empty_cuit(): void
    {
        $this->expectException(CuitInvalidoException::class);
        $this->expectExceptionMessage('El CUIT no puede estar vacío');

        new Cuit('');
    }

    public function test_throws_exception_for_null_cuit(): void
    {
        $this->expectException(CuitInvalidoException::class);
        $this->expectExceptionMessage('El CUIT no puede estar vacío');

        new Cuit(null);
    }

    public function test_cuit_equality(): void
    {
        $cuit1 = new Cuit('20-12345678-9');
        $cuit2 = new Cuit('20-12345678-9');
        $cuit3 = new Cuit('30-87654321-0');

        $this->assertTrue($cuit1->equals($cuit2));
        $this->assertFalse($cuit1->equals($cuit3));
    }

    public function test_cuit_string_representation(): void
    {
        $cuit = new Cuit('20-12345678-9');
        
        $this->assertEquals('20-12345678-9', (string) $cuit);
    }

    public function test_cuit_normalization(): void
    {
        $testCases = [
            '20123456789' => '20-12345678-9',
            '20 12345678 9' => '20-12345678-9',
            '20-12345678-9' => '20-12345678-9',
            '20.12345678.9' => '20-12345678-9',
        ];

        foreach ($testCases as $input => $expected) {
            $cuit = new Cuit($input);
            $this->assertEquals($expected, $cuit->getValue(), "Failed for input: {$input}");
        }
    }

    public function test_cuit_validation_with_real_examples(): void
    {
        $validCuits = [
            '20-00390552-8',
            '30-12345678-9',
            '23-45678901-2',
        ];

        foreach ($validCuits as $cuitString) {
            $cuit = new Cuit($cuitString);
            $this->assertEquals($cuitString, $cuit->getValue());
        }
    }
} 