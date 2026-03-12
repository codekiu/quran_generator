FROM python:3.9-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libass-dev \
    curl \
    fonts-liberation \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Install Python dependencies (layer caching)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy fonts and register with fontconfig
COPY backend/fonts/ ./fonts/
RUN cp ./fonts/*.otf ./fonts/*.ttf /usr/local/share/fonts/ 2>/dev/null; \
    fc-cache -fv

# Copy backend source
COPY backend/*.py .

# Copy qpc-hafs.json to /app (parent of WORKDIR)
COPY qpc-hafs.json /app/qpc-hafs.json

# Create directories for volumes
RUN mkdir -p /app/uploads /app/outputs /app/temp

EXPOSE 5001

CMD ["python", "app.py"]
