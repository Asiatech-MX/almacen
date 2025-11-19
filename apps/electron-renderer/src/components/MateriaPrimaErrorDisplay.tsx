// Componente específico para mostrar errores de Materia Prima
// Implementación basada en el plan de solución con Pattern Matching + Type Guards

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import {
  MateriaPrimaError,
  StockDisponibleError,
  MaterialNoEncontradoError,
  ConexionDatabaseError,
  ValidacionError,
  esStockDisponibleError,
  esMaterialNoEncontradoError,
  esConexionDatabaseError,
  esValidacionError
} from '../types/materiaPrimaErrors';

interface MateriaPrimaErrorDisplayProps {
  error: MateriaPrimaError | null;
  onDismiss?: () => void;
  onRecovery?: (action: string) => void;
  className?: string;
}

// Componente específico para error de stock disponible
const StockErrorMessage: React.FC<{ error: StockDisponibleError; onRecovery?: (action: string) => void }> = ({ error, onRecovery }) => {
  const handleGestionarStock = () => {
    onRecovery?.('gestionar_stock');
  };

  const handleDesactivar = () => {
    onRecovery?.('desactivar_material');
  };

  return (
    <Alert variant="warning" className="border-orange-200 bg-orange-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-orange-500 text-xl" aria-hidden="true">⚠️</span>
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-orange-800 font-medium">
            Material con Stock Disponible
          </AlertTitle>
          <AlertDescription className="text-orange-700 mt-2">
            <p className="mb-3">{error.userMessage}</p>

            {/* Información adicional del error */}
            <div className="bg-orange-100 rounded-md p-3 mb-3">
              <span className="font-semibold text-sm text-orange-800">Información adicional:</span>
              <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
                <div>
                  <span className="font-medium">ID:</span> {error.idMaterial}
                </div>
                <div>
                  <span className="font-medium">Nombre:</span> {error.nombreMaterial}
                </div>
                <div>
                  <span className="font-medium">Stock:</span> {error.stockActual} {error.stockActual === 1 ? 'unidad' : 'unidades'}
                </div>
                <div>
                  <span className="font-medium">Correlation ID:</span>
                  <code className="ml-1 bg-orange-200 px-1 py-0.5 rounded text-xs">
                    {error.correlationId}
                  </code>
                </div>
              </div>
            </div>

            {/* Acciones de recuperación */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleGestionarStock}
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                📦 Gestionar Stock
              </Button>
              <Button
                onClick={handleDesactivar}
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                🚫 Desactivar Material
              </Button>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

// Componente específico para error de material no encontrado
const MaterialNoEncontradoMessage: React.FC<{ error: MaterialNoEncontradoError; onDismiss?: () => void }> = ({ error, onDismiss }) => {
  const handleRecargar = () => {
    onDismiss?.();
    // Disparar evento para recargar datos
    window.dispatchEvent(new CustomEvent('recargarMateriales'));
  };

  return (
    <Alert variant="destructive" className="border-red-200 bg-red-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-red-500 text-xl" aria-hidden="true">❌</span>
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-red-800 font-medium">
            Material No Encontrado
          </AlertTitle>
          <AlertDescription className="text-red-700 mt-2">
            <p className="mb-3">{error.userMessage}</p>

            <div className="bg-red-100 rounded-md p-3 mb-3">
              <div className="text-xs">
                <div className="font-medium mb-1">Detalles del error:</div>
                <div><span className="font-medium">ID Buscado:</span> {error.idMaterial}</div>
                <div><span className="font-medium">Timestamp:</span> {error.timestamp.toLocaleString()}</div>
                <div><span className="font-medium">Correlation ID:</span>
                  <code className="ml-1 bg-red-200 px-1 py-0.5 rounded text-xs">
                    {error.correlationId}
                  </code>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRecargar}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                🔄 Recargar Lista
              </Button>
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-red-700 hover:bg-red-100"
                >
                  Cerrar
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

// Componente específico para error de conexión
const ConexionErrorMessage: React.FC<{ error: ConexionDatabaseError; onDismiss?: () => void }> = ({ error, onDismiss }) => {
  const handleReintentar = () => {
    onDismiss?.();
    // Disparar evento para reintentar operación
    window.dispatchEvent(new CustomEvent('reintentarOperacion'));
  };

  return (
    <Alert variant="destructive" className="border-red-200 bg-red-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-red-500 text-xl" aria-hidden="true">🔌</span>
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-red-800 font-medium">
            Error de Conexión
          </AlertTitle>
          <AlertDescription className="text-red-700 mt-2">
            <p className="mb-3">{error.userMessage}</p>

            {error.detalles && (
              <div className="bg-red-100 rounded-md p-3 mb-3">
                <div className="text-xs">
                  <div className="font-medium mb-1">Detalles técnicos:</div>
                  <div className="font-mono text-xs">{error.detalles}</div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleReintentar}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                🔄 Reintentar
              </Button>
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-red-700 hover:bg-red-100"
                >
                  Cerrar
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

// Componente específico para error de validación
const ValidacionErrorMessage: React.FC<{ error: ValidacionError }> = ({ error }) => {
  return (
    <Alert variant="warning" className="border-orange-200 bg-orange-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-orange-500 text-xl" aria-hidden="true">⚠️</span>
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-orange-800 font-medium">
            Error de Validación
          </AlertTitle>
          <AlertDescription className="text-orange-700 mt-2">
            <p className="mb-2">{error.userMessage}</p>

            <div className="bg-orange-100 rounded-md p-3 mb-2">
              <div className="text-xs">
                <div className="font-medium mb-1">Información de validación:</div>
                <div><span className="font-medium">Campo:</span> {error.campo}</div>
                <div><span className="font-medium">Valor:</span>
                  <code className="ml-1 bg-orange-200 px-1 py-0.5 rounded text-xs">
                    {error.valor === null || error.valor === undefined ? 'Nulo' : String(error.valor)}
                  </code>
                </div>
              </div>
            </div>

            <p className="text-sm text-orange-700">
              <span className="font-medium">Sugerencia:</span> {error.suggestedAction}
            </p>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

// Componente genérico para errores no específicos
const GenericErrorMessage: React.FC<{ error: MateriaPrimaError; onDismiss?: () => void }> = ({ error, onDismiss }) => {
  const getSeverityVariant = () => {
    switch (error.severity) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'error':
      default:
        return 'destructive';
    }
  };

  const getIcon = () => {
    switch (error.severity) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'error':
      default:
        return '❌';
    }
  };

  return (
    <Alert variant={getSeverityVariant() as any} className="border-red-200 bg-red-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-red-500 text-xl" aria-hidden="true">{getIcon()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-red-800 font-medium">
            Error
          </AlertTitle>
          <AlertDescription className="text-red-700 mt-2">
            <p className="mb-2">{error.userMessage}</p>

            {/* Mostrar mensaje técnico si está disponible */}
            {error.message && error.message !== error.userMessage && (
              <details className="mb-3">
                <summary className="cursor-pointer text-sm font-medium text-red-800 hover:text-red-900">
                  Ver detalles técnicos
                </summary>
                <div className="mt-2 bg-red-100 rounded-md p-3">
                  <code className="text-xs font-mono text-red-800">{error.message}</code>
                </div>
              </details>
            )}

            <div className="bg-red-100 rounded-md p-3 mb-3">
              <div className="text-xs">
                <div className="grid grid-cols-1 gap-1">
                  <div><span className="font-medium">Tipo:</span> {error.type}</div>
                  <div><span className="font-medium">Capa:</span> {error.layer}</div>
                  <div><span className="font-medium">Timestamp:</span> {error.timestamp.toLocaleString()}</div>
                  <div><span className="font-medium">Correlation ID:</span>
                    <code className="ml-1 bg-red-200 px-1 py-0.5 rounded text-xs">
                      {error.correlationId}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-red-700 mb-3">
              <span className="font-medium">Acción recomendada:</span> {error.suggestedAction}
            </p>

            {onDismiss && (
              <Button
                onClick={onDismiss}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Cerrar
              </Button>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

// Componente principal que maneja todos los tipos de error
export const MateriaPrimaErrorDisplay: React.FC<MateriaPrimaErrorDisplayProps> = ({
  error,
  onDismiss,
  onRecovery,
  className
}) => {
  if (!error) return null;

  // Componentes específicos por tipo de error usando type guards
  if (esStockDisponibleError(error)) {
    return <StockErrorMessage error={error} onRecovery={onRecovery} />;
  }

  if (esMaterialNoEncontradoError(error)) {
    return <MaterialNoEncontradoMessage error={error} onDismiss={onDismiss} />;
  }

  if (esConexionDatabaseError(error)) {
    return <ConexionErrorMessage error={error} onDismiss={onDismiss} />;
  }

  if (esValidacionError(error)) {
    return <ValidacionErrorMessage error={error} />;
  }

  // Error genérico
  return <GenericErrorMessage error={error} onDismiss={onDismiss} />;
};

// Componente simplificado para mensajes de error en texto plano
export const MateriaPrimaErrorText: React.FC<{ error: MateriaPrimaError | null; className?: string }> = ({
  error,
  className
}) => {
  if (!error) return null;

  return (
    <div className={className}>
      {esStockDisponibleError(error) && (
        <span className="text-orange-700 text-sm">
          ⚠️ {error.userMessage}. Stock actual: {error.stockActual} unidades. {error.suggestedAction}
        </span>
      )}
      {esMaterialNoEncontradoError(error) && (
        <span className="text-red-700 text-sm">
          ❌ {error.userMessage}. {error.suggestedAction}
        </span>
      )}
      {esConexionDatabaseError(error) && (
        <span className="text-red-700 text-sm">
          🔌 {error.userMessage}. {error.suggestedAction}
        </span>
      )}
      {esValidacionError(error) && (
        <span className="text-orange-700 text-sm">
          ⚠️ {error.userMessage} (campo: {error.campo}). {error.suggestedAction}
        </span>
      )}
      {/* Error genérico */}
      {!esStockDisponibleError(error) && !esMaterialNoEncontradoError(error) &&
       !esConexionDatabaseError(error) && !esValidacionError(error) && (
        <span className="text-red-700 text-sm">
          ❌ {error.userMessage}. {error.suggestedAction}
        </span>
      )}
    </div>
  );
};

export default MateriaPrimaErrorDisplay;