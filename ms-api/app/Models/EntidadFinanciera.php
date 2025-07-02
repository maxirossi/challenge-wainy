<?php

namespace App\Models;

use App\Domains\EntidadesFinancieras\Entities\EntidadFinanciera as EntidadFinancieraEntity;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EntidadFinanciera extends Model
{
    protected $table = 'entidades_financieras';
    
    protected $fillable = [
        'codigo',
        'nombre',
        'tipo_entidad',
        'activa'
    ];
    
    protected $casts = [
        'activa' => 'boolean',
    ];
    
    /**
     * Relación con los deudores de esta entidad
     */
    public function deudores(): HasMany
    {
        return $this->hasMany(Deudor::class, 'codigo_entidad', 'codigo');
    }
    
    /**
     * Convierte el modelo Eloquent a entidad del dominio
     */
    public function toDomainEntity(): EntidadFinancieraEntity
    {
        return new EntidadFinancieraEntity(
            new CodigoEntidad($this->codigo),
            $this->nombre,
            $this->activa,
            $this->tipo_entidad,
            $this->id
        );
    }
    
    /**
     * Crea un modelo Eloquent desde una entidad del dominio
     */
    public static function fromDomainEntity(EntidadFinancieraEntity $entidad): self
    {
        $model = new self();
        $model->id = $entidad->getId();
        $model->codigo = $entidad->getCodigo()->getValue();
        $model->nombre = $entidad->getNombre();
        $model->tipo_entidad = $entidad->getTipoEntidad();
        $model->activa = $entidad->isActiva();
        
        return $model;
    }
    
    /**
     * Scope para entidades activas
     */
    public function scopeActivas($query)
    {
        return $query->where('activa', true);
    }
}
