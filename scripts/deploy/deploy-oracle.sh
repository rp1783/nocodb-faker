#!/bin/bash

# NoCoDB Oracle Cloud Deployment Script
# This script helps deploy NoCoDB with Nginx Proxy Manager on Oracle Cloud

set -e

echo "🚀 NoCoDB Oracle Cloud Deployment Script"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.oracle.example .env

    echo "🔐 Generating secure keys..."
    JWT_SECRET=$(openssl rand -hex 32)
    API_KEY=$(openssl rand -hex 32)

    # Update .env with generated keys
    sed -i.bak "s/your_super_secret_jwt_key_here_change_this/$JWT_SECRET/" .env
    sed -i.bak "s/your_secure_api_key_for_wrapper/$API_KEY/" .env

    echo "✅ Environment file created with secure keys"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file and add:"
    echo "   - Your Oracle public IP"
    echo "   - Your domain name"
    echo "   - NoCoDB API token (after first login)"
    echo "   - Table IDs (after creating tables)"
    echo ""
    read -p "Press Enter when you've updated .env file..."
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "🐳 Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install it first."
    exit 1
fi

echo "✅ Docker and Docker Compose are ready"
echo ""

# Pull latest images
echo "📦 Pulling latest Docker images..."
docker-compose -f docker-compose.oracle.yml pull

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.oracle.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.oracle.yml ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next Steps:"
echo "=============="
echo ""
echo "1. Access Nginx Proxy Manager:"
echo "   URL: http://$(grep ORACLE_PUBLIC_IP .env | cut -d '=' -f2):81"
echo "   Default login: admin@example.com / changeme"
echo "   ⚠️  CHANGE THESE CREDENTIALS IMMEDIATELY!"
echo ""
echo "2. Configure SSL certificates in NPM for your domains:"
echo "   - $(grep DOMAIN= .env | grep -v API_DOMAIN | cut -d '=' -f2)"
echo "   - $(grep API_DOMAIN .env | cut -d '=' -f2)"
echo ""
echo "3. Access NoCoDB and get your API token:"
echo "   - Create account at https://$(grep DOMAIN= .env | grep -v API_DOMAIN | cut -d '=' -f2)"
echo "   - Go to Account Settings → Tokens → Create New Token"
echo "   - Update NOCODB_API_TOKEN in .env"
echo ""
echo "4. Create tables in NoCoDB:"
echo "   - Contacts, Employees, Vehicles, Cases"
echo "   - Get table IDs from URLs"
echo "   - Update table IDs in .env"
echo ""
echo "5. Generate fake data:"
echo "   docker exec -it nocodb-api sh"
echo "   node create-columns.js && node generate-contacts.js"
echo "   node create-employee-columns.js && node generate-employees.js"
echo "   node create-vehicle-columns.js && node generate-vehicles.js"
echo "   node create-case-columns.js && node generate-cases.js"
echo ""
echo "📖 Full documentation: ORACLE_DEPLOYMENT.md"
echo ""
echo "🔍 View logs: docker-compose -f docker-compose.oracle.yml logs -f"
echo ""
