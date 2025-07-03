<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Endpoint temporal para E2E testing - devuelve datos directamente desde la base de datos
// COMENTADO: Esta ruta está duplicada y interfiere con las rutas del módulo de deudores
/*
Route::get('/api/deudores/{cuit}', function ($cuit) {
    try {
        $deudor = \DB::table('deudores')->where('cuit', $cuit)->first();
        
        if (!$deudor) {
            return response()->json([
                'success' => false,
                'message' => 'Deudor no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'cuit' => $deudor->cuit,
                'total_deuda' => (float) $deudor->monto_deuda,
                'situacion' => $deudor->situacion,
                'tipo_deuda' => $deudor->tipo_deuda,
                'codigo_entidad' => $deudor->codigo_entidad,
                'fecha_procesamiento' => $deudor->fecha_procesamiento
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error interno del servidor',
            'error' => $e->getMessage()
        ], 500);
    }
});
*/
