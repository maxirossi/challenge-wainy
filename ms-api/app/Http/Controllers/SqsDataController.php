<?php

namespace App\Http\Controllers;

use App\Domains\Deudores\Entities\Deudor;
use App\Domains\Deudores\ValueObjects\Cuit;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use App\Domains\Deudores\Repositories\DeudorRepositoryInterface;
use App\Domains\EntidadesFinancieras\Repositories\EntidadFinancieraRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class SqsDataController extends Controller
{
    public function __construct(
        private DeudorRepositoryInterface $deudorRepository,
        private EntidadFinancieraRepositoryInterface $entidadRepository
    ) {}

    /**
     * Recibe datos de deudores desde el script SQS y los procesa
     */
    public function processDeudores(Request $request): JsonResponse
    {
        try {
            $data = $request->all();
            
            Log::info('Datos recibidos desde SQS script', ['data' => $data]);

            // Validar estructura del mensaje
            if (!isset($data['deudores']) || !is_array($data['deudores'])) {
                throw new InvalidArgumentException('Estructura de mensaje inválida: falta array de deudores');
            }

            $deudoresProcesados = 0;
            $errores = [];

            foreach ($data['deudores'] as $deudorData) {
                try {
                    $this->procesarDeudor($deudorData);
                    $deudoresProcesados++;
                } catch (\Exception $e) {
                    $errores[] = [
                        'cuit' => $deudorData['cuit'] ?? 'desconocido',
                        'error' => $e->getMessage()
                    ];
                    Log::error('Error procesando deudor', [
                        'cuit' => $deudorData['cuit'] ?? 'desconocido',
                        'error' => $e->getMessage(),
                        'data' => $deudorData
                    ]);
                }
            }

            Log::info('Procesamiento completado', [
                'deudores_procesados' => $deudoresProcesados,
                'errores' => count($errores),
                'total_deudores' => count($data['deudores'])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Datos procesados correctamente',
                'deudores_procesados' => $deudoresProcesados,
                'errores' => $errores,
                'total_deudores' => count($data['deudores'])
            ]);

        } catch (\Exception $e) {
            Log::error('Error fatal procesando datos SQS', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Procesa un deudor individual
     */
    private function procesarDeudor(array $deudorData): void
    {
        // Validar campos requeridos
        $camposRequeridos = ['cuit', 'codigo_entidad', 'tipo_deuda', 'monto_deuda', 'situacion'];
        foreach ($camposRequeridos as $campo) {
            if (!isset($deudorData[$campo])) {
                throw new InvalidArgumentException("Campo requerido faltante: {$campo}");
            }
        }

        // Crear Value Objects
        $cuit = new Cuit($deudorData['cuit']);
        $codigoEntidad = new CodigoEntidad($deudorData['codigo_entidad']);

        // Verificar si la entidad financiera existe, si no, crearla
        $entidad = $this->entidadRepository->findByCodigo($codigoEntidad);
        if (!$entidad) {
            $entidad = new \App\Domains\EntidadesFinancieras\Entities\EntidadFinanciera(
                $codigoEntidad,
                $deudorData['nombre_entidad'] ?? 'Entidad ' . $codigoEntidad->getValue(),
                true,
                $deudorData['tipo_entidad'] ?? null
            );
            $this->entidadRepository->save($entidad);
        }

        // Crear entidad de dominio
        $deudor = new Deudor(
            $cuit,
            $codigoEntidad,
            $deudorData['tipo_deuda'],
            (float) $deudorData['monto_deuda'],
            $deudorData['situacion'],
            new \DateTime($deudorData['fecha_procesamiento'] ?? 'now'),
            isset($deudorData['fecha_vencimiento']) ? new \DateTime($deudorData['fecha_vencimiento']) : null
        );

        // Guardar en el repositorio
        $this->deudorRepository->save($deudor);

        Log::info('Deudor procesado exitosamente', [
            'cuit' => $cuit->getValue(),
            'entidad' => $codigoEntidad->getValue(),
            'monto' => $deudorData['monto_deuda']
        ]);
    }
} 