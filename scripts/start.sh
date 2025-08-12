#!/bin/bash

# Anniversary Voting System - Start Script
# Usage: ./start.sh [dev|prod] [--build]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENV=${1:-dev}
BUILD_FLAG=""

# Check for build flag
if [[ "$*" == *"--build"* ]]; then
    BUILD_FLAG="--build"
fi

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
}

# Function to get docker-compose command
get_docker_compose_cmd() {
    if command -v docker-compose >/dev/null 2>&1; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create data directories for persistence
    mkdir -p data/postgres
    mkdir -p data/redis
    mkdir -p logs/backend
    mkdir -p logs/nginx
    
    # Create nginx config directory
    mkdir -p nginx/conf.d
    
    print_success "Directories created successfully"
}

# Function to generate environment files if they don't exist
generate_env_files() {
    print_status "Checking environment files..."
    
    # Backend .env file
    if [ ! -f "backend/.env" ]; then
        print_warning "Backend .env file not found. Creating from template..."
        cp backend/.env.example backend/.env 2>/dev/null || {
            print_error "Backend .env.example not found. Please create backend/.env manually."
            exit 1
        }
    fi
    
    # Root .env file for Docker Compose
    if [ ! -f ".env" ]; then
        print_warning "Root .env file not found. Creating..."
        cat > .env << EOF
# Environment
NODE_ENV=${ENV}

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
EOF
        print_success "Root .env file created"
    fi
}

# Function to start services
start_services() {
    local compose_file="docker-compose.yml"
    local compose_cmd=$(get_docker_compose_cmd)
    
    # Use production compose file if specified
    if [ "$ENV" = "prod" ]; then
        compose_file="docker-compose.prod.yml"
        if [ ! -f "$compose_file" ]; then
            print_warning "Production compose file not found, using default"
            compose_file="docker-compose.yml"
        fi
    fi
    
    print_status "Starting Anniversary Voting System ($ENV environment)..."
    print_status "Using compose file: $compose_file"
    
    # Start services
    if [ -n "$BUILD_FLAG" ]; then
        print_status "Building and starting services..."
        $compose_cmd -f $compose_file up -d $BUILD_FLAG
    else
        print_status "Starting services..."
        $compose_cmd -f $compose_file up -d
    fi
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 5
    
    # Check service status
    print_status "Checking service status..."
    $compose_cmd -f $compose_file ps
}

# Function to show service URLs
show_urls() {
    local nginx_port=$(grep NGINX_PORT .env | cut -d'=' -f2 || echo "80")
    local mobile_port=$(grep MOBILE_PORT .env | cut -d'=' -f2 || echo "8080")
    local bigscreen_port=$(grep BIGSCREEN_PORT .env | cut -d'=' -f2 || echo "8081")
    local admin_port=$(grep ADMIN_PORT .env | cut -d'=' -f2 || echo "8082")
    local backend_port=$(grep BACKEND_PORT .env | cut -d'=' -f2 || echo "3000")
    
    print_success "Anniversary Voting System is starting up!"
    echo ""
    echo "🌐 Service URLs:"
    echo "   📱 Mobile App:     http://localhost:${mobile_port}"
    echo "   🖥️  Big Screen:     http://localhost:${bigscreen_port}" 
    echo "   ⚙️  Admin Panel:    http://localhost:${admin_port}"
    echo "   🔧 Backend API:    http://localhost:${backend_port}"
    echo "   🌍 Nginx Proxy:    http://localhost:${nginx_port}"
    echo ""
    echo "🔑 Admin Credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "📊 Monitoring:"
    echo "   📋 Logs:           ./scripts/logs.sh [service]"
    echo "   ⚡ Status:         ./scripts/status.sh"
    echo "   🛑 Stop:           ./scripts/stop.sh"
    echo ""
    echo "🔗 QR Code for mobile access will be available at:"
    echo "   http://localhost:${mobile_port}?event=ANNIV2025"
}

# Function to initialize database
init_database() {
    local compose_cmd=$(get_docker_compose_cmd)
    
    print_status "Checking if database needs initialization..."
    
    # Wait for postgres to be ready
    sleep 10
    
    # Check if tables exist
    if ! $compose_cmd exec postgres psql -U postgres -d anniversary_voting -c "\\dt" >/dev/null 2>&1; then
        print_status "Initializing database..."
        
        # Run database initialization
        $compose_cmd exec postgres psql -U postgres -d anniversary_voting -f /docker-entrypoint-initdb.d/schema.sql
        $compose_cmd exec postgres psql -U postgres -d anniversary_voting -f /docker-entrypoint-initdb.d/seed_data.sql
        
        print_success "Database initialized successfully"
    else
        print_status "Database already initialized"
    fi
}

# Main execution
main() {
    echo "🎉 Anniversary Voting System - Startup Script"
    echo "=============================================="
    echo ""
    
    # Change to script directory
    cd "$(dirname "$0")/.."
    
    # Checks
    check_docker
    check_docker_compose
    
    # Setup
    create_directories
    generate_env_files
    
    # Start services
    start_services
    
    # Initialize database if needed
    if [ "$ENV" != "dev" ] || [ ! -f "data/postgres/initialized" ]; then
        init_database
        touch data/postgres/initialized
    fi
    
    # Show URLs
    show_urls
    
    print_success "All services started successfully! 🚀"
    echo ""
    print_status "To stop the system, run: ./scripts/stop.sh"
    print_status "To view logs, run: ./scripts/logs.sh"
}

# Run main function
main "$@"