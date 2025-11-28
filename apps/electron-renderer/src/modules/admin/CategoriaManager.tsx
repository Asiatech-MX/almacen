import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Plus, Trash2, GripVertical, Loader2, ArrowDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoriaArbol, Categoria, NewCategoria, CategoriaUpdate } from '../../../../packages/shared-types/src/referenceData';
import { useReferenceData } from '@/hooks/useReferenceData';
import { InlineEditModal } from '@/components/ui/InlineEditModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategoriaCrearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrear: (categoria: NewCategoria, idPadre?: string) => Promise<{ success: boolean; data?: Categoria; error?: string }>;
  categoriasPadre: CategoriaArbol[];
  idPadrePreseleccionado?: string;
}

const CategoriaCrearModal: React.FC<CategoriaCrearModalProps> = ({
  isOpen,
  onClose,
  onCrear,
  categoriasPadre,
  idPadrePreseleccionado
}) => {
  const [formData, setFormData] = useState<Partial<NewCategoria>>({
    nombre: '',
    descripcion: '',
    icono: '',
    color: '#000000',
    orden: 0,
    id_institucion: 1 // TODO: Obtener del contexto
  });
  const [idPadre, setIdPadre] = useState<string | undefined>(idPadrePreseleccionado);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    const newErrors: Record<string, string> = {};
    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    if (formData.color && !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = 'El color debe ser un valor hexadecimal válido (#RRGGBB)';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const nuevaCategoria: NewCategoria = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim(),
        icono: formData.icono?.trim(),
        color: formData.color,
        orden: formData.orden || 0,
        id_institucion: formData.id_institucion || 1
      };

      const result = await onCrear(nuevaCategoria, idPadre);
      if (result.success) {
        onClose();
        // Reset form
        setFormData({
          nombre: '',
          descripcion: '',
          icono: '',
          color: '#000000',
          orden: 0,
          id_institucion: 1
        });
        setIdPadre(undefined);
      } else {
        setErrors({ general: result.error || 'Error al crear la categoría' });
      }
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setLoading(false);
    }
  };

  const buildCategoriasOptions = (categorias: CategoriaArbol[], nivel = 0): JSX.Element[] => {
    const options: JSX.Element[] = [];

    categorias.forEach(categoria => {
      options.push(
        <SelectItem key={categoria.id} value={categoria.id}>
          {'  '.repeat(nivel) + categoria.nombre}
        </SelectItem>
      );

      if (categoria.hijos.length > 0) {
        options.push(...buildCategoriasOptions(categoria.hijos, nivel + 1));
      }
    });

    return options;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Categoría</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <input
              id="nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                errors.nombre && "border-destructive"
              )}
              placeholder="Nombre de la categoría"
              maxLength={100}
              required
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria_padre">Categoría Padre (Opcional)</Label>
            <Select value={idPadre} onValueChange={setIdPadre}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría padre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin categoría padre (Raíz)</SelectItem>
                {buildCategoriasOptions(categoriasPadre)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className={cn(
                "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "ring-offset-background placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                errors.descripcion && "border-destructive"
              )}
              placeholder="Descripción de la categoría"
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icono">Icono</Label>
              <input
                id="icono"
                type="text"
                value={formData.icono}
                onChange={(e) => setFormData(prev => ({ ...prev, icono: e.target.value }))}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "ring-offset-background placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  errors.icono && "border-destructive"
                )}
                placeholder="🔧 🏗️ 📦"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "ring-offset-background placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  errors.color && "border-destructive"
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              Crear Categoría
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CategoriaManager: React.FC = () => {
  const { categoriasArbol, loading, actions } = useReferenceData({
    idInstitucion: 1 // TODO: Obtener del contexto
  });

  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [idPadreParaCrear, setIdPadreParaCrear] = useState<string | undefined>();

  // Drag and drop states
  const [draggedCategory, setDraggedCategory] = useState<Categoria | null>(null);
  const [dropTarget, setDropTarget] = useState<Categoria | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [moveStatus, setMoveStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleDragStart = (categoria: Categoria, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', categoria.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCategory(categoria);
    setMoveStatus(null);
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, targetCategoria: Categoria) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Don't allow dropping on self or descendants
    if (draggedCategory && draggedCategory.id !== targetCategoria.id) {
      setDropTarget(targetCategoria);
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCategoria: Categoria) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedCategory || draggedCategory.id === targetCategoria.id) {
      return;
    }

    setIsMoving(true);
    setMoveStatus(null);

    try {
      const result = await actions.moverCategoria(draggedCategory.id, targetCategoria.id);

      if (result.success) {
        setMoveStatus({
          success: true,
          message: `"${draggedCategory.nombre}" movida a "${targetCategoria.nombre}"`
        });

        // Clear success message after 3 seconds
        setTimeout(() => setMoveStatus(null), 3000);
      } else {
        setMoveStatus({
          success: false,
          message: result.error || 'Error al mover la categoría'
        });
      }
    } catch (error) {
      setMoveStatus({
        success: false,
        message: 'Error inesperado al mover la categoría'
      });
    } finally {
      setIsMoving(false);
      setDraggedCategory(null);
    }
  };

  const handleCrearCategoria = async (categoria: NewCategoria, idPadre?: string) => {
    const result = await actions.crearCategoria(categoria, idPadre);
    return result;
  };

  const handleEditarCategoria = async (cambios: CategoriaUpdate) => {
    if (!categoriaEditando) return { success: false, error: 'No hay categoría seleccionada para editar' };

    const result = await actions.editarCategoria(categoriaEditando.id, cambios);
    if (result.success) {
      setCategoriaEditando(null);
    }
    return result;
  };

  const handleEliminarCategoria = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta categoría? Esta acción no se puede deshacer.')) {
      return;
    }

    const result = await actions.eliminarCategoria(id);
    if (!result.success) {
      alert(result.error || 'Error al eliminar la categoría');
    }
  };

  const handleCrearSubcategoria = (idPadre: string) => {
    setIdPadreParaCrear(idPadre);
    setMostrarModalCrear(true);
  };

  const renderCategoriaNode = (categoria: CategoriaArbol, nivel: number = 0): JSX.Element => {
    const isBeingDragged = draggedCategory?.id === categoria.id;
    const isDropTarget = dropTarget?.id === categoria.id;
    const canDrop = isDropTarget && draggedCategory && draggedCategory.id !== categoria.id;

    return (
      <div key={categoria.id} className="mb-2">
        <Card
          className={cn(
            "hover:shadow-md transition-all duration-200 cursor-move",
            "border border-border bg-card",
            "hover:border-primary/50",
            // Drag states
            isBeingDragged && "dragging opacity-50 scale-95",
            canDrop && "drop-target drop-target-valid",
            isDropTarget && !canDrop && "drop-target drop-target-invalid",
            // Disabled states during operations
            (isMoving || loading) && "opacity-60 pointer-events-none"
          )}
          draggable
          onDragStart={(e) => handleDragStart(categoria, e)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, categoria)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, categoria)}
          style={{ marginLeft: `${nivel * 24}px` }}
        >
          {/* Drop indicator */}
          {canDrop && (
            <div className="drop-indicator drop-indicator--active absolute top-0 left-0 right-0 h-1 bg-primary" />
          )}

          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Drag handle with enhanced visual feedback */}
                <div className={cn(
                  "transition-all duration-200",
                  isBeingDragged && "scale-110 text-primary"
                )}>
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                </div>

                {/* Hierarchy indicator */}
                {nivel > 0 && (
                  <div className="flex items-center gap-1">
                    {[...Array(nivel)].map((_, i) => (
                      <div key={i} className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                    ))}
                  </div>
                )}

                {categoria.icono && (
                  <span
                    className={cn(
                      "text-lg transition-transform",
                      isBeingDragged && "scale-110"
                    )}
                    title="Icono de categoría"
                  >
                    {categoria.icono}
                  </span>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={cn(
                      "font-medium text-foreground",
                      isBeingDragged && "text-primary"
                    )}>
                      {categoria.nombre}
                    </h3>

                    {categoria.color && (
                      <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: categoria.color }}
                        title="Color de categoría"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Nivel {categoria.nivel}
                    </Badge>

                    {categoria.hijos.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {categoria.hijos.length} subcategoría{categoria.hijos.length !== 1 ? 's' : ''}
                      </Badge>
                    )}

                    <span className="text-xs text-muted-foreground">
                      {categoria.ruta_completa}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCategoriaEditando(categoria)}
                  className="h-8 w-8 p-0"
                  title="Editar categoría"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCrearSubcategoria(categoria.id)}
                  className="h-8 w-8 p-0"
                  title="Crear subcategoría"
                >
                  <Plus className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminarCategoria(categoria.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Eliminar categoría"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {categoria.descripcion && (
              <p className="text-sm text-muted-foreground mt-3 ml-7">
                {categoria.descripcion}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Renderizar subcategorías */}
        {categoria.hijos.length > 0 && (
          <div className="mt-2">
            {categoria.hijos.map(hijo => renderCategoriaNode(hijo, nivel + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Categorías</h1>
          <p className="text-muted-foreground mt-1">
            Organiza las categorías de manera jerárquica arrastrando y soltando
          </p>
        </div>
        <Button
          onClick={() => setMostrarModalCrear(true)}
          disabled={isMoving}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {/* Status messages */}
      {(isMoving || moveStatus) && (
        <Card className={cn(
          "mb-6 border-l-4",
          moveStatus?.success
            ? "border-l-green-500 bg-green-50 dark:bg-green-950/20"
            : "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
          !moveStatus?.success && moveStatus && "border-l-red-500 bg-red-50 dark:bg-red-950/20"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {isMoving && <Loader2 className="w-4 h-4 animate-spin" />}
              {moveStatus?.success ? (
                <AlertCircle className="w-4 h-4 text-green-600" />
              ) : moveStatus ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : null}

              <div className="flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  moveStatus?.success
                    ? "text-green-800 dark:text-green-200"
                    : moveStatus
                    ? "text-red-800 dark:text-red-200"
                    : "text-blue-800 dark:text-blue-200"
                )}>
                  {isMoving
                    ? 'Moviendo categoría...'
                    : moveStatus?.message
                  }
                </p>
              </div>

              {moveStatus?.success && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMoveStatus(null)}
                >
                  ×
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions when dragging */}
      {draggedCategory && (
        <Card className="mb-6 border-l-4 border-l-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowDown className="w-4 h-4 text-primary animate-bounce" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                  Arrastrando "{draggedCategory.nombre}"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Suelta sobre una categoría para moverla como subcategoría
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDragEnd}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Estructura Jerárquica</CardTitle>
          <CardDescription>
            Las categorías están organizadas en niveles. Arrastra y suelta para reorganizar la jerarquía.
            Las categorías se muestran con sangría según su nivel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriasArbol.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <div className="text-6xl mb-4">📂</div>
                <h3 className="text-lg font-medium mb-2">No hay categorías configuradas</h3>
                <p>Crea tu primera categoría para empezar a organizar tus materiales</p>
              </div>
              <Button onClick={() => setMostrarModalCrear(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Categoría
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {categoriasArbol.map(categoria => renderCategoriaNode(categoria))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      {mostrarModalCrear && (
        <CategoriaCrearModal
          isOpen={mostrarModalCrear}
          onClose={() => {
            setMostrarModalCrear(false);
            setIdPadreParaCrear(undefined);
          }}
          onCrear={handleCrearCategoria}
          categoriasPadre={categoriasArbol}
          idPadrePreseleccionado={idPadreParaCrear}
        />
      )}

      {categoriaEditando && (
        <InlineEditModal
          isOpen={!!categoriaEditando}
          onClose={() => setCategoriaEditando(null)}
          item={categoriaEditando}
          type="categoria"
          onSave={handleEditarCategoria}
        />
      )}
    </div>
  );
};

export default CategoriaManager;