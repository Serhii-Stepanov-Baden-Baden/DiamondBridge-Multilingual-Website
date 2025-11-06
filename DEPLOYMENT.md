# 🚀 Руководство по Развертыванию DiamondBridge

Это руководство содержит подробные инструкции по развертыванию DiamondBridge в различных средах: разработка, тестирование и production.

## 📋 Содержание

- [Требования к Системе](#требования-к-системе)
- [Локальное Развертывание](#локальное-развертывание)
- [Docker Развертывание](#docker-развертывание)
- [Production Deployment](#production-deployment)
- [Cloud Platforms](#cloud-platforms)
- [Мониторинг и Обслуживание](#мониторинг-и-обслуживание)
- [Troubleshooting](#troubleshooting)

## 🔧 Требования к Системе

### Минимальные Требования

#### Development/Testing
- **CPU**: 2+ ядер
- **RAM**: 4GB
- **Диск**: 20GB свободного места
- **OS**: Linux, macOS, Windows 10+

#### Production
- **CPU**: 4+ ядер (рекомендуется 8+)
- **RAM**: 8GB+ (рекомендуется 16GB+)
- **Диск**: 100GB+ SSD
- **Сеть**: 1Gbps+

### Программное Обеспечение

- **Node.js**: 16.0+ (рекомендуется 18.0+)
- **npm**: 8.0+ или **pnpm**: 8.0+
- **MongoDB**: 5.0+
- **Redis**: 6.0+
- **FFmpeg**: 4.0+ (для медиа обработки)
- **Git**: 2.30+

### Внешние Сервисы

- **OpenAI API**: для AI функциональности
- **Anthropic API**: как альтернатива OpenAI
- **Google AI API**: для дополнительных AI сервисов
- **Google Drive API**: для интеграции с Drive
- **SMTP сервис**: для email уведомлений (Gmail, SendGrid, etc.)
- **Twilio**: для SMS уведомлений

## 💻 Локальное Развертывание

### Быстрый Старт

1. **Клонирование репозитория**
```bash
git clone https://github.com/your-org/diamondbridge.git
cd diamondbridge
```

2. **Установка Backend зависимостей**
```bash
cd backend
npm install
```

3. **Установка Frontend зависимостей**
```bash
cd ../diamondbridge-multilingual
pnpm install
```

4. **Настройка переменных окружения**
```bash
# Backend
cd ../backend
cp .env.example .env
nano .env

# Frontend
cd ../diamondbridge-multilingual
cp .env.example .env.local
nano .env.local
```

5. **Запуск сервисов**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd diamondbridge-multilingual
pnpm dev
```

6. **Проверка работы**
```
Frontend: http://localhost:5173
Backend API: http://localhost:3000
API Docs: http://localhost:3000/api-docs
```

### Подробная Настройка

#### Backend Конфигурация

```bash
# backend/.env
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/diamondbridge-dev
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key

# Google Drive
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./config/service-account-dev.json
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-dev-folder-id

# Security
JWT_SECRET=your-super-secret-jwt-key-for-development
ENCRYPTION_KEY=your-32-character-encryption-key

# Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-dev-email@gmail.com
SMTP_PASS=your-app-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/development.log
```

#### Frontend Конфигурация

```bash
# diamondbridge-multilingual/.env.local
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=DiamondBridge Dev
VITE_APP_VERSION=1.0.0-dev
VITE_ENABLE_ANALYTICS=false
VITE_SENTRY_DSN=
```

#### База Данных

```bash
# Запуск MongoDB (Linux/macOS)
sudo systemctl start mongod

# Запуск MongoDB (Windows)
net start MongoDB

# Запуск Redis (Linux/macOS)
redis-server

# Запуск Redis (Windows)
redis-server.exe
```

## 🐳 Docker Развертывание

### Development с Docker Compose

1. **Создание docker-compose.dev.yml**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: diamondbridge-mongo-dev
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  redis:
    image: redis:6.2-alpine
    container_name: diamondbridge-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: diamondbridge-backend-dev
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/diamondbridge?authSource=admin
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    command: npm run dev

  frontend:
    build:
      context: ./diamondbridge-multilingual
      dockerfile: Dockerfile.dev
    container_name: diamondbridge-frontend-dev
    ports:
      - "5173:5173"
    volumes:
      - ./diamondbridge-multilingual:/app
      - /app/node_modules
    environment:
      - VITE_API_BASE_URL=http://localhost:3000/api
    depends_on:
      - backend
    command: pnpm dev --host

volumes:
  mongo_data:
  redis_data:
```

2. **Запуск Development среды**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production с Docker

1. **Backend Dockerfile**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runtime

RUN addgroup -g 1001 -S nodejs
RUN adduser -S diamondbridge -u 1001

WORKDIR /app
COPY --from=builder --chown=diamondbridge:nodejs /app/node_modules ./node_modules
COPY --chown=diamondbridge:nodejs . .

USER diamondbridge

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
```

2. **Frontend Dockerfile**
```dockerfile
# diamondbridge-multilingual/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

3. **nginx.conf**
```nginx
# diamondbridge-multilingual/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        
        root /usr/share/nginx/html;
        index index.html;

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api/ {
            proxy_pass http://backend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket proxy
        location /socket.io/ {
            proxy_pass http://backend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

4. **Production docker-compose**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: diamondbridge-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: diamondbridge
    volumes:
      - mongo_data:/data/db
      - ./mongo-init:/docker-entrypoint-initdb.d
    networks:
      - diamondbridge-network

  redis:
    image: redis:6.2-alpine
    container_name: diamondbridge-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - diamondbridge-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: diamondbridge-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongodb:27017/diamondbridge?authSource=admin
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config
    depends_on:
      - mongodb
      - redis
    networks:
      - diamondbridge-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./diamondbridge-multilingual
      dockerfile: Dockerfile
    container_name: diamondbridge-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    networks:
      - diamondbridge-network

  nginx-lb:
    image: nginx:alpine
    container_name: diamondbridge-nginx-lb
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - diamondbridge-network

volumes:
  mongo_data:
  redis_data:

networks:
  diamondbridge-network:
    driver: bridge
```

5. **Запуск Production**
```bash
# Создание .env файла для production
cp .env.example .env
nano .env

# Запуск всех сервисов
docker-compose -f docker-compose.prod.yml up -d

# Проверка статуса
docker-compose -f docker-compose.prod.yml ps
```

## 🌐 Production Deployment

### Настройка Сервера

#### Ubuntu/Debian Server

1. **Обновление системы**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nginx
```

2. **Установка Node.js**
```bash
# Установка NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установка pnpm
npm install -g pnpm
```

3. **Установка MongoDB**
```bash
# Добавление MongoDB repository
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

sudo apt update
sudo apt install -y mongodb-org

# Запуск и включение автозапуска
sudo systemctl start mongod
sudo systemctl enable mongod
```

4. **Установка Redis**
```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

5. **Установка PM2**
```bash
npm install -g pm2
```

### Развертывание с PM2

1. **Клонирование и настройка**
```bash
git clone https://github.com/your-org/diamondbridge.git
cd diamondbridge

# Backend
cd backend
npm install --production

# Frontend
cd ../diamondbridge-multilingual
pnpm install
pnpm build
```

2. **PM2 конфигурация**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'diamondbridge-backend',
      script: './backend/app.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};
```

3. **Запуск приложения**
```bash
# Запуск
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска
pm2 startup
```

### Настройка Nginx

```nginx
# /etc/nginx/sites-available/diamondbridge
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'" always;

    # Frontend
    location / {
        root /path/to/diamondbridge/diamondbridge-multilingual/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security
    location ~ /\. {
        deny all;
    }
    
    location ~ ^/(config|logs|tmp)/ {
        deny all;
    }
}
```

4. **Включение сайта**
```bash
sudo ln -s /etc/nginx/sites-available/diamondbridge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ☁️ Cloud Platforms

### AWS Deployment

#### EC2 + RDS + ElastiCache

1. **Создание инфраструктуры**
```bash
# Используйте Terraform или CloudFormation
# Создайте VPC, Subnets, Security Groups
# Настройте RDS для MongoDB (или используйте DocumentDB)
# Настройте ElastiCache для Redis
```

2. **Deployment скрипт**
```bash
#!/bin/bash
# deploy-aws.sh

# Установка зависимостей
sudo yum update -y
sudo yum install -y nodejs npm git

# Клонирование репозитория
git clone https://github.com/your-org/diamondbridge.git
cd diamondbridge

# Backend
cd backend
npm install --production

# Frontend
cd ../diamondbridge-multilingual
npm install -g pnpm
pnpm install
pnpm build

# Настройка переменных окружения
sudo tee /etc/sysconfig/diamondbridge << EOF
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-rds-endpoint:27017/diamondbridge
REDIS_URL=redis://your-elasticache-endpoint:6379
JWT_SECRET=your-jwt-secret
EOF

# Запуск с PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### Google Cloud Platform

#### Cloud Run + MongoDB Atlas

1. **Создание Cloud Run сервиса**
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/diamondbridge-backend', './backend']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/diamondbridge-frontend', './diamondbridge-multilingual']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/diamondbridge-backend']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/diamondbridge-frontend']
  
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'diamondbridge-backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/diamondbridge-backend'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
```

2. **Deploy скрипт**
```bash
#!/bin/bash
# deploy-gcp.sh

# Настройка gcloud
gcloud auth configure-docker

# Сборка и отправка образов
docker build -t gcr.io/$GOOGLE_CLOUD_PROJECT/diamondbridge-backend ./backend
docker build -t gcr.io/$GOOGLE_CLOUD_PROJECT/diamondbridge-frontend ./diamondbridge-multilingual

docker push gcr.io/$GOOGLE_CLOUD_PROJECT/diamondbridge-backend
docker push gcr.io/$GOOGLE_CLOUD_PROJECT/diamondbridge-frontend

# Развертывание Backend
gcloud run deploy diamondbridge-backend \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/diamondbridge-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production

# Развертывание Frontend (статический хостинг)
gsutil mb gs://diamondbridge-frontend-bucket
gsutil -m rsync -r -d ./diamondbridge-multilingual/dist gs://diamondbridge-frontend-bucket
gsutil web set -m index.html -e index.html gs://diamondbridge-frontend-bucket
```

### Heroku Deployment

1. **Procfile**
```
# backend/Procfile
web: node app.js
```

2. **Создание приложений**
```bash
# Backend
heroku create diamondbridge-api
heroku addons:create mongolab:sandbox
heroku addons:create heroku-redis:hobby-dev

# Frontend (статический сайт)
heroku create diamondbridge-web
heroku buildpacks:set heroku/nodejs

# Настройка переменных окружения
heroku config:set NODE_ENV=production --app diamondbridge-api
heroku config:set JWT_SECRET=your-jwt-secret --app diamondbridge-api
```

3. **Deployment**
```bash
# Backend
cd backend
git push heroku main

# Frontend
cd ../diamondbridge-multilingual
heroku git:remote -a diamondbridge-web
git push heroku main
```

### DigitalOcean App Platform

1. **Создание .do/app.yaml**
```yaml
name: diamondbridge
services:
- name: backend
  source_dir: /backend
  github:
    repo: your-org/diamondbridge
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: MONGODB_URI
    value: ${db.DATABASE_URL}
  - key: REDIS_URL
    value: ${redis.REDIS_URL}

- name: frontend
  source_dir: /diamondbridge-multilingual
  github:
    repo: your-org/diamondbridge
    branch: main
  build_command: pnpm build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: VITE_API_BASE_URL
    value: ${backend.PUBLIC_URL}/api

databases:
- name: db
  engine: MONGODB
  version: "5"
- name: redis
  engine: REDIS
  version: "6"
```

2. **Deployment**
```bash
# Через DigitalOcean CLI
doctl apps create --spec .do/app.yaml

# Или через web interface
# Перейдите на https://cloud.digitalocean.com/apps
```

## 📊 Мониторинг и Обслуживание

### Health Checks

#### Backend Health Check
```javascript
// backend/routes/health.js
const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');

const router = express.Router();

router.get('/', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {}
  };

  try {
    // Database check
    health.checks.database = mongoose.connection.readyState === 1 ? 'OK' : 'ERROR';
    
    // Redis check
    const redisClient = redis.createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    health.checks.redis = 'OK';
    await redisClient.disconnect();
    
    // AI Services check
    const openaiStatus = await checkOpenAI();
    health.checks.openai = openaiStatus ? 'OK' : 'ERROR';
    
    res.status(200).json(health);
  } catch (error) {
    health.message = 'ERROR';
    health.checks.error = error.message;
    res.status(503).json(health);
  }
});

async function checkOpenAI() {
  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    await openai.models.list();
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = router;
```

### Логирование

#### Winston Configuration
```javascript
// backend/utils/logger.js
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'diamondbridge-backend' },
  transports: [
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log') 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### Мониторинг с PM2

```bash
# Просмотр логов
pm2 logs diamondbridge-backend

# Мониторинг в реальном времени
pm2 monit

# Перезапуск
pm2 restart diamondbridge-backend

# Обновление без простоя
pm2 reload diamondbridge-backend
```

### Мониторинг с Grafana + Prometheus

1. **Docker Compose для мониторинга**
```yaml
# monitoring/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
    networks:
      - monitoring

volumes:
  grafana-storage:

networks:
  monitoring:
    driver: bridge
```

2. **Prometheus конфигурация**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'diamondbridge-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/api/metrics'
```

### Резервное Копирование

#### MongoDB Backup
```bash
#!/bin/bash
# backup-mongodb.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
DATABASE="diamondbridge"

mkdir -p $BACKUP_DIR

# Создание бэкапа
mongodump --db $DATABASE --out $BACKUP_DIR/mongodb_backup_$DATE

# Сжатие
tar -czf $BACKUP_DIR/mongodb_backup_$DATE.tar.gz -C $BACKUP_DIR mongodb_backup_$DATE

# Удаление несжатой папки
rm -rf $BACKUP_DIR/mongodb_backup_$DATE

# Удаление бэкапов старше 7 дней
find $BACKUP_DIR -name "mongodb_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: mongodb_backup_$DATE.tar.gz"
```

#### Автоматические бэкапы через Cron
```bash
# Добавление в crontab
crontab -e

# Бэкап каждый день в 2:00
0 2 * * * /path/to/backup-mongodb.sh >> /var/log/backup.log 2>&1

# Бэкап каждую неделю в воскресенье в 3:00
0 3 * * 0 /path/to/backup-files.sh >> /var/log/backup.log 2>&1
```

## 🔧 Troubleshooting

### Общие Проблемы

#### Backend не запускается
```bash
# Проверка логов
pm2 logs diamondbridge-backend

# Проверка переменных окружения
pm2 env diamondbridge-backend

# Перезапуск
pm2 restart diamondbridge-backend
```

#### Frontend не загружается
```bash
# Проверка сборки
cd diamondbridge-multilingual
pnpm build

# Проверка статических файлов
ls -la dist/

# Проверка Nginx конфигурации
sudo nginx -t
sudo systemctl status nginx
```

#### Проблемы с базой данных
```bash
# Проверка MongoDB
sudo systemctl status mongod
mongo --eval "db.adminCommand('ismaster')"

# Проверка Redis
redis-cli ping
```

#### Проблемы с AI API
```bash
# Проверка API ключей
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Проверка лимитов
curl -H "Authorization: Bearer $ANTHROPIC_API_KEY" \
     https://api.anthropic.com/v1/messages
```

### Производительность

#### Мониторинг ресурсов
```bash
# Использование CPU и памяти
htop

# Дисковое пространство
df -h

# Сетевые соединения
netstat -tulpn

# Логи в реальном времени
tail -f logs/combined.log
```

#### Оптимизация
```bash
# Очистка логов
sudo find /var/log -name "*.log" -mtime +30 -delete

# Очистка временных файлов
sudo find /tmp -mtime +7 -delete

# Очистка npm кэша
npm cache clean --force
```

### Безопасность

#### Обновление зависимостей
```bash
# Проверка уязвимостей
npm audit
npm audit fix

# Обновление пакетов
npm update
pnpm update
```

#### SSL сертификаты
```bash
# Проверка SSL
openssl x509 -in /path/to/certificate.crt -text -noout

# Обновление Let's Encrypt
sudo certbot renew
sudo certbot renew --dry-run
```

### Восстановление после сбоев

1. **Восстановление из бэкапа**
```bash
# Восстановление MongoDB
tar -xzf mongodb_backup_20231106_020000.tar.gz
mongorestore --db diamondbridge mongodb_backup_20231106_020000/diamondbridge
```

2. **Перезапуск всех сервисов**
```bash
# Остановка
docker-compose -f docker-compose.prod.yml down

# Очистка образов
docker system prune -f

# Перезапуск
docker-compose -f docker-compose.prod.yml up -d
```

3. **Проверка здоровья системы**
```bash
# Health checks
curl -f http://localhost:3000/api/health
curl -f http://localhost:3001/api/status

# Проверка всех сервисов
docker-compose -f docker-compose.prod.yml ps
pm2 status
```

---

## 📞 Поддержка

Если у вас возникли проблемы с развертыванием:

- **Issues**: [GitHub Issues](https://github.com/your-org/diamondbridge/issues)
- **Email**: devops@diamondbridge.com
- **Documentation**: [https://docs.diamondbridge.com/deployment](https://docs.diamondbridge.com/deployment)

---

**Успешного развертывания DiamondBridge!** 🚀