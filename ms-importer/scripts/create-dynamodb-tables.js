const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

async function createTables() {
  const tables = [
    {
      TableName: 'importaciones_bcra',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    },
    {
      TableName: 'deudores_bcra',
      KeySchema: [
        { AttributeName: 'cuit', KeyType: 'HASH' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'cuit', AttributeType: 'S' },
        { AttributeName: 'importacionId', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'importacionId-index',
          KeySchema: [
            { AttributeName: 'importacionId', KeyType: 'HASH' },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    },
    {
      TableName: 'importaciones_errores',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'importacionId', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'importacionId-index',
          KeySchema: [
            { AttributeName: 'importacionId', KeyType: 'HASH' },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    },
  ];

  for (const tableConfig of tables) {
    try {
      console.log(`Creando tabla: ${tableConfig.TableName}`);
      await client.send(new CreateTableCommand(tableConfig));
      console.log(`✅ Tabla ${tableConfig.TableName} creada exitosamente`);
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log(`⚠️  Tabla ${tableConfig.TableName} ya existe`);
      } else {
        console.error(`❌ Error creando tabla ${tableConfig.TableName}:`, error.message);
      }
    }
  }
}

createTables().catch(console.error); 