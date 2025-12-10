#!/bin/bash

# Migration Runner Script
# Automatically runs all pending migrations in order

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection from environment or defaults
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-almacen_db}

# Migration tracking table
MIGRATION_TABLE="schema_migrations"

echo -e "${BLUE}Database Migration Runner${NC}"
echo -e "${BLUE}==========================${NC}"

# Function to check if migration table exists
check_migration_table() {
    result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = '$MIGRATION_TABLE'
        );
    " 2>/dev/null | tr -d ' ')

    if [ "$result" = "t" ]; then
        return 0
    else
        return 1
    fi
}

# Function to create migration tracking table
create_migration_table() {
    echo -e "${YELLOW}Creating migration tracking table...${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        CREATE TABLE $MIGRATION_TABLE (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    " || {
        echo -e "${RED}Failed to create migration table${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Migration tracking table created${NC}"
}

# Function to check if migration has been run
migration_executed() {
    local filename=$1
    result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT EXISTS (
            SELECT 1 FROM $MIGRATION_TABLE
            WHERE filename = '$filename'
        );
    " 2>/dev/null | tr -d ' ')

    [ "$result" = "t" ]
}

# Function to mark migration as executed
mark_migration_executed() {
    local filename=$1
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        INSERT INTO $MIGRATION_TABLE (filename) VALUES ('$filename');
    " || {
        echo -e "${RED}Failed to mark migration as executed: $filename${NC}"
        exit 1
    }
}

# Function to run a single migration
run_migration() {
    local file=$1
    local filename=$(basename "$file")

    echo -e "${YELLOW}Running migration: $filename${NC}"

    # Create backup before migration
    local backup_file="db/backups/pre_migration_${filename%.sql}_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p db/backups
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$backup_file"
    echo -e "${BLUE}Backup created: $backup_file${NC}"

    # Execute migration
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"; then
        mark_migration_executed "$filename"
        echo -e "${GREEN}✓ Migration completed: $filename${NC}"
        return 0
    else
        echo -e "${RED}✗ Migration failed: $filename${NC}"
        echo -e "${RED}Backup is available at: $backup_file${NC}"
        return 1
    fi
}

# Main execution
echo -e "\n${YELLOW}Checking database connection...${NC}"

# Test database connection
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}✗ Cannot connect to database${NC}"
    echo -e "${RED}Please check your DATABASE_URL or DB_* environment variables${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Database connection successful${NC}"

# Check or create migration tracking table
if ! check_migration_table; then
    create_migration_table
fi

# Get all migration files sorted by filename
MIGRATIONS_DIR="db/migrations"
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}✗ Migrations directory not found: $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Find and sort migration files
migration_files=($(find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort))

if [ ${#migration_files[@]} -eq 0 ]; then
    echo -e "${YELLOW}No migration files found${NC}"
    exit 0
fi

echo -e "\n${YELLOW}Found ${#migration_files[@]} migration file(s)${NC}"

# Run pending migrations
executed_count=0
pending_count=0

for file in "${migration_files[@]}"; do
    filename=$(basename "$file")

    if migration_executed "$filename"; then
        echo -e "${BLUE}→ Skipping (already executed): $filename${NC}"
        ((executed_count++))
    else
        if run_migration "$file"; then
            ((pending_count++))
        else
            echo -e "${RED}Migration process stopped due to error${NC}"
            exit 1
        fi
    fi
done

# Summary
echo -e "\n${GREEN}Migration Summary${NC}"
echo -e "${GREEN}==================${NC}"
echo -e "Already executed: ${BLUE}$executed_count${NC}"
echo -e "Newly executed:   ${GREEN}$pending_count${NC}"
echo -e "Total migrations: ${YELLOW}${#migration_files[@]}${NC}"

if [ $pending_count -gt 0 ]; then
    echo -e "\n${YELLOW}Running schema validation...${NC}"
    if bun db:validate; then
        echo -e "${GREEN}✓ Schema validation passed${NC}"
    else
        echo -e "${RED}✗ Schema validation failed${NC}"
        exit 1
    fi
fi

echo -e "\n${GREEN}✓ All migrations completed successfully!${NC}"