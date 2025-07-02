<?php

namespace App\Http\Controllers\Api;

use App\Application\UseCases\EntidadesFinancieras\GetEntidadByCodigoUseCase;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class EntidadFinancieraController extends Controller
{
    public function __construct(
        private GetEntidadByCodigoUseCase $getEntidadByCodigoUseCase
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
     * Obtiene el resumen de una entidad financiera por código
     */
    public function show(string $codigo): JsonResponse
    {
        try {
            $resumen = $this->getEntidadByCodigoUseCase->execute($codigo);
            
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
}
