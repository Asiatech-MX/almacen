import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import useMateriaPrima, { useBusquedaAvanzada, useStockMateriaPrima } from '../../hooks/useMateriaPrima'
import useDebounce from '../../hooks/useDebounce'
import type { MateriaPrima, LowStockItem } from '../../../../shared/types/materiaPrima'

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
`

const Header = styled.div`
  margin-bottom: 30px;
`

const Title = styled.h2`
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`

const Subtitle = styled.p`
  color: #7f8c8d;
  font-size: 1rem;
  margin-bottom: 20px;
`

const TabsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid #ecf0f1;
`

const Tab = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  border: none;
  background: none;
  color: ${props => props.active ? '#3498db' : '#7f8c8d'};
  font-weight: 600;
  cursor: pointer;
  border-bottom: 3px solid ${props => props.active ? '#3498db' : 'transparent'};
  transition: all 0.2s ease;
  margin-bottom: -2px;

  &:hover {
    color: #3498db;
  }
`

const SearchSection = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
`

const SearchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`

const SearchGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.label`
  font-weight: 600;
  color: #34495e;
  font-size: 0.95rem;
`

const Input = styled.input`
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

const Select = styled.select`
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

const RangeInputs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  ${props => props.variant === 'primary' && `
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #2980b9 0%, #21618c 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }
  `}

  ${props => props.variant === 'success' && `
    background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
    color: white;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #229954 0%, #1e8449 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
    }
  `}

  ${props => props.variant === 'secondary' && `
    background: #95a5a6;
    color: white;

    &:hover:not(:disabled) {
      background: #7f8c8d;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
`

const ResultsSection = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`

const ResultsHeader = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const ResultsTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
`

const ResultsCount = styled.span`
  background: #3498db;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const TableHeader = styled.thead`
  background: #f8f9fa;
`

const TableRow = styled.tr`
  &:hover {
    background-color: #f8f9fa;
  }
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

const StatsCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`

const StatCard = styled.div<{ color?: string }>`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-left: 4px solid ${props => props.color || '#3498db'};

  h4 {
    margin: 0 0 10px 0;
    color: #7f8c8d;
    font-size: 0.9rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .value {
    font-size: 2.5rem;
    font-weight: 700;
    color: ${props => props.color || '#3498db'};
    margin-bottom: 5px;
  }

  .description {
    color: #95a5a6;
    font-size: 0.9rem;
  }
`

const AlertCard = styled.div<{ type: 'warning' | 'info' | 'success' }>`
  background: ${props => {
    switch (props.type) {
      case 'warning': return '#fff3cd'
      case 'info': return '#d1ecf1'
      case 'success': return '#d4edda'
      default: return '#f8f9fa'
    }
  }};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'warning': return '#ffeaa7'
      case 'info': return '#bee5eb'
      case 'success': return '#c3e6cb'
      default: return '#e9ecef'
    }
  }};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;

  .icon {
    font-size: 1.5rem;
  }

  .content {
    flex: 1;
  }

  .title {
    font-weight: 600;
    margin-bottom: 4px;
    color: ${props => {
      switch (props.type) {
        case 'warning': return '#856404'
        case 'info': return '#0c5460'
        case 'success': return '#155724'
        default: return '#495057'
      }
    }};
  }

  .description {
    color: ${props => {
      switch (props.type) {
        case 'warning': return '#856404'
        case 'info': return '#0c5460'
        case 'success': return '#155724'
        default: return '#6c757d'
      }
    }};
    font-size: 0.9rem;
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

type TabType = 'search' | 'lowStock' | 'statistics'

export const ConsultasAvanzadas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('search')

  // Estado para búsqueda avanzada
  const [searchFilters, setSearchFilters] = useState({
    nombre: '',
    categoria: '',
    proveedorId: '',
    bajoStock: false,
    rangoStock: { min: undefined, max: undefined } as { min?: number; max?: number }
  })

  const debouncedNombre = useDebounce(searchFilters.nombre, 300)

  const {
    resultados: searchResults,
    loading: searchLoading,
    error: searchError,
    buscarPorCriterios,
    limpiarBusqueda
  } = useBusquedaAvanzada()

  const {
    getStockBajo,
    loading: stockLoading,
    error: stockError
  } = useStockMateriaPrima()

  const {
    materiales,
    loading: materialesLoading,
    estadisticas
  } = useMateriaPrima({ autoLoad: true })

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])

  // Obtener categorías únicas
  const categorias = Array.from(new Set(materiales.map(m => m.categoria).filter(Boolean)))

  // Ejecutar búsqueda cuando los filtros cambian
  useEffect(() => {
    if (activeTab === 'search' && (debouncedNombre || searchFilters.categoria || searchFilters.proveedorId || searchFilters.bajoStock)) {
      buscarPorCriterios({
        nombre: debouncedNombre,
        categoria: searchFilters.categoria || undefined,
        proveedorId: searchFilters.proveedorId || undefined,
        bajoStock: searchFilters.bajoStock,
        rangoStock: searchFilters.rangoStock.min !== undefined || searchFilters.rangoStock.max !== undefined
          ? searchFilters.rangoStock
          : undefined
      })
    }
  }, [debouncedNombre, searchFilters.categoria, searchFilters.proveedorId, searchFilters.bajoStock, searchFilters.rangoStock, activeTab])

  // Cargar stock bajo cuando se activa la pestaña
  useEffect(() => {
    if (activeTab === 'lowStock') {
      loadLowStock()
    }
  }, [activeTab])

  const loadLowStock = async () => {
    try {
      const items = await getStockBajo()
      setLowStockItems(items)
    } catch (err) {
      console.error('Error al cargar stock bajo:', err)
    }
  }

  const handleFilterChange = (field: keyof typeof searchFilters) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value

    setSearchFilters(prev => ({
      ...prev,
      [field]: field === 'bajoStock'
        ? (e.target as HTMLInputElement).checked
        : field === 'rangoStock'
          ? prev.rangoStock
          : value
    }))
  }

  const handleRangeChange = (field: 'min' | 'max') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value ? Number(e.target.value) : undefined

    setSearchFilters(prev => ({
      ...prev,
      rangoStock: {
        ...prev.rangoStock,
        [field]: value
      }
    }))
  }

  const clearFilters = () => {
    setSearchFilters({
      nombre: '',
      categoria: '',
      proveedorId: '',
      bajoStock: false,
      rangoStock: { min: undefined, max: undefined }
    })
    limpiarBusqueda()
  }

  const exportResults = async () => {
    try {
      const data = activeTab === 'search' ? searchResults : materiales
      const csv = [
        ['Código', 'Nombre', 'Marca', 'Presentación', 'Stock Actual', 'Stock Mínimo', 'Categoría', 'Proveedor'],
        ...data.map(item => [
          item.codigo_barras,
          item.nombre,
          item.marca || '',
          item.presentacion,
          item.stock_actual?.toString() || '0',
          item.stock_minimo?.toString() || '0',
          item.categoria || '',
          (item as any).proveedor_nombre || ''
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `materia_prima_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error al exportar datos:', err)
    }
  }

  const getStockStatus = (material: MateriaPrima | LowStockItem): 'normal' | 'low' | 'out' => {
    const stock = (material as any).stock_actual || 0
    const minStock = (material as any).stock_minimo || 0

    if (stock === 0) return 'out'
    if (stock <= minStock) return 'low'
    return 'normal'
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <>
            <SearchSection>
              <h3>🔍 Búsqueda Avanzada</h3>
              <SearchGrid>
                <SearchGroup>
                  <Label>Nombre del Material</Label>
                  <Input
                    type="text"
                    value={searchFilters.nombre}
                    onChange={handleFilterChange('nombre')}
                    placeholder="Buscar por nombre..."
                  />
                </SearchGroup>

                <SearchGroup>
                  <Label>Categoría</Label>
                  <Select
                    value={searchFilters.categoria}
                    onChange={handleFilterChange('categoria')}
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </SearchGroup>

                <SearchGroup>
                  <Label>ID Proveedor</Label>
                  <Input
                    type="text"
                    value={searchFilters.proveedorId}
                    onChange={handleFilterChange('proveedorId')}
                    placeholder="ID del proveedor..."
                  />
                </SearchGroup>

                <SearchGroup>
                  <Label>Rango de Stock</Label>
                  <RangeInputs>
                    <Input
                      type="number"
                      placeholder="Mínimo"
                      value={searchFilters.rangoStock.min || ''}
                      onChange={handleRangeChange('min')}
                    />
                    <Input
                      type="number"
                      placeholder="Máximo"
                      value={searchFilters.rangoStock.max || ''}
                      onChange={handleRangeChange('max')}
                    />
                  </RangeInputs>
                </SearchGroup>

                <SearchGroup>
                  <Label>
                    <input
                      type="checkbox"
                      checked={searchFilters.bajoStock}
                      onChange={handleFilterChange('bajoStock')}
                      style={{ marginRight: '8px' }}
                    />
                    Mostrar solo stock bajo
                  </Label>
                </SearchGroup>
              </SearchGrid>

              <ButtonGroup>
                <Button variant="secondary" onClick={clearFilters}>
                  🔄 Limpiar Filtros
                </Button>
                <Button variant="success" onClick={exportResults} disabled={searchResults.length === 0}>
                  📊 Exportar Resultados
                </Button>
              </ButtonGroup>
            </SearchSection>

            {searchResults.length > 0 && (
              <ResultsSection>
                <ResultsHeader>
                  <ResultsTitle>Resultados de Búsqueda</ResultsTitle>
                  <ResultsCount>{searchResults.length} materiales</ResultsCount>
                </ResultsHeader>
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHeaderCell>Código</TableHeaderCell>
                      <TableHeaderCell>Nombre</TableHeaderCell>
                      <TableHeaderCell>Marca</TableHeaderCell>
                      <TableHeaderCell>Categoría</TableHeaderCell>
                      <TableHeaderCell>Stock</TableHeaderCell>
                      <TableHeaderCell>Estado</TableHeaderCell>
                    </tr>
                  </TableHeader>
                  <tbody>
                    {searchResults.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>{material.codigo_barras}</TableCell>
                        <TableCell>{material.nombre}</TableCell>
                        <TableCell>{material.marca || '-'}</TableCell>
                        <TableCell>{material.categoria || '-'}</TableCell>
                        <TableCell>{material.stock_actual}</TableCell>
                        <TableCell>
                          <StockStatus status={getStockStatus(material)}>
                            {getStockStatus(material) === 'normal' && '✅ Normal'}
                            {getStockStatus(material) === 'low' && '⚠️ Bajo'}
                            {getStockStatus(material) === 'out' && '❌ Agotado'}
                          </StockStatus>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </ResultsSection>
            )}

            {searchResults.length === 0 && !searchLoading && (debouncedNombre || searchFilters.categoria) && (
              <EmptyState>
                <h3>🔍 No se encontraron resultados</h3>
                <p>Intenta ajustar los filtros de búsqueda</p>
              </EmptyState>
            )}
          </>
        )

      case 'lowStock':
        return (
          <>
            <AlertCard type="warning">
              <div className="icon">⚠️</div>
              <div className="content">
                <div className="title">Materiales con Stock Bajo</div>
                <div className="description">
                  Estos materiales necesitan ser reabastecidos pronto para evitar interrupciones en el inventario.
                </div>
              </div>
            </AlertCard>

            {lowStockItems.length > 0 && (
              <ResultsSection>
                <ResultsHeader>
                  <ResultsTitle>Materiales con Stock Bajo</ResultsTitle>
                  <ResultsCount>{lowStockItems.length} materiales</ResultsCount>
                </ResultsHeader>
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHeaderCell>Código</TableHeaderCell>
                      <TableHeaderCell>Nombre</TableHeaderCell>
                      <TableHeaderCell>Marca</TableHeaderCell>
                      <TableHeaderCell>Presentación</TableHeaderCell>
                      <TableHeaderCell>Stock Actual</TableHeaderCell>
                      <TableHeaderCell>Stock Mínimo</TableHeaderCell>
                      <TableHeaderCell>Categoría</TableHeaderCell>
                    </tr>
                  </TableHeader>
                  <tbody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.codigo_barras}</TableCell>
                        <TableCell>{item.nombre}</TableCell>
                        <TableCell>{item.marca || '-'}</TableCell>
                        <TableCell>{item.presentacion}</TableCell>
                        <TableCell>{item.stock_actual}</TableCell>
                        <TableCell>{item.stock_minimo}</TableCell>
                        <TableCell>{item.categoria || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </ResultsSection>
            )}

            {lowStockItems.length === 0 && !stockLoading && (
              <EmptyState>
                <h3>✅ ¡Buen trabajo!</h3>
                <p>No hay materiales con stock bajo en este momento.</p>
              </EmptyState>
            )}
          </>
        )

      case 'statistics':
        return (
          <StatsCards>
            <StatCard color="#3498db">
              <h4>Total Materiales</h4>
              <div className="value">{estadisticas.total}</div>
              <div className="description">Materiales registrados</div>
            </StatCard>

            <StatCard color="#f39c12">
              <h4>Stock Bajo</h4>
              <div className="value">{estadisticas.bajoStock}</div>
              <div className="description">Necesitan reabastecer</div>
            </StatCard>

            <StatCard color="#e74c3c">
              <h4>Sin Stock</h4>
              <div className="value">{estadisticas.sinStock}</div>
              <div className="description">Agotados</div>
            </StatCard>

            <StatCard color="#27ae60">
              <h4>Valor Total</h4>
              <div className="value">${estadisticas.valorTotal.toFixed(2)}</div>
              <div className="description">Valor del inventario</div>
            </StatCard>
          </StatsCards>
        )

      default:
        return null
    }
  }

  return (
    <Container>
      <Header>
        <Title>📊 Consultas Avanzadas</Title>
        <Subtitle>
          Busca y analiza tu inventario de materia prima con herramientas avanzadas
        </Subtitle>
      </Header>

      <TabsContainer>
        <Tab
          active={activeTab === 'search'}
          onClick={() => setActiveTab('search')}
        >
          🔍 Búsqueda
        </Tab>
        <Tab
          active={activeTab === 'lowStock'}
          onClick={() => setActiveTab('lowStock')}
        >
          ⚠️ Stock Bajo
        </Tab>
        <Tab
          active={activeTab === 'statistics'}
          onClick={() => setActiveTab('statistics')}
        >
          📈 Estadísticas
        </Tab>
      </TabsContainer>

      {(searchLoading || stockLoading || materialesLoading) ? (
        <LoadingMessage>Cargando...</LoadingMessage>
      ) : (
        renderTabContent()
      )}

      {(searchError || stockError) && (
        <AlertCard type="warning">
          <div className="icon">⚠️</div>
          <div className="content">
            <div className="title">Error</div>
            <div className="description">
              {searchError || stockError || 'Ocurrió un error al cargar los datos'}
            </div>
          </div>
        </AlertCard>
      )}
    </Container>
  )
}

export default ConsultasAvanzadas