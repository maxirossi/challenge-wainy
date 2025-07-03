# Prueba End-to-End (E2E) - challenge-wainy

Este folder contiene un script bash para probar el flujo completo de integración entre los microservicios `ms-importer` y `ms-api`.

## ¿Qué hace el script?
1. Sube un archivo de prueba a `ms-importer` (`/upload`).
2. Espera a que el PHP listener procese el mensaje y los datos lleguen a MySQL vía SQS.
3. Consulta la API REST de `ms-api` para verificar que los datos estén disponibles.
4. Valida que la respuesta contenga un `total_deuda` mayor a 0 para el CUIT de prueba.

## Uso

1. Asegúrate de tener corriendo:
   - `ms-importer` (puerto 3000)
   - `ms-api` (puerto 8000)
   - LocalStack y MySQL
   - El PHP listener (`php /var/www/sqs-listener.php` en ms-api)
2. Coloca el archivo de prueba `test-real-bcra.txt` en el root del proyecto (o ajusta la variable `TEST_FILE` en el script).
3. Da permisos de ejecución al script:
   ```bash
   chmod +x e2e-test.sh
   ```
4. Ejecuta el test:
   ```bash
   ./e2e-test.sh
   ```

## Personalización
- Puedes modificar el CUIT de prueba o agregar más validaciones en el script.
- Puedes ajustar el tiempo de espera (`sleep 10`) según el rendimiento de tu entorno.

---

**¡Este test te permite validar rápidamente la integración real de tus microservicios!** 