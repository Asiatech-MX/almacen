# User Administration Guide
## Sistema de Referencia Dinámica (Dynamic Reference Data System)

This guide provides comprehensive instructions for users and administrators on how to manage the dynamic reference data system (categorías and presentaciones) in the warehouse management application.

## Table of Contents

1. [System Overview](#system-overview)
2. [User Roles and Permissions](#user-roles-and-permissions)
3. [Managing Categories](#managing-categories)
4. [Managing Presentations](#managing-presentations)
5. [Bulk Operations](#bulk-operations)
6. [Data Validation Rules](#data-validation-rules)
7. [Reporting and Analytics](#reporting-and-analytics)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## System Overview

The Dynamic Reference Data System (DRDS) allows for flexible management of product categories and presentations. This system replaces static dropdown lists with a dynamic, hierarchical structure that can be modified by authorized users.

### Key Features

- **Hierarchical Categories**: Multi-level category structure with parent-child relationships
- **Flexible Presentations**: Configurable product presentations (units, boxes, packages, etc.)
- **Real-time Updates**: Changes are immediately available throughout the application
- **Audit Trail**: All changes are tracked with user attribution and timestamps
- **Import/Export**: Bulk data operations through CSV files
- **Search and Filter**: Advanced search capabilities across reference data

### Accessibility

The system can be accessed through:
- **Admin Module**: `/admin/reference-data` (full administrative access)
- **Category Management**: `/materia-prima/categorias` (category-specific operations)
- **Presentation Management**: `/materia-prima/presentaciones` (presentation-specific operations)

## User Roles and Permissions

### Super Administrator

**Permissions:**
- Full access to all categories and presentations
- Can create, edit, delete, and reorganize any category
- Can manage system settings and feature flags
- Can perform bulk import/export operations
- Can access audit logs and reports

**Access Level:** All institutions and all categories

### Institution Administrator

**Permissions:**
- Full access to categories and presentations within their institution
- Can create, edit, delete categories in their institution's hierarchy
- Can manage presentations for their institution
- Can export data for their institution
- Can view audit logs for their institution

**Access Level:** Institution-specific categories and presentations

### Category Manager

**Permissions:**
- Can create and edit categories within assigned branches
- Can manage presentations within their scope
- Can move categories within their branch
- Cannot delete categories with associated materials
- Limited bulk operations

**Access Level:** Specific category branches and presentations

### Viewer

**Permissions:**
- Read-only access to categories and presentations
- Can search and filter reference data
- Can export data for reporting
- No modification permissions

**Access Level:** Read-only across all accessible data

## Managing Categories

### Creating a New Category

1. **Navigate to Category Management**
   - Go to Admin → Reference Data → Categories
   - Or use the direct path: `/admin/categorias`

2. **Click "Add New Category"**
   - Fill in required fields:
     - **Nombre (Name)**: Unique category name (required)
     - **Descripción (Description)**: Detailed description (optional)
     - **Categoría Padre (Parent Category)**: Select parent for hierarchical structure

3. **Configure Category Settings**
   - **Activo (Active)**: Enable/disable category
   - **Código Externo (External Code)**: Integration code (optional)
   - **Nivel de Orden (Sort Order)**: Position in hierarchy

4. **Save and Validate**
   - System validates for duplicate names
   - Checks circular references in hierarchy
   - Confirms parent category exists and is active

```typescript
// Example: Creating a category via API
const newCategory = await window.electronAPI.categoria.crear({
  nombre: 'Materiales de Limpieza',
  descripcion: 'Productos para limpieza y sanitización',
  activo: true,
  idInstitucion: 1,
  codigoExterno: 'LIMP',
  nivelOrden: 1
}, 'parent-category-id', 'admin-user-id')
```

### Editing a Category

1. **Locate the Category**
   - Use search or navigate through hierarchy
   - Click on the category to edit

2. **Modify Information**
   - Update name, description, or settings
   - Change parent category if needed (system validates hierarchy)

3. **Save Changes**
   - System creates audit entry
   - Updates all dependent materials

### Moving Categories

Categories can be reorganized within the hierarchy:

1. **Drag and Drop**
   - In the tree view, drag category to new parent
   - System validates the move (no circular references)

2. **Bulk Reorganization**
   - Use the "Reorder" function for multiple categories
   - Specify new parent relationships

```typescript
// Example: Moving a category
const movedCategory = await window.electronAPI.categoria.mover(
  'category-id-to-move',
  'new-parent-category-id',
  'admin-user-id'
)
```

### Deleting Categories

**Safety Precautions:**
- Categories with associated materials cannot be deleted
- Child categories must be deleted first
- System prompts for confirmation with impact analysis

1. **Select Category to Delete**
   - Click the delete button next to category
   - System shows dependency analysis

2. **Confirm Deletion**
   - Review affected materials and child categories
   - Confirm or cancel the operation

```typescript
// Example: Safe category deletion
try {
  const deleted = await window.electronAPI.categoria.eliminar(
    'category-id',
    false, // force = false (safe deletion)
    'admin-user-id'
  )
  console.log('Category deleted successfully')
} catch (error) {
  console.error('Cannot delete category:', error.message)
}
```

## Managing Presentations

### Creating a New Presentation

1. **Navigate to Presentation Management**
   - Go to Admin → Reference Data → Presentations
   - Or use direct path: `/admin/presentaciones`

2. **Click "Add New Presentation"**
   - **Nombre (Name)**: Presentation name (required)
   - **Abreviatura (Abbreviation)**: Short code (required, unique)
   - **Descripción (Description)**: Detailed description (optional)
   - **Factor de Conversión**: Conversion factor to base unit (optional)
   - **Predeterminada**: Set as default presentation

3. **Save and Validate**
   - System validates unique abbreviation
   - Checks conversion factor validity
   - Sets as default if specified

```typescript
// Example: Creating a presentation
const newPresentation = await window.electronAPI.presentacion.crear({
  nombre: 'Caja de 24 Unidades',
  abreviatura: 'CAJ24',
  descripcion: 'Caja conteniendo 24 unidades individuales',
  factorConversion: 24,
  predeterminada: false,
  activo: true,
  idInstitucion: 1
}, 'admin-user-id')
```

### Managing Default Presentations

Each institution can have multiple default presentations:

1. **Set Default Status**
   - Mark presentation as "Predeterminada"
   - System allows multiple defaults per institution

2. **Default Presentation Priority**
   - New materials use the first default presentation
   - Order can be adjusted through sort settings

### Updating Presentation Details

1. **Edit Presentation**
   - Modify name, abbreviation, or description
   - Update conversion factor
   - Change active status

2. **Impact Analysis**
   - System shows affected materials
   - Warns about conversion factor changes

## Bulk Operations

### Importing Categories

1. **Prepare CSV File**
   ```csv
   Nombre,Descripcion,CategoriaPadre,CodigoExterno,Activo,NivelOrden
   "Electrónicos","Dispositivos electrónicos","", "ELEC",true,1
   "Televisores","Pantallas y TVs","Electrónicos","TV",true,1
   "Celulares","Teléfonos móviles","Electrónicos","CEL",true,2
   ```

2. **Import Process**
   - Go to Admin → Import Data → Categories
   - Select CSV file
   - Preview and validate data
   - Confirm import

3. **Validation Rules**
   - Required fields must be present
   - Parent categories must exist (or be created first)
   - No duplicate names within same parent
   - Valid sort order values

### Exporting Categories

1. **Export Options**
   - Full hierarchy export
   - Institution-specific export
   - Active-only or all categories

2. **Export Formats**
   - CSV with full hierarchy information
   - JSON with parent-child relationships
   - Excel with hierarchy visualization

### Bulk Updates

1. **Select Multiple Items**
   - Use checkboxes to select categories/presentations
   - Apply bulk operations to selection

2. **Available Operations**
   - Activate/Deactivate
   - Update institution assignment
   - Change sort order
   - Export selected items

## Data Validation Rules

### Category Validation

**Required Fields:**
- `nombre`: Must be unique within parent category
- `idInstitucion`: Must reference existing institution

**Optional Fields:**
- `descripcion`: Free text description
- `codigoExterno`: Must be unique globally if provided
- `categoriaPadreId`: Must reference existing category (or null for root)

**Validation Rules:**
- No circular references in hierarchy
- Maximum depth: 10 levels
- Name length: 1-255 characters
- Description length: Max 1000 characters

### Presentation Validation

**Required Fields:**
- `nombre`: Must be unique within institution
- `abreviatura`: Must be unique within institution (2-10 characters)
- `idInstitucion`: Must reference existing institution

**Optional Fields:**
- `descripcion`: Free text description
- `factorConversion`: Positive number (default: 1)

**Validation Rules:**
- Abbreviation format: 2-10 alphanumeric characters
- Factor conversion: Positive decimal number
- Name length: 1-255 characters
- Description length: Max 1000 characters

## Reporting and Analytics

### Category Reports

1. **Hierarchy Report**
   - Complete category tree structure
   - Material count per category
   - Active/inactive status breakdown

2. **Usage Statistics**
   - Most used categories
   - Categories with no materials
   - Category depth analysis

### Presentation Reports

1. **Usage Analysis**
   - Most used presentations
   - Default presentation effectiveness
   - Conversion factor distribution

2. **Material Impact Report**
   - Materials affected by presentation changes
   - Inventory value by presentation

### Audit Reports

1. **Change History**
   - All modifications with user attribution
   - Timeline of changes
   - Before/after values

2. **User Activity**
   - Changes by user
   - Activity by date range
   - Operation type breakdown

## Troubleshooting

### Common Issues and Solutions

#### Category Management Issues

**Problem:** Cannot delete category
**Solution:**
- Check for associated materials using the category
- Move or delete child categories first
- Use "Force Delete" only if absolutely necessary (requires admin approval)

**Problem:** Category hierarchy becomes circular
**Solution:**
- System prevents circular references automatically
- Use the "Validate Hierarchy" function to detect issues
- Reorganize categories using drag-and-drop interface

**Problem:** Duplicate category names
**Solution:**
- Names must be unique within the same parent category
- Use more descriptive names or add identifiers
- Check existing categories before creating new ones

#### Presentation Management Issues

**Problem:** Duplicate abbreviation error
**Solution:**
- Abbreviations must be unique within institution
- Use institution codes as prefixes if needed
- Check existing abbreviations before creating new ones

**Problem:** Conversion factor changes affect inventory
**Solution:**
- System validates conversion factor impact
- Review affected materials before confirming changes
- Consider creating new presentation instead of modifying existing one

#### Performance Issues

**Problem:** Slow loading of category tree
**Solution:**
- Enable lazy loading for large hierarchies
- Use search instead of browsing entire tree
- Consider archiving unused categories

**Problem:** Bulk import timeout
**Solution:**
- Split large CSV files into smaller chunks (max 1000 rows)
- Disable validation for trusted data sources
- Import during off-peak hours

### Error Messages Reference

| Error Code | Message | Cause | Solution |
|-----------|---------|-------|----------|
| CAT001 | "Category name already exists" | Duplicate name within parent | Choose unique name |
| CAT002 | "Circular reference detected" | Category references itself as descendant | Reorganize hierarchy |
| CAT003 | "Cannot delete category with materials" | Category has associated materials | Move or delete materials first |
| PRE001 | "Abbreviation already exists" | Duplicate abbreviation in institution | Choose unique abbreviation |
| PRE002 | "Invalid conversion factor" | Negative or zero conversion factor | Use positive number |
| SYS001 | "Institution not found" | Invalid institution ID | Use valid institution |

## Best Practices

### Category Management

1. **Planning Hierarchy**
   - Plan category structure before implementation
   - Keep hierarchy shallow (max 5-6 levels recommended)
   - Use consistent naming conventions

2. **Naming Conventions**
   - Use clear, descriptive names
   - Avoid special characters in names
   - Consider multilingual requirements

3. **Maintenance**
   - Review category usage quarterly
   - Archive unused categories instead of deleting
   - Validate hierarchy integrity regularly

### Presentation Management

1. **Standardization**
   - Establish presentation naming conventions
   - Use consistent abbreviation patterns
   - Document conversion factor policies

2. **Quality Control**
   - Validate conversion factors before implementation
   - Test presentation changes in staging environment
   - Monitor presentation usage patterns

3. **Data Integrity**
   - Regular validation of presentation assignments
   - Audit conversion factor accuracy
   - Monitor default presentation effectiveness

### Security and Access Control

1. **User Permissions**
   - Follow principle of least privilege
   - Review user access rights regularly
   - Document permission changes

2. **Audit Trail**
   - Enable comprehensive logging
   - Review audit logs monthly
   - Investigate suspicious activity promptly

### Performance Optimization

1. **Caching Strategy**
   - Enable category caching for frequently accessed data
   - Use lazy loading for large datasets
   - Cache presentation lookups

2. **Database Optimization**
   - Regular maintenance of reference data tables
   - Monitor query performance
   - Optimize indexes for common queries

## Support and Training

### Training Resources

1. **Administrator Training**
   - Category management best practices
   - Presentation configuration procedures
   - Bulk operation guidelines

2. **User Training**
   - Using the category picker
   - Understanding presentation units
   - Reporting and analytics usage

### Support Channels

1. **Technical Support**
   - Application support team
   - System administrators
   - Documentation and knowledge base

2. **Business Support**
   - Process optimization guidance
   - Best practice consulting
   - Custom configuration assistance

## System Maintenance

### Regular Tasks

**Daily:**
- Monitor system health and performance
- Review error logs for reference data issues

**Weekly:**
- Validate category hierarchy integrity
- Check for orphaned categories or presentations
- Review user activity reports

**Monthly:**
- Audit high-volume changes
- Performance analysis of reference data operations
- User permission reviews

**Quarterly:**
- Comprehensive system health check
- Backup and recovery testing
- Feature flag evaluation and adjustment

### Backup and Recovery

1. **Data Backup**
   - Regular backups of reference data tables
   - Export current configurations
   - Document configuration changes

2. **Recovery Procedures**
   - Restore from recent backups
   - Validate data integrity after restore
   - Communicate recovery status to users

---

## Appendix

### API Reference

For detailed API documentation, see:
- [Category API Documentation](./API_CATEGORIES.md)
- [Presentation API Documentation](./API_PRESENTATIONS.md)
- [Admin API Documentation](./API_ADMIN.md)

### Configuration Files

- Feature flags: `feature-flags.json`
- System settings: `config/monitoring.json`
- Validation rules: `config/validation.json`

### Related Documentation

- [System Architecture Guide](./SYSTEM_ARCHITECTURE.md)
- [Database Schema Documentation](./DATABASE_SCHEMA.md)
- [Monitoring System Guide](./MONITORING_SYSTEM.md)