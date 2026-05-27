#!/bin/bash

# NoCoDB Migration Script - Unraid to Oracle Cloud
# This script migrates your existing NoCoDB SQLite database and API wrapper to Oracle

set -e

echo "🚀 NoCoDB Migration: Unraid → Oracle Cloud"
echo "=========================================="
echo ""

# Configuration
UNRAID_HOST="root@10.0.0.39"
UNRAID_DB_PATH="/mnt/user/appdata/nocodb/noco.db"
ORACLE_HOST="${ORACLE_HOST:-}"
BACKUP_DIR="./nocodb-backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Check if Oracle host is set
if [ -z "$ORACLE_HOST" ]; then
    echo "⚠️  Please set ORACLE_HOST environment variable"
    echo "Example: export ORACLE_HOST=ubuntu@your-oracle-ip"
    exit 1
fi

echo "📋 Migration Plan:"
echo "  Source: $UNRAID_HOST"
echo "  Destination: $ORACLE_HOST"
echo "  Backup directory: $BACKUP_DIR"
echo ""
read -p "Continue with migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 1
fi

# Step 1: Create backup directory
echo ""
echo "📁 Step 1: Creating backup directory..."
mkdir -p "$BACKUP_DIR"

# Step 2: Backup NoCoDB database from Unraid
echo ""
echo "💾 Step 2: Backing up NoCoDB database from Unraid..."
scp "$UNRAID_HOST:$UNRAID_DB_PATH" "$BACKUP_DIR/noco_backup_$TIMESTAMP.db"
echo "✅ Database backed up to: $BACKUP_DIR/noco_backup_$TIMESTAMP.db"

# Step 3: Get NoCoDB configuration from Unraid
echo ""
echo "🔍 Step 3: Extracting NoCoDB configuration..."
ssh "$UNRAID_HOST" "docker inspect nocodb" > "$BACKUP_DIR/nocodb_config.json"
echo "✅ Configuration saved"

# Step 4: Prepare Oracle instance
echo ""
echo "🔧 Step 4: Preparing Oracle instance..."
ssh "$ORACLE_HOST" "mkdir -p ~/nocodb-migration"
echo "✅ Oracle instance prepared"

# Step 5: Transfer files to Oracle
echo ""
echo "📤 Step 5: Transferring files to Oracle..."
scp -r ./* "$ORACLE_HOST:~/nocodb-migration/"
scp "$BACKUP_DIR/noco_backup_$TIMESTAMP.db" "$ORACLE_HOST:~/nocodb-migration/noco.db"
echo "✅ Files transferred"

# Step 6: Deploy on Oracle
echo ""
echo "🚀 Step 6: Deploying on Oracle..."
ssh "$ORACLE_HOST" << 'ENDSSH'
cd ~/nocodb-migration

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.oracle.example .env

    # Generate secure keys
    JWT_SECRET=$(openssl rand -hex 32)
    API_KEY=$(openssl rand -hex 32)

    # Update .env
    sed -i "s/your_super_secret_jwt_key_here_change_this/$JWT_SECRET/" .env
    sed -i "s/your_secure_api_key_for_wrapper/$API_KEY/" .env

    echo "✅ Environment file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add:"
    echo "   - Your domain name"
    echo "   - NoCoDB API token (if changed)"
    echo "   - Table IDs (if needed)"
fi

# Create docker-compose file for migration with SQLite
cat > docker-compose.migrate.yml << 'EOF'
version: '3.8'

services:
  nocodb:
    image: nocodb/nocodb:latest
    container_name: nocodb
    ports:
      - "8091:8080"
    volumes:
      - ./noco.db:/usr/app/data/noco.db
      - nocodb_data:/usr/app/data
    environment:
      - NC_AUTH_JWT_SECRET=${NC_AUTH_JWT_SECRET}
    restart: unless-stopped
    networks:
      - nocodb-network

  nocodb-api:
    build: .
    container_name: nocodb-api
    ports:
      - "3000:3000"
    environment:
      - NOCODB_URL=http://nocodb:8080
      - NOCODB_API_TOKEN=${NOCODB_API_TOKEN}
      - TABLE_ID=${TABLE_ID}
      - EMPLOYEES_TABLE_ID=${EMPLOYEES_TABLE_ID}
      - VEHICLES_TABLE_ID=${VEHICLES_TABLE_ID}
      - CASES_TABLE_ID=${CASES_TABLE_ID}
      - NUM_CONTACTS=${NUM_CONTACTS:-100}
      - NUM_EMPLOYEES=${NUM_EMPLOYEES:-20}
      - NUM_VEHICLES=${NUM_VEHICLES:-50}
      - NUM_CASES=${NUM_CASES:-30}
      - API_PORT=${API_PORT:-3000}
      - NOCODB_WRAPPER_API_KEY=${NOCODB_WRAPPER_API_KEY}
    depends_on:
      - nocodb
    restart: unless-stopped
    networks:
      - nocodb-network

  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    container_name: nginx-proxy-manager
    ports:
      - '80:80'
      - '443:443'
      - '81:81'
    environment:
      - DB_SQLITE_FILE=/data/database.sqlite
    volumes:
      - npm_data:/data
      - npm_letsencrypt:/etc/letsencrypt
    restart: unless-stopped
    networks:
      - nocodb-network

volumes:
  nocodb_data:
  npm_data:
  npm_letsencrypt:

networks:
  nocodb-network:
    driver: bridge
EOF

echo "✅ Migration docker-compose created"
echo ""
echo "Starting services..."
docker-compose -f docker-compose.migrate.yml up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 15

docker-compose -f docker-compose.migrate.yml ps

ENDSSH

echo ""
echo "✅ Migration Complete!"
echo ""
echo "📝 Next Steps:"
echo "=============="
echo ""
echo "1. Access Nginx Proxy Manager on Oracle:"
echo "   URL: http://\$ORACLE_IP:81"
echo "   Login: admin@example.com / changeme"
echo "   ⚠️  CHANGE CREDENTIALS IMMEDIATELY!"
echo ""
echo "2. Configure SSL certificates in NPM for your domains"
echo ""
echo "3. Add proxy hosts in NPM:"
echo "   - NoCoDB: Forward nocodb:8080"
echo "   - API: Forward nocodb-api:3000"
echo ""
echo "4. Access your migrated NoCoDB:"
echo "   Temporary: http://\$ORACLE_IP:8091"
echo "   Production: https://yourdomain.com (after NPM setup)"
echo ""
echo "5. Test your API wrapper:"
echo "   curl http://\$ORACLE_IP:3000/health"
echo ""
echo "💾 Local backup saved at: $BACKUP_DIR"
echo ""
echo "📖 See ORACLE_DEPLOYMENT.md for detailed instructions"
echo ""
