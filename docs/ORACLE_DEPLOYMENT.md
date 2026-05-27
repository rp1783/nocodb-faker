# Oracle Cloud Free Tier Deployment Guide

Complete guide to deploy NoCoDB with fake data generator and Nginx Proxy Manager on Oracle Cloud free tier.

## 📋 Prerequisites

- Oracle Cloud Free Tier account
- A domain name pointed to your Oracle instance IP
- SSH access to your Oracle instance
- Docker and Docker Compose installed on Oracle instance

## 🚀 Step 1: Prepare Oracle Instance

### SSH into your Oracle instance:
```bash
ssh ubuntu@your-oracle-ip
```

### Install Docker and Docker Compose:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Logout and login again for group changes to take effect
exit
```

### Configure Oracle Cloud Firewall:
1. Go to Oracle Cloud Console
2. Navigate to: Networking → Virtual Cloud Networks → Your VCN → Security Lists
3. Add Ingress Rules:
   - **Port 80** (HTTP) - Source: 0.0.0.0/0
   - **Port 443** (HTTPS) - Source: 0.0.0.0/0
   - **Port 81** (NPM Admin) - Source: YOUR_IP/32 (for security)

### Configure Ubuntu Firewall:
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 81 -j ACCEPT
sudo netfilter-persistent save
```

## 📦 Step 2: Deploy Application

### Clone the repository:
```bash
cd ~
git clone https://github.com/rp1783/nocodb-faker.git
cd nocodb-faker
```

### Create environment file:
```bash
cp .env.oracle.example .env
nano .env
```

### Generate secure keys:
```bash
# Generate JWT secret
openssl rand -hex 32

# Generate API wrapper key
openssl rand -hex 32
```

Update `.env` with these values:
```env
NC_AUTH_JWT_SECRET=<generated_jwt_secret>
NOCODB_WRAPPER_API_KEY=<generated_api_key>
ORACLE_PUBLIC_IP=<your_oracle_ip>
DOMAIN=nocodb.yourdomain.com
API_DOMAIN=api.nocodb.yourdomain.com
```

### Start all services:
```bash
docker-compose -f docker-compose.oracle.yml up -d
```

### Check service status:
```bash
docker-compose -f docker-compose.oracle.yml ps
docker-compose -f docker-compose.oracle.yml logs -f
```

## 🔐 Step 3: Configure Nginx Proxy Manager

### Access NPM Admin Panel:
1. Open browser: `http://your-oracle-ip:81`
2. Default credentials:
   - Email: `admin@example.com`
   - Password: `changeme`
3. **IMPORTANT**: Change these credentials immediately!

### Add SSL Certificates:
1. Go to: **SSL Certificates** → **Add SSL Certificate**
2. Select: **Let's Encrypt**
3. Domain Names: Add your domains
   - `nocodb.yourdomain.com`
   - `api.nocodb.yourdomain.com`
4. Email: Your email for renewal notifications
5. Agree to Let's Encrypt ToS
6. Click **Save**

### Configure NoCoDB Proxy Host:
1. Go to: **Hosts** → **Proxy Hosts** → **Add Proxy Host**
2. **Details Tab:**
   - Domain Names: `nocodb.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname/IP: `nocodb`
   - Forward Port: `8080`
   - Enable: ☑ Cache Assets, ☑ Block Common Exploits, ☑ Websockets Support
3. **SSL Tab:**
   - SSL Certificate: Select your Let's Encrypt certificate
   - Enable: ☑ Force SSL, ☑ HTTP/2 Support, ☑ HSTS Enabled
4. Click **Save**

### Configure API Wrapper Proxy Host:
1. Go to: **Hosts** → **Proxy Hosts** → **Add Proxy Host**
2. **Details Tab:**
   - Domain Names: `api.nocodb.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname/IP: `nocodb-api`
   - Forward Port: `3000`
   - Enable: ☑ Cache Assets, ☑ Block Common Exploits, ☑ Websockets Support
3. **SSL Tab:**
   - SSL Certificate: Select your Let's Encrypt certificate
   - Enable: ☑ Force SSL, ☑ HTTP/2 Support, ☑ HSTS Enabled
4. Click **Save**

## 🎯 Step 4: Configure NoCoDB and Generate Data

### Access NoCoDB:
1. Open: `https://nocodb.yourdomain.com`
2. Create your admin account
3. Create a new workspace or use default

### Get API Token:
1. Click your profile icon → **Account Settings**
2. Go to **Tokens** tab
3. Click **Create New Token**
4. Copy the token

### Create Tables:
1. Create 4 tables in NoCoDB:
   - **Contacts**
   - **Employees**
   - **Vehicles**
   - **Cases**

2. Get Table IDs from URLs:
   - Open each table
   - Copy the ID from URL: `https://nocodb.yourdomain.com/nc/your_base_id/table_<TABLE_ID>`

### Update environment and restart:
```bash
nano .env
# Add your NOCODB_API_TOKEN and table IDs

# Restart API service
docker-compose -f docker-compose.oracle.yml restart nocodb-api
```

