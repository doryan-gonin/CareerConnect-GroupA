FROM python:3.11-slim

# Set working dir inside the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y ---no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency specs first (to leverage Docker cache)
COPY pyproject.toml .

# Install project dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# Copy the rest of the backend code
COPY . .

# Expose port 7860
EXPOSE 7860

# Launch the FastAPI server using uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0", "--port", "7860"]
