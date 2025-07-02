<?php

namespace App\Modules\Deudores\Infrastructure\Http\Controllers;

use App\Application\UseCases\Deudores\GetDeudorByCuitUseCase;
use App\Application\UseCases\Deudores\GetTopDeudoresUseCase;
use App\Application\UseCases\Deudores\GetDeudoresByEntidadUseCase;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class DeudorController extends Controller
{
    public function __construct(
        private GetDeudorByCuitUseCase $getDeudorByCuitUseCase,
        private GetTopDeudoresUseCase $getTopDeudoresUseCase,
        private GetDeudoresByEntidadUseCase $getDeudoresByEntidadUseCase
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
     * Obtiene los deudores por entidad financiera
     */
    public function byEntidad(string $codigo): JsonResponse
    {
        try {
            $resumen = $this->getDeudoresByEntidadUseCase->execute($codigo);
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
     * Obtiene los top N deudores con mayor deuda (opcional: filtro por situación)
     */
    public function top(Request $request, int $n): JsonResponse
    {
        try {
            $situacion = $request->query('situacion');
            $deudores = $this->getTopDeudoresUseCase->execute($n, $situacion);
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

    /**
     * Endpoint para procesar mensajes SQS desde el script listener
     */
    public function processSqsMessages(Request $request): JsonResponse
    {
        try {
            $data = $request->all();
            
            // Validar estructura del mensaje
            if (!isset($data['deudores']) || !is_array($data['deudores'])) {
                throw new InvalidArgumentException('Estructura de mensaje inválida: falta array de deudores');
            }

            // Despachar el Job con los datos reales
            \App\Jobs\ProcessSqsMessage::dispatch($data);

            return response()->json([
                'success' => true,
                'message' => 'Job despachado correctamente',
                'deudores_recibidos' => count($data['deudores'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}
