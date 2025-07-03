<?php
use Illuminate\Support\Facades\Route;
use App\Modules\Deudores\Infrastructure\Http\Controllers\DeudorController;

Route::get('list', [DeudorController::class, 'all']);
Route::get('top/{n}', [DeudorController::class, 'top']);
Route::get('{cuit}', [DeudorController::class, 'show']);
Route::post('process-sqs', [DeudorController::class, 'processSqsMessages']);
