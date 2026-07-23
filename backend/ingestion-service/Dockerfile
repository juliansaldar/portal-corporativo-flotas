# Build context: raiz del repo (ver docker-compose.yml) para poder copiar backend/shared
FROM python:3.12-slim

WORKDIR /app

COPY backend/ingestion-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/shared /app/shared
COPY backend/ingestion-service/app /app/app
COPY backend/ingestion-service/migrations /app/migrations

ENV PYTHONPATH=/app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
