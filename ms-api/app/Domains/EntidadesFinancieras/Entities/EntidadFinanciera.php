<?php

namespace App\Domains\EntidadesFinancieras\Entities;

use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;

class EntidadFinanciera
{
    private ?int $id;
    private CodigoEntidad $codigo;
    private string $nombre;
    private ?string $tipoEntidad;
    private bool $activa;

    public function __construct(
        CodigoEntidad $codigo,
        string $nombre,
        bool $activa = true,
        ?string $tipoEntidad = null,
        ?int $id = null
    ) {
        $this->codigo = $codigo;
        $this->nombre = $nombre;
        $this->activa = $activa;
        $this->tipoEntidad = $tipoEntidad;
        $this->id = $id;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCodigo(): CodigoEntidad
    {
        return $this->codigo;
    }

    public function getNombre(): string
    {
        return $this->nombre;
    }

    public function getTipoEntidad(): ?string
    {
        return $this->tipoEntidad;
    }

    public function isActiva(): bool
    {
        return $this->activa;
    }

    public function activar(): void
    {
        $this->activa = true;
    }

    public function desactivar(): void
    {
        $this->activa = false;
    }

    public function actualizarNombre(string $nuevoNombre): void
    {
        $this->nombre = $nuevoNombre;
    }

    public function actualizarTipoEntidad(?string $nuevoTipo): void
    {
        $this->tipoEntidad = $nuevoTipo;
    }

    public function esBanco(): bool
    {
        return $this->tipoEntidad === 'banco';
    }

    public function esFinanciera(): bool
    {
        return $this->tipoEntidad === 'financiera';
    }
} 