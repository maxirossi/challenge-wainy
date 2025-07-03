<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Limpiar completamente la tabla users antes de crear el usuario de test
        \App\Models\User::query()->delete();
        User::factory()->firstOrCreate([
            'email' => 'test@example.com',
        ], [
            'name' => 'Test User',
        ]);

        $this->call([
            EntidadesFinancierasSeeder::class,
            DeudoresSeeder::class,
        ]);
    }
}
