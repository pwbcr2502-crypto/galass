#!/bin/bash

# Anniversary Voting System - Clean Script
# Usage: ./clean.sh [--all] [--volumes] [--images] [--cache]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
CLEAN_ALL=false
CLEAN_VOLUMES=false
CLEAN_IMAGES=false
CLEAN_CACHE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            CLEAN_ALL=true
            CLEAN_VOLUMES=true
            CLEAN_IMAGES=true
            CLEAN_CACHE=true
            shift
            ;;
        --volumes)
            CLEAN_VOLUMES=true
            shift
            ;;
        --images)
            CLEAN_IMAGES=true
            shift
            ;;
        --cache)
            CLEAN_CACHE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--all] [--volumes] [--images] [--cache]"
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

# Function to ask for confirmation
confirm() {
    local message=$1
    read -p "$message (y/N): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to stop services if running
stop_services() {
    print_status "Stopping services before cleanup..."
    
    # Run stop script if it exists
    if [ -f "scripts/stop.sh" ]; then
        bash scripts/stop.sh
    else
        # Manual stop
        local compose_cmd="docker-compose"
        if command -v "docker compose" >/dev/null 2>&1; then
            compose_cmd="docker compose"
        fi
        
        for compose_file in "docker-compose.yml" "docker-compose.prod.yml"; do
            if [ -f "$compose_file" ]; then
                $compose_cmd -f $compose_file down --remove-orphans 2>/dev/null || true
            fi
        done
    fi
}

# Function to clean volumes
clean_volumes() {
    if [ "$CLEAN_VOLUMES" = true ]; then
        print_warning "🗑️  Cleaning Docker volumes..."
        
        # Remove project-specific volumes
        local project_volumes=$(docker volume ls --filter "name=galass" --format "{{.Name}}" 2>/dev/null || true)
        if [ -n "$project_volumes" ]; then
            echo "$project_volumes" | xargs -r docker volume rm 2>/dev/null || true
            print_success "Project volumes removed"
        fi
        
        # Clean local data directories
        if confirm "Remove local data directories? This will delete all persistent data!"; then
            print_warning "Removing local data directories..."
            
            # Backup important data first
            if [ -d "data/postgres" ] && [ "$(ls -A data/postgres)" ]; then
                local backup_dir="backups/cleanup_$(date +%Y%m%d_%H%M%S)"
                mkdir -p "$backup_dir"
                print_status "Creating backup at $backup_dir..."
                cp -r data/postgres "$backup_dir/" 2>/dev/null || true
            fi
            
            # Remove data directories
            rm -rf data/postgres/* 2>/dev/null || true
            rm -rf data/redis/* 2>/dev/null || true
            rm -rf logs/* 2>/dev/null || true
            
            print_success "Local data directories cleaned"
        fi
    fi
}

# Function to clean images
clean_images() {
    if [ "$CLEAN_IMAGES" = true ]; then
        print_warning "🖼️  Cleaning Docker images..."
        
        # Remove project images
        local project_images=$(docker images --filter "reference=galass-*" --format "{{.Repository}}:{{.Tag}}" 2>/dev/null || true)
        if [ -n "$project_images" ]; then
            echo "$project_images" | xargs -r docker rmi -f 2>/dev/null || true
            print_success "Project images removed"
        fi
        
        # Remove dangling images
        local dangling_images=$(docker images -f "dangling=true" -q 2>/dev/null || true)
        if [ -n "$dangling_images" ]; then
            echo "$dangling_images" | xargs -r docker rmi -f 2>/dev/null || true
            print_success "Dangling images removed"
        fi
    fi
}

# Function to clean build cache
clean_cache() {
    if [ "$CLEAN_CACHE" = true ]; then
        print_warning "🧹 Cleaning Docker build cache..."
        
        # Clean build cache
        docker builder prune -f 2>/dev/null || true
        
        # Clean system cache (containers, networks, etc)
        docker system prune -f 2>/dev/null || true
        
        # Clean unused networks
        local unused_networks=$(docker network ls --filter "driver=bridge" --format "{{.Name}}" | grep -E "(galass|default)" 2>/dev/null || true)
        if [ -n "$unused_networks" ]; then
            echo "$unused_networks" | xargs -r docker network rm 2>/dev/null || true
        fi
        
        print_success "Docker cache cleaned"
    fi
}

# Function to clean log files
clean_logs() {
    print_status "Cleaning log files..."
    
    # Clean application logs
    find logs -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
    
    # Clean export directories older than 7 days
    find logs -name "export_*" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    
    # Clean temporary files
    find . -name "*.tmp" -o -name "*.temp" -o -name "*.lock" | head -20 | xargs -r rm -f 2>/dev/null || true
    
    print_success "Log files cleaned"
}

# Function to clean node_modules (development)
clean_node_modules() {
    if confirm "Remove node_modules directories? (This will require npm install afterwards)"; then
        print_warning "Removing node_modules directories..."
        
        find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
        
        print_success "node_modules directories removed"
        print_warning "Run 'npm install' in each project directory before starting services"
    fi
}

# Function to show cleanup summary
show_cleanup_summary() {
    print_success "Cleanup completed! 🧹"
    echo ""
    
    # Show disk space saved
    print_status "Cleanup performed:"
    [ "$CLEAN_VOLUMES" = true ] && echo "   ✓ Docker volumes cleaned"
    [ "$CLEAN_IMAGES" = true ] && echo "   ✓ Docker images removed"
    [ "$CLEAN_CACHE" = true ] && echo "   ✓ Docker cache cleared"
    echo "   ✓ Log files cleaned"
    
    echo ""
    print_status "To rebuild and restart:"
    echo "   🔨 Build images: ./scripts/build.sh"
    echo "   🚀 Start system: ./scripts/start.sh"
    
    # Show current disk usage
    echo ""
    print_status "Current Docker disk usage:"
    docker system df 2>/dev/null || true
}

# Function to show interactive menu
show_interactive_menu() {
    echo "What would you like to clean?"
    echo ""
    echo "1) Docker volumes (removes all data)"
    echo "2) Docker images (requires rebuild)"
    echo "3) Docker build cache"
    echo "4) Log files"
    echo "5) node_modules directories"
    echo "6) Everything (volumes + images + cache + logs)"
    echo "7) Cancel"
    echo ""
    
    read -p "Enter your choice (1-7): " choice
    
    case $choice in
        1)
            CLEAN_VOLUMES=true
            ;;
        2)
            CLEAN_IMAGES=true
            ;;
        3)
            CLEAN_CACHE=true
            ;;
        4)
            # Just clean logs, no flag needed
            ;;
        5)
            clean_node_modules
            return
            ;;
        6)
            CLEAN_VOLUMES=true
            CLEAN_IMAGES=true
            CLEAN_CACHE=true
            ;;
        7|*)
            print_status "Cleanup cancelled"
            exit 0
            ;;
    esac
}

# Main execution
main() {
    echo "🧹 Anniversary Voting System - Cleanup Script"
    echo "============================================="
    echo ""
    
    # Change to script directory
    cd "$(dirname "$0")/.."
    
    # Check Docker
    check_docker
    
    # If no flags provided, show interactive menu
    if [ "$CLEAN_ALL" = false ] && [ "$CLEAN_VOLUMES" = false ] && [ "$CLEAN_IMAGES" = false ] && [ "$CLEAN_CACHE" = false ]; then
        show_interactive_menu
    fi
    
    # Show warning for destructive operations
    if [ "$CLEAN_VOLUMES" = true ] || [ "$CLEAN_IMAGES" = true ]; then
        print_warning "This operation will remove data and may require rebuilding!"
        if ! confirm "Are you sure you want to continue?"; then
            print_status "Cleanup cancelled"
            exit 0
        fi
    fi
    
    # Stop services first
    stop_services
    
    # Perform cleanup operations
    clean_volumes
    clean_images  
    clean_cache
    clean_logs
    
    # Show summary
    show_cleanup_summary
}

# Run main function
main "$@"