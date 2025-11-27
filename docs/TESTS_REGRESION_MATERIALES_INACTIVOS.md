# 🧪 Tests de Regresión - Issue #5 Materiales INACTIVO

## Test 1: findAll() incluye materiales INACTIVO

**Test ID:** REG-MAT-001
**Descripción:** Verificar que el método `findAll()` del repositorio retorna materiales INACTIVO cuando no debería

**Resultado esperado (actual):** ✅ INCLUYE INACTIVO (comportamiento incorrecto)
**Resultado deseado (post-fix):** ❌ EXCLUIR INACTIVO

```typescript
// Test de comportamiento actual
test('findAll() incluye materiales INACTIVO - comportamiento actual INCORRECTO', async () => {
  // Setup: Crear materiales ACTIVO e INACTIVO
  const materialActivo = await crearMaterial({ nombre: 'Material Activo', activo: true })
  const materialInactivo = await crearMaterial({ nombre: 'Material Inactivo', activo: false })

  // Ejecución: Llamar findAll() sin filtros
  const resultado = await materiaPrimaRepo.findAll()

  // Verificación (comportamiento actual incorrecto)
  expect(resultado).toContainEqual(materialActivo)  // ✅ Correcto
  expect(resultado).toContainEqual(materialInactivo) // ❌ ERROR: No debería incluir INACTIVO

  console.log(`❌ REGRESIÓN: findAll() retornó ${resultado.length} materiales incluyendo INACTIVO`)
})
```

**Archivo impactado:** `backend/repositories/materiaPrimaRepo.ts:246-301`

---

## Test 2: Dashboard muestra estadísticas incorrectas

**Test ID:** REG-MAT-002
**Descripción:** Verificar que el Dashboard calcula estadísticas incluyendo materiales INACTIVO

**Resultado esperado (actual):** ✅ INCLUYE INACTIVO (comportamiento incorrecto)
**Resultado deseado (post-fix):** ❌ EXCLUIR INACTIVO

```typescript
// Test de comportamiento actual
test('Dashboard calcula estadísticas con materiales INACTIVO - comportamiento INCORRECTO', async () => {
  // Setup: Crear materiales con diferentes estatus y stock
  await crearMaterial({ nombre: 'Activo con stock', activo: true, stock_actual: 100, costo_unitario: 10 })
  await crearMaterial({ nombre: 'Inactivo con stock', activo: false, stock_actual: 50, costo_unitario: 20 })
  await crearMaterial({ nombre: 'Activo sin stock', activo: true, stock_actual: 0 })
  await crearMaterial({ nombre: 'Inactivo sin stock', activo: false, stock_actual: 0 })

  // Ejecución: Calcular estadísticas
  const stats = await materiaPrimaRepo.getStats()

  // Verificación (comportamiento actual incorrecto)
  expect(stats.total).toBe(4)  // ❌ ERROR: Debería ser 2 (solo ACTIVO)
  expect(stats.valorTotal).toBe(1200)  // ❌ ERROR: Debería ser 1000 (solo ACTIVO)

  console.log(`❌ REGRESIÓN: Estadísticas incluyen INACTIVO - Total: ${stats.total}, Valor: $${stats.valorTotal}`)
})
```

**Archivos impactados:**
- `backend/repositories/materiaPrimaRepo.ts:738-805` (getStats)
- `apps/electron-renderer/src/modules/dashboard/DashboardPage.tsx:55-59`

---

## Test 3: Consultas Avanzadas muestran INACTIVO

**Test ID:** REG-MAT-003
**Descripción:** Verificar que las consultas avanzadas retornan materiales INACTIVO

**Resultado esperado (actual):** ✅ MUESTRA INACTIVO (comportamiento incorrecto)
**Resultado deseado (post-fix):** ❌ OCULTAR INACTIVO

```typescript
// Test de comportamiento actual
test('Consultas avanzadas muestran materiales INACTIVO - comportamiento INCORRECTO', async () => {
  // Setup: Crear materiales ACTIVO e INACTIVO
  const Activo = await crearMaterial({ nombre: 'Tornillo Activo', categoria: 'Herramientas', activo: true })
  const Inactivo = await crearMaterial({ nombre: 'Tornillo Inactivo', categoria: 'Herramientas', activo: false })

  // Ejecución: Buscar por categoría
  const resultados = await materiaPrimaRepo.findAll({ categoria: 'Herramientas' })

  // Verificación (comportamiento actual incorrecto)
  expect(resultados).toHaveLength(2)  // ❌ ERROR: Debería ser 1
  expect(resultados.map(r => r.nombre)).toContain('Tornillo Inactivo')  // ❌ ERROR: No debería aparecer

  console.log(`❌ REGRESIÓN: Consulta por categoría retornó ${resultados.length} materiales incluyendo INACTIVO`)
})
```

**Archivos impactados:**
- `apps/electron-renderer/src/modules/materiaPrima/ConsultasAvanzadas.tsx:93`
- `backend/repositories/materiaPrimaRepo.ts:284`

---

## Test 4: Stock Bajo reporta materiales INACTIVO

