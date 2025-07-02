<?php

namespace App\Models;

use App\Domains\Deudores\Entities\Deudor as DeudorEntity;
use App\Domains\Deudores\ValueObjects\Cuit;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use DateTime;

class Deudor extends Model
{
    protected $table = 'deudores';
    
    protected $fillable = [
        'cuit',
        'codigo_entidad',
        'tipo_deuda',
        'monto_deuda',
        'situacion',
        'fecha_vencimiento',
        'fecha_procesamiento'
    ];
    
    protected $casts = [
        'monto_deuda' => 'decimal:2',
        'fecha_vencimiento' => 'date',
        'fecha_procesamiento' => 'date',
    ];
    
    /**
     * Relación con la entidad financiera
     */
    public function entidadFinanciera(): BelongsTo
    {
        return $this->belongsTo(EntidadFinanciera::class, 'codigo_entidad', 'codigo');
    }
    
    /**
     * Convierte el modelo Eloquent a entidad del dominio
     */
    public function toDomainEntity(): DeudorEntity
    {
        return new DeudorEntity(
            new Cuit($this->cuit),
            new CodigoEntidad($this->codigo_entidad),
            $this->tipo_deuda,
            (float) $this->monto_deuda,
            $this->situacion,
            $this->fecha_procesamiento,
            $this->fecha_vencimiento,
            $this->id
        );
    }
    
    /**
     * Crea un modelo Eloquent desde una entidad del dominio
     */
    public static function fromDomainEntity(DeudorEntity $deudor): self
    {
        $model = new self();
        $model->id = $deudor->getId();
        $model->cuit = $deudor->getCuit()->getValue();
        $model->codigo_entidad = $deudor->getCodigoEntidad()->getValue();
        $model->tipo_deuda = $deudor->getTipoDeuda();
        $model->monto_deuda = $deudor->getMontoDeuda();
        $model->situacion = $deudor->getSituacion();
        $model->fecha_procesamiento = $deudor->getFechaProcesamiento();
        $model->fecha_vencimiento = $deudor->getFechaVencimiento();
        
        return $model;
    }
    
    /**
     * Scope para filtrar por CUIT
     */
    public function scopePorCuit($query, $cuit)
    {
        return $query->where('cuit', $cuit);
    }
    
    /**
     * Scope para filtrar por entidad
     */
    public function scopePorEntidad($query, $codigoEntidad)
    {
        return $query->where('codigo_entidad', $codigoEntidad);
    }
    
    /**
     * Scope para filtrar por situación
     */
    public function scopePorSituacion($query, $situacion)
    {
        return $query->where('situacion', $situacion);
    }
}
