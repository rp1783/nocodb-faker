# Migration Guide: Unraid + Hetzner → Oracle Cloud

Complete guide to migrate your existing NoCoDB instance and API wrapper from Unraid/Hetzner to Oracle Cloud.

## 📋 Current Setup

- **NoCoDB**: Running on Unraid (root@10.0.0.39)
  - Database: SQLite (`/mnt/user/appdata/nocodb/noco.db`)
  - Port: 8091
  - Size: ~2.9MB

- **API Wrapper**: Running on Hetzner (ryan@hetzner)
  - Location: `/home/ryan/noco/nocodb-faker/`
  - Port: 3000
  - Container: nocodb-api

## 🎯 Migration Goal

Move everything to Oracle Cloud with:
- NoCoDB with your existing database
- API wrapper
- Nginx Proxy Manager for SSL/HTTPS
- All data intact

## 🚀 Quick Migration

### Prerequisites

1. Oracle Cloud instance with:
   - Ports 80, 443, 81 open in firewall
   - Docker and Docker Compose installed
   - SSH access configured

2. Your domain DNS pointed to Oracle IP

3. SSH access to:
   - Unraid: `root@10.0.0.39`
   - Hetzner: `ryan@hetzner`
   - Oracle: Your Oracle instance

### One-Command Migration

```bash
# Set your Oracle host
export ORACLE_HOST=ubuntu@your-oracle-ip

# Run migration
./migrate-to-oracle.sh
```

## 📝 Step-by-Step Manual Migration

If you prefer to do it manually or need to troubleshoot:

### Step 1: Backup NoCoDB Database

```bash
# Create backup directory
mkdir -p nocodb-backup

# Download NoCoDB database from Unraid
scp root@10.0.0.39:/mnt/user/appdata/nocodb/noco.db nocodb-backup/noco.db

# Verify backup
ls -lh nocodb-backup/noco.db
```

### Step 2: Get Current Environment Variables

```bash
# Get environment from Hetzner API wrapper
ssh ryan@hetzner "cat ~/noco/nocodb-faker/.env" > nocodb-backup/hetzner.env

# Review the variables
cat nocodb-backup/hetzner.env
```

### Step 3: Prepare Oracle Instance

```bash
# SSH into Oracle
ssh ubuntu@your-oracle-ip

# Install Docker if not already installed
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Configure Ubuntu firewall
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 81 -j ACCEPT
sudo netfilter-persistent save

# Exit and log back in for group changes
exit
```

### Step 4: Transfer Files to Oracle

```bash
# From your local machine, transfer everything
scp -r ./* ubuntu@your-oracle-ip:~/nocodb/
scp nocodb-backup/noco.db ubuntu@your-oracle-ip:~/nocodb/noco.db
```

### Step 5: Deploy on Oracle

```bash
# SSH into Oracle
ssh ubuntu@your-oracle-ip
cd ~/nocodb

# Create .env file
cp .env.oracle.example .env

# Generate secure keys
JWT_SECRET=$(openssl rand -hex 32)
API_KEY=$(openssl rand -hex 32)

# Update .env file
nano .env
# Add:
# - NC_AUTH_JWT_SECRET (use generated JWT_SECRET)
# - NOCODB_WRAPPER_API_KEY (use generated API_KEY)
# - Copy NOCODB_API_TOKEN from your backup
# - Copy Table IDs from your backup
# - Add your domain names

# Create migration docker-compose (uses SQLite)
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
      - API_PORT=3000
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

# Start services
docker-compose -f docker-compose.migrate.yml up -d

# Check status
docker-compose -f docker-compose.migrate.yml ps
docker-compose -f docker-compose.migrate.yml logs -f
```

### Step 6: Configure Nginx Proxy Manager

1. **Access NPM Admin**:
   - URL: `http://your-oracle-ip:81`
   - Default: `admin@example.com` / `changeme`
   - **Change these immediately!**

2. **Add SSL Certificates**:
   - Go to SSL Certificates → Add SSL Certificate
   - Select Let's Encrypt
   - Add your domains
   - Agree to ToS and save

3. **Create Proxy Host for NoCoDB**:
   - Domain: `nocodb.yourdomain.com`
   - Forward to: `nocodb:8080`
   - Enable: Cache Assets, Block Common Exploits, Websockets
   - SSL: Select your certificate
   - Enable: Force SSL, HTTP/2, HSTS

