# Plan: Fix Cache Refresh Issue for DynamicSelect Components

## Problem Summary
The cache refresh issue persists where after successfully editing a category or presentation, the dropdown shows the OLD name instead of the updated name unless the development server is restarted.

## Root Cause Analysis (from 8 Strategy Agents)

After analyzing the issue with eight different strategy-applier agents, we've identified the root causes:

1. **RefreshKey creates separate cache entries** - The refreshKey pattern causes mutations and queries to use different cache keys, preventing proper invalidation
2. **Structural sharing preserves old references** - TanStack Query's structural sharing with `true` prevents React from detecting changes
3. **Query key mismatch** - Mutations invalidate base keys but queries use extended keys with refreshKey
4. **Race condition** - The `onSettled` handler was invalidating cache after `onSuccess` updates

## Solution (Majority Approved)

The most effective solution, supported by multiple agents, is to:

1. Remove the refreshKey pattern completely
2. Disable structural sharing to force new object references
3. Use proper cache invalidation with exact key matching
4. Add forced refetch after successful mutations

## Implementation Plan

### Phase 1: Remove RefreshKey from DynamicSelect Component
**File**: `apps/electron-renderer/src/components/ui/DynamicSelect.tsx`

**Tasks**:
- [ ] Remove `refreshKey?: number` from `DynamicSelectProps` interface
- [ ] Remove `refreshKey = 0` from component props destructuring
- [ ] Remove `refreshKey` from `useDynamicSelectOptions` call
- [ ] Clean up any refreshKey related code

### Phase 2: Update useDynamicSelectOptions - Disable Structural Sharing
**File**: `apps/electron-renderer/src/hooks/useDynamicSelectOptions.ts`

**Tasks**:
- [ ] Remove `refreshKey?: number` from `UseDynamicSelectOptionsProps` interface
- [ ] Remove `refreshKey = 0` from hook parameters
- [ ] Remove refreshKey from all query keys
- [ ] Set `structuralSharing: false` in both `categoriasQuery` and `presentacionesQuery`
- [ ] Remove the `select` function that might preserve references

### Phase 3: Update Mutation Hooks - Add Forced Refetch
**File**: `apps/electron-renderer/src/hooks/useReferenceDataQuery.ts`

**Tasks**:
- [ ] Update `useEditarPresentacionMutation`:
  - Keep existing `onMutate` for optimistic updates
  - Keep `onError` for error handling
  - Update `onSuccess` to include `refetchQueries` after updating cache
  - Remove `onSettled` handler completely
- [ ] Update `useEditarCategoriaMutation`:
  - Apply same changes as above
  - Ensure both list and tree queries are refetched

### Phase 4: Clean Up Form Component
**File**: `apps/electron-renderer/src/modules/materiaPrima/Formulario.tsx`

**Tasks**:
- [ ] Remove refresh key state variables:
  - `const [presentacionesRefreshKey, setPresentacionesRefreshKey] = useState(0);`
  - `const [categoriasRefreshKey, setCategoriasRefreshKey] = useState(0);`
- [ ] Remove `setPresentacionesRefreshKey(prev => prev + 1)` from `handleGuardarPresentacion`
- [ ] Remove `setCategoriasRefreshKey(prev => prev + 1)` from `handleGuardarCategoria`
- [ ] Remove `refreshKey` props from both `MemoizedDynamicSelect` components

## Key Code Changes

### 1. DynamicSelect Component Changes
```typescript
// Remove from interface:
// refreshKey?: number;

// Remove from props:
// refreshKey = 0

// Remove from useDynamicSelectOptions call:
// refreshKey
```

### 2. useDynamicSelectOptions Changes
```typescript
// Critical change - disable structural sharing:
structuralSharing: false, // This forces new object references

// Remove from query keys:
// No more refreshKey in queryKey arrays
```

### 3. Mutation Hooks Changes
```typescript
// Add to onSuccess handler:
await queryClient.refetchQueries({
  queryKey: referenceDataKeys.presentacionesList(variables.idInstitucion)
});

// Remove completely:
// onSettled handler
```

## Why This Solution Works

1. **No Cache Key Mismatch**: By removing refreshKey, mutations and queries use identical cache keys
2. **Forced React Re-renders**: Disabling structural sharing ensures new object references trigger re-renders
3. **Fresh Data Guarantee**: `refetchQueries` ensures fresh data from server after successful mutations
4. **Simplified Architecture**: Removes complex refreshKey management that was causing issues

## Expected Outcomes

After implementing this solution:

- ✅ Modal closes successfully after editing
- ✅ Dropdown immediately shows updated names (e.g., "Pieza" → "Pieza 2")
- ✅ No need to restart development server
- ✅ Cache updates synchronously with UI updates
- ✅ Proper error handling maintained
- ✅ Optimistic updates still provide immediate feedback

## Alternative Strategies Considered

1. **Mutation State Pattern** - Update cache with new object references
2. **Manual Invalidation** - Create manual cache control system
3. **Subscription Pattern** - Implement reactive data flow with subscriptions
4. **Query Key Factory** - Standardize query key structure
5. **Redux-style Pattern** - Treat cache as normalized store
6. **Reactive Extensions (RxJS)** - Use observable streams for updates
7. **Event Bus Pattern** - Implement publish-subscribe for cache updates

The selected solution combines the best aspects of these approaches while maintaining simplicity and compatibility with the existing TanStack Query architecture.