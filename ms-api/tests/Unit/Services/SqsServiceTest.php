<?php

namespace Tests\Unit\Services;

use App\Jobs\ProcessSqsMessage;
use App\Services\SqsService;
use Aws\Sqs\SqsClient;
use Aws\Result;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Mockery;
use PHPUnit\Framework\TestCase;

class SqsServiceTest extends TestCase
{
    private SqsService $sqsService;
    private SqsClient $mockSqsClient;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockSqsClient = Mockery::mock(SqsClient::class);
        
        // Crear una instancia real del servicio pero con el cliente mockeado
        $this->sqsService = new SqsService();
        
        // Usar reflection para inyectar el mock client
        $reflection = new \ReflectionClass($this->sqsService);
        $property = $reflection->getProperty('sqsClient');
        $property->setAccessible(true);
        $property->setValue($this->sqsService, $this->mockSqsClient);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_send_message_successfully(): void
    {
        $messageData = [
            'type' => 'deudores_procesados',
            'data' => [
                'deudores' => [
                    [
                        'cuit' => '20-12345678-9',
                        'codigo_entidad' => 'BANCO001',
                        'tipo_deuda' => 'préstamo personal',
                        'monto_deuda' => 150000.00,
                        'situacion' => 'normal'
                    ]
                ]
            ]
        ];

        $expectedResult = new Result([
            'MessageId' => 'test-message-id-123'
        ]);

        $this->mockSqsClient
            ->shouldReceive('sendMessage')
            ->once()
            ->with([
                'QueueUrl' => env('SQS_QUEUE_URL', 'http://localhost:4566/000000000000/wayni-deudores-queue'),
                'MessageBody' => json_encode($messageData),
            ])
            ->andReturn($expectedResult);

        $this->sqsService->sendMessage($messageData);
    }

    public function test_send_message_throws_exception_on_error(): void
    {
        $messageData = ['test' => 'data'];

        $this->mockSqsClient
            ->shouldReceive('sendMessage')
            ->once()
            ->andThrow(new \Exception('SQS Error'));

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('SQS Error');

        $this->sqsService->sendMessage($messageData);
    }

    public function test_process_message_with_deudores_procesados_type(): void
    {
        Queue::fake();

        $message = [
            'MessageId' => 'test-123',
            'ReceiptHandle' => 'receipt-handle-123',
            'Body' => json_encode([
                'type' => 'deudores_procesados',
                'data' => [
                    'deudores' => [
                        [
                            'cuit' => '20-12345678-9',
                            'codigo_entidad' => 'BANCO001',
                            'tipo_deuda' => 'préstamo personal',
                            'monto_deuda' => 150000.00,
                            'situacion' => 'normal'
                        ]
                    ]
                ]
            ])
        ];

        $this->mockSqsClient
            ->shouldReceive('deleteMessage')
            ->once()
            ->with([
                'QueueUrl' => env('SQS_QUEUE_URL', 'http://localhost:4566/000000000000/wayni-deudores-queue'),
                'ReceiptHandle' => 'receipt-handle-123',
            ]);

        $this->invokePrivateMethod($this->sqsService, 'processMessage', [$message]);

        Queue::assertPushed(ProcessSqsMessage::class);
    }

    public function test_process_message_with_archivo_procesado_type(): void
    {
        $message = [
            'MessageId' => 'test-123',
            'ReceiptHandle' => 'receipt-handle-123',
            'Body' => json_encode([
                'type' => 'archivo_procesado',
                'data' => [
                    'archivo' => 'test.txt',
                    'fecha_procesamiento' => '2024-01-01T00:00:00Z',
                    'total_registros' => 100
                ]
            ])
        ];

        $this->mockSqsClient
            ->shouldReceive('deleteMessage')
            ->once()
            ->with([
                'QueueUrl' => env('SQS_QUEUE_URL', 'http://localhost:4566/000000000000/wayni-deudores-queue'),
                'ReceiptHandle' => 'receipt-handle-123',
            ]);

        $this->invokePrivateMethod($this->sqsService, 'processMessage', [$message]);
    }

