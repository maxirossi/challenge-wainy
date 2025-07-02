<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\EntidadFinancieraController;
use App\Http\Controllers\Api\StatusController;
use App\Http\Controllers\SqsDataController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Aquí se registran solo rutas globales, no las de módulos.
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Health check y status
Route::get('/health', [StatusController::class, 'health']);
Route::get('/stats', [StatusController::class, 'stats']);

// Endpoint para procesar datos de SQS
Route::post('/sqs/process-deudores', [SqsDataController::class, 'processDeudores']);

// Rutas para entidades financieras
Route::prefix('entidades')->group(function () {
    Route::get('/{codigo}', [EntidadFinancieraController::class, 'show']);
}); 