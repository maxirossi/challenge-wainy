<?php
use Illuminate\Support\Facades\Route;
use App\Modules\Deudores\Infrastructure\Http\Controllers\DeudorController;

Route::get('{cuit}', [DeudorController::class, 'show']);
Route::get('top/{n}', [DeudorController::class, 'top']);
Route::post('process-sqs', [DeudorController::class, 'processSqsMessages']);
