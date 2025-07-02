<?php

namespace App\Http\Controllers\Api;

use App\Application\UseCases\Deudores\GetDeudorByCuitUseCase;
use App\Application\UseCases\Deudores\GetTopDeudoresUseCase;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class DeudorController extends Controller
{
    public function __construct(
        private GetDeudorByCuitUseCase $getDeudorByCuitUseCase,
        private GetTopDeudoresUseCase $getTopDeudoresUseCase
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Obtiene el resumen de un deudor por CUIT
     */
    public function show(string $cuit): JsonResponse
    {
        try {
            $resumen = $this->getDeudorByCuitUseCase->execute($cuit);
            
            return response()->json([
                'success' => true,
                'data' => $resumen
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    /**
     * Obtiene los top N deudores con mayor deuda
     */
    public function top(Request $request, int $n): JsonResponse
    {
        try {
            $deudores = $this->getTopDeudoresUseCase->execute($n);
            
            return response()->json([
                'success' => true,
                'data' => $deudores
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
    }
}
