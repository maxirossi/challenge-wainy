import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Upload & Deudores (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('debería subir y procesar el archivo BCRA correctamente', async () => {
    const filePath = path.join(__dirname, '../test-bcra-file.txt');
    const response = await request(app.getHttpServer())
      .post('/upload')
      .attach('file', filePath)
      .expect(201);

    expect(response.body).toHaveProperty('message', 'Archivo procesado exitosamente');
    expect(response.body).toHaveProperty('processedLines', 3);
    expect(response.body).toHaveProperty('s3Key');
    expect(response.body).toHaveProperty('importacionId');
    expect(response.body).toHaveProperty('cantidadErrores', 0);
    expect(typeof response.body.s3Key).toBe('string');
    expect(typeof response.body.importacionId).toBe('string');
  });

  it('debería devolver el deudor del primer registro', async () => {
    const cuit = '20345678901';
    const response = await request(app.getHttpServer())
      .get(`/deudores/${cuit}`)
      .expect(200);
    expect(response.body).toHaveProperty('cuit', cuit);
    expect(response.body).toHaveProperty('situacion', 21);
    expect(response.body).toHaveProperty('monto', 1234);
  });

  it('debería devolver el deudor del segundo registro', async () => {
    const cuit = '20345678902';
    const response = await request(app.getHttpServer())
      .get(`/deudores/${cuit}`)
      .expect(200);
    expect(response.body).toHaveProperty('cuit', cuit);
    expect(response.body).toHaveProperty('situacion', 32);
    expect(response.body).toHaveProperty('monto', 98765);
  });

  it('debería devolver el deudor del tercer registro', async () => {
    const cuit = '20345678903';
    const response = await request(app.getHttpServer())
      .get(`/deudores/${cuit}`)
      .expect(200);
    expect(response.body).toHaveProperty('cuit', cuit);
    expect(response.body).toHaveProperty('situacion', 52);
    expect(response.body).toHaveProperty('monto', 12346);
  });

  it('debería manejar archivos con líneas inválidas', async () => {
    // Crear archivo con líneas inválidas
    const invalidContent = '00123020231111020345678901AAA012100000000123400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000\nlinea_invalida_corta\n';
    const tempFilePath = path.join(__dirname, '../test-invalid-file.txt');
    fs.writeFileSync(tempFilePath, invalidContent);

    const response = await request(app.getHttpServer())
      .post('/upload')
      .attach('file', tempFilePath)
      .expect(201);

    expect(response.body).toHaveProperty('processedLines', 1);
    expect(response.body).toHaveProperty('cantidadErrores', 1);

    // Limpiar archivo temporal
    fs.unlinkSync(tempFilePath);
  });
}); 