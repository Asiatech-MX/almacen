/**
 * Performance Monitoring System
 *
 * Sistema completo de monitoreo de rendimiento para la aplicación
 * optimizado para medir impacto de características como edición inline,
 * animaciones, y operaciones asíncronas.
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'fps' | 'bytes' | 'count';
  timestamp: number;
  context?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceThreshold {
  warning: number;
  critical: number;
  unit: 'ms' | 'fps' | 'bytes' | 'count';
}

export interface ComponentMetrics {
  renderTime: PerformanceMetric[];
  memoryUsage: PerformanceMetric[];
  userInteractions: PerformanceMetric[];
  asyncOperations: PerformanceMetric[];
}

export interface GlobalMetrics {
  webVitals: {
    LCP: number; // Largest Contentful Paint
    FID: number; // First Input Delay
    CLS: number; // Cumulative Layout Shift
    FCP: number; // First Contentful Paint
    TTFB: number; // Time to First Byte
  };
  resourceTiming: PerformanceResourceTiming[];
  navigationTiming: PerformanceNavigationTiming;
  paintTiming: PerformancePaintTiming[];
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;
  private componentMetrics: Map<string, ComponentMetrics> = new Map();

  constructor() {
    this.initializeThresholds();
  }

  /**
   * Inicializa umbrales de rendimiento para diferentes métricas
   */
  private initializeThresholds(): void {
    // Tiempos de renderizado (ms)
    this.thresholds.set('component-render', {
      warning: 16, // 60fps = 16.67ms por frame
      critical: 100,
      unit: 'ms'
    });

    // Tiempos de respuesta de usuario (ms)
    this.thresholds.set('user-interaction', {
      warning: 100,
      critical: 300,
      unit: 'ms'
    });

    // Operaciones asíncronas (ms)
    this.thresholds.set('async-operation', {
      warning: 500,
      critical: 2000,
      unit: 'ms'
    });

    // Uso de memoria (bytes)
    this.thresholds.set('memory-usage', {
      warning: 50 * 1024 * 1024, // 50MB
      critical: 100 * 1024 * 1024, // 100MB
      unit: 'bytes'
    });

    // FPS (frames por segundo)
    this.thresholds.set('fps', {
      warning: 30,
      critical: 15,
      unit: 'fps'
    });
  }

  /**
   * Inicia el monitoreo de rendimiento
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.initializeWebVitalsObserver();
    this.initializeResourceTimingObserver();
    this.initializePaintTimingObserver();
    this.startMemoryMonitoring();
    this.startFPSMonitoring();

    console.log('🚀 Performance monitoring started');
  }

  /**
   * Detiene el monitoreo de rendimiento
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isMonitoring = false;

    console.log('⏹️ Performance monitoring stopped');
  }

  /**
   * Mide el tiempo de renderizado de un componente
   */
  measureComponentRender(
    componentName: string,
    renderFn: () => void,
    context?: string
  ): number {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    this.recordMetric(`component-render-${componentName}`, renderTime, 'ms', context);

    // Evaluar contra umbrales
    this.evaluateThreshold('component-render', renderTime, {
      component: componentName,
      context
    });

    return renderTime;
  }

  /**
   * Mide una interacción de usuario
   */
  measureUserInteraction(
    interactionName: string,
    interactionFn: () => void | Promise<void>,
    context?: string
  ): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now();

      const finish = () => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.recordMetric(`user-interaction-${interactionName}`, duration, 'ms', context);
        this.evaluateThreshold('user-interaction', duration, {
          interaction: interactionName,
          context
        });

        resolve(duration);
      };

      const result = interactionFn();

      if (result instanceof Promise) {
        result.finally(finish);
      } else {
        finish();
      }
    });
  }

  /**
   * Mide una operación asíncrona
   */
  async measureAsyncOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();

    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric(`async-operation-${operationName}`, duration, 'ms', context);
      this.evaluateThreshold('async-operation', duration, {
        operation: operationName,
        context,
        success: true
      });

      return { result, duration };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric(`async-operation-${operationName}`, duration, 'ms', context);
      this.evaluateThreshold('async-operation', duration, {
        operation: operationName,
        context,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Registra una métrica personalizada
   */
  recordMetric(
    name: string,
    value: number,
    unit: 'ms' | 'fps' | 'bytes' | 'count',
    context?: string,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      context,
      metadata
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);

    // Limitar el tamaño del array para evitar memory leaks
    const metrics = this.metrics.get(name)!;
    if (metrics.length > 1000) {
      metrics.splice(0, 500); // Eliminar los primeros 500 elementos
    }
  }

  /**
   * Evalúa una métrica contra sus umbrales
   */
  private evaluateThreshold(
    metricType: string,
    value: number,
    metadata?: Record<string, any>
  ): void {
    const threshold = this.thresholds.get(metricType);
    if (!threshold) return;

    let level: 'normal' | 'warning' | 'critical' = 'normal';
    let message = '';

    if (value >= threshold.critical) {
      level = 'critical';
      message = `CRITICAL: ${metricType} exceeded critical threshold (${value}${threshold.unit} > ${threshold.critical}${threshold.unit})`;
    } else if (value >= threshold.warning) {
      level = 'warning';
      message = `WARNING: ${metricType} exceeded warning threshold (${value}${threshold.unit} > ${threshold.warning}${threshold.unit})`;
    }

    if (level !== 'normal') {
      console.warn(`🔍 ${message}`, metadata);

      // Enviar a servicio de monitoreo en producción
      if (process.env.NODE_ENV === 'production') {
        this.reportToMonitoringService(metricType, level, value, metadata);
      }
    }
  }

  /**
   * Reporta métricas a servicio externo de monitoreo
   */
  private reportToMonitoringService(
    metricType: string,
    level: 'warning' | 'critical',
    value: number,
    metadata?: Record<string, any>
  ): void {
    // Implementar integración con servicios como:
    // - Sentry
    // - DataDog
    // - New Relic
    // - Google Analytics

    console.log('📊 Reporting to monitoring service:', {
      metricType,
      level,
      value,
      metadata,
      timestamp: Date.now()
    });
  }

  /**
   * Inicializa observer para Web Vitals
   */
  private initializeWebVitalsObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            switch (entry.entryType) {
              case 'largest-contentful-paint':
                this.recordMetric('LCP', entry.startTime, 'ms', 'web-vital');
                break;
              case 'first-input':
                this.recordMetric('FID', entry.processingStart - entry.startTime, 'ms', 'web-vital');
                break;
              case 'layout-shift':
                if (!(entry as any).hadRecentInput) {
                  this.recordMetric('CLS', (entry as any).value, 'count', 'web-vital');
                }
                break;
            }
          }
        });

        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('Failed to initialize Web Vitals observer:', error);
      }
    }
  }

  /**
   * Inicializa observer para Resource Timing
   */
  private initializeResourceTimingObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resource = entry as PerformanceResourceTiming;

              // Registrar recursos lentos (>2 segundos)
              if (resource.duration > 2000) {
                this.recordMetric('slow-resource', resource.duration, 'ms', 'resource-timing', {
                  url: resource.name,
                  type: this.getResourceType(resource.name)
                });
              }
            }
          }
        });

        observer.observe({ entryTypes: ['resource'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('Failed to initialize Resource Timing observer:', error);
      }
    }
  }

  /**
   * Inicializa observer para Paint Timing
   */
  private initializePaintTimingObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint') {
              this.recordMetric(entry.name, entry.startTime, 'ms', 'paint-timing');
            }
          }
        });

        observer.observe({ entryTypes: ['paint'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('Failed to initialize Paint Timing observer:', error);
      }
    }
  }

  /**
   * Inicia monitoreo de memoria
   */
  private startMemoryMonitoring(): void {
    if ('memory' in performance) {
      const checkMemory = () => {
        if (!this.isMonitoring) return;

        const memory = (performance as any).memory;
        const usedMemory = memory.usedJSHeapSize;

        this.recordMetric('memory-usage', usedMemory, 'bytes', 'system');
        this.evaluateThreshold('memory-usage', usedMemory);

        // Chequear cada 5 segundos
        setTimeout(checkMemory, 5000);
      };

      checkMemory();
    }
  }

  /**
   * Inicia monitoreo de FPS
   */
  private startFPSMonitoring(): void {
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 0;

    const calculateFPS = (currentTime: number) => {
      if (!this.isMonitoring) return;

      frameCount++;
      const elapsed = currentTime - lastTime;

      if (elapsed >= 1000) {
        fps = Math.round((frameCount * 1000) / elapsed);

        this.recordMetric('fps', fps, 'fps', 'rendering');
        this.evaluateThreshold('fps', fps);

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(calculateFPS);
    };

    requestAnimationFrame(calculateFPS);
  }

  /**
   * Obtiene el tipo de recurso a partir de su URL
   */
  private getResourceType(url: string): string {
    if (url.match(/\.(js|jsx|ts|tsx)$/)) return 'script';
    if (url.match(/\.(css|scss|sass)$/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * Obtiene métricas de un componente específico
   */
  getComponentMetrics(componentName: string): ComponentMetrics | null {
    return this.componentMetrics.get(componentName) || null;
  }

  /**
   * Obtiene todas las métricas globales
   */
  getGlobalMetrics(): GlobalMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    return {
      webVitals: {
        LCP: this.getLastMetricValue('LCP') || 0,
        FID: this.getLastMetricValue('FID') || 0,
        CLS: this.getLastMetricValue('CLS') || 0,
        FCP: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        TTFB: navigation.responseStart - navigation.requestStart
      },
      resourceTiming: resources,
      navigationTiming: navigation,
      paintTiming: paint as PerformancePaintTiming[]
    };
  }

  /**
   * Obtiene el último valor de una métrica
   */
  private getLastMetricValue(metricName: string): number | null {
    const metrics = this.metrics.get(metricName);
    if (!metrics || metrics.length === 0) return null;
    return metrics[metrics.length - 1].value;
  }

  /**
   * Genera un reporte de rendimiento
   */
  generateReport(): string {
    const globalMetrics = this.getGlobalMetrics();
    const report = [
      '# Performance Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Web Vitals',
      `- LCP: ${globalMetrics.webVitals.LCP.toFixed(2)}ms`,
      `- FID: ${globalMetrics.webVitals.FID.toFixed(2)}ms`,
      `- CLS: ${globalMetrics.webVitals.CLS.toFixed(4)}`,
      `- FCP: ${globalMetrics.webVitals.FCP.toFixed(2)}ms`,
      `- TTFB: ${globalMetrics.webVitals.TTFB.toFixed(2)}ms`,
      '',
      '## Component Performance',
    ];

    // Agregar métricas de componentes
    for (const [componentName, metrics] of this.componentMetrics) {
      report.push(`### ${componentName}`);

      if (metrics.renderTime.length > 0) {
        const avgRenderTime = metrics.renderTime.reduce((sum, m) => sum + m.value, 0) / metrics.renderTime.length;
        report.push(`- Average render time: ${avgRenderTime.toFixed(2)}ms`);
      }

      if (metrics.userInteractions.length > 0) {
        const avgInteractionTime = metrics.userInteractions.reduce((sum, m) => sum + m.value, 0) / metrics.userInteractions.length;
        report.push(`- Average interaction time: ${avgInteractionTime.toFixed(2)}ms`);
      }

      report.push('');
    }

    // Agregar recursos lentos
    const slowResources = this.metrics.get('slow-resource') || [];
    if (slowResources.length > 0) {
      report.push('## Slow Resources');
      slowResources.forEach(resource => {
        report.push(`- ${resource.metadata?.url}: ${resource.value.toFixed(2)}ms`);
      });
      report.push('');
    }

    // Agregar FPS
    const fpsMetrics = this.metrics.get('fps') || [];
    if (fpsMetrics.length > 0) {
      const avgFPS = fpsMetrics.reduce((sum, m) => sum + m.value, 0) / fpsMetrics.length;
      report.push(`## Rendering Performance`);
      report.push(`- Average FPS: ${avgFPS.toFixed(2)}`);
      report.push(`- Min FPS: ${Math.min(...fpsMetrics.map(m => m.value))}`);
      report.push(`- Max FPS: ${Math.max(...fpsMetrics.map(m => m.value))}`);
      report.push('');
    }

    return report.join('\n');
  }

  /**
   * Exporta métricas a JSON
   */
  exportMetrics(): object {
    return {
      timestamp: Date.now(),
      global: this.getGlobalMetrics(),
      components: Object.fromEntries(this.componentMetrics),
      custom: Object.fromEntries(this.metrics)
    };
  }
}

// Instancia singleton del monitor
export const performanceMonitor = new PerformanceMonitor();

// Hook para React que facilita el uso del monitor
export function usePerformanceMonitor(componentName: string) {
  return {
    measureRender: (renderFn: () => void, context?: string) =>
      performanceMonitor.measureComponentRender(componentName, renderFn, context),

    measureInteraction: (interactionName: string, fn: () => void | Promise<void>, context?: string) =>
      performanceMonitor.measureUserInteraction(interactionName, fn, context),

    measureAsync: <T>(operationName: string, operation: () => Promise<T>, context?: string) =>
      performanceMonitor.measureAsyncOperation(operationName, operation, context),

    recordMetric: (name: string, value: number, unit: 'ms' | 'fps' | 'bytes' | 'count', context?: string) =>
      performanceMonitor.recordMetric(`${componentName}-${name}`, value, unit, context),

    getMetrics: () => performanceMonitor.getComponentMetrics(componentName)
  };
}

export default performanceMonitor;