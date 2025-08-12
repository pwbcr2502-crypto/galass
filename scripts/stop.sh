#!/bin/bash

# Anniversary Voting System - Stop Script
# Usage: ./stop.sh [--remove-volumes] [--remove-images]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
REMOVE_VOLUMES=false
REMOVE_IMAGES=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --remove-volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        --remove-images)
            REMOVE_IMAGES=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--remove-volumes] [--remove-images]"
            exit 1
            ;;
    esac
done

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

# Function to get docker-compose command
get_docker_compose_cmd() {
    if command -v docker-compose >/dev/null 2>&1; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# Function to stop services
stop_services() {
    local compose_cmd=$(get_docker_compose_cmd)
    
    print_status "Stopping Anniversary Voting System services..."
    
    # Try to stop with both possible compose files
    for compose_file in "docker-compose.yml" "docker-compose.prod.yml"; do
        if [ -f "$compose_file" ]; then
            print_status "Stopping services using $compose_file..."
            $compose_cmd -f $compose_file down --remove-orphans 2>/dev/null || true
        fi
    done
    
    # Force stop any remaining containers with our project name
    local project_name="galass"
    local running_containers=$(docker ps --filter "name=${project_name}" --format "{{.Names}}" 2>/dev/null || true)
    
    if [ -n "$running_containers" ]; then
        print_warning "Force stopping remaining containers..."
        echo "$running_containers" | xargs -r docker stop 2>/dev/null || true
        echo "$running_containers" | xargs -r docker rm 2>/dev/null || true
    fi
}

# Function to remove volumes
remove_volumes() {
    if [ "$REMOVE_VOLUMES" = true ]; then
        print_warning "Removing data volumes..."
        
        # Remove Docker volumes
        docker volume ls --filter "name=galass" --format "{{.Name}}" | xargs -r docker volume rm 2>/dev/null || true
        
        # Remove local data directories (ask for confirmation)
        read -p "Remove local data directories? This will delete all data! (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Removing local data directories..."
            rm -rf data/postgres/* 2>/dev/null || true
            rm -rf data/redis/* 2>/dev/null || true
            rm -rf logs/* 2>/dev/null || true
            print_success "Local data directories cleaned"
        fi
    fi
}

# Function to remove images
remove_images() {
    if [ "$REMOVE_IMAGES" = true ]; then
        print_warning "Removing Docker images..."
        
        # Remove images with our project prefix
        local project_images=$(docker images --filter "reference=galass-*" --format "{{.Repository}}:{{.Tag}}" 2>/dev/null || true)
        
        if [ -n "$project_images" ]; then
            echo "$project_images" | xargs -r docker rmi 2>/dev/null || true
            print_success "Project images removed"
        else
            print_status "No project images found to remove"
        fi
    fi
}

# Function to cleanup network
cleanup_network() {
    print_status "Cleaning up Docker networks..."
    
    # Remove any orphaned networks
    local project_networks=$(docker network ls --filter "name=galass" --format "{{.Name}}" 2>/dev/null || true)
    
    if [ -n "$project_networks" ]; then
        echo "$project_networks" | xargs -r docker network rm 2>/dev/null || true
        print_success "Project networks cleaned up"
    fi
}

# Function to show cleanup summary
show_summary() {
    echo ""
    print_success "Anniversary Voting System stopped successfully! 🛑"
    echo ""
    
    if [ "$REMOVE_VOLUMES" = true ] || [ "$REMOVE_IMAGES" = true ]; then
        print_status "Cleanup performed:"
        [ "$REMOVE_VOLUMES" = true ] && echo "   ✓ Data volumes removed"
        [ "$REMOVE_IMAGES" = true ] && echo "   ✓ Docker images removed"
    else
        print_status "To clean up data and images:"
        echo "   🗑️  Remove volumes: ./scripts/stop.sh --remove-volumes"
        echo "   📦 Remove images:  ./scripts/stop.sh --remove-images"
        echo "   🧹 Full cleanup:   ./scripts/clean.sh"
    fi
    
    echo ""
    print_status "To restart the system: ./scripts/start.sh"
}

# Function to check running containers
check_running_containers() {
    local running=$(docker ps --filter "name=galass" --format "{{.Names}}" 2>/dev/null | wc -l)
    
    if [ "$running" -eq 0 ]; then
        print_success "No Anniversary Voting System containers are running"
        return 0
    else
        print_status "Found $running running containers to stop"
        return 1
    fi
}

# Main execution
main() {
    echo "🛑 Anniversary Voting System - Stop Script"
    echo "=========================================="
    echo ""
    
    # Change to script directory
    cd "$(dirname "$0")/.."
    
    # Checks
    check_docker
    
    # Check if anything is running
    if check_running_containers; then
        print_status "System is already stopped"
    else
        # Stop services
        stop_services
        
        # Wait a moment for containers to fully stop
        sleep 3
        
        # Verify stop
        if check_running_containers; then
            print_success "All services stopped successfully"
        else
            print_warning "Some containers may still be running"
        fi
    fi
    
    # Cleanup network
    cleanup_network
    
    # Remove volumes if requested
    remove_volumes
    
    # Remove images if requested
    remove_images
    
    # Show summary
    show_summary
}

# Run main function
main "$@"