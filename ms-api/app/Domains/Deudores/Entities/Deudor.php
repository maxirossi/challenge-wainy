<?php

namespace App\Domains\Deudores\Entities;

use App\Domains\Deudores\ValueObjects\Cuit;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use DateTime;

class Deudor
{
    private ?int $id;
    private Cuit $cuit;
    private CodigoEntidad $codigoEntidad;
    private string $tipoDeuda;
    private float $montoDeuda;
    private string $situacion;
    private ?DateTime $fechaVencimiento;
    private DateTime $fechaProcesamiento;

    public function __construct(
        Cuit $cuit,
        CodigoEntidad $codigoEntidad,
        string $tipoDeuda,
        float $montoDeuda,
        string $situacion,
        DateTime $fechaProcesamiento,
        ?DateTime $fechaVencimiento = null,
        ?int $id = null
    ) {
        $this->cuit = $cuit;
        $this->codigoEntidad = $codigoEntidad;
        $this->tipoDeuda = $tipoDeuda;
        $this->montoDeuda = $montoDeuda;
        $this->situacion = $situacion;
        $this->fechaProcesamiento = $fechaProcesamiento;
        $this->fechaVencimiento = $fechaVencimiento;
        $this->id = $id;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCuit(): Cuit
    {
        return $this->cuit;
    }

    public function getCodigoEntidad(): CodigoEntidad
    {
        return $this->codigoEntidad;
    }

    public function getTipoDeuda(): string
    {
        return $this->tipoDeuda;
    }

    public function getMontoDeuda(): float
    {
        return $this->montoDeuda;
    }

    public function getSituacion(): string
    {
        return $this->situacion;
    }

    public function getFechaVencimiento(): ?DateTime
    {
        return $this->fechaVencimiento;
    }

    public function getFechaProcesamiento(): DateTime
    {
        return $this->fechaProcesamiento;
    }

    public function esDeudaVencida(): bool
    {
        if ($this->fechaVencimiento === null) {
            return false;
        }
        
        return $this->fechaVencimiento < new DateTime();
    }

    public function esSituacionIrregular(): bool
    {
        return in_array(strtolower($this->situacion), ['irregular', 'vencida', 'morosa']);
    }

    public function actualizarSituacion(string $nuevaSituacion): void
    {
        $this->situacion = $nuevaSituacion;
    }

    public function actualizarMontoDeuda(float $nuevoMonto): void
    {
        $this->montoDeuda = $nuevoMonto;
    }
} 