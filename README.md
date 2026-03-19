# SaaS Todo App - Full Stack MVP

A full-stack todo application with JWT authentication, built with React and Spring Boot, deployed on Azure.

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 19, TypeScript, Vite 6, Tailwind CSS |
| Backend    | Spring Boot 3.4, Java 21, Maven        |
| Database   | H2 (dev) / Azure PostgreSQL (prod)     |
| Auth       | JWT (24h expiry, jjwt library)         |
| Deployment | Azure App Service (Linux B1)           |

---

## GitHub Repositories

- **Backend**: https://github.com/UDAY556/saas-todo-backend
- **Frontend**: https://github.com/UDAY556/saas-todo-frontend

---

## Architecture

```
┌──────────────────┐       HTTPS        ┌──────────────────────┐       TCP/5432      ┌─────────────────────┐
│                  │  ───────────────>   │                      │  ──────────────>    │                     │
│   React Frontend │   /api/* requests   │  Spring Boot Backend │   IP-whitelisted    │  Azure PostgreSQL   │
│   (App Service)  │  <───────────────   │    (App Service)     │  <──────────────    │  (Flexible Server)  │
│                  │    JSON responses   │                      │    SQL queries      │                     │
└──────────────────┘                     └──────────────────────┘                     └─────────────────────┘
saas-todo-frontend                       saas-todo-backend                            saas-todo-db-server
.azurewebsites.net                       .azurewebsites.net                           .postgres.database
                                                                                       .azure.com
```

---

## API Endpoints

| Method  | Endpoint                | Auth     | Description          |
|---------|-------------------------|----------|----------------------|
| POST    | `/api/auth/register`    | Public   | Register new user    |
| POST    | `/api/auth/login`       | Public   | Login, returns JWT   |
| GET     | `/api/auth/me`          | JWT      | Get current user     |
| GET     | `/api/todos`            | JWT      | List user's todos    |
| POST    | `/api/todos`            | JWT      | Create todo          |
| PUT     | `/api/todos/{id}`       | JWT      | Update todo          |
| PATCH   | `/api/todos/{id}/toggle`| JWT      | Toggle completed     |
| DELETE  | `/api/todos/{id}`       | JWT      | Delete todo          |

---

## Local Development

### Prerequisites
- Java 21
- Maven
- Node.js 22+
- nvm (recommended)

### Run Backend
```bash
cd backend
JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn spring-boot:run -Dspring-boot.run.profiles=dev
# Runs on http://localhost:8080
# H2 Console: http://localhost:8080/h2-console
```

### Run Frontend
```bash
cd frontend
nvm use 22
npm install
npm run dev
# Runs on http://localhost:5173 (proxies /api to :8080)
```

---

## Azure Deployment Flow

### Flowchart

```
  ┌─────────────────────────────┐
  │  1. Create Resource Group   │
  │     (saas-todo-rg)          │
  └──────────────┬──────────────┘
                 │
  ┌──────────────▼──────────────┐
  │  2. Register PostgreSQL     │
  │     Provider                │
  └──────────────┬──────────────┘
                 │
  ┌──────────────▼──────────────┐
  │  3. Create PostgreSQL       │
  │     Flexible Server         │
  │     (centralus)             │
  └──────────────┬──────────────┘
                 │
  ┌──────────────▼──────────────┐
  │  4. Create Database         │
  │     (tododb)                │
  └──────────────┬──────────────┘
                 │
  ┌──────────────▼──────────────┐
  │  5. Create App Service Plan │
  │     (Linux B1)              │
  └──────────────┬──────────────┘
                 │
         ┌───────┴───────┐
         │               │
  ┌──────▼──────┐ ┌──────▼──────┐
  │ 6. Create   │ │ 7. Create   │
  │ Backend App │ │ Frontend App│
  └──────┬──────┘ └──────┬──────┘
         │               │
  ┌──────▼──────┐        │
  │ 8. Set Env  │        │
  │ Variables   │        │
  └──────┬──────┘        │
         │               │
  ┌──────▼──────┐        │
  │ 9. Enable   │        │
  │ Public      │        │
  │ Access on   │        │
  │ PostgreSQL  │        │
  └──────┬──────┘        │
         │               │
  ┌──────▼──────┐        │
  │ 10. Add IP  │        │
  │ Firewall    │        │
  │ Rules       │        │
  └──────┬──────┘        │
         │               │
  ┌──────▼──────┐        │
  │ 11. Set     │        │
  │ CORS        │        │
  └──────┬──────┘        │
         │               │
  ┌──────▼──────┐ ┌──────▼──────┐
  │ 12. Build & │ │ 13. Build & │
  │ Deploy JAR  │ │ Deploy SPA  │
  └──────┬──────┘ └──────┬──────┘
         │               │
         └───────┬───────┘
                 │
  ┌──────────────▼──────────────┐
  │  14. Verify & Test          │
  └─────────────────────────────┘
```

### Azure CLI Commands (in order)

#### Step 1: Create Resource Group
```bash
az group create --name saas-todo-rg --location eastus
```

#### Step 2: Register PostgreSQL Provider
```bash
az provider register --namespace Microsoft.DBforPostgreSQL

# Check status (wait until "Registered")
az provider show -n Microsoft.DBforPostgreSQL --query "registrationState" -o tsv
```

