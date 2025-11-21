# Plan de Rollback - Fix Eliminación Materiales INACTIVOS Issue #4

## 🚨 Propósito del Plan
Este documento describe el procedimiento para revertir los cambios del fix de eliminación de materiales INACTIVOS en caso de que se detecten problemas críticos en producción.

## 📋 Cambio Principal Revertir
**Archivo**: `backend/repositories/materiaPrimaRepo.ts`
**Método**: `delete(id: string, usuarioId?: string)`
**Línea**: 614
**Cambio**: Re-add filtro `activo = true` en la consulta de búsqueda

## 🔄 Procedimiento de Rollback

### Opción 1: Rollback Completo (Recomendado)
```bash
# 1. Identificar el commit de backup
git log --oneline -10

# 2. Revertir al commit de backup pre-despliegue
git revert 0df6927 --no-edit

# 3. Verificar los cambios revertidos
git diff HEAD~1

# 4. Forzar push si es necesario (con cuidado)
git push origin main --force-with-lease
```

### Opción 2: Rollback Manual (Si solo se necesita revertir el fix específico)
```bash
# 1. Editar manualmente el archivo materiaPrimaRepo.ts
# 2. En la línea 614, re-add la línea:
.where('activo', '=', true)

# 3. Commit del cambio
git add backend/repositories/materiaPrimaRepo.ts
git commit -m "ROLLBACK: Re-add filtro activo=true en materiaPrimaRepo.ts:614"

# 4. Push a producción
git push origin main
```

## 🎯 Código Específico para Rollback

### Cambio a Revertir en materiaPrimaRepo.ts:614
```typescript
// ESTADO ACTUAL (con fix)
const material = await trx
  .selectFrom('materia_prima')
  .selectAll()
  .where('id', '=', id)
  // Sin filtro de activo para permitir eliminar INACTIVOS
  .executeTakeFirst()

// ESTADO POST-ROLLBACK (revertir a original)
const material = await trx
  .selectFrom('materia_prima')
  .selectAll()
  .where('id', '=', id)
  .where('activo', '=', true)  // ← RE-ADD ESTA LÍNEA
  .executeTakeFirst()
```

## ⚠️ Criterios para Activar Rollback

### Problemas Críticos que Requieren Rollback Inmediato
1. **Pérdida de Datos**: Eliminación accidental de materiales con stock > 0
2. **Corrupción de Datos**: Inconsistencias en la base de datos
3. **Performance Crítico**: Degradación severa del rendimiento (>50%)
4. **Errores en Cascada**: Fallas en otros módulos relacionados
5. **Bloqueo Operativo**: La aplicación no funciona correctamente

### Problemas que NO Requieren Rollback
1. **Issues Menores de UI**: Problemas cosméticos en la interfaz
2. **Warnings de Logs**: Mensajes que no afectan funcionalidad
3. **Performance Leve**: Degradación menor al 10%
4. **Issues de Testing**: Fallos en tests que no afectan producción

## 🕐 Tiempos de Respuesta

### Niveles de Severidad
- **CRÍTICO**: Rollback inmediato (< 30 minutos)
- **ALTO**: Rollback en 2 horas
- **MEDIO**: Evaluar en 24 horas
- **BAJO**: Monitorear y programar fix

### Procedimiento por Severidad
```
CRÍTICO: 
├── Notificar equipo inmediatamente
├── Ejecutar rollback completo
├── Verificar funcionamiento
└── Comunicar a stakeholders

ALTO:
├── Evaluar impacto
├── Decidir rollback vs hotfix
├── Ejecutar acción decidida
└── Documentar lección aprendida

MEDIO/BAJO:
├── Monitorear comportamiento
├── Recopilar datos
├── Programar fix planificado
└── Comunicar progreso
```

## 🧪 Verificación Post-Rollback

### Checklist de Validación
- [ ] La aplicación inicia correctamente
- [ ] Los materiales ACTIVOS pueden eliminarse con stock = 0
- [ ] Los materiales INACTIVOS NO pueden eliminarse (comportamiento original)
- [ ] Las validaciones de stock funcionan correctamente
- [ ] La auditoría se registra apropiadamente
- [ ] No hay errores en los logs
- [ ] El rendimiento es aceptable
- [ ] Otras operaciones CRUD funcionan normalmente

### Tests de Regresión
```bash
# Ejecutar suite de tests completa
pnpm --filter electron-renderer test
pnpm --filter electron-renderer test:accessibility

# Verificar linting
pnpm --filter electron-renderer lint

# Probar manualmente la funcionalidad
pnpm dev
```

## 📞 Contactos y Comunicación

### Equipo de Respuesta
- **Desarrollador Principal**: [Nombre]
- **DevOps**: [Nombre]
- **QA Lead**: [Nombre]
- **Product Owner**: [Nombre]

### Canales de Comunicación
- **Emergencia**: Slack #production-alerts
- **Coordinación**: Slack #development
- **Stakeholders**: Email y llamada telefónica

## 📊 Monitoreo Durante Rollback

### Métricas Clave
1. **Error Rate**: < 0.1%
2. **Response Time**: < 500ms promedio
3. **Throughput**: > 100 req/min
4. **Database Connections**: < 80% utilización
5. **Memory Usage**: < 70% utilización

### Alerts Configuradas
- High error rate (> 1%)
- Database connection failures
- Application crashes
- Performance degradation (> 50%)

## 📝 Documentación Post-Rollback

### Informe de Incidente
1. **Descripción del Problema**
2. **Impacto en Usuarios**
3. **Causa Raíz**
4. **Acciones Tomadas**
5. **Lecciones Aprendidas**
6. **Preventivas Futuras**

### Actualización de Documentación
- Actualizar `CHANGELOG.md`
- Documentar en `docs/PLAN_FIX_ELIMINACION_MATERIALES_INACTIVOS_ISSUE_4.md`
- Crear post-mortem si es necesario

## 🔄 Comandos Útiles

### Git Commands
```bash
# Ver historial reciente
git log --oneline -10

# Ver diff entre commits
git diff commit1 commit2

# Revertir commit específico
git revert <commit-hash>

# Reset a commit específico (con cuidado)
git reset --hard <commit-hash>

# Ver estado actual
git status
```

### Database Commands
```bash
# Verificar estado de la BD
psql -h localhost -U postgres -d almacen -c "SELECT COUNT(*) FROM materia_prima WHERE activo = false;"

# Verificar auditoría
psql -h localhost -U postgres -d almacen -c "SELECT COUNT(*) FROM materia_prima_auditoria WHERE DATE(eliminado_en) = CURRENT_DATE;"

# Verificar materiales eliminados recientemente
psql -h localhost -U postgres -d almacen -c "SELECT * FROM materia_prima WHERE eliminado_en IS NOT NULL ORDER BY eliminado_en DESC LIMIT 10;"
```

---

## 📋 Resumen Ejecutivo

**Riesgo del Fix**: Bajo
**Impacto del Rollback**: Mínimo (vuelve a estado conocido)
**Tiempo de Rollback**: 5-15 minutos
**Complejidad**: Baja

Este plan asegura que podemos revertir rápidamente si se detectan problemas, manteniendo la estabilidad del sistema mientras evaluamos el impacto del fix implementado.