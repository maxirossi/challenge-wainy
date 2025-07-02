<?php

namespace App\Console\Commands;

use App\Services\SqsService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ListenSqsQueue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sqs:listen {--daemon : Run in daemon mode}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Escucha mensajes de la cola SQS para procesar datos de deudores';

    /**
     * Execute the console command.
     */
    public function handle(SqsService $sqsService): int
    {
        $this->info('🚀 Iniciando listener de SQS para procesamiento de deudores...');
        $this->info('📋 Cola: ' . env('SQS_QUEUE_URL', 'http://localhost:4566/000000000000/wayni-deudores-queue'));
        $this->info('🔧 Modo: ' . ($this->option('daemon') ? 'Daemon' : 'Single run'));
        
        if ($this->option('daemon')) {
            $this->info('⏳ Ejecutando en modo daemon (Ctrl+C para detener)...');
        }

        try {
            if ($this->option('daemon')) {
                // Modo daemon - ejecuta continuamente
                while (true) {
                    $this->info('👂 Escuchando mensajes de SQS...');
                    $sqsService->listenForMessages();
                }
            } else {
                // Modo single run - ejecuta una vez
                $this->info('👂 Escuchando mensajes de SQS (single run)...');
                $sqsService->listenForMessages();
            }
        } catch (\Exception $e) {
            $this->error('❌ Error en el listener de SQS: ' . $e->getMessage());
            Log::error('Error en comando ListenSqsQueue', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }

        return 0;
    }
}