#### Step 3: Create PostgreSQL Flexible Server
```bash
read -s DB_PASSWORD && az postgres flexible-server create \
  --resource-group saas-todo-rg \
  --name saas-todo-db-server \
  --location centralus \
  --admin-user todoadmin \
  --admin-password "$DB_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --public-access none \
  --yes
```

#### Step 4: Create Database
```bash
az postgres flexible-server db create \
  --resource-group saas-todo-rg \
  --server-name saas-todo-db-server \
  --database-name tododb
```

#### Step 5: Create App Service Plan
```bash
az appservice plan create \
  --name saas-todo-plan \
  --resource-group saas-todo-rg \
  --location centralus \
  --sku B1 \
  --is-linux
```

#### Step 6: Create Backend App Service
```bash
az webapp create \
  --name saas-todo-backend \
  --resource-group saas-todo-rg \
  --plan saas-todo-plan \
  --runtime "JAVA:21-java21"
```

#### Step 7: Create Frontend App Service
```bash
az webapp create \
  --name saas-todo-frontend \
  --resource-group saas-todo-rg \
  --plan saas-todo-plan \
  --runtime "NODE:22-lts"
```

#### Step 8: Set Backend Environment Variables
```bash
az webapp config appsettings set \
  --name saas-todo-backend \
  --resource-group saas-todo-rg \
  --settings \
    SPRING_PROFILES_ACTIVE=prod \
    AZURE_POSTGRESQL_HOST=saas-todo-db-server.postgres.database.azure.com \
    AZURE_POSTGRESQL_DATABASE=tododb \
    AZURE_POSTGRESQL_USERNAME=todoadmin \
    AZURE_POSTGRESQL_PASSWORD='<your-password>' \
    JWT_SECRET='<your-jwt-secret>' \
    FRONTEND_URL='https://saas-todo-frontend.azurewebsites.net'
```

#### Step 9: Enable Public Access on PostgreSQL
```bash
az postgres flexible-server update \
  --resource-group saas-todo-rg \
  --name saas-todo-db-server \
  --public-access Enabled
```

#### Step 10: Add IP Firewall Rules (backend outbound IPs only)
```bash
# Get backend outbound IPs
az webapp show --name saas-todo-backend --resource-group saas-todo-rg \
  --query "outboundIpAddresses" -o tsv

# Add a rule for each IP
az postgres flexible-server firewall-rule create \
  --resource-group saas-todo-rg \
  --name saas-todo-db-server \
  --rule-name BackendIP1 \
  --start-ip-address <IP> \
  --end-ip-address <IP>
# Repeat for each IP...
```

#### Step 11: Set CORS on Backend
```bash
az webapp cors add \
  --name saas-todo-backend \
  --resource-group saas-todo-rg \
  --allowed-origins "https://saas-todo-frontend.azurewebsites.net"
```

#### Step 12: Build & Deploy Backend
```bash
cd backend
JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn clean package -DskipTests
az webapp deploy \
  --name saas-todo-backend \
  --resource-group saas-todo-rg \
  --src-path target/todo-0.0.1-SNAPSHOT.jar \
  --type jar
```

#### Step 13: Build & Deploy Frontend
```bash
cd frontend
npm run build
cd dist && zip -r /tmp/frontend-dist.zip .
az webapp deploy \
  --name saas-todo-frontend \
  --resource-group saas-todo-rg \
  --src-path /tmp/frontend-dist.zip \
  --type zip

# Configure SPA routing
az webapp config set \
  --name saas-todo-frontend \
  --resource-group saas-todo-rg \
  --startup-file "pm2 serve /home/site/wwwroot --no-daemon --spa"
```

---

## Managing Services

### Start all services
```bash
az postgres flexible-server start --resource-group saas-todo-rg --name saas-todo-db-server
az webapp start --name saas-todo-backend --resource-group saas-todo-rg
az webapp start --name saas-todo-frontend --resource-group saas-todo-rg
```

### Stop all services (to avoid charges)
```bash
az webapp stop --name saas-todo-frontend --resource-group saas-todo-rg
az webapp stop --name saas-todo-backend --resource-group saas-todo-rg
az postgres flexible-server stop --resource-group saas-todo-rg --name saas-todo-db-server
```

### Check status
```bash
az webapp show --name saas-todo-frontend --resource-group saas-todo-rg --query "state" -o tsv
az webapp show --name saas-todo-backend --resource-group saas-todo-rg --query "state" -o tsv
```

### Delete everything (cleanup)
```bash
az group delete --name saas-todo-rg --yes --no-wait
```

---

## Azure Resources Summary

| Resource                | Name                  | Location   | SKU/Tier       |
|-------------------------|-----------------------|------------|----------------|
| Resource Group          | saas-todo-rg          | eastus     | -              |
| PostgreSQL Server       | saas-todo-db-server   | centralus  | Burstable B1ms |
| Database                | tododb                | centralus  | -              |
| App Service Plan        | saas-todo-plan        | centralus  | Basic B1       |
| Backend App Service     | saas-todo-backend     | centralus  | Linux/Java 21  |
| Frontend App Service    | saas-todo-frontend    | centralus  | Linux/Node 22  |

---

## Security Notes

- PostgreSQL has **no public access** — only backend App Service outbound IPs are whitelisted via firewall rules
- All traffic uses **SSL/TLS** (Azure enforces `sslmode=require` on PostgreSQL)
- Passwords are **bcrypt-hashed** before storage
- JWT tokens expire after **24 hours**
- CORS is restricted to the frontend domain only
- Backend validates **todo ownership** — users can only access their own todos
