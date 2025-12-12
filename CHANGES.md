# Changelog de Almacén 2.0

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Fixed
- **CRITICAL**: Bucle infinito "Maximum update depth exceeded" en formulario de Materia Prima
  - Arreglado interacción entre `setValue` con `shouldValidate: true` y useEffect
  - Implementado debounce de 500ms para validación de código de barras
  - Optimizado useEffect en BarcodeGenerator con useRef para prevenir bucles
  - Agregados comentarios explicativos y patrones de uso

### Changed
- Patrón de `setValue` ahora usa `shouldValidate: false` consistentemente
- Validación manual con `form.trigger()` y debounce para mejor UX
- Callbacks memoizados para prevenir re-renders innecesarios

### Technical Debt
- Documentación completa del problema y solución en `docs/PLAN_FIX_INFINITE_LOOP_FORMULARIO.md`
- README creado para componente BarcodeGenerator con patrones de uso

---

## [Previous Versions]

### Migration Notes

#### Patrones React Hook Form Establecidos

Para prevenir bucles infinitos en formularios con código de barras:

```typescript
// ✅ Patrón correcto
form.setValue('campo', valor, {
  shouldValidate: false,  // Siempre false
  shouldDirty: true,
  shouldTouch: true
});

// Validación manual con debounce
const debouncedValue = useDebounce(form.watch('campo'), 500);
useEffect(() => {
  if (debouncedValue) form.trigger('campo');
}, [debouncedValue, form.trigger]);
```

#### BarcodeGenerator Best Practices

```typescript
// Callback memoizado requerido
const handleChange = useCallback((value) => {
  // Lógica de actualización
}, [dependencies]);

<BarcodeGenerator
  onBarcodeChange={handleChange}  // Debe estar memoizado
  // ... otras props
/>
```

---

## Documentación de Referencia

- [Plan completo de fix del bucle infinito](docs/PLAN_FIX_INFINITE_LOOP_FORMULARIO.md)
- [Documentación de BarcodeGenerator](apps/electron-renderer/src/components/ui/BarcodeGenerator.README.md)
- [Patrones del proyecto](CLAUDE.md)