    public function test_process_message_with_unknown_type(): void
    {
        $message = [
            'MessageId' => 'test-123',
            'ReceiptHandle' => 'receipt-handle-123',
            'Body' => json_encode([
                'type' => 'unknown_type',
                'data' => []
            ])
        ];

        $this->mockSqsClient
            ->shouldReceive('deleteMessage')
            ->once()
            ->with([
                'QueueUrl' => env('SQS_QUEUE_URL', 'http://localhost:4566/000000000000/wayni-deudores-queue'),
                'ReceiptHandle' => 'receipt-handle-123',
            ]);

        $this->invokePrivateMethod($this->sqsService, 'processMessage', [$message]);
    }

    public function test_process_message_with_invalid_json(): void
    {
        $message = [
            'MessageId' => 'test-123',
            'ReceiptHandle' => 'receipt-handle-123',
            'Body' => 'invalid-json'
        ];

        // No debe llamar a deleteMessage cuando hay error
        $this->mockSqsClient
            ->shouldNotReceive('deleteMessage');

        $this->invokePrivateMethod($this->sqsService, 'processMessage', [$message]);
    }

    public function test_process_message_with_missing_type(): void
    {
        $message = [
            'MessageId' => 'test-123',
            'ReceiptHandle' => 'receipt-handle-123',
            'Body' => json_encode([
                'data' => []
            ])
        ];

        // No debe llamar a deleteMessage cuando hay error
        $this->mockSqsClient
            ->shouldNotReceive('deleteMessage');

        $this->invokePrivateMethod($this->sqsService, 'processMessage', [$message]);
    }

    public function test_delete_message_successfully(): void
    {
        $receiptHandle = 'receipt-handle-123';

        $this->mockSqsClient
            ->shouldReceive('deleteMessage')
            ->once()
            ->with([
                'QueueUrl' => env('SQS_QUEUE_URL', 'http://localhost:4566/000000000000/wayni-deudores-queue'),
                'ReceiptHandle' => $receiptHandle,
            ]);

        $this->invokePrivateMethod($this->sqsService, 'deleteMessage', [$receiptHandle]);
    }

    public function test_delete_message_throws_exception(): void
    {
        $receiptHandle = 'receipt-handle-123';

        $this->mockSqsClient
            ->shouldReceive('deleteMessage')
            ->once()
            ->andThrow(new \Exception('Delete Error'));

        $this->invokePrivateMethod($this->sqsService, 'deleteMessage', [$receiptHandle]);
    }

    public function test_handle_deudores_processed_with_valid_data(): void
    {
        Queue::fake();

        $messageData = [
            'data' => [
                'deudores' => [
                    [
                        'cuit' => '20-12345678-9',
                        'codigo_entidad' => 'BANCO001',
                        'tipo_deuda' => 'préstamo personal',
                        'monto_deuda' => 150000.00,
                        'situacion' => 'normal'
                    ]
                ]
            ]
        ];

        $this->invokePrivateMethod($this->sqsService, 'handleDeudoresProcessed', [$messageData]);

        Queue::assertPushed(ProcessSqsMessage::class, function ($job) use ($messageData) {
            return $job->messageData === $messageData['data'];
        });
    }

    public function test_handle_deudores_processed_with_missing_data(): void
    {
        $messageData = [
            'data' => []
        ];

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Datos de deudores no encontrados en el mensaje');

        $this->invokePrivateMethod($this->sqsService, 'handleDeudoresProcessed', [$messageData]);
    }

    public function test_handle_file_processed(): void
    {
        $messageData = [
            'data' => [
                'archivo' => 'test.txt',
                'fecha_procesamiento' => '2024-01-01T00:00:00Z',
                'total_registros' => 100
            ]
        ];

        // No debe lanzar excepción
        $this->invokePrivateMethod($this->sqsService, 'handleFileProcessed', [$messageData]);
    }

    private function invokePrivateMethod($object, string $methodName, array $parameters = [])
    {
        $reflection = new \ReflectionClass(get_class($object));
        $method = $reflection->getMethod($methodName);
        $method->setAccessible(true);
        return $method->invokeArgs($object, $parameters);
    }
}
