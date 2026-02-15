#!/bin/bash

# CyberShield Backend Startup Script

echo "🚀 Starting CyberShield Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ Created .env file from template. Please edit it with your API keys."
        echo "🔑 Required API keys:"
        echo "   - GOOGLE_SAFE_BROWSING_API_KEY"
        echo "   - VIRUS_TOTAL_API_KEY"
        echo "   - URLVOID_API_KEY"
        echo "   - PHISHTANK_API_KEY (optional)"
        echo ""
        echo "📝 Edit .env file and run this script again."
        exit 1
    else
        echo "❌ env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
fi

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    echo "📁 Creating logs directory..."
    mkdir -p logs
fi

# Check if required environment variables are set
source .env
REQUIRED_VARS=("GOOGLE_SAFE_BROWSING_API_KEY" "VIRUS_TOTAL_API_KEY" "URLVOID_API_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "your_${var,,}_here" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  Missing or invalid API keys:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "📝 Please update your .env file with valid API keys."
    exit 1
fi

echo "✅ All required API keys are configured"

# Start the server
echo "🌐 Starting server on port ${PORT:-3000}..."
echo "📊 Health check: http://localhost:${PORT:-3000}/health"
echo "🔍 API docs: Check README.md for endpoint documentation"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
