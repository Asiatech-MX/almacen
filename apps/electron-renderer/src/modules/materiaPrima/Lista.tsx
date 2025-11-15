import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { MateriaPrima } from '../../types/electron'
import { materiaPrimaService } from '../../services/materiaPrimaService'

const Container = styled.div`
  padding: 20px;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

const Title = styled.h2`
  margin: 0;
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 600;
`

const NuevoButton = styled(Link)`
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`

const Tabla = styled.table`
  width: 100%;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const Thead = styled.thead`
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
`

const Th = styled.th`
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const Td = styled.td`
  padding: 14px 16px;
  border-bottom: 1px solid #ecf0f1;
  font-size: 0.95rem;
`

const Tr = styled.tr`
  &:hover {
    background-color: #f8f9fa;
  }

  &:last-child td {
    border-bottom: none;
  }
`

const StockCell = styled(Td)`
  font-weight: 600;
  color: ${props => {
    const stock = parseFloat(props.children?.toString() || '0')
    if (stock <= 10) return '#e74c3c'
    if (stock <= 25) return '#f39c12'
    return '#27ae60'
  }};
`

const AccionesCell = styled(Td)`
  width: 120px;
`

const AccionButton = styled(Link)`
  background: ${props => props.variant === 'edit' ? '#3498db' : '#e74c3c'};
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  text-decoration: none;
  margin-right: 8px;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: ${props => props.variant === 'edit' ? '#2980b9' : '#c0392b'};
  }
`

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-size: 1.1rem;
`

const ErrorMessage = styled.div`
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 20px;
`

const EmptyMessage = styled.div`
  text-align: center;
  padding: 60px;
  color: #95a5a6;
  font-size: 1.2rem;
`

export const MateriaPrimaLista: React.FC = () => {
  const [materiaPrima, setMateriaPrima] = useState<MateriaPrima[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarMateriaPrima()
  }, [])

  const cargarMateriaPrima = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await materiaPrimaService.listar()
      setMateriaPrima(data)
    } catch (err) {
      setError('Error al cargar la materia prima. Por favor, intente nuevamente.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Cargando materia prima...</LoadingMessage>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
        <NuevoButton to="/materia-prima/nueva">+ Nueva Materia Prima</NuevoButton>
      </Container>
    )
  }

  if (materiaPrima.length === 0) {
    return (
      <Container>
        <Header>
          <Title>Materia Prima</Title>
          <NuevoButton to="/materia-prima/nueva">+ Nueva Materia Prima</NuevoButton>
        </Header>
        <EmptyMessage>
          No hay materia prima registrada.<br />
          <NuevoButton to="/materia-prima/nueva">Agregar la primera</NuevoButton>
        </EmptyMessage>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <Title>Materia Prima ({materiaPrima.length})</Title>
        <NuevoButton to="/materia-prima/nueva">+ Nueva Materia Prima</NuevoButton>
      </Header>

      <Tabla>
        <Thead>
          <tr>
            <Th>Nombre</Th>
            <Th>Marca</Th>
            <Th>Modelo</Th>
            <Th>Presentación</Th>
            <Th>Stock Actual</Th>
            <Th>Código Barras</Th>
            <Th>Acciones</Th>
          </tr>
        </Thead>
        <tbody>
          {materiaPrima.map((item) => (
            <Tr key={item.id}>
              <Td>{item.nombre}</Td>
              <Td>{item.marca || '-'}</Td>
              <Td>{item.modelo || '-'}</Td>
              <Td>{item.presentacion}</Td>
              <StockCell>{item.stockActual}</StockCell>
              <Td>{item.codigoBarras || '-'}</Td>
              <AccionesCell>
                <AccionButton to={`/materia-prima/editar/${item.id}`} variant="edit">
                  Editar
                </AccionButton>
                <AccionButton to="#" variant="delete">
                  Eliminar
                </AccionButton>
              </AccionesCell>
            </Tr>
          ))}
        </tbody>
      </Tabla>
    </Container>
  )
}