### Generate Fake Data:
```bash
# Enter the API container
docker exec -it nocodb-api sh

# Generate Contacts
node create-columns.js
node generate-contacts.js

# Generate Employees
node create-employee-columns.js
node generate-employees.js

# Generate Vehicles
node create-vehicle-columns.js
node fix-transmission-column.js
node generate-vehicles.js

# Generate Cases
node create-case-columns.js
node generate-cases.js
node fix-display-values-v2.js

# Exit container
exit
```

## 🧪 Step 5: Test Your Setup

### Test NoCoDB Access:
```bash
curl -I https://nocodb.yourdomain.com
```

### Test API Wrapper:
```bash
# Health check (no auth required)
curl https://api.nocodb.yourdomain.com/health

# Test with API key
curl -H "X-API-Key: your_api_key" https://api.nocodb.yourdomain.com/api/vehicles

# Query examples
curl -H "X-API-Key: your_api_key" "https://api.nocodb.yourdomain.com/api/vehicles?Make=BMW"
curl -H "X-API-Key: your_api_key" "https://api.nocodb.yourdomain.com/api/contacts?VIP=Yes"
curl -H "X-API-Key: your_api_key" "https://api.nocodb.yourdomain.com/api/employees?JobTitle=Manager"
```

## 🔒 Security Best Practices

### 1. Lock Down NPM Admin Panel:
```bash
# Only allow access from specific IPs
# In NPM: Edit the admin panel and add Access List
```

### 2. Regular Updates:
```bash
# Update images regularly
docker-compose -f docker-compose.oracle.yml pull
docker-compose -f docker-compose.oracle.yml up -d
```

### 3. Backup Strategy:
```bash
# Backup volumes
docker run --rm \
  -v nocodb-faker_nocodb_data:/data \
  -v $(pwd)/backups:/backup \
  ubuntu tar czf /backup/nocodb-backup-$(date +%Y%m%d).tar.gz /data

# Backup PostgreSQL
docker exec nocodb_postgres pg_dump -U nocodb_network nocodb > backup.sql
```

### 4. Monitor Logs:
```bash
# View logs
docker-compose -f docker-compose.oracle.yml logs -f

# View specific service logs
docker-compose -f docker-compose.oracle.yml logs -f nocodb
docker-compose -f docker-compose.oracle.yml logs -f nocodb-api
docker-compose -f docker-compose.oracle.yml logs -f nginx-proxy-manager
```

## 📊 Service URLs

After deployment, your services will be available at:

| Service | URL | Description |
|---------|-----|-------------|
| NoCoDB | `https://nocodb.yourdomain.com` | Main NoCoDB interface |
| API Wrapper | `https://api.nocodb.yourdomain.com` | Your REST API wrapper |
| NPM Admin | `http://your-oracle-ip:81` | Nginx Proxy Manager admin panel |

## 🔧 Maintenance

### Restart Services:
```bash
docker-compose -f docker-compose.oracle.yml restart
```

### Stop Services:
```bash
docker-compose -f docker-compose.oracle.yml down
```

### View Resource Usage:
```bash
docker stats
```

### Clean Up:
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes (be careful!)
docker volume prune
```

## 🐛 Troubleshooting

### Service won't start:
```bash
# Check logs
docker-compose -f docker-compose.oracle.yml logs service-name

# Check port conflicts
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### SSL Certificate Issues:
- Ensure DNS is pointing to Oracle IP
- Check ports 80/443 are open
- Wait a few minutes for DNS propagation
- Check NPM logs: `docker logs nginx-proxy-manager`

### Can't access from outside:
- Verify Oracle Cloud security list rules
- Check Ubuntu firewall: `sudo iptables -L`
- Verify DNS: `nslookup yourdomain.com`

### API not responding:
```bash
# Check if API is running
docker ps | grep nocodb-api

# Check API logs
docker logs nocodb-api

# Check environment variables
docker exec nocodb-api env | grep NOCODB
```

## 📈 Resource Usage (Oracle Free Tier)

Oracle Free Tier provides:
- **Compute**: 1-4 ARM cores (Ampere A1) - 24GB RAM
- **Storage**: 200GB block storage
- **Bandwidth**: 10TB/month

Expected resource usage:
- **NoCoDB**: ~200MB RAM
- **PostgreSQL**: ~50MB RAM
- **API Wrapper**: ~50MB RAM
- **Nginx Proxy Manager**: ~50MB RAM
- **Total**: ~350MB RAM (well within free tier limits)

## 🎉 You're All Set!

Your NoCoDB instance with fake data and API wrapper is now deployed on Oracle Cloud with SSL!

- Access NoCoDB at: `https://nocodb.yourdomain.com`
- Access API at: `https://api.nocodb.yourdomain.com`
- Manage proxies at: `http://your-oracle-ip:81`

## 📚 Additional Resources

- [NoCoDB Documentation](https://docs.nocodb.com/)
- [Nginx Proxy Manager Documentation](https://nginxproxymanager.com/guide/)
- [Oracle Cloud Documentation](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm)
- [Project Repository](https://github.com/rp1783/nocodb-faker)

---

🤖 Generated with Claude Code
