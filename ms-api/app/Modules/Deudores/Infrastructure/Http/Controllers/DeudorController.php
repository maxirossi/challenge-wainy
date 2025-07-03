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

    public function all(): JsonResponse
    {
        try {
            $deudores = \DB::table('deudores')->get();
            return response()->json([
                'success' => true,
                'data' => $deudores
            ]);
        } catch (\Exception $e) {
            \Log::error('Error obteniendo todos los deudores', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
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

    public function processSqsMessages(Request $request): JsonResponse
    {
        try {
            // Debug: Log the raw request data
            \Log::info('DeudorController - Raw request data', [
                'all' => $request->all(),
                'json' => $request->json()->all(),
                'content_type' => $request->header('Content-Type'),
                'body' => $request->getContent(),
                'input' => $request->input()
            ]);
            
            // Try different ways to get the data
            $data = $request->json()->all();
            if (empty($data)) {
                $data = $request->all();
            }
            
            \Log::info('DeudorController - Processed data', ['data' => $data]);
            
            // Validar estructura del mensaje
            if (!isset($data['deudores']) || !is_array($data['deudores'])) {
                throw new InvalidArgumentException('Estructura de mensaje inválida: falta array de deudores');
            }

            // Procesar directamente sin usar Jobs
            $deudoresProcesados = 0;
            $errores = [];

            foreach ($data['deudores'] as $deudorData) {
                try {
                    $this->procesarDeudorDirecto($deudorData);
                    $deudoresProcesados++;
                } catch (\Exception $e) {
                    $errores[] = [
                        'cuit' => $deudorData['cuit'] ?? 'desconocido',
                        'error' => $e->getMessage()
                    ];
                    \Log::error('Error procesando deudor', [
                        'cuit' => $deudorData['cuit'] ?? 'desconocido',
                        'error' => $e->getMessage(),
                        'data' => $deudorData
                    ]);
                }
            }

            \Log::info('Procesamiento de mensaje SQS completado', [
                'deudores_procesados' => $deudoresProcesados,
                'errores' => count($errores),
                'total_deudores' => count($data['deudores'])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Datos procesados correctamente',
                'deudores_recibidos' => count($data['deudores']),
                'deudores_procesados' => $deudoresProcesados,
                'errores' => count($errores),
                'detalle_errores' => $errores
            ]);

        } catch (\Exception $e) {
            \Log::error('DeudorController - Error processing SQS message', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    private function procesarDeudorDirecto(array $deudorData): void
    {
        // Validar campos requeridos
        $camposRequeridos = ['cuit', 'codigoEntidad', 'monto', 'situacion'];
        foreach ($camposRequeridos as $campo) {
            if (!isset($deudorData[$campo])) {
                throw new InvalidArgumentException("Campo requerido faltante: {$campo}");
            }
        }

        // Crear Value Objects
        $cuit = new \App\Domains\Deudores\ValueObjects\Cuit($deudorData['cuit']);
        $codigoEntidad = new \App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad($deudorData['codigoEntidad']);

        // Verificar si la entidad financiera existe, si no, crearla
        $entidadRepository = app(\App\Domains\EntidadesFinancieras\Repositories\EntidadFinancieraRepositoryInterface::class);
        $entidad = $entidadRepository->findByCodigo($codigoEntidad);
        
        if (!$entidad) {
            $entidad = new \App\Domains\EntidadesFinancieras\Entities\EntidadFinanciera(
                $codigoEntidad,
                'Entidad ' . $codigoEntidad->getValue(),
                true,
                null
            );
            $entidadRepository->save($entidad);
        }

        // Crear entidad de dominio
        $deudor = new \App\Domains\Deudores\Entities\Deudor(
            $cuit,
            $codigoEntidad,
            'préstamo', // tipo_deuda por defecto
            (float) $deudorData['monto'],
            $deudorData['situacion'],
            new \DateTime('now'),
            null
        );

        // Guardar en el repositorio
        $deudorRepository = app(\App\Domains\Deudores\Repositories\DeudorRepositoryInterface::class);
        $deudorRepository->save($deudor);

        \Log::info('Deudor procesado exitosamente', [
            'cuit' => $cuit->getValue(),
            'entidad' => $codigoEntidad->getValue(),
            'monto' => $deudorData['monto']
        ]);
    }
}
