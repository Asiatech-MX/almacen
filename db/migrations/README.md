# Database Migrations

This directory contains database migration files for systematic schema changes.

## Migration File Format

Migrations follow the naming convention:
```
YYYY-MM-DD_HHMMSS_description_of_change.sql
```

Example:
```
2025-12-09_224118_add_estatus_column_to_materia_prima.sql
```

## Migration Structure

Each migration file should contain:

1. **Header Section**:
   - Description of the change
   - Reason for the change
   - Author and date
   - rollback information

2. **SQL Changes**:
   - DDL statements (ALTER TABLE, CREATE INDEX, etc.)
   - Data migration if needed
   - Comments explaining each step

3. **Verification Queries**:
   - Queries to verify the migration was successful
   - Expected results

## Running Migrations

### Single Migration
```bash
psql -h localhost -U postgres -d almacen_db -f db/migrations/2025-12-09_224118_add_estatus_column_to_materia_prima.sql
```

### All Migrations
```bash
# Run all migrations in order
for file in db/migrations/*.sql; do
  echo "Running migration: $file"
  psql -h localhost -U postgres -d almacen_db -f "$file"
done
```

## Best Practices

1. **Always create a backup** before running migrations
2. **Test migrations** on a staging environment first
3. **Use transactions** for atomic changes
4. **Add rollback scripts** for each migration
5. **Document the impact** on existing functionality
6. **Update application code** to handle schema changes
7. **Run validation script** after migration: `bun db:validate`

## Migration History

- **2025-12-09_224118**: Added `estatus` column to `materia_prima` table with constraint and index
- See individual migration files for detailed change logs