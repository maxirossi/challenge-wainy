<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DeudorController;
use App\Http\Controllers\Api\EntidadFinancieraController;
use App\Http\Controllers\Api\StatusController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Health check y status
Route::get('/health', [StatusController::class, 'health']);
Route::get('/stats', [StatusController::class, 'stats']);

// Rutas para deudores
Route::prefix('deudores')->group(function () {
    Route::get('/{cuit}', [DeudorController::class, 'show']);
    Route::get('/top/{n}', [DeudorController::class, 'top']);
});

// Rutas para entidades financieras
Route::prefix('entidades')->group(function () {
    Route::get('/{codigo}', [EntidadFinancieraController::class, 'show']);
}); 