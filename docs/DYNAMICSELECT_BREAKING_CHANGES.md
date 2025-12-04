# DynamicSelect Breaking Changes & Deprecations

## Overview

This document outlines breaking changes and deprecations introduced in the DynamicSelect system refactor. Understanding these changes is crucial for a smooth migration from the legacy implementation.

---

## 🚨 Major Breaking Changes

### 1. Component Interface Changes

#### Legacy Implementation
```typescript
interface LegacyDynamicSelectProps {
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  options: Categoria[] | Presentacion[];
  loading?: boolean;
  error?: string;
  type: 'categoria' | 'presentacion';
  placeholder?: string;
  disabled?: boolean;
  creatable?: boolean;
  onCreate?: (name: string) => Promise<void>;
}
```

#### New Implementation
```typescript
interface DynamicSelectProps {
  control: Control<any>;
  name: string;
  label: string;
  type: 'categoria' | 'presentacion';
  placeholder?: string;
  creatable?: boolean;
  allowEdit?: boolean;
  allowInlineEdit?: boolean;
  onEdit?: (item: Categoria | Presentacion) => void;
  onMove?: (id: string, nuevoPadreId?: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: FieldError;
  onInlineEditStart?: (item: Categoria | Presentacion) => void;
  onInlineEditSuccess?: (item: Categoria | Presentacion) => void;
  onInlineEditError?: (item: Categoria | Presentacion, error: string) => void;
}
```

**Impact**: Complete component interface change requiring form integration migration.

### 2. Form Integration Pattern

#### Legacy (Manual State Management)
```typescript
const MyComponent = () => {
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Categoria[]>([]);

  const handleChange = (value: number) => {
    setCategoryId(value);
  };

  return (
    <LegacyDynamicSelect
      value={categoryId}
      onChange={handleChange}
      options={categories}
      type="categoria"
    />
  );
};
```

#### New (React Hook Form)
```typescript
const MyComponent = () => {
  const { control } = useForm({
    defaultValues: { categoria_id: null }
  });

  return (
    <DynamicSelect
      control={control}
      name="categoria_id"
      label="Categoría"
      type="categoria"
    />
  );
};
```

**Impact**: Requires migration to React Hook Form for all form handling.

### 3. Data Fetching Pattern

#### Legacy (Direct Hook Usage)
```typescript
const {
  data: categorias,
  loading: isLoading,
  error,
  refetch
} = useReferenceData({
  type: 'categoria',
  idInstitucion: 1
});
```

#### New (Internal to Component)
```typescript
// Data fetching is handled internally by DynamicSelect
// For direct access, use specific hooks:
const {
  options,
  isLoading,
  isFetching,
  error,
  refetch
} = useDynamicSelectOptions({
  type: 'categoria',
  idInstitucion: 1
});
```

**Impact**: Manual data fetching no longer required for basic usage.

---

## 🔄 Deprecated Features

### 1. Legacy Hook: `useReferenceData`

**Status**: ❌ **DEPRECATED** - Will be removed in v2.0

**Replaced By**: `useDynamicSelectOptions`, `useDynamicSelectValue`, `useReferenceDataQuery`

```typescript
// ❌ DEPRECATED - Do not use
import { useReferenceData } from './useReferenceData';

const { data, loading } = useReferenceData({
  type: 'categoria',
  idInstitucion: 1
});

// ✅ NEW - Use instead
import { useDynamicSelectOptions } from './useDynamicSelectOptions';

const { options, isLoading } = useDynamicSelectOptions({
  type: 'categoria',
  idInstitucion: 1
});
```

### 2. Legacy Component: `ReferenceDataSelect`

**Status**: ❌ **DEPRECATED** - Will be removed in v2.0

**Replaced By**: `DynamicSelect` with React Hook Form integration

```typescript
// ❌ DEPRECATED - Do not use
import { ReferenceDataSelect } from './ReferenceDataSelect';

<ReferenceDataSelect
  value={value}
  onChange={onChange}
  options={options}
  type="categoria"
/>

// ✅ NEW - Use instead
import { DynamicSelect } from './ui/DynamicSelect';

<DynamicSelect
  control={control}
  name="categoria_id"
  type="categoria"
/>
```

