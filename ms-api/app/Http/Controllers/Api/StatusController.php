<?php

namespace App\Http\Controllers\Api;

use App\Domains\Deudores\Repositories\DeudorRepositoryInterface;
use App\Domains\EntidadesFinancieras\Repositories\EntidadFinancieraRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatusController extends Controller
{
    public function __construct(
        private DeudorRepositoryInterface $deudorRepository,
        private EntidadFinancieraRepositoryInterface $entidadRepository
    ) {}

    /**
     * Obtiene estadísticas generales del sistema
     */
    public function stats(): JsonResponse
    {
        try {
            // Obtener estadísticas básicas
            $totalDeudores = \App\Models\Deudor::count();
            $totalEntidades = \App\Models\EntidadFinanciera::count();
            $totalDeuda = \App\Models\Deudor::sum('monto_deuda');
            
            // Estadísticas por situación
            $situaciones = \App\Models\Deudor::selectRaw('situacion, COUNT(*) as cantidad, SUM(monto_deuda) as total_deuda')
                ->groupBy('situacion')
                ->get();

            // Top 5 entidades con más deudores
            $topEntidades = \App\Models\Deudor::selectRaw('codigo_entidad, COUNT(*) as cantidad_deudores, SUM(monto_deuda) as total_deuda')
                ->groupBy('codigo_entidad')
                ->orderByDesc('cantidad_deudores')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'resumen_general' => [
                        'total_deudores' => $totalDeudores,
                        'total_entidades' => $totalEntidades,
                        'total_deuda' => (float) $totalDeuda,
                        'deuda_promedio' => $totalDeudores > 0 ? (float) ($totalDeuda / $totalDeudores) : 0,
                    ],
                    'situaciones' => $situaciones,
                    'top_entidades' => $topEntidades,
                    'ultima_actualizacion' => now()->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error obteniendo estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene el estado de salud del sistema
     */
    public function health(): JsonResponse
    {
        try {
            $status = [
                'status' => 'healthy',
                'timestamp' => now()->toISOString(),
                'services' => [
                    'database' => $this->checkDatabase(),
                    'sqs' => $this->checkSqs(),
                ]
            ];

            $httpStatus = 200;
            
            // Si algún servicio no está saludable, cambiar el status
            foreach ($status['services'] as $service) {
                if ($service['status'] !== 'healthy') {
                    $status['status'] = 'unhealthy';
                    $httpStatus = 503;
                    break;
                }
            }

            return response()->json($status, $httpStatus);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'unhealthy',
                'timestamp' => now()->toISOString(),
                'error' => $e->getMessage()
            ], 503);
        }
    }

    /**
     * Verifica la conexión a la base de datos
     */
    private function checkDatabase(): array
    {
        try {
            \DB::connection()->getPdo();
            return [
                'status' => 'healthy',
                'message' => 'Conexión exitosa'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Error de conexión: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Verifica la conexión a SQS
     */
    private function checkSqs(): array
    {
        try {
            $sqsService = new \App\Services\SqsService();
            // Intentar crear el cliente SQS
            $client = new \Aws\Sqs\SqsClient([
                'version' => 'latest',
                'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
                'credentials' => [
                    'key' => env('AWS_ACCESS_KEY_ID'),
                    'secret' => env('AWS_SECRET_ACCESS_KEY'),
                ],
                'endpoint' => env('AWS_ENDPOINT'),
            ]);

            return [
                'status' => 'healthy',
                'message' => 'Cliente SQS configurado correctamente'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Error configurando SQS: ' . $e->getMessage()
            ];
        }
    }
} 