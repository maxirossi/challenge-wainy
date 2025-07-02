<?php

namespace App\Jobs;

use App\Domains\Deudores\Entities\Deudor;
use App\Domains\Deudores\ValueObjects\Cuit;
use App\Domains\EntidadesFinancieras\ValueObjects\CodigoEntidad;
use App\Domains\Deudores\Repositories\DeudorRepositoryInterface;
use App\Domains\EntidadesFinancieras\Repositories\EntidadFinancieraRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class ProcessSqsMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutos
    public $tries = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private array $messageData
    ) {}

    /**
     * Execute the job.
     */
    public function handle(
        DeudorRepositoryInterface $deudorRepository,
        EntidadFinancieraRepositoryInterface $entidadRepository
    ): void {
        try {
            Log::info('Procesando mensaje SQS', ['data' => $this->messageData]);

            // Validar que el mensaje tenga la estructura esperada
            if (!isset($this->messageData['deudores']) || !is_array($this->messageData['deudores'])) {
                throw new InvalidArgumentException('Estructura de mensaje inválida: falta array de deudores');
            }

            $deudoresProcesados = 0;
            $errores = [];

            foreach ($this->messageData['deudores'] as $deudorData) {
                try {
                    $this->procesarDeudor($deudorData, $deudorRepository, $entidadRepository);
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

            Log::info('Procesamiento de mensaje SQS completado', [
                'deudores_procesados' => $deudoresProcesados,
                'errores' => count($errores),
                'total_deudores' => count($this->messageData['deudores'])
            ]);

            if (!empty($errores)) {
                Log::warning('Errores durante el procesamiento', ['errores' => $errores]);
            }

        } catch (\Exception $e) {
            Log::error('Error fatal procesando mensaje SQS', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Procesa un deudor individual
     */
    private function procesarDeudor(
        array $deudorData,
        DeudorRepositoryInterface $deudorRepository,
        EntidadFinancieraRepositoryInterface $entidadRepository
    ): void {
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
        $entidad = $entidadRepository->findByCodigo($codigoEntidad);
        if (!$entidad) {
            $entidad = new \App\Domains\EntidadesFinancieras\Entities\EntidadFinanciera(
                $codigoEntidad,
                $deudorData['nombre_entidad'] ?? 'Entidad ' . $codigoEntidad->getValue(),
                true,
                $deudorData['tipo_entidad'] ?? null
            );
            $entidadRepository->save($entidad);
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
        $deudorRepository->save($deudor);

        Log::info('Deudor procesado exitosamente', [
            'cuit' => $cuit->getValue(),
            'entidad' => $codigoEntidad->getValue(),
            'monto' => $deudorData['monto_deuda']
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Job ProcessSqsMessage falló', [
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
            'data' => $this->messageData
        ]);
    }
}