### 3. Manual State Management

**Status**: ❌ **DEPRECATED** - Not recommended for new implementations

**Replaced By**: React Hook Form state management

```typescript
// ❌ DEPRECATED - Manual state management
const [formData, setFormData] = useState({
  categoria_id: null,
  presentacion_id: null
});

// ✅ NEW - React Hook Form
const { control } = useForm({
  defaultValues: {
    categoria_id: null,
    presentacion_id: null
  }
});
```

---

## 🆕 New Features (Breaking Changes)

### 1. Inline Editing

**New Capability**: Direct editing in dropdown without modal

```typescript
<DynamicSelect
  control={control}
  name="categoria_id"
  type="categoria"
  allowInlineEdit  // New feature
  onInlineEditSuccess={(item) => {
    console.log('Updated:', item);
  }}
/>
```

**Breaking Change**: New props for inline editing callbacks.

### 2. Enhanced Type Safety

**New Capability**: Full TypeScript coverage with strict typing

```typescript
// Strong typing for all data structures
interface DynamicSelectOption {
  value: string;
  label: string;
  data?: Categoria | Presentacion | null;
  isDisabled?: boolean;
}
```

**Breaking Change**: More strict TypeScript requirements.

### 3. Optimistic Updates

**New Capability**: Immediate UI updates with rollback on error

```typescript
// Automatic with TanStack Query mutations
const { mutate } = useEditarCategoriaMutation();

mutate(
  { id, cambios },
  {
    optimisticData: (current) => ({
      ...current,
      ...cambios
    })
  }
);
```

**Breaking Change**: Different error handling patterns required.

---

## 📅 Migration Timeline

### Phase 1: Immediate (v1.0 - Current)
- ✅ New DynamicSelect system available
- ⚠️ Legacy components marked as deprecated
- 📚 Documentation and migration guides provided

### Phase 2: Warning Period (v1.1 - 3 months)
- ⚠️ Deprecated components show console warnings
- 📢 Automated migration tools available
- 🎓 Team training sessions scheduled

### Phase 3: Removal (v2.0 - 6 months)
- ❌ Legacy components completely removed
- 🔧 Only new DynamicSelect system supported
- 📖 Updated documentation only

---

## 🔧 Migration Impact Assessment

### High Impact Changes

1. **Form Integration** (100% of forms affected)
   - Requires React Hook Form migration
   - Manual state management replacement
   - Validation schema updates

2. **Component Props** (100% of selects affected)
   - New prop interface
   - Callback function changes
   - Styling class updates

### Medium Impact Changes

1. **Testing** (80% of test files affected)
   - Component test updates
   - Form integration test changes
   - Hook test modifications

2. **Data Fetching** (60% of components affected)
   - Manual fetching removal
   - Error handling updates
   - Loading state management

### Low Impact Changes

1. **Styling** (30% of styles affected)
   - CSS class name changes
   - Custom styling updates
   - Theme integration

---

## ⚠️ Deprecated API Reference

### useReferenceData Hook

```typescript
/**
 * @deprecated Use useDynamicSelectOptions and useDynamicSelectValue instead
 * @removed In v2.0
 */
interface UseReferenceDataProps {
  type: 'categoria' | 'presentacion';
  idInstitucion: number;
  includeInactive?: boolean;
  enableCache?: boolean;
}

// DO NOT USE - Will be removed
const useReferenceData = ({
  type,
  idInstitucion,
  includeInactive = true,
  enableCache = true
}: UseReferenceDataProps) => {
  // Legacy implementation
};
```

### ReferenceDataSelect Component

```typescript
/**
 * @deprecated Use DynamicSelect with React Hook Form instead
 * @removed In v2.0
 */
interface ReferenceDataSelectProps {
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  options: Categoria[] | Presentacion[];
  loading?: boolean;
  type: 'categoria' | 'presentacion';
  // ... other props
}

// DO NOT USE - Will be removed
const ReferenceDataSelect: React.FC<ReferenceDataSelectProps> = ({
  value,
  onChange,
  options,
  loading,
  type
}) => {
  // Legacy implementation
};
```

