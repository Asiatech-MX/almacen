import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { Label } from './label';
import { Input } from './input';
import { Textarea } from './textarea';
import { Loader2 } from 'lucide-react';
import { Categoria, Presentacion, CategoriaUpdate, PresentacionUpdate } from '../../../../packages/shared-types/src/referenceData';

interface InlineEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: Categoria | Presentacion;
  type: 'categoria' | 'presentacion';
  onSave: (item: CategoriaUpdate | PresentacionUpdate) => Promise<{ success: boolean; data?: any; error?: string }>;
}

export const InlineEditModal: React.FC<InlineEditModalProps> = ({
  isOpen,
  onClose,
  item,
  type,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<Categoria | Presentacion>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({});
    }
    setErrors({});
  }, [item, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validación del nombre
    if (!formData.nombre || formData.nombre.trim().length === 0) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    // Validación específica para categorías
    if (type === 'categoria') {
      // Validación de color si se proporciona
      if (formData.color && !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
        newErrors.color = 'El color debe ser un valor hexadecimal válido (#RRGGBB)';
      }

      // Validación de icono
      if (formData.icono && formData.icono.length > 50) {
        newErrors.icono = 'El icono no puede exceder 50 caracteres';
      }

      // Validación de descripción
      if (formData.descripcion && formData.descripcion.length > 500) {
        newErrors.descripcion = 'La descripción no puede exceder 500 caracteres';
      }
    }

    // Validación específica para presentaciones
    if (type === 'presentacion') {
      // Validación de abreviatura
      if (formData.abreviatura && formData.abreviatura.length > 20) {
        newErrors.abreviatura = 'La abreviatura no puede exceder 20 caracteres';
      }

      // Validación de unidad base
      if (formData.unidad_base && formData.unidad_base.length > 20) {
        newErrors.unidad_base = 'La unidad base no puede exceder 20 caracteres';
      }

      // Validación de factor de conversión
      if (formData.factor_conversion !== undefined) {
        if (typeof formData.factor_conversion !== 'number') {
          newErrors.factor_conversion = 'El factor de conversión debe ser un número';
        } else if (formData.factor_conversion <= 0) {
          newErrors.factor_conversion = 'El factor de conversión debe ser positivo';
        } else if (formData.factor_conversion > 999999.9999) {
          newErrors.factor_conversion = 'El factor de conversión no puede exceder 999999.9999';
        }
      }

      // Validación de descripción
      if (formData.descripcion && formData.descripcion.length > 500) {
        newErrors.descripcion = 'La descripción no puede exceder 500 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        ...formData,
        nombre: formData.nombre?.trim(),
        descripcion: formData.descripcion?.trim() || undefined
      } as CategoriaUpdate | PresentacionUpdate;

      const result = await onSave(updateData);

      if (result.success) {
        onClose();
      } else {
        setErrors({ general: result.error || 'Error al guardar los cambios' });
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleColorChange = (value: string) => {
    // Auto-add # if missing
    const formattedValue = value.startsWith('#') ? value : `#${value}`;
    handleInputChange('color', formattedValue);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Editar' : 'Crear'} {type === 'categoria' ? 'Categoría' : 'Presentación'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {errors.general}
            </div>
          )}

          {/* Campo de nombre (requerido) */}
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              value={formData.nombre || ''}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Ej: Construcción, Kilogramo, etc."
              className={errors.nombre ? 'border-destructive' : ''}
              maxLength={100}
              required
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre}</p>
            )}
          </div>

          {/* Campo de descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion || ''}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              placeholder="Descripción detallada (opcional)"
              className={errors.descripcion ? 'border-destructive' : ''}
              rows={3}
              maxLength={500}
            />
            {errors.descripcion && (
              <p className="text-sm text-destructive">{errors.descripcion}</p>
            )}
          </div>

          {/* Campos específicos para presentaciones */}
          {type === 'presentacion' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* Abreviatura */}
                <div className="space-y-2">
                  <Label htmlFor="abreviatura">Abreviatura</Label>
                  <Input
                    id="abreviatura"
                    value={formData.abreviatura || ''}
                    onChange={(e) => handleInputChange('abreviatura', e.target.value)}
                    placeholder="Ej: kg, L, ud"
                    className={errors.abreviatura ? 'border-destructive' : ''}
                    maxLength={20}
                  />
                  {errors.abreviatura && (
                    <p className="text-sm text-destructive">{errors.abreviatura}</p>
                  )}
                </div>

                {/* Unidad base */}
                <div className="space-y-2">
                  <Label htmlFor="unidad_base">Unidad Base</Label>
                  <Input
                    id="unidad_base"
                    value={formData.unidad_base || ''}
                    onChange={(e) => handleInputChange('unidad_base', e.target.value)}
                    placeholder="Ej: gramo"
                    className={errors.unidad_base ? 'border-destructive' : ''}
                    maxLength={20}
                  />
                  {errors.unidad_base && (
                    <p className="text-sm text-destructive">{errors.unidad_base}</p>
                  )}
                </div>
              </div>

              {/* Factor de conversión */}
              <div className="space-y-2">
                <Label htmlFor="factor_conversion">Factor de Conversión</Label>
                <Input
                  id="factor_conversion"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  max="999999.9999"
                  value={formData.factor_conversion || ''}
                  onChange={(e) => handleInputChange(
                    'factor_conversion',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )}
                  placeholder="1000"
                  className={errors.factor_conversion ? 'border-destructive' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  Ej: 1000 (1 kg = 1000 g). Deja vacío si no aplica conversión.
                </p>
                {errors.factor_conversion && (
                  <p className="text-sm text-destructive">{errors.factor_conversion}</p>
                )}
              </div>
            </>
          )}

          {/* Campos específicos para categorías */}
          {type === 'categoria' && (
            <div className="grid grid-cols-2 gap-4">
              {/* Icono */}
              <div className="space-y-2">
                <Label htmlFor="icono">Icono</Label>
                <Input
                  id="icono"
                  value={formData.icono || ''}
                  onChange={(e) => handleInputChange('icono', e.target.value)}
                  placeholder="🔧 🏗️ 📦"
                  className={errors.icono ? 'border-destructive' : ''}
                  maxLength={50}
                />
                {errors.icono && (
                  <p className="text-sm text-destructive">{errors.icono}</p>
                )}
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color || '#000000'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className={errors.color ? 'border-destructive' : ''}
                  />
                  <Input
                    value={formData.color || ''}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="#RRGGBB"
                    className={errors.color ? 'border-destructive' : ''}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Color para identificar la categoría en la UI
                </p>
                {errors.color && (
                  <p className="text-sm text-destructive">{errors.color}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {item ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InlineEditModal;