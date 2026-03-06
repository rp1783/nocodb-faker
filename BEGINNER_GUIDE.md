# Complete Beginner's Guide: NoCoDB on Oracle Cloud Free Tier

This guide will take you from zero to a fully deployed NoCoDB instance with fake data on Oracle Cloud's free tier. No prior cloud experience required!

## What You'll Build

By the end of this guide, you'll have:
- A free Oracle Cloud virtual machine (VM)
- NoCoDB running with PostgreSQL database
- An API wrapper for easy data access
- Realistic fake data in 4 tables (Contacts, Employees, Vehicles, Cases)
- Secure HTTPS access via either:
  - **Option A**: Your own domain with Nginx Proxy Manager (recommended if you have a domain)
  - **Option B**: Cloudflare Tunnel (free, no domain required)

## Time Required

- **First time setup**: 45-60 minutes
- **With experience**: 15-20 minutes

---

## Part 1: Create Oracle Cloud Free Tier Account

### Step 1.1: Sign Up for Oracle Cloud

1. Go to [https://www.oracle.com/cloud/free/](https://www.oracle.com/cloud/free/)
2. Click **Start for free**
3. Fill out the registration form:
   - Email address
   - Country
   - First and last name
4. Click **Verify my email**
5. Check your email and click the verification link
6. Complete the account setup:
   - Create a password
   - Choose your cloud region (pick one closest to you)
   - Enter payment information (required but won't be charged - free tier is truly free)
7. Wait for account provisioning (usually 5-10 minutes)

### Step 1.2: Sign In to Oracle Cloud Console

1. Go to [https://cloud.oracle.com/](https://cloud.oracle.com/)
2. Enter your **Cloud Account Name** (shown in welcome email)
3. Click **Next**
4. Enter your email and password
5. You'll see the Oracle Cloud Console dashboard

---

## Part 2: Create a Virtual Machine (VM)

### Step 2.1: Create a Compute Instance

1. From the Oracle Cloud Console, click the **hamburger menu** (≡) in the top-left
2. Navigate to: **Compute** → **Instances**
3. Click **Create Instance**

### Step 2.2: Configure the Instance

**Name your instance:**
```
nocodb-server
```

**Placement:** (leave as default)

**Image and shape:**
1. Click **Edit** next to "Image and shape"
2. Click **Change Image**
   - Select: **Canonical Ubuntu** (22.04 or later)
   - Click **Select Image**
3. Click **Change Shape**
   - Select: **Ampere** (ARM-based processor)
   - Choose: **VM.Standard.A1.Flex**
   - Set OCPUs: **2** (or up to 4 if you want)
   - Set Memory: **12 GB** (or up to 24 GB)
   - Click **Select Shape**

**Networking:**
1. Click **Edit** next to "Networking"
2. Keep **Create new virtual cloud network** selected
3. Keep **Create new public subnet** selected
4. Check **Assign a public IPv4 address**

**Add SSH keys:**
1. This is how you'll access your server securely
2. Two options:

   **Option A - Generate new keys (easiest for beginners):**
   - Select **Generate a key pair for me**
   - Click **Save Private Key** and save it somewhere safe (e.g., Downloads folder)
   - Click **Save Public Key** and save it too
   - **IMPORTANT**: Don't lose these keys! You'll need them to access your server

   **Option B - Use existing keys (if you have them):**
   - Select **Upload public key files (.pub)**
   - Upload your existing public key file

**Boot volume:**
- Leave as default (200GB is included in free tier)

### Step 2.3: Create the Instance

1. Click **Create** at the bottom
2. Wait 1-2 minutes for the instance to provision
3. Status will change from "PROVISIONING" to "RUNNING" (orange to green)

### Step 2.4: Note Your Public IP Address

Once running, you'll see:
```
Public IP address: 123.456.789.101
```
**Save this IP address** - you'll need it throughout this guide!

---

## Part 3: Configure Firewall Rules

Your VM needs to allow web traffic through the firewall.

### Step 3.1: Configure Oracle Cloud Security List

1. From your instance page, scroll down to **Resources** (left sidebar)
2. Click **Attached VNICs**
3. Click on your VNIC name (usually starts with "vnic-")
4. Under **Resources**, click **Security Lists**
5. Click on the security list name (e.g., "Default Security List")
6. Click **Add Ingress Rules**

**Add Rule 1 (HTTP):**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: **TCP**
- Destination Port Range: `80`
- Description: `Allow HTTP`
- Click **Add Ingress Rules**

**Add Rule 2 (HTTPS):**
- Click **Add Ingress Rules** again
- Source CIDR: `0.0.0.0/0`
- IP Protocol: **TCP**
- Destination Port Range: `443`
- Description: `Allow HTTPS`
- Click **Add Ingress Rules**

**Add Rule 3 (Nginx Proxy Manager - optional, only if using Option A):**
- Click **Add Ingress Rules** again
- Source CIDR: `YOUR_HOME_IP/32` (find your IP at [whatismyip.com](https://www.whatismyip.com))
- IP Protocol: **TCP**
- Destination Port Range: `81`
- Description: `Allow NPM Admin`
- Click **Add Ingress Rules**

### Step 3.2: Configure Ubuntu Firewall (iptables)

We'll do this in the next section when we connect to the server.

---

## Part 4: Connect to Your Server

### Step 4.1: Prepare SSH Connection

**On Mac/Linux:**
1. Open **Terminal**
2. Move your private key to a safe location:
   ```bash
   mkdir -p ~/.ssh
   mv ~/Downloads/ssh-key-*.key ~/.ssh/oracle-key
   chmod 400 ~/.ssh/oracle-key
   ```

**On Windows:**
1. Install [PuTTY](https://www.putty.org/) if you don't have it
2. Use PuTTYgen to convert your private key to .ppk format
3. Or use Windows Subsystem for Linux (WSL) and follow Mac/Linux instructions

### Step 4.2: Connect via SSH

Replace `123.456.789.101` with your actual public IP:

**Mac/Linux:**
```bash
ssh -i ~/.ssh/oracle-key ubuntu@123.456.789.101
```

**Windows (PuTTY):**
1. Open PuTTY
2. Host Name: `ubuntu@123.456.789.101`
3. Connection → SSH → Auth → Browse to your .ppk file
4. Click **Open**

**First connection:** You'll see a security warning - type `yes` and press Enter

You should now see:
```
ubuntu@nocodb-server:~$
```

Congratulations! You're connected to your cloud server!

### Step 4.3: Configure Ubuntu Firewall

Run these commands on your server:

```bash
# Update system packages
sudo apt update

# Install iptables-persistent (select Yes when prompted)
sudo apt install iptables-persistent -y

# Add firewall rules for HTTP (port 80)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT

# Add firewall rules for HTTPS (port 443)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# Add firewall rules for Nginx Proxy Manager admin (port 81) - optional
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 81 -j ACCEPT

# Save the rules
sudo netfilter-persistent save

# Verify rules are added
sudo iptables -L INPUT --line-numbers
```

You should see the new rules listed.

---

## Part 5: Install Docker

Docker lets us run applications in containers - isolated, portable environments.

### Step 5.1: Install Docker Engine

```bash
# Download Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh

# Run the installation script
sudo sh get-docker.sh

# Add your user to the docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# Clean up
rm get-docker.sh
```

### Step 5.2: Install Docker Compose

```bash
# Install Docker Compose
sudo apt install docker-compose -y
```

### Step 5.3: Apply Group Changes

```bash
# Logout and login again for group changes to take effect
exit
```

Now reconnect via SSH (same command as before):
```bash
ssh -i ~/.ssh/oracle-key ubuntu@123.456.789.101
```

### Step 5.4: Verify Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version

# Verify you can run docker without sudo
docker ps
```

You should see version information and an empty list of containers.

---

## Part 6: Clone and Setup the Project

### Step 6.1: Clone the Repository

```bash
# Clone the project
git clone https://github.com/rp1783/nocodb-faker.git

# Enter the directory
cd nocodb-faker
```

### Step 6.2: Create Environment File

```bash
# Copy the example environment file
cp .env.oracle.example .env
```

### Step 6.3: Generate Secure Keys

```bash
# Generate JWT secret (you'll see a long random string)
openssl rand -hex 32

# Generate API wrapper key (you'll see another long random string)
openssl rand -hex 32
```

**Copy these values!** You'll need them in the next step.

### Step 6.4: Edit Environment File

```bash
# Edit the .env file
nano .env
```

You'll see this file. Update the following values:

```env
# Replace this with the first generated key
NC_AUTH_JWT_SECRET=paste_your_first_generated_key_here

# Replace this with the second generated key
NOCODB_WRAPPER_API_KEY=paste_your_second_generated_key_here

# Replace with your Oracle instance public IP
ORACLE_PUBLIC_IP=123.456.789.101

# If you have a domain, replace these
DOMAIN=nocodb.yourdomain.com
API_DOMAIN=api.nocodb.yourdomain.com

# Leave everything else as is for now
```

**Nano editor shortcuts:**
- Edit the file by moving cursor and typing
- `Ctrl + O` to save (press Enter to confirm)
- `Ctrl + X` to exit

---

## Part 7: Choose Your Access Method

You have two options for accessing your NoCoDB instance:

- **Option A**: Use your own domain with Nginx Proxy Manager (free SSL certificates)
  - ✅ Professional custom domain
  - ✅ Full control over SSL certificates
  - ❌ Requires owning a domain name
  - ❌ Requires DNS configuration

- **Option B**: Use Cloudflare Tunnel (no domain required)
  - ✅ No domain needed
  - ✅ Automatic HTTPS
  - ✅ Free Cloudflare subdomain
  - ✅ Extra security (no ports exposed)
  - ❌ URLs will be on Cloudflare's domain (*.trycloudflare.com or your Cloudflare domain)

Choose one and follow the corresponding section below.

---

## Option A: Setup with Domain & Nginx Proxy Manager

Follow this section if you own a domain name.

### A.1: Point Your Domain to Oracle

1. Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
2. Go to DNS settings for your domain
3. Add two **A records**:

   ```
   Type: A
   Name: nocodb
   Value: 123.456.789.101 (your Oracle IP)
   TTL: 300 (or Auto)
   ```

   ```
   Type: A
   Name: api.nocodb
   Value: 123.456.789.101 (your Oracle IP)
   TTL: 300 (or Auto)
   ```

4. Save changes
5. Wait 5-10 minutes for DNS to propagate

**Verify DNS is working:**
```bash
# On your local computer (not the server)
nslookup nocodb.yourdomain.com
nslookup api.nocodb.yourdomain.com
```

Both should return your Oracle IP address.

### A.2: Start Services

```bash
# Pull the latest Docker images
docker-compose -f docker-compose.oracle.yml pull

# Start all services
docker-compose -f docker-compose.oracle.yml up -d

# Wait 30 seconds for services to start
sleep 30

# Check if all services are running
docker-compose -f docker-compose.oracle.yml ps
```

You should see 4 services running:
- nocodb
- nocodb_postgres
- nocodb-api
- nginx-proxy-manager

### A.3: Configure Nginx Proxy Manager

**Access NPM admin panel:**
1. Open browser: `http://123.456.789.101:81` (replace with your IP)
2. Login with default credentials:
   - Email: `admin@example.com`
   - Password: `changeme`
3. You'll be prompted to change these immediately
4. Set new email and password (save these!)

**Get SSL certificates:**
1. Click **SSL Certificates** in the menu
2. Click **Add SSL Certificate**
3. Choose **Let's Encrypt**
4. In **Domain Names**, add:
   ```
   nocodb.yourdomain.com
   api.nocodb.yourdomain.com
   ```
5. Toggle on **Use a DNS Challenge**
6. Enter your email for renewal notifications
7. Check **I Agree to the Let's Encrypt Terms of Service**
8. Click **Save**
9. Wait 1-2 minutes for certificate issuance

**Create proxy host for NoCoDB:**
1. Click **Hosts** → **Proxy Hosts**
2. Click **Add Proxy Host**
3. **Details tab:**
   - Domain Names: `nocodb.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname/IP: `nocodb`
   - Forward Port: `8080`
   - Check: ☑ Cache Assets
   - Check: ☑ Block Common Exploits
   - Check: ☑ Websockets Support
4. **SSL tab:**
   - SSL Certificate: Select your Let's Encrypt certificate
   - Check: ☑ Force SSL
   - Check: ☑ HTTP/2 Support
   - Check: ☑ HSTS Enabled
5. Click **Save**

**Create proxy host for API wrapper:**
1. Click **Add Proxy Host** again
2. **Details tab:**
   - Domain Names: `api.nocodb.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname/IP: `nocodb-api`
   - Forward Port: `3000`
   - Check: ☑ Cache Assets
   - Check: ☑ Block Common Exploits
   - Check: ☑ Websockets Support
3. **SSL tab:**
   - SSL Certificate: Select your Let's Encrypt certificate
   - Check: ☑ Force SSL
   - Check: ☑ HTTP/2 Support
   - Check: ☑ HSTS Enabled
4. Click **Save**

**Your services are now accessible at:**
- NoCoDB: `https://nocodb.yourdomain.com`
- API Wrapper: `https://api.nocodb.yourdomain.com`

Skip to **Part 8: Setup NoCoDB**

---

## Option B: Setup with Cloudflare Tunnel

Follow this section if you don't have a domain or prefer Cloudflare Tunnel.

### B.1: Create Cloudflare Account

1. Go to [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Sign up for a free account
3. Verify your email
4. Log in to the Cloudflare dashboard

### B.2: Install Cloudflared on Your Server

On your Oracle server:

```bash
# Download and install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb

# Install the package
sudo dpkg -i cloudflared-linux-arm64.deb

# Verify installation
cloudflared --version

# Clean up
rm cloudflared-linux-arm64.deb
```

### B.3: Authenticate Cloudflared

```bash
# Login to Cloudflare
cloudflared tunnel login
```

This will output a URL. Copy and paste it into your browser, then:
1. Select your Cloudflare account (or create one if needed)
2. Authorize cloudflared
3. You'll see "You have successfully logged in"
4. Return to your SSH terminal - you should see "You have successfully logged in"

### B.4: Create a Tunnel

```bash
# Create a new tunnel named "nocodb"
cloudflared tunnel create nocodb

# This will create a tunnel and show you:
# Tunnel credentials written to /home/ubuntu/.cloudflared/<TUNNEL-ID>.json
# Save this tunnel ID!

# List your tunnels to see the details
cloudflared tunnel list
```

Copy your **Tunnel ID** - it looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### B.5: Create Tunnel Configuration

```bash
# Create config directory
mkdir -p ~/.cloudflared

# Create config file
nano ~/.cloudflared/config.yml
```

Paste this configuration (replace `TUNNEL-ID` with your actual tunnel ID):

```yaml
tunnel: TUNNEL-ID
credentials-file: /home/ubuntu/.cloudflared/TUNNEL-ID.json

ingress:
  # NoCoDB web interface
  - hostname: nocodb-TUNNEL-ID.trycloudflare.com
    service: http://localhost:8091

  # API wrapper
  - hostname: api-nocodb-TUNNEL-ID.trycloudflare.com
    service: http://localhost:3000

  # Catch-all rule (required)
  - service: http_status:404
```

**Note:** If you have a domain in Cloudflare, you can use your own subdomains instead:
```yaml
  - hostname: nocodb.yourdomain.com
    service: http://localhost:8091

  - hostname: api.nocodb.yourdomain.com
    service: http://localhost:3000
```

Save the file (`Ctrl + O`, Enter, `Ctrl + X`)

### B.6: Route DNS (if using your own domain)

If you're using Cloudflare with your own domain:

```bash
# Route your domain through the tunnel (replace with your actual domain)
cloudflared tunnel route dns nocodb nocodb.yourdomain.com
cloudflared tunnel route dns nocodb api.nocodb.yourdomain.com
```

### B.7: Start Services

```bash
# Go back to the project directory
cd ~/nocodb-faker

# Start NoCoDB and API (without Nginx Proxy Manager)
docker-compose -f docker-compose.cloudflare.yml up -d

# Wait 30 seconds for services to start
sleep 30

# Check if services are running
docker-compose -f docker-compose.cloudflare.yml ps
```

### B.8: Start Cloudflare Tunnel

```bash
# Run the tunnel (this will run in foreground)
cloudflared tunnel run nocodb
```

You should see:
```
Connection registered
```

**To run the tunnel in the background:**

Press `Ctrl + C` to stop the foreground process, then:

```bash
# Install cloudflared as a service
sudo cloudflared service install

# Start the service
sudo systemctl start cloudflared

# Enable it to start on boot
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

### B.9: Access Your Services

Your services are now accessible at:

**Using free Cloudflare subdomain:**
- NoCoDB: `https://nocodb-TUNNEL-ID.trycloudflare.com`
- API: `https://api-nocodb-TUNNEL-ID.trycloudflare.com`

**Or using your own domain (if configured):**
- NoCoDB: `https://nocodb.yourdomain.com`
- API: `https://api.nocodb.yourdomain.com`

---

## Part 8: Setup NoCoDB

Now that your services are running, let's configure NoCoDB and generate data.

### Step 8.1: Create NoCoDB Account

1. Open your NoCoDB URL:
   - **Option A**: `https://nocodb.yourdomain.com`
   - **Option B**: `https://nocodb-TUNNEL-ID.trycloudflare.com`

2. You'll see the NoCoDB welcome screen
3. Click **Sign Up**
4. Create your admin account:
   - Email
   - Password
5. Click **Sign Up**

### Step 8.2: Create a Workspace and Base

1. You'll see the workspace dashboard
2. Click **Create New Base** (or use the default base)
3. Name it something like "Fake Data"
4. Click **Create**

### Step 8.3: Get Your API Token

1. Click your profile icon (top-right corner)
2. Click **Account Settings**
3. Go to **Tokens** tab
4. Click **+ Create Token**
5. Give it a name: "Data Generator"
6. Click **Generate**
7. **Copy the token** - you'll only see it once!

### Step 8.4: Create Tables

Create these 4 tables in NoCoDB:

**Table 1: Contacts**
1. Click **+ New Table**
2. Name: `Contacts`
3. Click **Submit**
4. NoCoDB creates it with a default Title column

**Table 2: Employees**
1. Click **+ New Table**
2. Name: `Employees`
3. Click **Submit**

**Table 3: Vehicles**
1. Click **+ New Table**
2. Name: `Vehicles`
3. Click **Submit**

**Table 4: Cases**
1. Click **+ New Table**
2. Name: `Cases`
3. Click **Submit**

### Step 8.5: Get Table IDs

For each table, you need to get its ID from the URL:

1. Click on the **Contacts** table
2. Look at the URL in your browser:
   ```
   https://nocodb.yourdomain.com/nc/base_id/table_id
   ```
3. Copy the `table_id` part (the last segment)
4. Repeat for all 4 tables

**Example:**
```
URL: https://nocodb.yourdomain.com/nc/p01234abcd/m5678efgh
                                               ^^^^^^^^^^^
                                               This is your table ID
```

### Step 8.6: Update Environment File

Back on your Oracle server:

```bash
# Edit the environment file
nano .env
```

Update these values with your actual data:

```env
# Paste your NoCoDB API token here
NOCODB_API_TOKEN=your_actual_token_from_nocodb

# Paste your table IDs here
TABLE_ID=your_contacts_table_id
EMPLOYEES_TABLE_ID=your_employees_table_id
VEHICLES_TABLE_ID=your_vehicles_table_id
CASES_TABLE_ID=your_cases_table_id
```

Save the file (`Ctrl + O`, Enter, `Ctrl + X`)

### Step 8.7: Restart API Service

```bash
# Restart the API service to load new environment variables
# If using Option A (Nginx Proxy Manager):
docker-compose -f docker-compose.oracle.yml restart nocodb-api

# If using Option B (Cloudflare Tunnel):
docker-compose -f docker-compose.cloudflare.yml restart nocodb-api
```

---

## Part 9: Generate Fake Data

Now for the fun part - let's populate your database with realistic fake data!

### Step 9.1: Enter the API Container

```bash
# Connect to the API container
docker exec -it nocodb-api sh
```

You'll now see a different prompt: `#` or `/app #`

### Step 9.2: Generate Contacts Table

```bash
# Create columns for Contacts table
node create-columns.js

# You should see:
# Column Name created successfully
# Column Email created successfully
# ... etc

# Generate 100 contacts
node generate-contacts.js

# You should see:
# Generated 100 contacts successfully!
```

### Step 9.3: Generate Employees Table

```bash
# Create columns for Employees table
node create-employee-columns.js

# Generate 20 employees
node generate-employees.js

# You should see:
# Generated 20 employees successfully!
```

### Step 9.4: Generate Vehicles Table

```bash
# Create columns for Vehicles table
node create-vehicle-columns.js

# Fix transmission column (set dropdown options)
node fix-transmission-column.js

# Add year column
node add-year-column.js

# Generate 50 vehicles
node generate-vehicles.js

# You should see:
# Generated 50 vehicles successfully!
```

### Step 9.5: Generate Cases Table (with relationships)

```bash
# Create columns for Cases table (includes links to Contacts & Employees)
node create-case-columns.js

# Generate 30 cases
node generate-cases.js

# Fix display values to show names instead of IDs
node fix-display-values-v2.js

# You should see:
# Generated 30 cases successfully!
```

### Step 9.6: Exit the Container

```bash
exit
```

You're back to your server prompt: `ubuntu@nocodb-server:~/nocodb-faker$`

### Step 9.7: Verify Data in NoCoDB

1. Go back to your NoCoDB browser window
2. Click on each table to see the data:
   - **Contacts**: 100 contacts with names, emails, phones, cities, states, VIP status
   - **Employees**: 20 employees with names, job titles, extensions
   - **Vehicles**: 50 vehicles with make, model, year, color, mileage, transmission
   - **Cases**: 30 cases with case numbers, linked contacts, and assigned employees

---

## Part 10: Test Your API

Your API wrapper provides a clean REST interface to query this data.

### Step 10.1: Get Your API Key

From your `.env` file:
```bash
# View your API key
grep NOCODB_WRAPPER_API_KEY .env
```

Copy the value (the long random string).

### Step 10.2: Test API Endpoints

**Health check (no authentication):**
```bash
# Option A (with domain):
curl https://api.nocodb.yourdomain.com/health

# Option B (Cloudflare):
curl https://api-nocodb-TUNNEL-ID.trycloudflare.com/health

# Should return: {"status":"healthy","timestamp":"..."}
```

**Get all vehicles:**
```bash
# Replace YOUR_API_KEY with your actual key
# Replace the URL with your actual API URL

curl -H "X-API-Key: YOUR_API_KEY" \
  "https://api.nocodb.yourdomain.com/api/vehicles"
```

**Filter vehicles by make:**
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://api.nocodb.yourdomain.com/api/vehicles?Make=BMW"
```

**Get VIP contacts:**
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://api.nocodb.yourdomain.com/api/contacts?VIP=Yes"
```

**Get managers:**
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://api.nocodb.yourdomain.com/api/employees?JobTitle=Manager"
```

**Get all cases (includes linked data):**
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://api.nocodb.yourdomain.com/api/cases"
```

### Step 10.3: Test in Browser

For a prettier view, test in your browser:

1. Install a browser extension for API testing:
   - **Chrome**: [ModHeader](https://chrome.google.com/webstore/detail/modheader/idgpnmonknjnojddfkpgkljpfnnfcklj)
   - **Firefox**: [ModHeader](https://addons.mozilla.org/en-US/firefox/addon/modheader-firefox/)

2. Configure the extension:
   - Add a request header
   - Name: `X-API-Key`
   - Value: Your API key

3. Visit your API endpoints in the browser:
   ```
   https://api.nocodb.yourdomain.com/api/vehicles
   https://api.nocodb.yourdomain.com/api/contacts
   ```

You'll see nicely formatted JSON!

---

## Part 11: Understanding Your Setup

### What's Running?

**Option A (Nginx Proxy Manager):**
- **PostgreSQL** (port 5432): Database for NoCoDB
- **NoCoDB** (port 8080): The main application
- **API Wrapper** (port 3000): Your custom API
- **Nginx Proxy Manager** (ports 80, 443, 81): Reverse proxy with SSL

**Option B (Cloudflare Tunnel):**
- **NoCoDB** (port 8091): The main application
- **API Wrapper** (port 3000): Your custom API
- **Cloudflared**: Tunnel service connecting to Cloudflare

### How It Works

1. **Users access** your domain (e.g., nocodb.yourdomain.com)
2. **Nginx/Cloudflare** receives the request
3. **Routes to NoCoDB** or API container
4. **NoCoDB** queries PostgreSQL database
5. **Response** sent back through the chain

### Resource Usage

Check what resources you're using:

```bash
# See CPU and memory usage
docker stats

# See disk usage
df -h

# See container status
docker ps
```

Oracle Free Tier includes:
- **4 ARM cores**
- **24 GB RAM**
- **200 GB storage**

Your setup uses approximately:
- **350 MB RAM total**
- **5 GB storage**

You have plenty of headroom!

---

## Part 12: Maintenance & Management

### View Logs

**All services:**
```bash
# Option A:
docker-compose -f docker-compose.oracle.yml logs -f

# Option B:
docker-compose -f docker-compose.cloudflare.yml logs -f
```

**Specific service:**
```bash
docker logs nocodb
docker logs nocodb-api
docker logs nocodb_postgres
```

### Restart Services

```bash
# Option A:
docker-compose -f docker-compose.oracle.yml restart

# Option B:
docker-compose -f docker-compose.cloudflare.yml restart
```

### Stop Services

```bash
# Option A:
docker-compose -f docker-compose.oracle.yml down

# Option B:
docker-compose -f docker-compose.cloudflare.yml down
```

### Start Services

```bash
# Option A:
docker-compose -f docker-compose.oracle.yml up -d

# Option B:
docker-compose -f docker-compose.cloudflare.yml up -d
```

### Update Services

```bash
# Pull latest images
# Option A:
docker-compose -f docker-compose.oracle.yml pull

# Option B:
docker-compose -f docker-compose.cloudflare.yml pull

# Restart with new images
# Option A:
docker-compose -f docker-compose.oracle.yml up -d

# Option B:
docker-compose -f docker-compose.cloudflare.yml up -d
```

### Backup Your Data

**Backup NoCoDB data:**
```bash
# Create backups directory
mkdir -p ~/backups

# Backup NoCoDB data
docker run --rm \
  -v nocodb-faker_nocodb_data:/data \
  -v ~/backups:/backup \
  ubuntu tar czf /backup/nocodb-backup-$(date +%Y%m%d).tar.gz /data

# List backups
ls -lh ~/backups/
```

**Backup PostgreSQL database (Option A only):**
```bash
# Backup database
docker exec nocodb_postgres pg_dump -U nocodb_network nocodb > ~/backups/postgres-backup-$(date +%Y%m%d).sql

# List backups
ls -lh ~/backups/
```

### Restore from Backup

**Restore NoCoDB data:**
```bash
# Stop services first
docker-compose -f docker-compose.oracle.yml down

# Restore from backup
docker run --rm \
  -v nocodb-faker_nocodb_data:/data \
  -v ~/backups:/backup \
  ubuntu bash -c "cd / && tar xzf /backup/nocodb-backup-YYYYMMDD.tar.gz"

# Start services
docker-compose -f docker-compose.oracle.yml up -d
```

---

## Part 13: Troubleshooting

### Can't Connect to Server via SSH

**Problem:** `Connection refused` or `Connection timeout`

**Solutions:**
1. Check instance is running in Oracle Console
2. Verify you're using the correct public IP
3. Check SSH key permissions: `chmod 400 ~/.ssh/oracle-key`
4. Try from a different network (some ISPs block SSH)

### Services Won't Start

**Problem:** `Error starting container`

**Solutions:**
```bash
# Check logs
docker-compose -f docker-compose.oracle.yml logs

# Check for port conflicts
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Remove old containers
docker-compose -f docker-compose.oracle.yml down
docker-compose -f docker-compose.oracle.yml up -d
```

### SSL Certificate Issues (Option A)

**Problem:** Let's Encrypt certificate won't generate

**Solutions:**
1. Verify DNS points to your IP: `nslookup nocodb.yourdomain.com`
2. Wait 10 minutes for DNS propagation
3. Check ports 80 and 443 are accessible: `curl http://your-ip`
4. Check NPM logs: `docker logs nginx-proxy-manager`
5. Try using DNS challenge instead of HTTP challenge

### Cloudflare Tunnel Not Working (Option B)

**Problem:** Tunnel shows disconnected

**Solutions:**
```bash
# Check tunnel status
sudo systemctl status cloudflared

# View tunnel logs
sudo journalctl -u cloudflared -f

# Restart tunnel
sudo systemctl restart cloudflared

# Re-authenticate if needed
cloudflared tunnel login
```

### API Returns 401 Unauthorized

**Problem:** API queries fail with "Unauthorized"

**Solutions:**
1. Check you're sending the API key header: `-H "X-API-Key: your_key"`
2. Verify API key matches `.env` file: `grep NOCODB_WRAPPER_API_KEY .env`
3. Ensure API service restarted after updating `.env`
4. Check API logs: `docker logs nocodb-api`

### Data Generation Scripts Fail

**Problem:** Scripts show errors when generating data

**Solutions:**
```bash
# Verify environment variables are set
docker exec nocodb-api env | grep NOCODB

# Check NoCoDB is accessible from container
docker exec nocodb-api wget -qO- http://nocodb:8080

# Verify API token is correct
docker exec nocodb-api sh -c 'echo $NOCODB_API_TOKEN'

# Check table IDs are correct in .env
```

### Out of Memory Errors

**Problem:** Services crash or freeze

**Solutions:**
```bash
# Check memory usage
free -h
docker stats

# If using SQLite, switch to PostgreSQL (Option A)
# If memory is maxed, reduce services or upgrade instance
```

### Can't Access from Outside

**Problem:** URLs don't work from browser

**Solutions:**
1. **Oracle firewall:** Check security list in Oracle Console
2. **Ubuntu firewall:** Check iptables rules
3. **DNS:** Verify with `nslookup yourdomain.com`
4. **Nginx/Cloudflare:** Check service logs
5. Try accessing from your server: `curl http://localhost:8091`

---

## Part 14: Next Steps

### Add More Data Tables

Want to add more tables? Follow this pattern:

1. Create table in NoCoDB
2. Get table ID from URL
3. Create a column creation script
4. Create a data generation script
5. Run the scripts in the container

### Customize the API

The API wrapper is in `api.js`. You can:
- Add new endpoints
- Modify query logic
- Add custom filters
- Integrate with other services

### Connect Your Applications

Use your API in your apps:

**JavaScript/Node.js:**
```javascript
const response = await fetch('https://api.nocodb.yourdomain.com/api/vehicles?Make=BMW', {
  headers: {
    'X-API-Key': 'your_api_key'
  }
});
const data = await response.json();
console.log(data);
```

**Python:**
```python
import requests

headers = {'X-API-Key': 'your_api_key'}
response = requests.get('https://api.nocodb.yourdomain.com/api/vehicles', headers=headers)
data = response.json()
print(data)
```

**cURL/Bash:**
```bash
curl -H "X-API-Key: your_api_key" \
  "https://api.nocodb.yourdomain.com/api/vehicles"
```

### Monitoring & Alerts

Set up monitoring to know if your service goes down:

1. Use a free service like [UptimeRobot](https://uptimerobot.com/)
2. Monitor your `/health` endpoint
3. Get email/SMS alerts if down

### Security Hardening

Additional security steps:

1. **Change SSH port:**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Change Port 22 to Port 2222
   sudo systemctl restart sshd
   ```

2. **Enable fail2ban:**
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   ```

3. **Regular updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **Firewall for NPM admin:**
   - Only allow your IP to access port 81
   - Update Oracle security list to restrict source

---

## Part 15: Useful Commands Reference

### SSH Connection
```bash
ssh -i ~/.ssh/oracle-key ubuntu@YOUR_IP
```

### Docker Commands
```bash
# List running containers
docker ps

# View logs
docker logs CONTAINER_NAME

# Enter container
docker exec -it CONTAINER_NAME sh

# View resource usage
docker stats

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a
```

### Docker Compose Commands
```bash
# Start services
docker-compose -f docker-compose.oracle.yml up -d

# Stop services
docker-compose -f docker-compose.oracle.yml down

# Restart services
docker-compose -f docker-compose.oracle.yml restart

# View logs
docker-compose -f docker-compose.oracle.yml logs -f

# Check status
docker-compose -f docker-compose.oracle.yml ps
```

### System Commands
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check system load
top

# Check open ports
sudo netstat -tlnp

# View firewall rules
sudo iptables -L
```

### Cloudflare Tunnel Commands
```bash
# List tunnels
cloudflared tunnel list

# Check tunnel service status
sudo systemctl status cloudflared

# View tunnel logs
sudo journalctl -u cloudflared -f

# Restart tunnel
sudo systemctl restart cloudflared
```

---

## Part 16: FAQ

**Q: How much does this cost?**
A: $0! Oracle Cloud Free Tier is completely free forever for the resources used in this guide.

**Q: Will I be charged if I exceed limits?**
A: No. Free tier resources have hard limits. You cannot accidentally exceed them and get charged.

**Q: Can I use this for production?**
A: The free tier is suitable for small projects, testing, and development. For high-traffic production apps, consider paid tiers.

**Q: Do I need a domain?**
A: No! Use Option B (Cloudflare Tunnel) which provides free HTTPS without a domain.

**Q: Can I use my own domain with Cloudflare Tunnel?**
A: Yes! If your domain is on Cloudflare, you can use custom subdomains.

**Q: How do I add more fake data?**
A: Edit the `NUM_*` variables in `.env` and re-run the generation scripts.

**Q: Can I customize the fake data?**
A: Yes! Edit the generator scripts (e.g., `generate-contacts.js`) to change what data is created.

**Q: Is my data secure?**
A: Yes. Data is encrypted in transit (HTTPS) and stored in your private database. Only you have access.

**Q: Can I reset everything and start over?**
A: Yes! Run `docker-compose down -v` to remove everything, then start again from Part 6.

**Q: What if I want to use SQLite instead of PostgreSQL?**
A: Use `docker-compose.cloudflare.yml` which uses SQLite (simpler, but less features).

**Q: How do I delete all the fake data?**
A: In NoCoDB, select all rows and delete, or use the delete scripts in the project.

---

## Part 17: Additional Resources

### Documentation
- [NoCoDB Official Docs](https://docs.nocodb.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Proxy Manager Guide](https://nginxproxymanager.com/guide/)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Oracle Cloud Free Tier](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm)

### Community & Support
- [NoCoDB Discord](https://discord.gg/5RgZmkW)
- [NoCoDB GitHub](https://github.com/nocodb/nocodb)
- [Project Repository](https://github.com/rp1783/nocodb-faker)

### Video Tutorials
Search YouTube for:
- "Oracle Cloud Free Tier setup"
- "NoCoDB tutorial"
- "Docker for beginners"
- "Cloudflare Tunnel setup"

---

## Conclusion

Congratulations! You've successfully:

✅ Created an Oracle Cloud Free Tier account
✅ Deployed a VM instance
✅ Installed Docker and Docker Compose
✅ Set up NoCoDB with PostgreSQL
✅ Configured HTTPS access (via Nginx or Cloudflare)
✅ Generated realistic fake data across 4 relational tables
✅ Set up a clean REST API wrapper
✅ Learned basic cloud server management

You now have a powerful, free cloud database platform with an API that you can use for:
- Learning web development
- Testing applications
- Building prototypes
- Demonstrating concepts
- API development practice

**Your Setup:**
- **NoCoDB**: Manage data visually
- **REST API**: Query data programmatically
- **Free Hosting**: No ongoing costs
- **HTTPS**: Secure connections
- **Realistic Data**: 200+ fake records

---

## Getting Help

If you run into issues:

1. Check the **Troubleshooting** section (Part 13)
2. Review the logs: `docker-compose logs -f`
3. Search for error messages online
4. Open an issue on [GitHub](https://github.com/rp1783/nocodb-faker/issues)
5. Ask in the NoCoDB Discord community

---

**Happy building!** 🚀

Generated with Claude Code
