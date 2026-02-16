#!/bin/bash

# Execution Engine Startup Script

echo "🚀 Starting AI Workflow Execution Engine..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Run FastAPI application
echo ""
echo "✅ Starting FastAPI server..."
echo "📡 API will be available at: http://localhost:8000"
echo "📖 API docs at: http://localhost:8000/docs"
echo ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload