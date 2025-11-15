# Plan de Implementación: Funcionalidad "Ver Detalles" en Gestión de Almacén

## 📋 Resumen del Problema

Los botones "ver detalles" (👁️) en la tabla de gestión de almacén muestran `onclick="function noop$1() {}` en lugar de event handlers funcionales. Esto ocurre porque el componente `GestionMateriaPrima` espera una prop `onView` que nunca es proporcionada por el componente padre en `App.tsx`.

## 🔍 Diagnóstico Técnico

### Causa Raíz
- **Componente**: `GestionMateriaPrima.tsx` línea 389 define interface con `onView?: (material: MateriaPrima) => void`
- **Padre**: `App.tsx` línea 43 renderiza `<GestionMateriaPrima />` sin pasar props
- **Resultado**: `onView?.(material)` se convierte en `undefined?.(material)` → React reemplaza con `noop$1()`

### Evidencia Encontrada
- 3 botones con clase "sc-bjMIFn fqsaAC" (styled-components)
- Todos muestran `onclick="function noop$1() {}"`
- Infraestructura subyacente (DB, IPC, servicios) funciona correctamente
- Patrones de modales existentes (eliminar, ajuste stock) funcionan perfectamente

## 🎯 Estrategia de Solución

Implementar un sistema completo de modal siguiendo los patrones existentes en la aplicación. Basado en el análisis de 8 estrategias diferentes, 7/8 agentes coinciden en esta solución.

## 📝 Plan de Implementación Detallado

### Paso 1: Agregar Gestión de Estado para Modal

**Archivo**: `apps/electron-renderer/src/modules/materiaPrima/GestionMateriaPrima.tsx`

**Ubicación**: Después de línea 425 (junto a otros estados)

```typescript
const [showViewModal, setShowViewModal] = useState(false)
const [materialDetalle, setMaterialDetalle] = useState<MateriaPrimaDetail | null>(null)
const [loadingDetalle, setLoadingDetalle] = useState(false)
const [detalleError, setDetalleError] = useState<string | null>(null)
```

### Paso 2: Implementar Funciones Handler

**Ubicación**: Después de línea 512 (junto a otros handlers)

```typescript
const openViewModal = async (material: MateriaPrima) => {
  setSelectedMaterial(material)
  setShowViewModal(true)
  setDetalleError(null)
  setLoadingDetalle(true)

  try {
    const detalle = await materiaPrimaService.obtener(material.id)
    setMaterialDetalle(detalle)
  } catch (error) {
    console.error('Error al cargar detalles:', error)
    setDetalleError(error instanceof Error ? error.message : 'Error al cargar los detalles del material')
  } finally {
    setLoadingDetalle(false)
  }
}

const closeViewModal = () => {
  setShowViewModal(false)
  setSelectedMaterial(null)
  setMaterialDetalle(null)
  setDetalleError(null)
  setLoadingDetalle(false)
}
```

### Paso 3: Actualizar Event Handler del Botón

**Ubicación**: Línea 621

**Cambio**:
```typescript
// ANTES (línea 621):
onClick={() => onView?.(material)}

// DESPUÉS:
onClick={() => openViewModal(material)}
```

### Paso 4: Verificar Importaciones

**Ubicación**: Parte superior del archivo (línea 4 aprox)

Asegurar que el servicio esté importado:
```typescript
import { materiaPrimaService } from '../../services/materiaPrimaService'
```

### Paso 5: Implementar Componente Modal

**Ubicación**: Después de línea 763 (antes del cierre `</Container>`)

