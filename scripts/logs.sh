#!/bin/bash

# Anniversary Voting System - Logs Script
# Usage: ./logs.sh [service] [--follow] [--tail=lines]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SERVICE=""
FOLLOW=false
TAIL_LINES=100

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --follow|-f)
            FOLLOW=true
            shift
            ;;
        --tail=*)
            TAIL_LINES="${1#*=}"
            shift
            ;;
        --tail)
            TAIL_LINES="$2"
            shift 2
            ;;
        backend|mobile|bigscreen|postgres|redis|nginx|all)
            SERVICE=$1
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [backend|mobile|bigscreen|postgres|redis|nginx|all] [--follow] [--tail=lines]"
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

# Function to get docker-compose command
get_docker_compose_cmd() {
    if command -v docker-compose >/dev/null 2>&1; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# Function to show available services
show_available_services() {
    local compose_cmd=$(get_docker_compose_cmd)
    
    print_status "Available services:"
    
    if [ -f "docker-compose.yml" ]; then
        $compose_cmd -f docker-compose.yml config --services 2>/dev/null | sort | sed 's/^/   - /'
    else
        echo "   - backend"
        echo "   - mobile" 
        echo "   - bigscreen"
        echo "   - postgres"
        echo "   - redis"
        echo "   - nginx"
    fi
}

# Function to check if service is running
check_service_running() {
    local service=$1
    local compose_cmd=$(get_docker_compose_cmd)
    
    if [ "$service" = "all" ]; then
        return 0
    fi
    
    local running=$($compose_cmd ps --services --filter "status=running" 2>/dev/null | grep -c "^${service}$" || echo "0")
    
    if [ "$running" -eq 0 ]; then
        print_warning "Service '$service' is not running"
        
        # Show running services
        local all_running=$($compose_cmd ps --services --filter "status=running" 2>/dev/null | tr '\n' ' ')
        if [ -n "$all_running" ]; then
            print_status "Currently running services: $all_running"
        else
            print_status "No services are currently running"
        fi
        
        return 1
    fi
    
    return 0
}

# Function to show logs for a specific service
show_service_logs() {
    local service=$1
    local compose_cmd=$(get_docker_compose_cmd)
    local log_args=""
    
    # Build log arguments
    if [ "$FOLLOW" = true ]; then
        log_args="$log_args --follow"
    fi
    
    if [ -n "$TAIL_LINES" ] && [ "$TAIL_LINES" != "all" ]; then
        log_args="$log_args --tail=$TAIL_LINES"
    fi
    
    print_status "Showing logs for service: $service"
    
    if [ "$FOLLOW" = true ]; then
        print_status "Following logs (Press Ctrl+C to stop)..."
        echo ""
    fi
    
    # Show logs
    $compose_cmd logs $log_args $service
}

# Function to show all logs
show_all_logs() {
    local compose_cmd=$(get_docker_compose_cmd)
    local log_args=""
    
    # Build log arguments
    if [ "$FOLLOW" = true ]; then
        log_args="$log_args --follow"
    fi
    
    if [ -n "$TAIL_LINES" ] && [ "$TAIL_LINES" != "all" ]; then
        log_args="$log_args --tail=$TAIL_LINES"
    fi
    
    print_status "Showing logs for all services"
    
    if [ "$FOLLOW" = true ]; then
        print_status "Following logs (Press Ctrl+C to stop)..."
        echo ""
    fi
    
    # Show logs for all services
    $compose_cmd logs $log_args
}

# Function to export logs to files
export_logs() {
    local compose_cmd=$(get_docker_compose_cmd)
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local log_dir="logs/export_${timestamp}"
    
    print_status "Exporting logs to $log_dir..."
    mkdir -p "$log_dir"
    
    # Get list of services
    local services=$($compose_cmd ps --services 2>/dev/null || echo "backend mobile bigscreen postgres redis nginx")
    
    for service in $services; do
        if check_service_running "$service" >/dev/null 2>&1; then
            print_status "Exporting logs for $service..."
            $compose_cmd logs --no-color --tail=1000 "$service" > "$log_dir/${service}.log" 2>&1 || true
        fi
    done
    
    # Create summary
    cat > "$log_dir/README.md" << EOF
# Anniversary Voting System - Log Export

Export Date: $(date)
Export Directory: $log_dir

## Services
EOF
    
    for service in $services; do
        if [ -f "$log_dir/${service}.log" ]; then
            local lines=$(wc -l < "$log_dir/${service}.log")
            echo "- $service: ${lines} log lines" >> "$log_dir/README.md"
        fi
    done
    
    print_success "Logs exported to $log_dir"
}

# Function to show log statistics
show_log_stats() {
    local compose_cmd=$(get_docker_compose_cmd)
    
    print_status "Log statistics:"
    echo ""
    printf "%-15s %-10s %-15s %s\n" "SERVICE" "STATUS" "LOG_LINES" "LAST_LOG"
    printf "%-15s %-10s %-15s %s\n" "-------" "------" "---------" "--------"
    
    # Get list of services
    local services=$($compose_cmd ps --services 2>/dev/null || echo "backend mobile bigscreen postgres redis nginx")
    
    for service in $services; do
        local status="stopped"
        local log_lines=0
        local last_log="N/A"
        
        if check_service_running "$service" >/dev/null 2>&1; then
            status="running"
            log_lines=$($compose_cmd logs --tail=1000 "$service" 2>/dev/null | wc -l || echo "0")
            last_log=$($compose_cmd logs --tail=1 --no-color "$service" 2>/dev/null | head -1 | cut -c1-20 || echo "N/A")
        fi
        
        printf "%-15s %-10s %-15s %s\n" "$service" "$status" "$log_lines" "$last_log"
    done
}

# Main execution
main() {
    echo "📋 Anniversary Voting System - Logs Viewer"
    echo "=========================================="
    echo ""
    
    # Change to script directory
    cd "$(dirname "$0")/.."
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found. Are you in the correct directory?"
        exit 1
    fi
    
    # If no service specified, show options
    if [ -z "$SERVICE" ]; then
        echo "No service specified. Available options:"
        echo ""
        show_available_services
        echo ""
        echo "Usage examples:"
        echo "  ./scripts/logs.sh backend              # Show backend logs"
        echo "  ./scripts/logs.sh all --follow         # Follow all logs"
        echo "  ./scripts/logs.sh postgres --tail=50   # Show last 50 lines"
        echo ""
        
        # Show log statistics
        show_log_stats
        exit 0
    fi
    
    # Handle special commands
    case $SERVICE in
        stats|statistics)
            show_log_stats
            exit 0
            ;;
        export)
            export_logs
            exit 0
            ;;
    esac
    
    # Show logs for specified service
    if [ "$SERVICE" = "all" ]; then
        show_all_logs
    else
        if check_service_running "$SERVICE"; then
            show_service_logs "$SERVICE"
        else
            print_error "Cannot show logs for '$SERVICE' - service is not running"
            echo ""
            show_available_services
            exit 1
        fi
    fi
}

# Run main function
main "$@"