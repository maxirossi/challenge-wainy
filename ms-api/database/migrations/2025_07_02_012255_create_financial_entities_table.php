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
        Schema::create('entidades_financieras', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 10)->unique()->comment('Código de la entidad financiera');
            $table->string('nombre', 255)->comment('Nombre de la entidad financiera');
            $table->string('tipo_entidad', 50)->nullable()->comment('Tipo de entidad (banco, financiera, etc.)');
            $table->boolean('activa')->default(true)->comment('Indica si la entidad está activa');
            $table->timestamps();
            
            $table->index('codigo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entidades_financieras');
    }
};