**Modal completo con styled-components**:
```typescript
{/* Modal de ver detalles */}
{showViewModal && selectedMaterial && (
  <Modal onClick={closeViewModal}>
    <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
      <ModalHeader>📋 Detalles del Material</ModalHeader>
      <ModalBody>
        {loadingDetalle ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #ecf0f1',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 15px auto'
            }} />
            Cargando detalles...
          </div>
        ) : detalleError ? (
          <div style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            color: '#c33',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>⚠️</div>
            {detalleError}
          </div>
        ) : materialDetalle ? (
          <div>
            {/* Información básica */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '15px', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                📦 Información General
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong>Código de Barras:</strong><br />
                  {materialDetalle.codigo_barras || 'N/A'}
                </div>
                <div>
                  <strong>Nombre:</strong><br />
                  {materialDetalle.nombre || 'N/A'}
                </div>
                <div>
                  <strong>Marca:</strong><br />
                  {materialDetalle.marca || 'N/A'}
                </div>
                <div>
                  <strong>Modelo:</strong><br />
                  {materialDetalle.modelo || 'N/A'}
                </div>
                <div>
                  <strong>Categoría:</strong><br />
                  {materialDetalle.categoria || 'N/A'}
                </div>
                <div>
                  <strong>Presentación:</strong><br />
                  {materialDetalle.presentacion || 'N/A'}
                </div>
              </div>
            </div>

            {/* Información de stock */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '15px', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                📊 Información de Stock
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong>Stock Actual:</strong><br />
                  <span style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: materialDetalle.stock_actual > materialDetalle.stock_minimo ? '#27ae60' :
                           materialDetalle.stock_actual > 0 ? '#f39c12' : '#e74c3c'
                  }}>
                    {materialDetalle.stock_actual || 0} unidades
                  </span>
                </div>
                <div>
                  <strong>Stock Mínimo:</strong><br />
                  {materialDetalle.stock_minimo || 0} unidades
                </div>
                <div>
                  <strong>Estado:</strong><br />
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    backgroundColor: materialDetalle.stock_actual > materialDetalle.stock_minimo ? '#d4edda' :
                                    materialDetalle.stock_actual > 0 ? '#fff3cd' : '#f8d7da',
                    color: materialDetalle.stock_actual > materialDetalle.stock_minimo ? '#155724' :
                          materialDetalle.stock_actual > 0 ? '#856404' : '#721c24'
                  }}>
                    {materialDetalle.stock_actual > materialDetalle.stock_minimo ? '✅ Normal' :
                     materialDetalle.stock_actual > 0 ? '⚠️ Stock Bajo' : '❌ Agotado'}
                  </span>
                </div>
                <div>
                  <strong>Costo Unitario:</strong><br />
                  ${materialDetalle.costo_unitario?.toFixed(2) || 'N/A'}
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '15px', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                ℹ️ Información Adicional
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong>ID Proveedor:</strong><br />
                  {materialDetalle.proveedor_id || 'No especificado'}
                </div>
                <div>
                  <strong>Fecha de Caducidad:</strong><br />
                  {materialDetalle.fecha_caducidad
                    ? new Date(materialDetalle.fecha_caducidad).toLocaleDateString('es-ES')
                    : 'No especificada'
                  }
                </div>
              </div>
              {materialDetalle.descripcion && (
                <div style={{ marginTop: '15px' }}>
                  <strong>Descripción:</strong><br />
                  <span style={{ color: '#495057' }}>
                    {materialDetalle.descripcion}
                  </span>
                </div>
              )}
            </div>

            {/* Fechas de auditoría */}
            <div>
              <h4 style={{ color: '#2c3e50', marginBottom: '15px', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                🕒 Información de Auditoría
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.9rem', color: '#6c757d' }}>
                <div>
                  <strong>Creado:</strong><br />
                  {materialDetalle.creado_en
                    ? new Date(materialDetalle.creado_en).toLocaleString('es-ES')
                    : 'N/A'
                  }
                </div>
                <div>
                  <strong>Actualizado:</strong><br />
                  {materialDetalle.actualizado_en
                    ? new Date(materialDetalle.actualizado_en).toLocaleString('es-ES')
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={closeViewModal}>
          Cerrar
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
)}
```

### Paso 6: Limpieza Opcional del Interface

**Ubicación**: Líneas 387-390 y 404-406

