#!/bin/bash

# PKM Vault Setup Script
# This script sets up the development environment

set -e

echo "🧠 PKM Vault Setup"
echo "=================="

# Check for required tools
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is required but not installed."
        exit 1
    fi
    echo "✅ $1 found"
}

echo ""
echo "Checking dependencies..."
check_command docker
check_command docker-compose
check_command node
check_command python3

# Create environment files if they don't exist
echo ""
echo "Setting up environment files..."

if [ ! -f .env ]; then
    cp .env.example .env
    # Generate a random secret key
    SECRET_KEY=$(openssl rand -hex 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/your-super-secret-key-change-in-production-min-32-chars/$SECRET_KEY/" .env
    else
        sed -i "s/your-super-secret-key-change-in-production-min-32-chars/$SECRET_KEY/" .env
    fi
    echo "✅ Created .env with random secret key"
else
    echo "⏭️  .env already exists, skipping"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ Created frontend/.env.local"
else
    echo "⏭️  frontend/.env.local already exists, skipping"
fi

# Create data directories
echo ""
echo "Creating data directories..."
mkdir -p backend/data/uploads backend/data/backups
echo "✅ Data directories created"

# Option to set up local development
read -p "Do you want to set up local development environment? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Setting up backend..."
    cd backend
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "✅ Python virtual environment created"
    fi
    source venv/bin/activate
    pip install -r requirements.txt -q
    echo "✅ Python dependencies installed"
    cd ..

    echo ""
    echo "Setting up frontend..."
    cd frontend
    npm install
    echo "✅ Node dependencies installed"
    cd ..
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  Development (Docker): make dev"
echo "  Production (Docker):  make prod"
echo ""
echo "For local development:"
echo "  Backend:  cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Access the app at: http://localhost:3000"
echo "API docs at:       http://localhost:8000/docs"
