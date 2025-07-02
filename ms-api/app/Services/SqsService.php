<?php

namespace App\Services;

use Aws\Sqs\SqsClient;
use App\Jobs\ProcessSqsMessage;
use Illuminate\Support\Facades\Log;

class SqsService
{
    private SqsClient $sqsClient;
    private string $queueUrl;

    public function __construct()
    {
        $this->sqsClient = new SqsClient([
            'version' => 'latest',
            'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
            'credentials' => [
                'key' => env('AWS_ACCESS_KEY_ID'),
                'secret' => env('AWS_SECRET_ACCESS_KEY'),
            ],
            'endpoint' => env('AWS_ENDPOINT'), // Para LocalStack
        ]);

        $this->queueUrl = env('SQS_QUEUE_URL', 'http://localhost:4566/000000000000/wayni-deudores-queue');
    }

    /**
     * Escucha mensajes de la cola SQS y los procesa
     */
    public function listenForMessages(): void
    {
        try {
            Log::info('Iniciando escucha de mensajes SQS', ['queue_url' => $this->queueUrl]);

            while (true) {
                $result = $this->sqsClient->receiveMessage([
                    'QueueUrl' => $this->queueUrl,
                    'MaxNumberOfMessages' => 10,
                    'WaitTimeSeconds' => 20, // Long polling
                    'VisibilityTimeout' => 300, // 5 minutos
                ]);

                $messages = $result->get('Messages');

                if (empty($messages)) {
                    Log::debug('No hay mensajes en la cola SQS');
                    continue;
                }

                Log::info('Mensajes recibidos de SQS', ['count' => count($messages)]);

                foreach ($messages as $message) {
                    $this->processMessage($message);
                }
            }
        } catch (\Exception $e) {
            Log::error('Error en la escucha de SQS', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Procesa un mensaje individual de SQS
     */
    private function processMessage(array $message): void
    {
        $receiptHandle = $message['ReceiptHandle'];
        $messageBody = $message['Body'];

        try {
            Log::info('Procesando mensaje SQS', [
                'message_id' => $message['MessageId'],
                'body' => $messageBody
            ]);

            // Decodificar el mensaje
            $messageData = json_decode($messageBody, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Error decodificando JSON: ' . json_last_error_msg());
            }

            // Validar estructura del mensaje
            if (!isset($messageData['type'])) {
                throw new \Exception('Tipo de mensaje no especificado');
            }

            // Procesar según el tipo de mensaje
            switch ($messageData['type']) {
                case 'deudores_procesados':
                    $this->handleDeudoresProcessed($messageData);
                    break;
                case 'archivo_procesado':
                    $this->handleFileProcessed($messageData);
                    break;
                default:
                    Log::warning('Tipo de mensaje desconocido', ['type' => $messageData['type']]);
            }

            // Eliminar mensaje de la cola
            $this->deleteMessage($receiptHandle);

            Log::info('Mensaje SQS procesado exitosamente', [
                'message_id' => $message['MessageId']
            ]);

        } catch (\Exception $e) {
            Log::error('Error procesando mensaje SQS', [
                'message_id' => $message['MessageId'],
                'error' => $e->getMessage(),
                'body' => $messageBody
            ]);

            // En caso de error, no eliminamos el mensaje para que pueda ser reprocesado
            // El mensaje volverá a estar disponible después del VisibilityTimeout
        }
    }

    /**
     * Maneja mensajes de deudores procesados
     */
    private function handleDeudoresProcessed(array $messageData): void
    {
        if (!isset($messageData['data']['deudores'])) {
            throw new \Exception('Datos de deudores no encontrados en el mensaje');
        }

        // Dispatch job para procesar los deudores
        ProcessSqsMessage::dispatch($messageData['data']);

        Log::info('Job de procesamiento de deudores dispatchado', [
            'deudores_count' => count($messageData['data']['deudores'])
        ]);
    }

    /**
     * Maneja mensajes de archivo procesado
     */
    private function handleFileProcessed(array $messageData): void
    {
        Log::info('Archivo procesado por el microservicio de importación', [
            'archivo' => $messageData['data']['archivo'] ?? 'desconocido',
            'fecha_procesamiento' => $messageData['data']['fecha_procesamiento'] ?? 'desconocida',
            'total_registros' => $messageData['data']['total_registros'] ?? 0
        ]);
    }

    /**
     * Elimina un mensaje de la cola SQS
     */
    private function deleteMessage(string $receiptHandle): void
    {
        try {
            $this->sqsClient->deleteMessage([
                'QueueUrl' => $this->queueUrl,
                'ReceiptHandle' => $receiptHandle,
            ]);

            Log::debug('Mensaje eliminado de la cola SQS', ['receipt_handle' => $receiptHandle]);
        } catch (\Exception $e) {
            Log::error('Error eliminando mensaje de SQS', [
                'error' => $e->getMessage(),
                'receipt_handle' => $receiptHandle
            ]);
        }
    }

    /**
     * Envía un mensaje a la cola SQS (para respuestas o notificaciones)
     */
    public function sendMessage(array $messageData): void
    {
        try {
            $result = $this->sqsClient->sendMessage([
                'QueueUrl' => $this->queueUrl,
                'MessageBody' => json_encode($messageData),
            ]);

            Log::info('Mensaje enviado a SQS', [
                'message_id' => $result->get('MessageId'),
                'data' => $messageData
            ]);
        } catch (\Exception $e) {
            Log::error('Error enviando mensaje a SQS', [
                'error' => $e->getMessage(),
                'data' => $messageData
            ]);
            throw $e;
        }
    }
} 