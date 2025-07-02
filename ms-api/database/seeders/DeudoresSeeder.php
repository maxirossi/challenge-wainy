<?php

namespace Database\Seeders;

use App\Models\Deudor;
use Illuminate\Database\Seeder;

class DeudoresSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $deudores = [
            // Deudor con múltiples préstamos en diferentes entidades
            [
                'cuit' => '20-12345678-9',
                'codigo_entidad' => 'BANCO001',
                'tipo_deuda' => 'préstamo personal',
                'monto_deuda' => 150000.00,
                'situacion' => 'normal',
                'fecha_vencimiento' => '2024-12-31',
                'fecha_procesamiento' => now(),
            ],
            [
                'cuit' => '20-12345678-9',
                'codigo_entidad' => 'BANCO002',
                'tipo_deuda' => 'tarjeta de crédito',
                'monto_deuda' => 75000.50,
                'situacion' => 'irregular',
                'fecha_vencimiento' => '2024-10-15',
                'fecha_procesamiento' => now(),
            ],
            [
                'cuit' => '20-12345678-9',
                'codigo_entidad' => 'FIN001',
                'tipo_deuda' => 'préstamo hipotecario',
                'monto_deuda' => 500000.00,
                'situacion' => 'normal',
                'fecha_vencimiento' => '2030-06-30',
                'fecha_procesamiento' => now(),
            ],
            
            // Otro deudor con situación irregular
            [
                'cuit' => '30-98765432-1',
                'codigo_entidad' => 'BANCO003',
                'tipo_deuda' => 'préstamo personal',
                'monto_deuda' => 250000.00,
                'situacion' => 'vencida',
                'fecha_vencimiento' => '2024-08-01',
                'fecha_procesamiento' => now(),
            ],
            [
                'cuit' => '30-98765432-1',
                'codigo_entidad' => 'FIN002',
                'tipo_deuda' => 'tarjeta de crédito',
                'monto_deuda' => 120000.75,
                'situacion' => 'morosa',
                'fecha_vencimiento' => '2024-09-15',
                'fecha_procesamiento' => now(),
            ],
            
            // Deudor con alta deuda
            [
                'cuit' => '20-55555555-5',
                'codigo_entidad' => 'BANCO001',
                'tipo_deuda' => 'préstamo empresarial',
                'monto_deuda' => 1500000.00,
                'situacion' => 'normal',
                'fecha_vencimiento' => '2025-12-31',
                'fecha_procesamiento' => now(),
            ],
            [
                'cuit' => '20-55555555-5',
                'codigo_entidad' => 'BANCO002',
                'tipo_deuda' => 'préstamo personal',
                'monto_deuda' => 300000.00,
                'situacion' => 'normal',
                'fecha_vencimiento' => '2024-11-30',
                'fecha_procesamiento' => now(),
            ],
            
            // Deudor con situación normal
            [
                'cuit' => '30-11111111-1',
                'codigo_entidad' => 'COOP001',
                'tipo_deuda' => 'préstamo personal',
                'monto_deuda' => 50000.00,
                'situacion' => 'normal',
                'fecha_vencimiento' => '2024-12-15',
                'fecha_procesamiento' => now(),
            ],
        ];

        foreach ($deudores as $deudor) {
            Deudor::create($deudor);
        }
    }
}
