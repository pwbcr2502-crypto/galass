# Anniversary Voting System - Docker Deployment Guide

This document provides comprehensive instructions for deploying the Anniversary Voting System using Docker and Docker Compose.

## 🏗️ Architecture

The system consists of 6 containerized services:

- **PostgreSQL** (Database) - Port 5432
- **Redis** (Cache) - Port 6379  
- **Backend API** (Node.js/Express) - Port 3000
- **Mobile Frontend** (Vue.js) - Port 8080
- **Big Screen Frontend** (Vue.js) - Port 8081
- **Nginx** (Reverse Proxy) - Port 80/443

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available
- 10GB free disk space

### 1. Start the System

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start all services
./scripts/start.sh

# Or start in production mode
./scripts/start.sh prod
```

### 2. Access the Applications

- **Mobile App**: http://localhost:8080
- **Big Screen**: http://localhost:8081  
- **Backend API**: http://localhost:3000
- **Main Portal**: http://localhost (Nginx)

## 📋 Available Scripts

### Core Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `start.sh` | Start all services | `./scripts/start.sh [dev\|prod] [--build]` |
| `stop.sh` | Stop all services | `./scripts/stop.sh [--remove-volumes] [--remove-images]` |
| `build.sh` | Build Docker images | `./scripts/build.sh [service] [--no-cache] [--push]` |
| `logs.sh` | View service logs | `./scripts/logs.sh [service] [--follow] [--tail=N]` |
| `clean.sh` | System cleanup | `./scripts/clean.sh [--all] [--volumes] [--images]` |

### Example Usage

```bash
# Start with fresh build
./scripts/start.sh dev --build

# View backend logs
./scripts/logs.sh backend --follow

# Build only backend service
./scripts/build.sh backend --no-cache

# Full system cleanup
./scripts/clean.sh --all

# Stop and remove volumes
./scripts/stop.sh --remove-volumes
```

## 🔧 Configuration

### Environment Variables

Create/modify `.env` file in the root directory:

```bash
# Environment
NODE_ENV=development

# Database Configuration
POSTGRES_DB=anniversary_voting
POSTGRES_USER=postgres
POSTGRES_PASSWORD=anniversary_db_2025
DB_HOST=postgres
DB_PORT=5432

# Redis Configuration  
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Backend Configuration
BACKEND_PORT=3000
JWT_SECRET=anniversary-voting-system-secret-key-2025
ADMIN_TOKEN=admin-anniversary-2025-secret

# Frontend Configuration
MOBILE_PORT=8080
BIGSCREEN_PORT=8081

# Nginx Configuration
NGINX_PORT=80
NGINX_SSL_PORT=443
```

### Service-Specific Configuration

#### Backend (.env in backend/ directory)
```bash
NODE_ENV=development
PORT=3000
JWT_SECRET=anniversary-voting-system-secret-key-2025
ADMIN_TOKEN=admin-anniversary-2025-secret
CORS_ORIGIN=*
```

## 📁 Directory Structure

```
galass/
├── docker-compose.yml          # Development compose file
├── docker-compose.prod.yml     # Production compose file
├── .dockerignore              # Docker ignore rules
├── .env                       # Environment variables
├── DOCKER.md                  # This documentation
├── backend/
│   ├── Dockerfile            # Backend container config
│   ├── .env                  # Backend environment
│   └── src/                  # Application source
├── frontend/
│   ├── mobile/
│   │   ├── Dockerfile        # Mobile frontend container
│   │   ├── nginx.conf        # Nginx config
│   │   └── docker-entrypoint.sh
│   └── bigscreen/
│       ├── Dockerfile        # Bigscreen frontend container
│       ├── nginx.conf        # Nginx config
│       └── docker-entrypoint.sh
├── nginx/
│   ├── nginx.conf           # Main Nginx configuration
│   └── conf.d/              # Additional configurations
├── scripts/                 # Deployment scripts
├── data/                   # Persistent data
│   ├── postgres/           # Database data
│   └── redis/             # Cache data
├── logs/                  # Application logs
└── backups/              # Database backups
```

## 🔍 Monitoring & Debugging

### Health Checks

All services include health checks:

```bash
# Check service health
docker ps --filter "name=galass" --format "table {{.Names}}\\t{{.Status}}"

