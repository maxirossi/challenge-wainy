<?php

namespace App\Domains\EntidadesFinancieras\ValueObjects;

use InvalidArgumentException;

class CodigoEntidad
{
    private string $value;

    public function __construct(string $codigo)
    {
        $this->validate($codigo);
        $this->value = strtoupper(trim($codigo));
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }

    private function validate(string $codigo): void
    {
        $cleanCodigo = trim($codigo);
        
        // Validar longitud (máximo 10 caracteres)
        if (strlen($cleanCodigo) === 0 || strlen($cleanCodigo) > 10) {
            throw new InvalidArgumentException('El código de entidad debe tener entre 1 y 10 caracteres');
        }
        
        // Validar que contenga solo letras, números y guiones
        if (!preg_match('/^[A-Za-z0-9\-]+$/', $cleanCodigo)) {
            throw new InvalidArgumentException('El código de entidad solo puede contener letras, números y guiones');
        }
    }

    public function equals(CodigoEntidad $other): bool
    {
        return $this->value === $other->value;
    }
} 