**Test ID:** REG-MAT-004
**Descripción:** Verificar que el reporte de stock bajo incluye materiales INACTIVO

**Resultado esperado (actual):** ❌ EXCLUIR INACTIVO (comportamiento correcto)
**Resultado deseado (post-fix):** ✅ MANTENER EXCLUSIÓN

```typescript
// Test de comportamiento actual
test('Stock bajo excluye correctamente materiales INACTIVO - comportamiento CORRECTO', async () => {
  // Setup: Crear materiales con stock bajo y diferentes estatus
  await crearMaterial({ nombre: 'Activo Bajo Stock', activo: true, stock_actual: 1, stock_minimo: 5 })
  await crearMaterial({ nombre: 'Inactivo Bajo Stock', activo: false, stock_actual: 1, stock_minimo: 5 })

  // Ejecución: Obtener materiales con stock bajo
  const lowStock = await materiaPrimaRepo.getLowStockItems()

  // Verificación (comportamiento correcto)
  expect(lowStock).toHaveLength(1)  // ✅ CORRECTO: Solo incluye ACTIVO
  expect(lowStock[0].nombre).toBe('Activo Bajo Stock')  // ✅ CORRECTO

  console.log(`✅ COMPORTAMIENTO CORRECTO: Stock bajo excluye INACTIVO (${lowStock.length} materiales)`)
})
```

**Archivo impactado:** `backend/repositories/materiaPrimaRepo.ts:386-408`

---

## Test 5: Autocompletado en formularios incluye INACTIVO

**Test ID:** REG-MAT-005
**Descripción:** Verificar que los formularios muestran materiales INACTIVO en autocompletado

**Resultado esperado (actual):** ✅ MUESTRA INACTIVO (comportamiento incorrecto)
**Resultado deseado (post-fix):** ❌ EXCLUIR INACTIVO

```typescript
// Test de comportamiento actual
test('Formularios incluyen materiales INACTIVO en autocompletado - comportamiento INCORRECTO', async () => {
  // Setup: Crear materiales ACTIVO e INACTIVO
  await crearMaterial({ nombre: 'Material Activo', activo: true })
  await crearMaterial({ nombre: 'Material Inactivo', activo: false })

  // Ejecución: Buscar materiales para autocomplete
  const resultados = await materiaPrimaRepo.search('Material')

  // Verificación (comportamiento actual incorrecto)
  expect(resultados).toHaveLength(2)  // ❌ ERROR: Debería ser 1
  expect(resultados.map(r => r.nombre)).toContain('Material Inactivo')  // ❌ ERROR: No debería aparecer

  console.log(`❌ REGRESIÓN: Autocompletado retornó ${resultados.length} materiales incluyendo INACTIVO`)
})
```

**Archivos impactados:**
- `backend/repositories/materiaPrimaRepo.ts:351-380` (search)
- `apps/electron-renderer/src/components/forms/MovementForm.tsx`

---

## 📊 Resumen de Tests de Regresión

| Test ID | Comportamiento Actual | Comportamiento Deseado | Impacto |
|---------|----------------------|----------------------|---------|
| REG-MAT-001 | ✅ Incluye INACTIVO | ❌ Excluir INACTIVO | Crítico: findAll() |
| REG-MAT-002 | ✅ Incluye INACTIVO | ❌ Excluir INACTIVO | Crítico: Estadísticas Dashboard |
| REG-MAT-003 | ✅ Muestra INACTIVO | ❌ Ocultar INACTIVO | Alto: Consultas Avanzadas |
| REG-MAT-004 | ✅ Excluye INACTIVO | ✅ Mantener exclusión | ✅ CORRECTO: Stock Bajo |
| REG-MAT-005 | ✅ Muestra INACTIVO | ❌ Excluir INACTIVO | Alto: Formularios |

## 🎯 Criterios de Aceptación para Tests Post-Fix

1. **REG-MAT-001:** `findAll()` debe retornar solo materiales con `activo = true` por defecto
2. **REG-MAT-002:** Dashboard debe calcular estadísticas solo con materiales ACTIVO
3. **REG-MAT-003:** Consultas avanzadas deben excluir INACTIVO por defecto
4. **REG-MAT-004:** Stock bajo debe mantener exclusión de INACTIVO (sin cambios)
5. **REG-MAT-005:** Autocompletado debe mostrar solo materiales ACTIVO

## 📋 Ejecución de Tests

```bash
# Ejecutar todos los tests de regresión
npm run test:regresion-materiales

# Ejecutar test específico
npm run test:regresion-materiales -- --testNamePattern="REG-MAT-001"

# Ver reporte de cobertura
npm run test:regresion-materiales -- --coverage
```

## 🔄 Notas Importantes

1. **Baseline establecido:** Estos tests documentan el comportamiento actual incorrecto
2. **Validación post-fix:** Los mismos tests deben fallar después de la corrección
3. **Métricas cuantificables:** Todos los tests miden resultados específicos (counts, valores)
4. **Impacto completo:** Los tests cubren todos los módulos identificados en la auditoría