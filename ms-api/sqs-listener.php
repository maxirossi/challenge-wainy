<?php

require_once 'vendor/autoload.php';

use Aws\Sqs\SqsClient;

echo "SQS Listener - Enviando mensajes a Laravel API\n";

// Función para esperar a que la cola esté disponible
function waitForQueue($sqsClient, $queueUrl, $maxAttempts = 30) {
    echo "⏳ Esperando a que la cola esté disponible...\n";
    
    for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
        try {
            // Intentar obtener atributos de la cola para verificar que existe
            $sqsClient->getQueueAttributes([
                'QueueUrl' => $queueUrl,
                'AttributeNames' => ['All']
            ]);
            
            echo "✅ Cola disponible después de $attempt intentos\n";
            return true;
            
        } catch (\Exception $e) {
            echo "⏳ Intento $attempt/$maxAttempts: Cola no disponible aún... (" . $e->getMessage() . ")\n";
            
            if ($attempt < $maxAttempts) {
                sleep(2);
            } else {
                echo "❌ Error: La cola no está disponible después de $maxAttempts intentos\n";
                return false;
            }
        }
    }
    
    return false;
}

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

    $queueUrl = "http://localstack:4566/000000000000/deudores-import-queue";
    $laravelApiUrl = "http://localhost:8000/api/deudores/process-sqs";
    
    echo "Conectando a cola SQS: {$queueUrl}\n";
    echo "Enviando datos a Laravel API: {$laravelApiUrl}\n";
    
    // Esperar a que la cola esté disponible
    if (!waitForQueue($sqsClient, $queueUrl)) {
        echo "❌ No se pudo conectar a la cola. Saliendo...\n";
        exit(1);
    }
    
    echo "🚀 Iniciando procesamiento de mensajes...\n";
    
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
                        
                        // Log del mensaje recibido
                        file_put_contents('/tmp/sqs_listener.log', "Mensaje recibido: " . print_r($body, true) . "\n", FILE_APPEND);

                        $payload = null;
                        
                        // Caso 1: Mensaje directo con 'deudores' (del importador NestJS)
                        if (isset($body['deudores'])) {
                            $payload = $body;
                            echo "✅ Mensaje JSON directo detectado\n";
                        } 
                        // Caso 2: Mensaje con 'data.deudores' (anidado)
                        elseif (isset($body['data']['deudores'])) {
                            $payload = $body['data'];
                            echo "✅ Mensaje JSON anidado detectado\n";
                        }
                        // Caso 3: Job serializado de Laravel - extraer datos
                        elseif (isset($body['data']['command'])) {
                            echo "⚠️ Job serializado de Laravel detectado - extrayendo datos\n";
                            
                            // Extraer datos del comando serializado
                            $command = $body['data']['command'];
                            
                            // Buscar el patrón de datos serializados
                            if (preg_match('/s:8:"deudores";a:\d+:\{.*?\}/s', $command, $matches)) {
                                // Reconstruir el array serializado completo
                                $serializedData = 'a:1:{' . $matches[0] . '}';
                                
                                // Deserializar los datos
                                $deserializedData = unserialize($serializedData);
                                
                                if ($deserializedData && isset($deserializedData['deudores'])) {
                                    $payload = $deserializedData;
                                    echo "✅ Datos extraídos de job serializado\n";
                                } else {
                                    echo "❌ Error deserializando datos\n";
                                }
                            } else {
                                echo "❌ No se encontró patrón de datos en el comando serializado\n";
                            }
                        }
                        
                        if (!$payload) {
                            echo "Mensaje ignorado: formato no reconocido\n";
                            file_put_contents('/tmp/sqs_listener.log', "Mensaje ignorado: formato no reconocido\n", FILE_APPEND);
                            // Eliminar mensaje de la cola para que no se procese infinitamente
                            $sqsClient->deleteMessage([
                                'QueueUrl' => $queueUrl,
                                'ReceiptHandle' => $message['ReceiptHandle']
                            ]);
                            continue;
                        }

                        // Enviar a la API de Laravel
                        echo "Enviando datos a Laravel API...\n";
                        
                        $apiUrl = $laravelApiUrl;
                        $jsonData = json_encode($payload);
                        
                        // Log del payload que se envía
                        file_put_contents('/tmp/sqs_listener.log', "Payload enviado a API: " . $jsonData . "\n", FILE_APPEND);
                        
                        $ch = curl_init();
                        curl_setopt($ch, CURLOPT_URL, $apiUrl);
                        curl_setopt($ch, CURLOPT_POST, true);
                        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
                        curl_setopt($ch, CURLOPT_HTTPHEADER, [
                            'Content-Type: application/json',
                            'Content-Length: ' . strlen($jsonData)
                        ]);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                        
                        $response = curl_exec($ch);
                        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        curl_close($ch);
                        
                        // Log de la respuesta
                        file_put_contents('/tmp/sqs_listener.log', "Respuesta API (HTTP $httpCode): " . $response . "\n", FILE_APPEND);
                        
                        if ($httpCode === 200) {
                            $responseData = json_decode($response, true);
                            if ($responseData && isset($responseData['success']) && $responseData['success']) {
                                echo "✅ Datos procesados exitosamente\n";
                                echo "   - Deudores procesados: " . ($responseData['deudores_recibidos'] ?? 0) . "\n";
                                echo "   - Errores: " . ($responseData['errores'] ?? 0) . "\n";
                                echo "   - Mensaje eliminado de la cola\n";
                                
                                // Eliminar mensaje de la cola
                                $sqsClient->deleteMessage([
                                    'QueueUrl' => $queueUrl,
                                    'ReceiptHandle' => $message['ReceiptHandle']
                                ]);
                            } else {
                                echo "❌ Error en API Laravel (HTTP $httpCode): $response\n";
                            }
                        } else {
                            echo "❌ Error en API Laravel (HTTP $httpCode): $response\n";
                        }
                        
                    } catch (Exception $e) {
                        echo "❌ Error procesando mensaje: " . $e->getMessage() . "\n";
                        file_put_contents('/tmp/sqs_listener.log', "Error: " . $e->getMessage() . "\n", FILE_APPEND);
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