---

## 🔄 Backward Compatibility

### Compatibility Mode (v1.0 Only)

For gradual migration, a compatibility layer is available:

```typescript
import { LegacyDynamicSelectCompat } from './components/LegacyCompat';

// Allows legacy props while using new implementation
<LegacyDynamicSelectCompat
  value={legacyValue}
  onChange={legacyOnChange}
  type="categoria"
  // Converts to React Hook Form internally
/>
```

**Note**: Compatibility mode will be removed in v2.0.

### Migration Utilities

```typescript
import { migrateLegacyForm, convertLegacyProps } from './utils/migration';

// Convert legacy form to React Hook Form
const { FormComponent, controller } = migrateLegacyForm(LegacyForm);

// Convert legacy props to new props
const newProps = convertLegacyProps(legacyProps);
```

---

## 🚨 Action Required

### For Development Teams

1. **Immediate Actions**
   - [ ] Review breaking changes documentation
   - [ ] Plan migration timeline for your components
   - [ ] Schedule team training sessions
   - [ ] Update development environment

2. **Short-term Actions (1-2 weeks)**
   - [ ] Begin migrating non-critical forms
   - [ ] Update test suites
   - [ ] Implement error handling patterns
   - [ ] Validate new functionality

3. **Long-term Actions (1-3 months)**
   - [ ] Complete migration of all forms
   - [ ] Remove legacy component dependencies
   - [ ] Update documentation
   - [ ] Team knowledge transfer

### For Product Teams

1. **Planning Considerations**
   - Schedule migration time in development sprints
   - Plan for thorough testing
   - Consider user training for new features
   - Plan for potential user experience changes

2. **Risk Mitigation**
   - Feature flags for gradual rollout
   - Comprehensive testing strategies
   - Rollback plans
   - User acceptance testing

---

## 📞 Support During Migration

### Available Resources

1. **Documentation**
   - [API Documentation](./DYNAMICSELECT_API_DOCUMENTATION.md)
   - [Migration Guide](./DYNAMICSELECT_MIGRATION_GUIDE.md)
   - [Troubleshooting Guide](./DYNAMICSELECT_TROUBLESHOOTING.md)

2. **Development Support**
   - Code review sessions
   - Pair programming opportunities
   - Office hours for migration questions
   - Sample migration repositories

3. **Tools & Utilities**
   - Automated migration scripts
   - Validation tools
   - Testing utilities
   - Performance monitoring

### Getting Help

1. **Technical Questions**
   - Create GitHub issues with migration questions
   - Join developer office hours
   - Review migration examples

2. **Migration Blocking Issues**
   - Contact development team directly
   - Schedule migration planning session
   - Request custom migration assistance

---

## 🎯 Migration Success Criteria

### Technical Success

- [ ] All forms use React Hook Form
- [ ] Legacy components removed
- [ ] Tests updated and passing
- [ ] Performance benchmarks met
- [ ] Type coverage maintained

### User Experience Success

- [ ] Feature parity maintained
- [ ] Performance improvements realized
- [ ] New features adopted
- [ ] User feedback positive
- [ ] Error rates reduced

### Development Success

- [ ] Team trained on new patterns
- [ ] Documentation complete
- [ ] Migration tools effective
- [ ] Development velocity maintained
- [ ] Code quality improved

---

## 📋 Final Checklist

### Before Migration Deadline

- [ ] Schedule migration planning meeting
- [ ] Assign migration responsibilities
- [ ] Set up development environment
- [ ] Review all breaking changes
- [ ] Plan testing strategy

### During Migration

- [ ] Migrate forms incrementally
- [ ] Update tests continuously
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Document issues and solutions

### After Migration

- [ ] Validate all functionality
- [ ] Remove legacy dependencies
- [ ] Update documentation
- [ ] Train remaining team members
- [ ] Plan future enhancements

---

*This breaking changes document will be updated throughout the migration process. Check back regularly for the latest information and guidance.*