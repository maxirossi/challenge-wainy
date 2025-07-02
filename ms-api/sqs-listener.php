<?php

require_once 'vendor/autoload.php';

use Aws\Sqs\SqsClient;

echo "SQS Listener - Enviando mensajes a Laravel API\n";

try {
    // Create SQS client
    $sqsClient = new SqsClient([
        'version' => 'latest',
        'region' => 'us-east-1',
        'credentials' => [
            'key' => 'test',
            'secret' => 'test',
        ],
        'endpoint' => 'http://localstack:4566',
    ]);

    $queueUrl = "http://localstack:4566/000000000000/deudores-queue";
    $laravelApiUrl = "http://localhost:8000/process-sqs";
    
    echo "Conectando a cola SQS: {$queueUrl}\n";
    echo "Enviando datos a Laravel API: {$laravelApiUrl}\n";
    
    while (true) {
        try {
            // Recibir mensajes de SQS
            $result = $sqsClient->receiveMessage([
                'QueueUrl' => $queueUrl,
                'MaxNumberOfMessages' => 10,
                'WaitTimeSeconds' => 20,
            ]);

            if (!empty($result['Messages'])) {
                echo "Recibidos " . count($result['Messages']) . " mensajes\n";
                
                foreach ($result['Messages'] as $message) {
                    echo "Procesando mensaje ID: " . $message['MessageId'] . "\n";
                    
                    try {
                        $body = json_decode($message['Body'], true);
                        
                        if (json_last_error() !== JSON_ERROR_NONE) {
                            echo "Error: JSON inválido en mensaje\n";
                            continue;
                        }
                        
                        echo "Enviando datos a Laravel API...\n";
                        
                        // Enviar datos a Laravel API
                        $ch = curl_init();
                        curl_setopt($ch, CURLOPT_URL, $laravelApiUrl);
                        curl_setopt($ch, CURLOPT_POST, true);
                        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
                        curl_setopt($ch, CURLOPT_HTTPHEADER, [
                            'Content-Type: application/json',
                            'Accept: application/json'
                        ]);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                        
                        $response = curl_exec($ch);
                        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        curl_close($ch);
                        
                        if ($httpCode === 200) {
                            $responseData = json_decode($response, true);
                            echo "✅ Datos procesados exitosamente\n";
                            echo "   - Deudores procesados: " . ($responseData['deudores_procesados'] ?? 0) . "\n";
                            echo "   - Errores: " . count($responseData['errores'] ?? []) . "\n";
                            
                            // Eliminar mensaje de la cola
                            $sqsClient->deleteMessage([
                                'QueueUrl' => $queueUrl,
                                'ReceiptHandle' => $message['ReceiptHandle'],
                            ]);
                            echo "   - Mensaje eliminado de la cola\n";
                        } else {
                            echo "❌ Error en API Laravel (HTTP {$httpCode}): {$response}\n";
                        }
                        
                    } catch (\Exception $e) {
                        echo "❌ Error procesando mensaje: " . $e->getMessage() . "\n";
                    }
                }
            } else {
                echo "No hay mensajes en la cola, esperando...\n";
            }
            
        } catch (\Exception $e) {
            echo "Error recibiendo mensajes: " . $e->getMessage() . "\n";
            sleep(5);
        }
    }
    
} catch (Exception $e) {
    echo "Error fatal: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
} 