4. **Create Proxy Host for API**:
   - Domain: `api.nocodb.yourdomain.com`
   - Forward to: `nocodb-api:3000`
   - Enable: Cache Assets, Block Common Exploits, Websockets
   - SSL: Select your certificate
   - Enable: Force SSL, HTTP/2, HSTS

### Step 7: Test Everything

```bash
# Test NoCoDB (temporary direct access)
curl -I http://your-oracle-ip:8091

# Test API wrapper
curl http://your-oracle-ip:3000/health

# Test with domain (after NPM setup)
curl -I https://nocodb.yourdomain.com
curl https://api.nocodb.yourdomain.com/health

# Test API with auth
curl -H "X-API-Key: your_api_key" "https://api.nocodb.yourdomain.com/api/vehicles"
```

### Step 8: Verify Data Integrity

1. Access NoCoDB at `https://nocodb.yourdomain.com`
2. Log in with your existing credentials
3. Check that all tables and data are intact:
   - Contacts
   - Employees
   - Vehicles
   - Cases
4. Verify relationships and display values work correctly

### Step 9: Update Your Applications

Update any applications or scripts that were using:
- Old Unraid URL: `http://10.0.0.39:8091` → New: `https://nocodb.yourdomain.com`
- Old Hetzner API: `http://hetzner:3000` → New: `https://api.nocodb.yourdomain.com`

### Step 10: Decommission Old Servers (Optional)

Once you've verified everything works:

```bash
# Stop NoCoDB on Unraid
ssh root@10.0.0.39 "docker stop nocodb"

# Stop API on Hetzner
ssh ryan@hetzner "cd ~/noco/nocodb-faker && docker-compose down"
```

Keep the backups for at least a week before removing them!

## 🔧 Troubleshooting

### NoCoDB won't start

```bash
# Check logs
docker logs nocodb

# Check if database file is readable
ls -lh noco.db

# Try starting without the existing database
docker-compose -f docker-compose.migrate.yml down
mv noco.db noco.db.backup
docker-compose -f docker-compose.migrate.yml up -d
```

### API wrapper can't connect to NoCoDB

```bash
# Check if nocodb is running
docker ps | grep nocodb

# Check network
docker network inspect nocodb_nocodb-network

# Check API logs
docker logs nocodb-api

# Verify environment variables
docker exec nocodb-api env | grep NOCODB
```

### Can't access via domain

- Verify DNS is pointing to Oracle IP: `nslookup yourdomain.com`
- Check Oracle Cloud security list has ports 80/443 open
- Check Ubuntu firewall: `sudo iptables -L | grep -E "80|443"`
- Review NPM logs: `docker logs nginx-proxy-manager`

### SSL certificate fails

- Ensure DNS is fully propagated (wait 10-15 minutes)
- Verify ports 80/443 are accessible from internet
- Check Let's Encrypt rate limits
- Try using DNS challenge instead of HTTP challenge

## 📊 Migration Checklist

- [ ] Backup NoCoDB database from Unraid
- [ ] Save environment variables from Hetzner
- [ ] Prepare Oracle instance (Docker, firewall, etc.)
- [ ] Transfer files to Oracle
- [ ] Create .env file with proper credentials
- [ ] Start services on Oracle
- [ ] Configure Nginx Proxy Manager
- [ ] Set up SSL certificates
- [ ] Create proxy hosts
- [ ] Test NoCoDB access
- [ ] Test API wrapper
- [ ] Verify all data is intact
- [ ] Update application configurations
- [ ] Keep backups for 1+ week
- [ ] Decommission old services

## 🔄 Rollback Plan

If something goes wrong:

```bash
# On Oracle, stop services
docker-compose -f docker-compose.migrate.yml down

# On Unraid, restart NoCoDB
ssh root@10.0.0.39 "docker start nocodb"

# On Hetzner, restart API
ssh ryan@hetzner "cd ~/noco/nocodb-faker && docker-compose up -d"
```

Your original setup is unchanged until you manually stop/remove the services.

## 💾 Backup Strategy

After migration, set up regular backups:

```bash
# Add to crontab on Oracle
0 2 * * * docker exec nocodb sqlite3 /usr/app/data/noco.db ".backup '/usr/app/data/noco_backup_$(date +\%Y\%m\%d).db'"
```

## 📚 Additional Resources

- [Oracle Cloud Free Tier](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm)
- [NoCoDB Documentation](https://docs.nocodb.com/)
- [Nginx Proxy Manager](https://nginxproxymanager.com/guide/)
- [Docker Documentation](https://docs.docker.com/)

---

🤖 Generated with Claude Code
