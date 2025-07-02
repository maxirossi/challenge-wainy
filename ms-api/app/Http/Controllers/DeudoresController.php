<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DeudoresController extends Controller
{
    /**
     * Endpoint temporal para procesar mensajes SQS manualmente
     */
    public function processSqsMessages()
    {
        try {
            // Simular el mensaje que viene de ms-importer
            $messageData = [
                'deudores' => [
                    [
                        'cuit' => '20-00390552-8',
                        'codigo_entidad' => 'BANCO001',
                        'tipo_deuda' => 'préstamo personal',
                        'monto_deuda' => 150000.00,
                        'situacion' => 'normal',
                        'fecha_vencimiento' => '2024-12-31',
                        'fecha_procesamiento' => '2024-01-01T00:00:00Z',
                        'nombre_entidad' => 'Banco de la Nación Argentina',
                        'tipo_entidad' => 'banco'
                    ]
                ]
            ];

            // Despachar el Job
            \App\Jobs\ProcessSqsMessage::dispatch($messageData);

            return response()->json([
                'message' => 'Job despachado correctamente',
                'data' => $messageData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
} 