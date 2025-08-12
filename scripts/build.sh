#!/bin/bash

# Anniversary Voting System - Build Script
# Usage: ./build.sh [service] [--no-cache] [--push]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SERVICE=""
NO_CACHE=false
PUSH_IMAGES=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --push)
            PUSH_IMAGES=true
            shift
            ;;
        backend|mobile|bigscreen|all)
            SERVICE=$1
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [backend|mobile|bigscreen|all] [--no-cache] [--push]"
            exit 1
            ;;
    esac
done

# Set default service
if [ -z "$SERVICE" ]; then
    SERVICE="all"
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

# Function to build backend image
build_backend() {
    print_status "Building backend image..."
    
    local build_args=""
    if [ "$NO_CACHE" = true ]; then
        build_args="--no-cache"
    fi
    
    cd backend
    docker build $build_args -t galass-backend:latest -f Dockerfile .
    cd ..
    
    if [ "$PUSH_IMAGES" = true ]; then
        print_status "Pushing backend image..."
        docker tag galass-backend:latest your-registry/galass-backend:latest
        docker push your-registry/galass-backend:latest
    fi
    
    print_success "Backend image built successfully"
}

# Function to build mobile frontend image
build_mobile() {
    print_status "Building mobile frontend image..."
    
    local build_args=""
    if [ "$NO_CACHE" = true ]; then
        build_args="--no-cache"
    fi
    
    cd frontend/mobile
    docker build $build_args -t galass-mobile:latest -f Dockerfile .
    cd ../..
    
    if [ "$PUSH_IMAGES" = true ]; then
        print_status "Pushing mobile image..."
        docker tag galass-mobile:latest your-registry/galass-mobile:latest
        docker push your-registry/galass-mobile:latest
    fi
    
    print_success "Mobile frontend image built successfully"
}

# Function to build bigscreen frontend image
build_bigscreen() {
    print_status "Building bigscreen frontend image..."
    
    local build_args=""
    if [ "$NO_CACHE" = true ]; then
        build_args="--no-cache"
    fi
    
    cd frontend/bigscreen
    docker build $build_args -t galass-bigscreen:latest -f Dockerfile .
    cd ../..
    
    if [ "$PUSH_IMAGES" = true ]; then
        print_status "Pushing bigscreen image..."
        docker tag galass-bigscreen:latest your-registry/galass-bigscreen:latest
        docker push your-registry/galass-bigscreen:latest
    fi
    
    print_success "Bigscreen frontend image built successfully"
}

# Function to show build summary
show_build_summary() {
    print_success "Build completed successfully! 🚀"
    echo ""
    print_status "Built images:"
    
    case $SERVICE in
        backend)
            echo "   📦 galass-backend:latest"
            ;;
        mobile)
            echo "   📱 galass-mobile:latest"
            ;;
        bigscreen)
            echo "   🖥️  galass-bigscreen:latest"
            ;;
        all)
            echo "   📦 galass-backend:latest"
            echo "   📱 galass-mobile:latest"
            echo "   🖥️  galass-bigscreen:latest"
            ;;
    esac
    
    echo ""
    if [ "$PUSH_IMAGES" = true ]; then
        print_status "Images have been pushed to registry"
    else
        print_status "To push images: ./scripts/build.sh $SERVICE --push"
    fi
    
    echo ""
    print_status "To start services: ./scripts/start.sh"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Dockerfiles exist
    case $SERVICE in
        backend|all)
            if [ ! -f "backend/Dockerfile" ]; then
                print_error "Backend Dockerfile not found"
                exit 1
            fi
            ;;
    esac
    
    case $SERVICE in
        mobile|all)
            if [ ! -f "frontend/mobile/Dockerfile" ]; then
                print_error "Mobile frontend Dockerfile not found"
                exit 1
            fi
            ;;
    esac
    
    case $SERVICE in
        bigscreen|all)
            if [ ! -f "frontend/bigscreen/Dockerfile" ]; then
                print_error "Bigscreen frontend Dockerfile not found"
                exit 1
            fi
            ;;
    esac
    
    print_success "Prerequisites check passed"
}

# Function to clean up build cache
cleanup_build_cache() {
    print_status "Cleaning up Docker build cache..."
    docker system prune -f --filter "label=stage=builder" 2>/dev/null || true
    print_success "Build cache cleaned"
}

# Main execution
main() {
    echo "🔨 Anniversary Voting System - Build Script"
    echo "==========================================="
    echo ""
    
    # Change to script directory
    cd "$(dirname "$0")/.."
    
    # Checks
    check_docker
    check_prerequisites
    
    print_status "Building service(s): $SERVICE"
    if [ "$NO_CACHE" = true ]; then
        print_warning "Building without cache"
    fi
    
    # Build services
    case $SERVICE in
        backend)
            build_backend
            ;;
        mobile)
            build_mobile
            ;;
        bigscreen)
            build_bigscreen
            ;;
        all)
            build_backend
            build_mobile
            build_bigscreen
            ;;
        *)
            print_error "Unknown service: $SERVICE"
            exit 1
            ;;
    esac
    
    # Cleanup
    cleanup_build_cache
    
    # Show summary
    show_build_summary
}

# Run main function
main "$@"