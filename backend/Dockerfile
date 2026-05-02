FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PYTHONPATH=/app
ENV SECRET_KEY=test-secret-key-for-jwt-12345
ENV ALGORITHM=HS256
ENV ACCESS_TOKEN_EXPIRE_MINUTES=15
ENV REFRESH_TOKEN_EXPIRE_DAYS=7
ENV S3_BUCKET_NAME=grant-cabinet
ENV S3_ENDPOINT_URL=http://minio:9000
ENV S3_ACCESS_KEY=minioadmin
ENV S3_SECRET_KEY=minioadmin
ENV S3_USE_SSL=false

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

CMD ["python", "main.py"]