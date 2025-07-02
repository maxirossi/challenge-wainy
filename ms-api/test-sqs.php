<?php

require_once 'vendor/autoload.php';

use Aws\Sqs\SqsClient;

echo "Testing SQS connection...\n";

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
    
    echo "Connecting to queue URL: {$queueUrl}\n";
    
    // Get queue attributes to verify connection
    $result = $sqsClient->getQueueAttributes([
        'QueueUrl' => $queueUrl,
        'AttributeNames' => ['All']
    ]);
    
    echo "Successfully connected to SQS queue!\n";
    echo "Queue attributes: " . json_encode($result['Attributes'], JSON_PRETTY_PRINT) . "\n";
    
    // Try to receive messages
    echo "Trying to receive messages...\n";
    
    $result = $sqsClient->receiveMessage([
        'QueueUrl' => $queueUrl,
        'MaxNumberOfMessages' => 10,
        'WaitTimeSeconds' => 5,
    ]);

    if (!empty($result['Messages'])) {
        echo "Received " . count($result['Messages']) . " messages\n";
        
        foreach ($result['Messages'] as $message) {
            echo "Message ID: " . $message['MessageId'] . "\n";
            echo "Message body: " . $message['Body'] . "\n";
            
            // Delete the message
            $sqsClient->deleteMessage([
                'QueueUrl' => $queueUrl,
                'ReceiptHandle' => $message['ReceiptHandle'],
            ]);
            echo "Message deleted\n";
        }
    } else {
        echo "No messages received\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
} 