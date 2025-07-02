<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Aws\Sqs\SqsClient;
use Illuminate\Support\Facades\Log;

class SqsListener extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sqs-listener';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Listen to SQS queue for messages';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        echo "SQS Listener starting...\n";
        
        $queueName = 'deudores-queue';
        $timeout = 20;
        
        $this->info("Starting SQS listener for queue: {$queueName}");
        
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

        $queueUrl = "http://localstack:4566/000000000000/{$queueName}";
        
        $this->info("Connecting to queue URL: {$queueUrl}");
        
        try {
            // Get queue attributes to verify connection
            $result = $sqsClient->getQueueAttributes([
                'QueueUrl' => $queueUrl,
                'AttributeNames' => ['All']
            ]);
            
            $this->info("Successfully connected to SQS queue");
            $this->info("Queue attributes: " . json_encode($result['Attributes'], JSON_PRETTY_PRINT));
            
        } catch (\Exception $e) {
            $this->error("Error connecting to SQS: " . $e->getMessage());
            return 1;
        }

        $this->info("Starting to listen for messages...");
        
        while (true) {
            try {
                $result = $sqsClient->receiveMessage([
                    'QueueUrl' => $queueUrl,
                    'MaxNumberOfMessages' => 10,
                    'WaitTimeSeconds' => $timeout,
                ]);

                if (!empty($result['Messages'])) {
                    $this->info("Received " . count($result['Messages']) . " messages");
                    
                    foreach ($result['Messages'] as $message) {
                        $this->processMessage($message, $sqsClient, $queueUrl);
                    }
                } else {
                    $this->line("No messages received, waiting...");
                }
                
            } catch (\Exception $e) {
                $this->error("Error receiving messages: " . $e->getMessage());
                Log::error("SQS Listener Error", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                sleep(5); // Wait before retrying
            }
        }
    }

    private function processMessage($message, $sqsClient, $queueUrl)
    {
        $this->info("Processing message ID: " . $message['MessageId']);
        
        try {
            $body = json_decode($message['Body'], true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->error("Invalid JSON in message: " . json_last_error_msg());
                $this->deleteMessage($sqsClient, $queueUrl, $message['ReceiptHandle']);
                return;
            }
            
            $this->info("Message body: " . json_encode($body, JSON_PRETTY_PRINT));
            
            // Log the message for debugging
            Log::info("SQS Message received", [
                'messageId' => $message['MessageId'],
                'body' => $body
            ]);
            
            // TODO: Process the message here
            // For now, just acknowledge it
            $this->info("Message processed successfully");
            
            // Delete the message from queue
            $this->deleteMessage($sqsClient, $queueUrl, $message['ReceiptHandle']);
            
        } catch (\Exception $e) {
            $this->error("Error processing message: " . $e->getMessage());
            Log::error("Error processing SQS message", [
                'messageId' => $message['MessageId'],
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    private function deleteMessage($sqsClient, $queueUrl, $receiptHandle)
    {
        try {
            $sqsClient->deleteMessage([
                'QueueUrl' => $queueUrl,
                'ReceiptHandle' => $receiptHandle,
            ]);
            $this->line("Message deleted from queue");
        } catch (\Exception $e) {
            $this->error("Error deleting message: " . $e->getMessage());
        }
    }
} 