#!/bin/bash

# Development Setup Script
set -e

echo "🚀 Setting up Quiz Backend for development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please configure your .env file with the correct values"
fi

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Run linting
echo "🔍 Running linter..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm test

echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with your Supabase and Redis credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:5000/api/v1/health to verify the server is running"
echo ""
echo "Happy coding! 🎉"