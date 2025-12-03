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
import { Edit2, Plus, Trash2 } from 'lucide-react';
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
    id_institucion: 1 // TODO: Obtener del contexto
  });
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

  
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const nuevaCategoria: NewCategoria = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim(),
        id_institucion: formData.id_institucion || 1
      };

      const result = await onCrear(nuevaCategoria);
      if (result.success) {
        onClose();
        // Reset form
        setFormData({
          nombre: '',
          descripcion: '',
          id_institucion: 1
        });
      } else {
        setErrors({ general: result.error || 'Error al crear la categoría' });
      }
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setLoading(false);
    }
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
  const { categorias, loading, actions } = useReferenceData({
    idInstitucion: 1 // TODO: Obtener del contexto
  });

  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);

  
  const handleCrearCategoria = async (categoria: NewCategoria) => {
    const result = await actions.crearCategoria(categoria);
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

  const renderCategoriaSimple = (categoria: Categoria): JSX.Element => {
    return (
      <Card key={categoria.id} className="mb-2 hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-foreground">
                {categoria.nombre}
              </h3>
              {categoria.descripcion && (
                <p className="text-sm text-muted-foreground mt-1">
                  {categoria.descripcion}
                </p>
              )}
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
                onClick={() => handleEliminarCategoria(categoria.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Eliminar categoría"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
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
            Administra las categorías para organizar tus materiales
          </p>
        </div>
        <Button onClick={() => setMostrarModalCrear(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorías</CardTitle>
          <CardDescription>
            Todas las categorías disponibles para clasificar tus materiales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categorias.length === 0 ? (
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
              {categorias.map(categoria => renderCategoriaSimple(categoria))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      {mostrarModalCrear && (
        <CategoriaCrearModal
          isOpen={mostrarModalCrear}
          onClose={() => setMostrarModalCrear(false)}
          onCrear={handleCrearCategoria}
          categoriasPadre={[]}
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