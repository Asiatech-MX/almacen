import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import useMateriaPrima, { useStockMateriaPrima } from '../../hooks/useMateriaPrima'
import useDebounce from '../../hooks/useDebounce'
import { materiaPrimaService } from '../../services/materiaPrimaService'
import type { MateriaPrima, MateriaPrimaDetail } from '../../../../shared/types/materiaPrima'

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const Title = styled.h2`
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
`

const SearchContainer = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
  max-width: 600px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 12px 16px;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`

const FilterSelect = styled.select`
  padding: 12px 16px;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;

  ${props => props.variant === 'primary' && `
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #2980b9 0%, #21618c 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }
  `}

  ${props => props.variant === 'danger' && `
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
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

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`

const StatCard = styled.div<{ color?: string }>`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.color || '#3498db'};

  h3 {
    margin: 0 0 10px 0;
    color: #7f8c8d;
    font-size: 0.9rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .value {
    font-size: 2rem;
    font-weight: 700;
    color: ${props => props.color || '#3498db'};
    margin-bottom: 5px;
  }

  .description {
    color: #95a5a6;
    font-size: 0.85rem;
  }
`

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const TableHeader = styled.thead`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
`

const TableRow = styled.tr<{ selected?: boolean }>`
  &:hover {
    background-color: #f8f9fa;
  }

  ${props => props.selected && `
    background-color: #e3f2fd;
  `}
`

const TableCell = styled.td`
  padding: 16px;
  border-bottom: 1px solid #ecf0f1;
  vertical-align: middle;

  &:first-child {
    font-weight: 600;
    color: #2c3e50;
  }
`

const TableHeaderCell = styled.th`
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
`

const StockStatus = styled.span<{ status: 'normal' | 'low' | 'out' }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${props => props.status === 'normal' && `
    background-color: #d4edda;
    color: #155724;
  `}

  ${props => props.status === 'low' && `
    background-color: #fff3cd;
    color: #856404;
  `}

  ${props => props.status === 'out' && `
    background-color: #f8d7da;
    color: #721c24;
  `}
`

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`

const IconButton = styled.button<{ variant?: 'edit' | 'delete' | 'view' }>`
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  ${props => props.variant === 'edit' && `
    background-color: #3498db;
    color: white;

    &:hover {
      background-color: #2980b9;
      transform: scale(1.1);
    }
  `}

  ${props => props.variant === 'delete' && `
    background-color: #e74c3c;
    color: white;

    &:hover {
      background-color: #c0392b;
      transform: scale(1.1);
    }
  `}

  ${props => props.variant === 'view' && `
    background-color: #95a5a6;
    color: white;

    &:hover {
      background-color: #7f8c8d;
      transform: scale(1.1);
    }
  `}
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

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;

  h3 {
    margin-bottom: 10px;
    color: #95a5a6;
  }

  p {
    margin-bottom: 20px;
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

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
`

const ModalHeader = styled.h3`
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.5rem;
`

const ModalBody = styled.div`
  margin-bottom: 30px;
  color: #495057;
  line-height: 1.6;
`

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`

interface GestionMateriaPrimaProps {
  // La prop onEdit ya no es necesaria ya que usamos navegación programática
}

// Función utilitaria para validación segura de propiedades
const safeGet = <T, K extends keyof T>(obj: T | null | undefined, key: K, defaultValue: T[K]): T[K] => {
  // Primero verificamos que obj no sea null ni undefined
  if (obj === null || obj === undefined) {
    return defaultValue
  }

  // Ahora es seguro acceder a la propiedad
  const value = obj[key]
  return (value === undefined || value === null) ? defaultValue : value
}

export const GestionMateriaPrima: React.FC<GestionMateriaPrimaProps> = () => {
  const navigate = useNavigate()
  const {
    materiales,
    loading,
    error,
    cargarMateriales,
    eliminarMaterial,
    estadisticas,
    clearError
  } = useMateriaPrima({ autoLoad: true })

  const { loading: stockLoading, actualizarStock } = useStockMateriaPrima()

  const [searchTerm, setSearchTerm] = useState('')

  const handleEdit = (material: MateriaPrima) => {
    if (material?.id) {
      navigate(`/materia-prima/editar/${material.id}`)
    }
  }
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')
  const [selectedMaterial, setSelectedMaterial] = useState<MateriaPrima | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockAmount, setStockAmount] = useState('')
  const [stockReason, setStockReason] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [materialDetalle, setMaterialDetalle] = useState<MateriaPrimaDetail | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [detalleError, setDetalleError] = useState<string | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Obtener categorías únicas
  const categorias = Array.from(new Set(materiales.map(m => m.categoria).filter(Boolean)))

  // Filtrar materiales con validaciones robustas
  const materialesFiltrados = materiales.filter(material => {
    if (!material) return false

    const nombre = safeGet(material, 'nombre', '')
    const codigoBarras = safeGet(material, 'codigo_barras', '')
    const marca = safeGet(material, 'marca', '')
    const categoria = safeGet(material, 'categoria', '')
    const stockActual = safeGet(material, 'stock_actual', 0)
    const stockMinimo = safeGet(material, 'stock_minimo', 0)

    const matchesSearch = !debouncedSearchTerm ||
      nombre.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      codigoBarras.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (marca && marca.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))

    const matchesCategoria = !categoriaFilter || categoria === categoriaFilter

    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'low' && stockActual <= stockMinimo) ||
      (stockFilter === 'out' && stockActual === 0)

    return matchesSearch && matchesCategoria && matchesStock
  })

  useEffect(() => {
    cargarMateriales({
      ...(categoriaFilter && { categoria: categoriaFilter }),
      ...(stockFilter === 'low' && { bajoStock: true })
    })
  }, [categoriaFilter, stockFilter])

  const getStockStatus = (material: MateriaPrima | null | undefined): 'normal' | 'low' | 'out' => {
    if (!material) return 'out'

    const stock = safeGet(material, 'stock_actual', 0)
    const minStock = safeGet(material, 'stock_minimo', 0)

    if (stock === 0) return 'out'
    if (stock <= minStock) return 'low'
    return 'normal'
  }

  const handleDelete = async () => {
    if (!selectedMaterial) return

    try {
      await eliminarMaterial(selectedMaterial.id)
      setShowDeleteModal(false)
      setSelectedMaterial(null)
    } catch (err) {
      console.error('Error al eliminar material:', err)
    }
  }

  const handleStockUpdate = async () => {
    if (!selectedMaterial || !stockAmount || !stockReason) return

    try {
      const amount = parseFloat(stockAmount)
      await actualizarStock(selectedMaterial.id, amount, stockReason)
      setShowStockModal(false)
      setSelectedMaterial(null)
      setStockAmount('')
      setStockReason('')
    } catch (err) {
      console.error('Error al actualizar stock:', err)
    }
  }

  const openDeleteModal = (material: MateriaPrima) => {
    setSelectedMaterial(material)
    setShowDeleteModal(true)
  }

  const openStockModal = (material: MateriaPrima) => {
    setSelectedMaterial(material)
    setShowStockModal(true)
  }

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

  if (loading && materiales.length === 0) {
    return <LoadingMessage>Cargando materiales...</LoadingMessage>
  }

  return (
    <Container>
      <Header>
        <Title>🗂️ Gestión de Materia Prima</Title>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Buscar por nombre, código o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FilterSelect
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
          >
            <option value="all">Todo el stock</option>
            <option value="low">Stock bajo</option>
            <option value="out">Sin stock</option>
          </FilterSelect>
          <Button variant="primary" onClick={() => navigate('/materia-prima/nueva')}>
            ➕ Nuevo Material
          </Button>
        </SearchContainer>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <StatsContainer>
        <StatCard color="#3498db">
          <h3>Total Materiales</h3>
          <div className="value">{estadisticas.total}</div>
          <div className="description">Materiales registrados</div>
        </StatCard>
        <StatCard color="#f39c12">
          <h3>Stock Bajo</h3>
          <div className="value">{estadisticas.bajoStock}</div>
          <div className="description">Necesitan reabastecer</div>
        </StatCard>
        <StatCard color="#e74c3c">
          <h3>Sin Stock</h3>
          <div className="value">{estadisticas.sinStock}</div>
          <div className="description">Agotados</div>
        </StatCard>
        <StatCard color="#27ae60">
          <h3>Valor Total</h3>
          <div className="value">${estadisticas.valorTotal.toFixed(2)}</div>
          <div className="description">Valor del inventario</div>
        </StatCard>
      </StatsContainer>

      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Código</TableHeaderCell>
              <TableHeaderCell>Nombre</TableHeaderCell>
              <TableHeaderCell>Marca</TableHeaderCell>
              <TableHeaderCell>Categoría</TableHeaderCell>
              <TableHeaderCell>Stock</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell>Acciones</TableHeaderCell>
            </tr>
          </TableHeader>
          <tbody>
            {materialesFiltrados.map((material) => {
              if (!material || !material.id) return null

              const codigoBarras = safeGet(material, 'codigo_barras', 'N/A')
              const nombre = safeGet(material, 'nombre', 'Sin nombre')
              const marca = safeGet(material, 'marca', '-')
              const categoria = safeGet(material, 'categoria', '-')
              const stockActual = safeGet(material, 'stock_actual', 0)
              const stockMinimo = safeGet(material, 'stock_minimo', 0)

              return (
                <TableRow key={material.id} selected={selectedMaterial?.id === material.id}>
                  <TableCell>{codigoBarras}</TableCell>
                  <TableCell>{nombre}</TableCell>
                  <TableCell>{marca}</TableCell>
                  <TableCell>{categoria}</TableCell>
                  <TableCell>
                    {stockActual} / {stockMinimo}
                  </TableCell>
                  <TableCell>
                    <StockStatus status={getStockStatus(material)}>
                      {getStockStatus(material) === 'normal' && '✅ Normal'}
                      {getStockStatus(material) === 'low' && '⚠️ Bajo'}
                      {getStockStatus(material) === 'out' && '❌ Agotado'}
                    </StockStatus>
                  </TableCell>
                  <TableCell>
                    <ActionButtons>
                      <IconButton
                        variant="view"
                        onClick={() => openViewModal(material)}
                        title="Ver detalles"
                      >
                        👁️
                      </IconButton>
                      <IconButton
                        variant="edit"
                        onClick={() => handleEdit(material)}
                        title="Editar"
                      >
                        ✏️
                      </IconButton>
                      <IconButton
                        variant="edit"
                        onClick={() => openStockModal(material)}
                        title="Ajustar stock"
                      >
                        📦
                      </IconButton>
                      <IconButton
                        variant="delete"
                        onClick={() => openDeleteModal(material)}
                        title="Eliminar"
                      >
                        🗑️
                      </IconButton>
                    </ActionButtons>
                  </TableCell>
                </TableRow>
              )
            })}
          </tbody>
        </Table>

        {materialesFiltrados.length === 0 && !loading && (
          <EmptyState>
            <h3>🔍 No se encontraron materiales</h3>
            <p>
              {searchTerm || categoriaFilter || stockFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay materiales registrados'}
            </p>
            <Button variant="primary" onClick={() => navigate('/materia-prima/nueva')}>
              ➕ Crear primer material
            </Button>
          </EmptyState>
        )}
      </TableContainer>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && selectedMaterial && (
        <Modal onClick={() => setShowDeleteModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>🗑️ Eliminar Material</ModalHeader>
            <ModalBody>
              <p><strong>¿Estás seguro de que deseas eliminar este material?</strong></p>
              <p>Este proceso no se puede deshacer.</p>
              <br />
              <p><strong>Material:</strong> {safeGet(selectedMaterial, 'nombre', 'N/A')}</p>
              <p><strong>Código:</strong> {safeGet(selectedMaterial, 'codigo_barras', 'N/A')}</p>
              <p><strong>Stock actual:</strong> {safeGet(selectedMaterial, 'stock_actual', 0)}</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={loading}>
                {loading ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal de ajuste de stock */}
      {showStockModal && selectedMaterial && (
        <Modal onClick={() => setShowStockModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>📦 Ajustar Stock</ModalHeader>
            <ModalBody>
              <p><strong>Material:</strong> {safeGet(selectedMaterial, 'nombre', 'N/A')}</p>
              <p><strong>Stock actual:</strong> {safeGet(selectedMaterial, 'stock_actual', 0)}</p>
              <br />

              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="stockAmount" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Cantidad a ajustar:
                </label>
                <input
                  id="stockAmount"
                  type="number"
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  placeholder="Usa números positivos para agregar, negativos para restar"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ecf0f1',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <small style={{ color: '#7f8c8d' }}>
                  Ejemplo: 10 para agregar 10 unidades, -5 para restar 5 unidades
                </small>
              </div>

              <div>
                <label htmlFor="stockReason" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Motivo del ajuste:
                </label>
                <textarea
                  id="stockReason"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder="Describe el motivo del ajuste de stock..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ecf0f1',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowStockModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleStockUpdate}
                disabled={!stockAmount || !stockReason || stockLoading}
              >
                {stockLoading ? 'Actualizando...' : 'Actualizar Stock'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

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
    </Container>
  )
}

export default GestionMateriaPrima