**Opcional**: Remover la prop `onView` ya no necesaria:
```typescript
// Interface antes:
interface GestionMateriaPrimaProps {
  onEdit?: (material: MateriaPrima) => void
  onView?: (material: MateriaPrima) => void  // ← Eliminar esta línea
}

// Interface después:
interface GestionMateriaPrimaProps {
  onEdit?: (material: MateriaPrima) => void
}

// Component props antes:
export const GestionMateriaPrima: React.FC<GestionMateriaPrimaProps> = ({
  onEdit,
  onView  // ← Eliminar esta línea
}) => {

// Component props después:
export const GestionMateriaPrima: React.FC<GestionMateriaPrimaProps> = ({
  onEdit
}) => {
```

## 🧪 Plan de Pruebas

### Pruebas Funcionales
1. **Click en Botón**: Verificar que el modal se abre al hacer clic en 👁️
2. **Estado de Carga**: Confirmar que muestra "Cargando detalles..." al iniciar
3. **Datos Cargados**: Verificar que se muestra información completa del material
4. **Manejo de Errores**: Probar con material inexistente o errores de red
5. **Cierre Modal**: Verificar que se puede cerrar con botón "Cerrar" o clic fuera

### Pruebas de UI/UX
1. **Diseño Responsivo**: Probar en diferentes tamaños de pantalla
2. **Accesibilidad**: Verificar navegación por teclado y lectores de pantalla
3. **Performance**: Confirmar que no hay re-renders innecesarios
4. **Consistencia**: Comparar estilo con otros modales existentes

## 📊 Beneficios Esperados

### Beneficios Técnicos
- ✅ **Sigue Patrones Existentes**: Usa misma estructura que modales funcionales
- ✅ **Type Safe**: Mantiene seguridad de tipos TypeScript
- ✅ **Manejo de Errores**: Incluye manejo robusto de errores
- ✅ **Performance**: Carga datos bajo demanda (lazy loading)
- ✅ **State Management**: Gestión adecuada de estado y cleanup

### Beneficios de Usuario
- ✅ **Información Completa**: Acceso a todos los detalles del material
- ✅ **Feedback Visual**: Estados de carga y errores claros
- ✅ **UX Consistente**: Sigue patrones de interfaz existentes
- ✅ **Accesibilidad**: Soporte para navegación por teclado y lectores

## 🔧 Consideraciones Técnicas

### Dependencias Existentes
- `materiaPrimaService.obtener()` ya está implementado
- Componentes de modal ya existen y funcionan
- Tipos `MateriaPrimaDetail` ya están definidos
- styled-components ya está configurado

### Integración con Sistema
- **Base de Datos**: Usa consultas existentes de PostgreSQL
- **IPC**: Comunica con main process vía canales existentes
- **Tipado**: Utiliza tipos compartidos del monorepo
- **Estilos**: Sigue tema visual existente de la aplicación

## 📋 Checklist de Implementación

- [ ] Agregar variables de estado para modal
- [ ] Implementar funciones `openViewModal` y `closeViewModal`
- [ ] Modificar event handler del botón
- [ ] Verificar importaciones del servicio
- [ ] Implementar JSX del modal completo
- [ ] Probar funcionalidad end-to-end
- [ ] Verificar manejo de errores
- [ ] Confirmar responsive design
- [ ] Validar accesibilidad
- [ ] Limpiar código innecesario (props opcionales)

## 🎯 Resultado Final

Después de la implementación:
1. Los botones 👁️ tendrán event handlers funcionales
2. Los usuarios podrán ver detalles completos de cada material
3. La información incluirá stock, costos, fechas y datos de auditoría
4. El sistema será robusto con manejo de errores y estados de carga
5. La experiencia será consistente con otras funcionalidades de la aplicación

## 📝 Notas Adicionales

- **Mínimo Impacto**: Solo se modifica un archivo principal
- **Sin Cambios Roturos**: La implementación es backward compatible
- **Escalable**: El patrón puede reutilizarse para otras vistas de detalles
- **Mantenible**: Código bien estructurado y documentado

---

**Estado del Plan**: ✅ Listo para implementación
**Complejidad**: 🟡 Media
**Tiempo Estimado**: 2-3 horas
**Riesgo**: 🟢 Bajo