# Quick Start Guide - Oracle Cloud Deployment

## 🎯 1-Minute Overview

This setup includes:
- **NoCoDB** - Your no-code database (with PostgreSQL backend)
- **API Wrapper** - Clean REST API for your data
- **Nginx Proxy Manager** - Easy SSL/reverse proxy management
- **Fake Data** - Pre-built scripts to generate 200+ records

## ⚡ Quick Deploy

```bash
# 1. Clone and enter directory
git clone https://github.com/rp1783/nocodb-faker.git
cd nocodb-faker

# 2. Run deployment script
./deploy-oracle.sh

# 3. Follow the prompts
```

## 🔧 Manual Deploy (Step-by-Step)

### Prerequisites on Oracle Instance
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Configure firewall
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 81 -j ACCEPT
sudo netfilter-persistent save
```

### Deploy Services
```bash
# Create environment file
cp .env.oracle.example .env

# Generate secure keys
openssl rand -hex 32  # Use for NC_AUTH_JWT_SECRET
openssl rand -hex 32  # Use for NOCODB_WRAPPER_API_KEY

# Edit .env with your values
nano .env

# Start everything
docker-compose -f docker-compose.oracle.yml up -d
```

## 🌐 Access Your Services

| Service | URL | Port |
|---------|-----|------|
| NoCoDB | `https://yourdomain.com` | 443 |
| API Wrapper | `https://api.yourdomain.com` | 443 |
| NPM Admin | `http://your-ip:81` | 81 |

## 🔐 First Time Setup

### 1. Nginx Proxy Manager (NPM)
```
URL: http://your-oracle-ip:81
Email: admin@example.com
Password: changeme

⚠️ CHANGE IMMEDIATELY!
```

### 2. Add SSL Certificates in NPM
- SSL Certificates → Add SSL Certificate → Let's Encrypt
- Add both domains: `yourdomain.com` and `api.yourdomain.com`
- Agree to ToS and save

### 3. Create Proxy Hosts in NPM

**For NoCoDB:**
- Domain: `yourdomain.com`
- Forward to: `nocodb:8080`
- SSL: Select your certificate
- Enable: Force SSL, HTTP/2, HSTS

**For API:**
- Domain: `api.yourdomain.com`
- Forward to: `nocodb-api:3000`
- SSL: Select your certificate
- Enable: Force SSL, HTTP/2, HSTS

### 4. NoCoDB Setup
1. Visit `https://yourdomain.com`
2. Create admin account
3. Create workspace
4. Get API token: Profile → Account Settings → Tokens
5. Update `.env` with `NOCODB_API_TOKEN`

### 5. Create Tables & Generate Data
```bash
# Create tables in NoCoDB UI:
# - Contacts
# - Employees
# - Vehicles
# - Cases

# Get table IDs from URLs and update .env

# Restart API to pick up new config
docker-compose -f docker-compose.oracle.yml restart nocodb-api

# Enter container and generate data
docker exec -it nocodb-api sh

# Generate all data (run in container)
node create-columns.js && node generate-contacts.js
node create-employee-columns.js && node generate-employees.js
node create-vehicle-columns.js && node generate-vehicles.js
node create-case-columns.js && node generate-cases.js && node fix-display-values-v2.js

exit
```

## 📡 Test Your API

```bash
# Health check (no auth)
curl https://api.yourdomain.com/health

# Get vehicles (with auth)
curl -H "X-API-Key: your_key" https://api.yourdomain.com/api/vehicles

# Filter BMWs
curl -H "X-API-Key: your_key" "https://api.yourdomain.com/api/vehicles?Make=BMW"

# VIP contacts
curl -H "X-API-Key: your_key" "https://api.yourdomain.com/api/contacts?VIP=Yes"
```

## 🛠️ Common Commands

```bash
# View all logs
docker-compose -f docker-compose.oracle.yml logs -f

# View specific service
docker-compose -f docker-compose.oracle.yml logs -f nocodb

# Restart everything
docker-compose -f docker-compose.oracle.yml restart

# Stop everything
docker-compose -f docker-compose.oracle.yml down

# Check status
docker-compose -f docker-compose.oracle.yml ps

# Check resource usage
docker stats
```

## 📊 Generated Data Summary

| Table | Records | Columns |
|-------|---------|---------|
| Contacts | 100 | Name, Email, Phone, City, State, VIP |
| Employees | 20 | Name, JobTitle, Extension |
| Vehicles | 50 | Make, Model, Year, Color, Mileage, Transmission |
| Cases | 30 | CaseNumber, Contact (link), AssignedTo (link) |

## 🔒 Oracle Cloud Firewall Rules

In Oracle Cloud Console, add these **Ingress Rules**:

| Port | Protocol | Source | Description |
|------|----------|--------|-------------|
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 81 | TCP | YOUR_IP/32 | NPM Admin (restrict to your IP) |

## 🐛 Quick Troubleshooting

**Can't access services:**
- Check Oracle Cloud security list has ingress rules
- Verify Ubuntu firewall: `sudo iptables -L`
- Check DNS points to Oracle IP: `nslookup yourdomain.com`

**SSL not working:**
- Ensure DNS is propagated (wait 5-10 minutes)
- Check ports 80/443 are open
- View NPM logs: `docker logs nginx-proxy-manager`

**API not responding:**
- Check .env has correct NOCODB_API_TOKEN and table IDs
- Restart API: `docker-compose -f docker-compose.oracle.yml restart nocodb-api`
- View logs: `docker logs nocodb-api`

## 📚 Full Documentation

For detailed information, see: **ORACLE_DEPLOYMENT.md**

## 💡 Tips

- Use `docker-compose -f docker-compose.oracle.yml` for all commands
- Back up your data regularly (PostgreSQL and NoCoDB volumes)
- Keep your API key secure
- Monitor resource usage with `docker stats`
- Oracle free tier includes 200GB storage and 10TB bandwidth/month

---

🤖 Generated with Claude Code
