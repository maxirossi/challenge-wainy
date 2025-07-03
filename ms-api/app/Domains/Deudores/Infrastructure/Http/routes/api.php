<?php

use Illuminate\Support\Facades\Route;

// Rutas para el dominio Deudores
Route::prefix('deudores')->group(function () {
    Route::get('all', [DeudorController::class, 'all']);
    Route::get('/{cuit}', [DeudorController::class, 'show']);
    Route::get('/top/{n}', [DeudorController::class, 'top']);
    Route::post('/process-sqs', [DeudorController::class, 'processSqsMessages']);
}); 