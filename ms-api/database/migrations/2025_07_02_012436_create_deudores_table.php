<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('deudores', function (Blueprint $table) {
            $table->id();
            $table->string('cuit', 13)->comment('CUIT del deudor');
            $table->string('codigo_entidad', 10)->comment('Código de la entidad financiera');
            $table->string('tipo_deuda', 50)->comment('Tipo de deuda (préstamo, tarjeta, etc.)');
            $table->decimal('monto_deuda', 15, 2)->comment('Monto de la deuda');
            $table->string('situacion', 50)->comment('Situación del deudor (normal, irregular, etc.)');
            $table->date('fecha_vencimiento')->nullable()->comment('Fecha de vencimiento del préstamo');
            $table->date('fecha_procesamiento')->comment('Fecha en que se procesó el registro');
            $table->timestamps();
            
            // Índices para optimizar consultas
            $table->index('cuit');
            $table->index('codigo_entidad');
            $table->index(['cuit', 'codigo_entidad']);
            $table->index('situacion');
            
            // Clave foránea a entidades financieras
            $table->foreign('codigo_entidad')->references('codigo')->on('entidades_financieras');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deudores');
    }
};
