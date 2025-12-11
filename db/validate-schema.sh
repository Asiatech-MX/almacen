#!/bin/bash

# Schema Validation Script
# Validates that the database schema matches expected structure
# Used in CI/CD and pre-commit hooks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection from environment or defaults
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-almacen_db}

echo -e "${YELLOW}Validating database schema...${NC}"

# Function to check if column exists
check_column() {
    local table=$1
    local column=$2
    local type=$3

    result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = '$table' AND column_name = '$column';
    ")

    if [ -z "$result" ]; then
        echo -e "${RED}✗ Column $table.$column does not exist${NC}"
        return 1
    fi

    if [ -n "$type" ]; then
        if ! echo "$result" | grep -qi "$type"; then
            echo -e "${RED}✗ Column $table.$column has wrong type. Expected: $type, Got: $result${NC}"
            return 1
        fi
    fi

    echo -e "${GREEN}✓ Column $table.$column exists${NC}"
    return 0
}

# Function to check if constraint exists
check_constraint() {
    local table=$1
    local constraint=$2

    result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = '$table' AND constraint_name = '$constraint';
    ")

    if [ -z "$result" ]; then
        echo -e "${RED}✗ Constraint $constraint does not exist on table $table${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Constraint $constraint exists on table $table${NC}"
    return 0
}

# Function to check if index exists
check_index() {
    local index=$1

    result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT indexname FROM pg_indexes WHERE indexname = '$index';
    ")

    if [ -z "$result" ]; then
        echo -e "${RED}✗ Index $index does not exist${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Index $index exists${NC}"
    return 0
}

# Validation errors counter
errors=0

# Validate materia_prima table schema
echo -e "\n${YELLOW}Validating materia_prima table...${NC}"

check_column "materia_prima" "id" "integer" || ((errors++))
check_column "materia_prima" "codigo_barras" "character varying" || ((errors++))
check_column "materia_prima" "nombre" "character varying" || ((errors++))
check_column "materia_prima" "marca" "character varying" || ((errors++))
check_column "materia_prima" "modelo" "character varying" || ((errors++))
check_column "materia_prima" "presentacion" "character varying" || ((errors++))
check_column "materia_prima" "stock" "numeric" || ((errors++))
check_column "materia_prima" "stock_minimo" "numeric" || ((errors++))
check_column "materia_prima" "estatus" "character varying" || ((errors++))
check_column "materia_prima" "activo" "boolean" || ((errors++))
check_column "materia_prima" "fecha_registro" "timestamp without time zone" || ((errors++))
check_column "materia_prima" "id_institucion" "integer" || ((errors++))
check_column "materia_prima" "imagen_url" "character varying" || ((errors++))
check_column "materia_prima" "unidad_medida" "character varying" || ((errors++))

# Validate constraints
echo -e "\n${YELLOW}Validating constraints...${NC}"
check_constraint "materia_prima" "materia_prima_estatus_check" || ((errors++))

# Validate indexes
echo -e "\n${YELLOW}Validating indexes...${NC}"
check_index "idx_materia_prima_estatus" || ((errors++))
check_index "idx_materia_prima_stock_bajo" || ((errors++))

# Validate other critical tables
echo -e "\n${YELLOW}Validating other critical tables...${NC}"

# Check institucion table
check_column "institucion" "estatus" "character varying" || ((errors++))

# Check proveedor table
check_column "proveedor" "estatus" "character varying" || ((errors++))

# Check usuario table
check_column "usuario" "estatus" "character varying" || ((errors++))

# Summary
echo -e "\n${YELLOW}Schema validation completed.${NC}"

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✓ All validations passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Validation failed with $errors error(s)${NC}"
    echo -e "${RED}Please run the migration scripts to update the schema.${NC}"
    exit 1
fi