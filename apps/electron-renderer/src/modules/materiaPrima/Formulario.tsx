import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import useMateriaPrima, { UseMateriaPrimaOptions } from '../../hooks/useMateriaPrima'
import type {
  MateriaPrimaDetail,
  NewMateriaPrima,
  MateriaPrimaUpdate
} from '../../../../shared/types/materiaPrima'

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
`

const Title = styled.h2`
  margin-bottom: 30px;
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
`

const Subtitle = styled.p`
  color: #7f8c8d;
  margin-bottom: 25px;
  font-size: 1rem;
`

const Form = styled.form`
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const FormGroup = styled.div`
  margin-bottom: 20px;

  &.full-width {
    grid-column: 1 / -1;
  }
`

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #34495e;
  font-size: 0.95rem;

  ${props => props.required && `
    &::after {
      content: ' *';
      color: #e74c3c;
    }
  `}
`

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background-color: #fff;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  &:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
    opacity: 0.6;
  }

  ${props => props.error && `
    border-color: #e74c3c;
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
  `}
`

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  font-size: 1rem;
  background-color: white;
  transition: all 0.2s ease;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  &:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
    opacity: 0.6;
  }

  ${props => props.error && `
    border-color: #e74c3c;
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
  `}
`

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  &:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
    opacity: 0.6;
  }

  ${props => props.error && `
    border-color: #e74c3c;
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
  `}
`

