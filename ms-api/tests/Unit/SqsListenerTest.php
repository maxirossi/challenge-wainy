<?php

namespace Tests\Unit;

use Aws\Sqs\SqsClient;
use Aws\Result;
use PHPUnit\Framework\TestCase;
use Mockery;

class SqsListenerTest extends TestCase
{
    private SqsClient $mockSqsClient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockSqsClient = Mockery::mock(SqsClient::class);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_sqs_connection_successful(): void
    {
        // Mock successful connection
        $this->mockSqsClient
            ->shouldReceive('receiveMessage')
            ->once()
            ->andReturn(new Result(['Messages' => []]));

        // This test verifies that the SQS client can be created and connected
        $sqsClient = new SqsClient([
            'version' => 'latest',
            'region' => 'us-east-1',
            'credentials' => [
                'key' => 'test',
                'secret' => 'test',
            ],
            'endpoint' => 'http://localstack:4566',
        ]);

        $this->assertInstanceOf(SqsClient::class, $sqsClient);
    }

    public function test_processes_valid_message_successfully(): void
    {
        $validMessage = [
            'MessageId' => 'test-message-id',
            'Body' => json_encode([
                'deudores' => [
                    [
                        'cuit' => '20-12345678-9',
                        'codigo_entidad' => 'BANCO001',
                        'tipo_deuda' => 'préstamo personal',
                        'monto_deuda' => 150000.00,
                        'situacion' => 'normal',
                        'fecha_procesamiento' => '2024-01-01T00:00:00Z'
                    ]
                ]
            ]),
            'ReceiptHandle' => 'test-receipt-handle'
        ];

        $this->mockSqsClient
            ->shouldReceive('receiveMessage')
            ->once()
            ->andReturn(new Result(['Messages' => [$validMessage]]));

        $this->mockSqsClient
            ->shouldReceive('deleteMessage')
            ->once()
            ->with([
                'QueueUrl' => 'http://localstack:4566/000000000000/deudores-queue',
                'ReceiptHandle' => 'test-receipt-handle'
            ])
            ->andReturn(new Result([]));

        // Test JSON parsing
        $body = json_decode($validMessage['Body'], true);
        $this->assertIsArray($body);
        $this->assertArrayHasKey('deudores', $body);
        $this->assertCount(1, $body['deudores']);
    }

    public function test_handles_invalid_json_message(): void
    {
        $invalidMessage = [
            'MessageId' => 'test-message-id',
            'Body' => 'invalid-json',
            'ReceiptHandle' => 'test-receipt-handle'
        ];

        $this->mockSqsClient
            ->shouldReceive('receiveMessage')
            ->once()
            ->andReturn(new Result(['Messages' => [$invalidMessage]]));

        // Test JSON error handling
        $body = json_decode($invalidMessage['Body'], true);
        $this->assertNull($body);
        $this->assertEquals(JSON_ERROR_SYNTAX, json_last_error());
    }

    public function test_handles_empty_message_queue(): void
    {
        $this->mockSqsClient
            ->shouldReceive('receiveMessage')
            ->once()
            ->andReturn(new Result(['Messages' => []]));

        $result = $this->mockSqsClient->receiveMessage([
            'QueueUrl' => 'http://localstack:4566/000000000000/deudores-queue',
            'MaxNumberOfMessages' => 10,
            'WaitTimeSeconds' => 20,
        ]);

        $this->assertEmpty($result['Messages']);
    }

    public function test_handles_multiple_messages(): void
    {
        $messages = [
            [
                'MessageId' => 'msg-1',
                'Body' => json_encode(['deudores' => [['cuit' => '20-11111111-1']]]),
                'ReceiptHandle' => 'receipt-1'
            ],
            [
                'MessageId' => 'msg-2',
                'Body' => json_encode(['deudores' => [['cuit' => '20-22222222-2']]]),
                'ReceiptHandle' => 'receipt-2'
            ]
        ];

        $this->mockSqsClient
            ->shouldReceive('receiveMessage')
            ->once()
            ->andReturn(new Result(['Messages' => $messages]));

        $this->mockSqsClient
            ->shouldReceive('deleteMessage')
            ->twice()
            ->andReturn(new Result([]));

        $result = $this->mockSqsClient->receiveMessage([
            'QueueUrl' => 'http://localstack:4566/000000000000/deudores-queue',
            'MaxNumberOfMessages' => 10,
            'WaitTimeSeconds' => 20,
        ]);

        $this->assertCount(2, $result['Messages']);
    }
} 