#!/bin/bash
set -e

# Configuración
IMPORTER_URL="http://localhost:3000/upload"
API_URL="http://localhost:8000/api"
TEST_FILE="small-100.txt"

# test-real-bcra.txt
CUIT="20-00390552-8"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando prueba E2E${NC}"
echo "========================"

# 1. Verificar que el archivo existe
if [ ! -f "$TEST_FILE" ]; then
  echo -e "${RED}❌ Archivo de prueba no encontrado:${NC}"
  echo "   Ruta esperada: $TEST_FILE"
  echo "   Verifica que el archivo existe y la ruta es correcta."
  exit 1
fi

# Mostrar tamaño del archivo
FILESIZE=$(ls -lh "$TEST_FILE" | awk '{print $5}')
echo -e "${BLUE}📁 Archivo de prueba:${NC} $TEST_FILE ($FILESIZE)"

# 2. Verificar que los servicios estén corriendo
echo -e "${BLUE}🔍 Verificando servicios...${NC}"

# Verificar ms-importer
if ! curl -s "$IMPORTER_URL" > /dev/null; then
  echo -e "${RED}❌ ms-importer no está disponible en $IMPORTER_URL${NC}"
  echo "   Asegúrate de que el contenedor esté corriendo: docker compose up -d ms-importer"
  exit 1
fi

# Verificar ms-api
if ! curl -s "$API_URL/deudores/$CUIT" > /dev/null; then
  echo -e "${RED}❌ ms-api no está disponible en $API_URL${NC}"
  echo "   Asegúrate de que el contenedor esté corriendo: docker compose up -d ms-api"
  exit 1
fi

echo -e "${GREEN}✅ Servicios verificados${NC}"

# 3. Obtener conteo inicial de deudores
echo -e "${BLUE}📊 Obteniendo conteo inicial de deudores...${NC}"
INITIAL_COUNT=$(curl -s "$API_URL/deudores/$CUIT" | jq -r '.data | length // 0')
echo -e "${YELLOW}   Deudores iniciales: $INITIAL_COUNT${NC}"

# 4. Subir archivo al importador
echo -e "${BLUE}📤 Subiendo archivo al importador...${NC}"
UPLOAD_RESPONSE=$(curl -s -X POST -F "file=@$TEST_FILE" "$IMPORTER_URL")
echo "   Respuesta: $UPLOAD_RESPONSE"

# Verificar si la subida fue exitosa
if echo "$UPLOAD_RESPONSE" | jq -e '.success' > /dev/null; then
  echo -e "${GREEN}✅ Archivo subido exitosamente${NC}"
else
  echo -e "${RED}❌ Error al subir archivo${NC}"
  echo "   Respuesta: $UPLOAD_RESPONSE"
  exit 1
fi

# 5. Esperar y monitorear procesamiento
echo -e "${BLUE}⏳ Esperando procesamiento...${NC}"
echo "   Monitoreando cola SQS y base de datos..."

MAX_WAIT_TIME=1800  # 30 minutos
WAIT_INTERVAL=30    # 30 segundos
ELAPSED_TIME=0

while [ $ELAPSED_TIME -lt $MAX_WAIT_TIME ]; do
  # Verificar mensajes en cola SQS
  SQS_COUNT=$(docker compose exec localstack awslocal sqs get-queue-attributes \
    --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/deudores-import-queue \
    --attribute-names ApproximateNumberOfMessages 2>/dev/null | \
    jq -r '.Attributes.ApproximateNumberOfMessages // "0"')
  
  # Verificar deudores en base de datos
  CURRENT_COUNT=$(curl -s "$API_URL/deudores/$CUIT" | jq -r '.data | length // 0')
  
  # Mostrar progreso
  echo -e "${YELLOW}   ⏱️  Tiempo: ${ELAPSED_TIME}s | 📨 SQS: $SQS_COUNT | 💾 BD: $CURRENT_COUNT${NC}"
  
  # Si no hay mensajes en cola y hay nuevos deudores, considerar completado
  if [ "$SQS_COUNT" = "0" ] && [ "$CURRENT_COUNT" -gt "$INITIAL_COUNT" ]; then
    echo -e "${GREEN}✅ Procesamiento completado${NC}"
    break
  fi
  
  # Si no hay mensajes en cola y no hay nuevos deudores después de 5 minutos, verificar
  if [ "$SQS_COUNT" = "0" ] && [ $ELAPSED_TIME -gt 300 ] && [ "$CURRENT_COUNT" -eq "$INITIAL_COUNT" ]; then
    echo -e "${YELLOW}⚠️  No hay actividad después de 5 minutos${NC}"
    echo "   Verificando si el procesamiento está en curso..."
  fi
  
  sleep $WAIT_INTERVAL
  ELAPSED_TIME=$((ELAPSED_TIME + WAIT_INTERVAL))
done

# 6. Verificar resultado final
echo -e "${BLUE}🔍 Verificando resultado final...${NC}"
FINAL_COUNT=$(curl -s "$API_URL/deudores/$CUIT" | jq -r '.data | length // 0')
NEW_DEUDORES=$((FINAL_COUNT - INITIAL_COUNT))

echo -e "${YELLOW}   Deudores iniciales: $INITIAL_COUNT${NC}"
echo -e "${YELLOW}   Deudores finales: $FINAL_COUNT${NC}"
echo -e "${YELLOW}   Nuevos deudores: $NEW_DEUDORES${NC}"

# 7. Probar búsqueda por CUIT
echo -e "${BLUE}🔍 Probando búsqueda por CUIT...${NC}"
SEARCH_RESULT=$(curl -s "$API_URL/deudores/$CUIT")
echo "   Resultado: $SEARCH_RESULT"

# 8. Evaluar resultado
if [ "$NEW_DEUDORES" -gt 0 ]; then
  echo -e "${GREEN}✅ Prueba E2E EXITOSA${NC}"
  echo "   Se procesaron $NEW_DEUDORES nuevos deudores"
  exit 0
else
  echo -e "${RED}❌ Prueba E2E FALLIDA${NC}"
  echo "   No se procesaron nuevos deudores"
  echo "   Verifica los logs del importador y el listener SQS"
  exit 1
fi 