const ImagePreview = styled.div`
  margin-top: 10px;
  padding: 20px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  text-align: center;
  background-color: #f8f9fa;

  img {
    max-width: 200px;
    max-height: 200px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .placeholder {
    color: #7f8c8d;
    font-size: 0.9rem;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
`

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;

  ${props => props.variant === 'primary' && `
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #2980b9 0%, #21618c 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  `}

  ${props => props.variant === 'secondary' && `
    background: #95a5a6;
    color: white;

    &:hover:not(:disabled) {
      background: #7f8c8d;
      transform: translateY(-1px);
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
`

const ErrorMessage = styled.div`
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: '⚠️';
    font-size: 1.2rem;
  }
`

const SuccessMessage = styled.div`
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: '✅';
    font-size: 1.2rem;
  }
`

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-size: 1.1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;

  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid #ecf0f1;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const FieldError = styled.span`
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 5px;
  display: block;
`

const SectionTitle = styled.h3`
  margin: 30px 0 20px 0;
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 2px solid #ecf0f1;
`

const BarcodeSection = styled.div`
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
`

const presentaciones = [
  'Unidad',
  'Caja',
  'Paquete',
  'Saco',
  'Bolsa',
  'Kilogramo',
  'Gramo',
  'Litro',
  'Mililitro',
  'Metro',
  'Centímetro',
  'Rollo',
  'Tubo',
  'Botella',
  'Frasco'
]

const categorias = [
  'Construcción',
  'Electricidad',
  'Plomería',
  'Pinturas',
  'Herramientas',
  'Ferretería',
  'Limpieza',
  'Oficina',
  'Seguridad',
  'Jardinería',
  'Automotriz',
  'Electrónica',
  'Otros'
]

interface FormularioMateriaPrimaProps {
  materialId?: string
  onSave?: (material: MateriaPrimaDetail) => void
  onCancel?: () => void
}

export const MateriaPrimaFormulario: React.FC<FormularioMateriaPrimaProps> = ({
  materialId,
  onSave,
  onCancel
}) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const esEdicion = Boolean(materialId || id)
  const finalId = materialId || id

  const {
    crearMaterial,
    actualizarMaterial,
    obtenerMaterial,
    loading,
    error,
    clearError
  } = useMateriaPrima({ autoLoad: false })

  const [formData, setFormData] = useState<NewMateriaPrima | MateriaPrimaUpdate>(() => ({
    codigo_barras: '',
    nombre: '',
    marca: '',
    modelo: '',
    presentacion: 'Unidad',
    stock_actual: 0,
    stock_minimo: 0,
    costo_unitario: null,
    fecha_caducidad: null,
    imagen_url: '',
    descripcion: '',
    categoria: '',
    proveedor_id: null
  }))

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (esEdicion && finalId) {
      cargarMateriaPrima(finalId)
    }
  }, [esEdicion, finalId])

  const cargarMateriaPrima = async (id: string) => {
    try {
      clearError()
      const data = await obtenerMaterial(id)

      setFormData({
        codigo_barras: data.codigo_barras || '',
        nombre: data.nombre || '',
        marca: data.marca || '',
        modelo: data.modelo || '',
        presentacion: data.presentacion || 'Unidad',
        stock_actual: data.stock_actual || 0,
        stock_minimo: data.stock_minimo || 0,
        costo_unitario: data.costo_unitario || null,
        fecha_caducidad: data.fecha_caducidad ?
          new Date(data.fecha_caducidad).toISOString().split('T')[0] : '',
        imagen_url: data.imagen_url || '',
        descripcion: data.descripcion || '',
        categoria: data.categoria || '',
        proveedor_id: data.proveedor_id || null
      })
    } catch (err) {
      console.error('Error al cargar material:', err)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Validaciones requeridas
    if (!formData.codigo_barras?.trim()) {
      errors.codigo_barras = 'El código de barras es requerido'
    }

    if (!formData.nombre?.trim()) {
      errors.nombre = 'El nombre es requerido'
    }

    if (!formData.presentacion?.trim()) {
      errors.presentacion = 'La presentación es requerida'
    }

    // Validaciones de formato
    if (formData.stock_actual !== undefined && formData.stock_actual < 0) {
      errors.stock_actual = 'El stock actual no puede ser negativo'
    }

    if (formData.stock_minimo !== undefined && formData.stock_minimo < 0) {
      errors.stock_minimo = 'El stock mínimo no puede ser negativo'
    }

    if (formData.costo_unitario !== null && formData.costo_unitario !== undefined && formData.costo_unitario < 0) {
      errors.costo_unitario = 'El costo unitario no puede ser negativo'
    }

    // Validación de URL
    if (formData.imagen_url && formData.imagen_url.trim()) {
      try {
        new URL(formData.imagen_url)
      } catch {
        errors.imagen_url = 'La URL de la imagen no es válida'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value

    setFormData(prev => ({
      ...prev,
      [field]: field === 'stock_actual' || field === 'stock_minimo' || field === 'costo_unitario'
        ? (value === '' ? (field === 'costo_unitario' ? null : 0) : Number(value))
        : value
    }))

    // Limpiar error del campo
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    try {
      let materialGuardado: MateriaPrimaDetail

      if (esEdicion && finalId) {
        materialGuardado = await actualizarMaterial(finalId, formData as MateriaPrimaUpdate)
      } else {
        materialGuardado = await crearMaterial(formData as NewMateriaPrima)
      }

      setSuccess(true)
      setTimeout(() => {
        if (onSave) {
          onSave(materialGuardado)
        } else {
          navigate('/materia-prima')
        }
      }, 1500)

    } catch (err) {
      console.error('Error al guardar material:', err)
      // El error ya se maneja en el hook
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      navigate('/materia-prima')
    }
  }

  if (loading && esEdicion) {
    return <LoadingMessage>Cargando material...</LoadingMessage>
  }

  if (loading && esEdicion) {
    return <LoadingMessage>Cargando materia prima...</LoadingMessage>
  }

  return (
    <Container>
      <Title>
        {esEdicion ? '✏️ Editar Material' : '➕ Nuevo Material'}
      </Title>

      <Subtitle>
        {esEdicion
          ? 'Modifica los datos del material seleccionado'
          : 'Completa los datos para agregar un nuevo material al inventario'
        }
      </Subtitle>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>
        {esEdicion ? 'Material actualizado correctamente' : 'Material creado correctamente'}
      </SuccessMessage>}

      <Form onSubmit={handleSubmit}>
        {/* Sección de Información Básica */}
        <SectionTitle>📋 Información Básica</SectionTitle>
        <FormGrid>
          <FormGroup>
            <Label htmlFor="codigo_barras" required>Código de Barras</Label>
            <Input
              type="text"
              id="codigo_barras"
              value={formData.codigo_barras || ''}
              onChange={handleChange('codigo_barras')}
              placeholder="Ej: 7501234567890"
              error={!!fieldErrors.codigo_barras}
              disabled={loading}
            />
            {fieldErrors.codigo_barras && <FieldError>{fieldErrors.codigo_barras}</FieldError>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="nombre" required>Nombre del Material</Label>
            <Input
              type="text"
              id="nombre"
              value={formData.nombre || ''}
              onChange={handleChange('nombre')}
              placeholder="Ej: Tornillo Phillips"
              error={!!fieldErrors.nombre}
              disabled={loading}
            />
            {fieldErrors.nombre && <FieldError>{fieldErrors.nombre}</FieldError>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="marca">Marca</Label>
            <Input
              type="text"
              id="marca"
              value={formData.marca || ''}
              onChange={handleChange('marca')}
              placeholder="Ej: Stanley"
              disabled={loading}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="modelo">Modelo</Label>
            <Input
              type="text"
              id="modelo"
              value={formData.modelo || ''}
              onChange={handleChange('modelo')}
              placeholder="Ej: PH-2"
              disabled={loading}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="presentacion" required>Presentación</Label>
            <Select
              id="presentacion"
              value={formData.presentacion || 'Unidad'}
              onChange={handleChange('presentacion')}
              error={!!fieldErrors.presentacion}
              disabled={loading}
            >
              {presentaciones.map(pres => (
                <option key={pres} value={pres}>
                  {pres}
                </option>
              ))}
            </Select>
            {fieldErrors.presentacion && <FieldError>{fieldErrors.presentacion}</FieldError>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="categoria">Categoría</Label>
            <Select
              id="categoria"
              value={formData.categoria || ''}
              onChange={handleChange('categoria')}
              disabled={loading}
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </FormGroup>
        </FormGrid>

        {/* Sección de Stock */}
        <SectionTitle>📦 Gestión de Stock</SectionTitle>
        <FormGrid>
          <FormGroup>
            <Label htmlFor="stock_actual">Stock Actual</Label>
            <Input
              type="number"
              id="stock_actual"
              value={formData.stock_actual || 0}
              onChange={handleChange('stock_actual')}
              min="0"
              step="0.01"
              placeholder="0"
              error={!!fieldErrors.stock_actual}
              disabled={loading}
            />
            {fieldErrors.stock_actual && <FieldError>{fieldErrors.stock_actual}</FieldError>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="stock_minimo">Stock Mínimo</Label>
            <Input
              type="number"
              id="stock_minimo"
              value={formData.stock_minimo || 0}
              onChange={handleChange('stock_minimo')}
              min="0"
              step="0.01"
              placeholder="0"
              error={!!fieldErrors.stock_minimo}
              disabled={loading}
            />
            {fieldErrors.stock_minimo && <FieldError>{fieldErrors.stock_minimo}</FieldError>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="costo_unitario">Costo Unitario</Label>
            <Input
              type="number"
              id="costo_unitario"
              value={formData.costo_unitario || ''}
              onChange={handleChange('costo_unitario')}
              min="0"
              step="0.01"
              placeholder="0.00"
              error={!!fieldErrors.costo_unitario}
              disabled={loading}
            />
            {fieldErrors.costo_unitario && <FieldError>{fieldErrors.costo_unitario}</FieldError>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="fecha_caducidad">Fecha de Caducidad</Label>
            <Input
              type="date"
              id="fecha_caducidad"
              value={formData.fecha_caducidad || ''}
              onChange={handleChange('fecha_caducidad')}
              disabled={loading}
            />
          </FormGroup>
        </FormGrid>

        {/* Sección de Información Adicional */}
        <SectionTitle>ℹ️ Información Adicional</SectionTitle>
        <FormGrid>
          <FormGroup className="full-width">
            <Label htmlFor="proveedor_id">ID del Proveedor</Label>
            <Input
              type="text"
              id="proveedor_id"
              value={formData.proveedor_id || ''}
              onChange={handleChange('proveedor_id')}
              placeholder="UUID del proveedor (opcional)"
              disabled={loading}
            />
          </FormGroup>

          <FormGroup className="full-width">
            <Label htmlFor="imagen_url">URL de Imagen</Label>
            <Input
              type="url"
              id="imagen_url"
              value={formData.imagen_url || ''}
              onChange={handleChange('imagen_url')}
              placeholder="https://ejemplo.com/imagen.jpg"
              error={!!fieldErrors.imagen_url}
              disabled={loading}
            />
            {fieldErrors.imagen_url && <FieldError>{fieldErrors.imagen_url}</FieldError>}

            {(formData.imagen_url) && (
              <ImagePreview>
                {formData.imagen_url ? (
                  <img
                    src={formData.imagen_url}
                    alt="Vista previa"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="placeholder">Sin imagen</div>
                )}
              </ImagePreview>
            )}
          </FormGroup>

          <FormGroup className="full-width">
            <Label htmlFor="descripcion">Descripción</Label>
            <TextArea
              id="descripcion"
              value={formData.descripcion || ''}
              onChange={handleChange('descripcion')}
              placeholder="Descripción detallada del material..."
              disabled={loading}
            />
          </FormGroup>
        </FormGrid>

        <ButtonGroup>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || success}
          >
            {loading
              ? 'Guardando...'
              : (esEdicion ? '💾 Actualizar' : '➕ Crear')
            }
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            ❌ Cancelar
          </Button>
        </ButtonGroup>
      </Form>
    </Container>
  )
}

// Export por defecto para compatibilidad
export default MateriaPrimaFormulario