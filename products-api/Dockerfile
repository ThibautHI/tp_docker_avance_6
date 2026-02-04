# Stage 1: Build
FROM python:3.11-slim AS builder

WORKDIR /app

# Installer build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements et installer
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Créer utilisateur non-root
RUN useradd -m -u 1001 appuser

# Copier les packages Python depuis builder
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH

# Copier le code
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8082/health').read()"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8082"]
