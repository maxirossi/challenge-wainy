<?php

namespace Database\Seeders;

use App\Models\EntidadFinanciera;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EntidadesFinancierasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $entidades = [
            [
                'codigo' => 'BANCO001',
                'nombre' => 'Banco de la Nación Argentina',
                'tipo_entidad' => 'banco',
                'activa' => true,
            ],
            [
                'codigo' => 'BANCO002',
                'nombre' => 'Banco Santander Argentina',
                'tipo_entidad' => 'banco',
                'activa' => true,
            ],
            [
                'codigo' => 'BANCO003',
                'nombre' => 'Banco Galicia',
                'tipo_entidad' => 'banco',
                'activa' => true,
            ],
            [
                'codigo' => 'FIN001',
                'nombre' => 'Financiera del Sol',
                'tipo_entidad' => 'financiera',
                'activa' => true,
            ],
            [
                'codigo' => 'FIN002',
                'nombre' => 'Financiera Credicoop',
                'tipo_entidad' => 'financiera',
                'activa' => true,
            ],
            [
                'codigo' => 'COOP001',
                'nombre' => 'Cooperativa de Crédito',
                'tipo_entidad' => 'cooperativa',
                'activa' => true,
            ],
        ];

        foreach ($entidades as $entidad) {
            EntidadFinanciera::updateOrCreate(
                ['codigo' => $entidad['codigo']],
                $entidad
            );
        }
    }
}