# View health check logs
docker logs galass-backend --tail 20
```

### Service Status

```bash
# View all services
docker-compose ps

# Check resource usage
docker stats

# View system resource usage
docker system df
```

### Log Management

```bash
# Follow all logs
./scripts/logs.sh all --follow

# View specific service logs
./scripts/logs.sh backend --tail=50

# Export logs to files
./scripts/logs.sh export
```

### Performance Monitoring

```bash
# Check container resource usage
docker stats --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}"

# Monitor database performance
docker exec galass-postgres pg_stat_activity

# Monitor Redis performance  
docker exec galass-redis redis-cli info stats
```

## 🔒 Production Deployment

### 1. Production Environment Setup

```bash
# Copy production environment template
cp .env.example .env.prod

# Edit production settings
nano .env.prod
```

### 2. SSL Configuration

For HTTPS support, place SSL certificates in `ssl/` directory:

```
ssl/
├── certificate.crt
├── private.key
└── ca_bundle.crt
```

### 3. Production Startup

```bash
# Start in production mode
./scripts/start.sh prod

# Build and start with fresh images
./scripts/start.sh prod --build
```

### 4. Production Security

- Change all default passwords
- Use strong JWT secrets
- Configure firewall rules
- Set up SSL certificates
- Enable log rotation
- Configure backup strategy

## 🗄️ Database Management

### Backup

```bash
# Manual backup
docker exec galass-postgres pg_dump -U postgres anniversary_voting > backup.sql

# Automated backup (add to crontab)
0 2 * * * /path/to/galass/scripts/backup.sh
```

### Restore

```bash
# Restore from backup
docker exec -i galass-postgres psql -U postgres anniversary_voting < backup.sql
```

### Database Migrations

```bash
# Access database
docker exec -it galass-postgres psql -U postgres -d anniversary_voting

# Run custom SQL
docker exec -i galass-postgres psql -U postgres anniversary_voting < migration.sql
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :8080
   
   # Change ports in .env file
   MOBILE_PORT=8082
   ```

2. **Database Connection Issues**
   ```bash
   # Check database health
   docker logs galass-postgres
   
   # Test connection
   docker exec galass-backend npm run db:test
   ```

3. **Frontend Build Issues**
   ```bash
   # Rebuild frontend with no cache
   ./scripts/build.sh mobile --no-cache
   ```

4. **Memory Issues**
   ```bash
   # Check memory usage
   docker stats --no-stream
   
   # Increase Docker memory limits
   # Docker Desktop: Settings > Resources > Memory
   ```

### Recovery Procedures

1. **Complete System Reset**
   ```bash
   ./scripts/stop.sh --remove-volumes --remove-images
   ./scripts/clean.sh --all
   ./scripts/start.sh --build
   ```

2. **Database Recovery**
   ```bash
   # Stop services
   ./scripts/stop.sh
   
   # Restore database
   docker run --rm -v $(pwd)/backups:/backup postgres:15-alpine \
     pg_restore -d anniversary_voting /backup/latest.dump
   
   # Restart services
   ./scripts/start.sh
   ```

## 📊 Performance Optimization

### Resource Limits

Production deployment includes resource limits:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### Scaling

```bash
# Scale specific services
docker-compose up -d --scale backend=2

# Load balancing configuration needed for multiple backend instances
```

### Caching

- Redis caching is configured for session storage
- Nginx provides static file caching
- Database query optimization included

## 🔐 Security Considerations

### Container Security

- All containers run as non-root users
- Minimal base images used (Alpine Linux)
- Security headers configured in Nginx
- Database access restricted to application network

### Network Security

- Internal Docker network isolation
- Rate limiting configured
- CORS properly configured
- Input validation on all endpoints

### Data Security

- Database credentials in environment variables
- JWT tokens with strong secrets
- Session management with Redis
- Audit logging enabled

## 📞 Support

For issues and questions:

1. Check the logs: `./scripts/logs.sh all`
2. Review this documentation
3. Check container health: `docker ps`
4. Verify configuration files
5. Test network connectivity between services

## 🔄 Updates and Maintenance

### Updating the System

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
./scripts/stop.sh
./scripts/build.sh all --no-cache
./scripts/start.sh
```

### Regular Maintenance

- Weekly log cleanup: `./scripts/clean.sh`
- Monthly database backups
- Security updates for base images
- Monitor resource usage trends