#!/bin/bash
# GRIT+GTD Sync API Startup Script

echo "🔥 Starting GRIT+GTD Sync API..."

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Start the API server
echo "🚀 Starting Flask API on port 5000..."
export FLASK_ENV=production
export PORT=5000

python app.py

echo "✅ GRIT+GTD Sync API started successfully!"
echo "🌐 API available at: http://212.34.150.91:5000"
echo "📱 Health check: http://212.34.150.91:5000/health"