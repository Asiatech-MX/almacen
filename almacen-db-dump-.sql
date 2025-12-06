--
-- PostgreSQL database dump
--

\restrict iXfG4byUI7Cq1WFh0v2DTdO4aYpPeaWkFN0KUwH7Rm9zUa6hPDRx9YirDwokagS

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

-- Started on 2025-12-02 01:13:22 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS almacen_db;
--
-- TOC entry 3811 (class 1262 OID 16384)
-- Name: almacen_db; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE almacen_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C';


\unrestrict iXfG4byUI7Cq1WFh0v2DTdO4aYpPeaWkFN0KUwH7Rm9zUa6hPDRx9YirDwokagS
\connect almacen_db
\restrict iXfG4byUI7Cq1WFh0v2DTdO4aYpPeaWkFN0KUwH7Rm9zUa6hPDRx9YirDwokagS

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 256 (class 1255 OID 41664)
-- Name: actualizar_ruta_categoria(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_ruta_categoria() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.categoria_padre_id IS NULL THEN
            NEW.ruta_completa = NEW.nombre;
            NEW.nivel = 1;
        ELSE
            SELECT ruta_completa || ' > ' || NEW.nombre, nivel + 1
            INTO NEW.ruta_completa, NEW.nivel
            FROM categoria WHERE id = NEW.categoria_padre_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


--
-- TOC entry 254 (class 1255 OID 16760)
-- Name: actualizar_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- TOC entry 253 (class 1255 OID 16762)
-- Name: auditar_cambios(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auditar_cambios() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria (tabla_afectada, id_registro_afectado, tipo_operacion, valor_anterior, id_usuario)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), NULL);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO auditoria (tabla_afectada, id_registro_afectado, tipo_operacion, valor_anterior, valor_nuevo, id_usuario)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), NEW.id_usuario);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria (tabla_afectada, id_registro_afectado, tipo_operacion, valor_nuevo, id_usuario)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), NEW.id_usuario);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;


--
-- TOC entry 269 (class 1255 OID 25016)
-- Name: auditoria_materia_prima(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auditoria_materia_prima() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO materia_prima_auditoria (
            materia_prima_legacy_id,
            materia_prima_id,
            accion,
            datos_nuevos,
            fecha
        ) VALUES (
            NEW.id,
            NULL, -- UUID no aplica para legacy
            'INSERT',
            row_to_json(NEW),
            CURRENT_TIMESTAMP
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Solo registrar si hay cambios reales
        IF NEW IS DISTINCT FROM OLD THEN
            INSERT INTO materia_prima_auditoria (
                materia_prima_legacy_id,
                materia_prima_id,
                accion,
                datos_anteriores,
                datos_nuevos,
                fecha
            ) VALUES (
                NEW.id,
                NULL, -- UUID no aplica para legacy
                'UPDATE',
                row_to_json(OLD),
                row_to_json(NEW),
                CURRENT_TIMESTAMP
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO materia_prima_auditoria (
            materia_prima_legacy_id,
            materia_prima_id,
            accion,
            datos_anteriores,
            fecha
        ) VALUES (
            OLD.id,
            NULL, -- UUID no aplica para legacy
            'DELETE',
            row_to_json(OLD),
            CURRENT_TIMESTAMP
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


--
-- TOC entry 257 (class 1255 OID 41622)
-- Name: mapear_texto_a_categoria_id(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mapear_texto_a_categoria_id(texto text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (SELECT id FROM categoria
            WHERE LOWER(nombre) = LOWER(texto)
            LIMIT 1);
END;
$$;


--
-- TOC entry 255 (class 1255 OID 41621)
-- Name: mapear_texto_a_presentacion_id(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mapear_texto_a_presentacion_id(texto text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (SELECT id FROM presentacion
            WHERE LOWER(nombre) = LOWER(texto)
            LIMIT 1);
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 242 (class 1259 OID 16711)
-- Name: auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auditoria (
    id integer NOT NULL,
    tabla_afectada character varying(50) NOT NULL,
    id_registro_afectado integer NOT NULL,
    tipo_operacion character varying(20) NOT NULL,
    valor_anterior jsonb,
    valor_nuevo jsonb,
    id_usuario integer NOT NULL,
    fecha_operacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address character varying(45),
    user_agent text,
    CONSTRAINT auditoria_tipo_operacion_check CHECK (((tipo_operacion)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[])))
);


--
-- TOC entry 241 (class 1259 OID 16710)
-- Name: auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auditoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3812 (class 0 OID 0)
-- Dependencies: 241
-- Name: auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;


--
-- TOC entry 252 (class 1259 OID 41639)
-- Name: categoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categoria (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    categoria_padre_id integer,
    nivel integer DEFAULT 1 NOT NULL,
    ruta_completa text,
    icono character varying(50),
    color character varying(7),
    orden integer DEFAULT 0,
    activo boolean DEFAULT true,
    es_predeterminado boolean DEFAULT false,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_institucion integer NOT NULL
);


--
-- TOC entry 3813 (class 0 OID 0)
-- Dependencies: 252
-- Name: TABLE categoria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.categoria IS 'Tabla de categorías con soporte para jerarquía ilimitada';


--
-- TOC entry 3814 (class 0 OID 0)
-- Dependencies: 252
-- Name: COLUMN categoria.ruta_completa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.categoria.ruta_completa IS 'Ruta jerárquica completa para facilitar búsquedas y visualización';


--
-- TOC entry 3815 (class 0 OID 0)
-- Dependencies: 252
-- Name: COLUMN categoria.id_institucion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.categoria.id_institucion IS 'Institution to which this category belongs (multi-tenant support)';


--
-- TOC entry 251 (class 1259 OID 41638)
-- Name: categoria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3816 (class 0 OID 0)
-- Dependencies: 251
-- Name: categoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categoria_id_seq OWNED BY public.categoria.id;


--
-- TOC entry 220 (class 1259 OID 16436)
-- Name: empresa_proveedora; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresa_proveedora (
    id_fiscal character varying(50) NOT NULL,
    nombre character varying(200) NOT NULL,
    domicilio character varying(200) NOT NULL,
    numero_interior character varying(20),
    numero_exterior character varying(50),
    colonia character varying(100),
    ciudad character varying(100),
    pais character varying(100),
    codigo_postal integer,
    telefono character varying(100),
    email character varying(100),
    contacto character varying(100),
    condicion_pago character varying(255),
    condicion_entrega character varying(255),
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 232 (class 1259 OID 16567)
-- Name: entrada_material; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entrada_material (
    id integer NOT NULL,
    id_material integer NOT NULL,
    id_proveedor integer NOT NULL,
    cantidad_anterior numeric(10,2) NOT NULL,
    cantidad_entrante numeric(10,2) NOT NULL,
    cantidad_actual numeric(10,2) NOT NULL,
    precio_unitario numeric(12,4) NOT NULL,
    tipo_moneda character varying(10) DEFAULT 'MXN'::character varying NOT NULL,
    estado_material character varying(100) NOT NULL,
    id_usuario integer NOT NULL,
    fecha_movimiento timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id_institucion integer NOT NULL,
    numero_factura character varying(100),
    fecha_factura date,
    comentarios text,
    id_solicitud_compra integer,
    CONSTRAINT entrada_material_cantidad_actual_check CHECK ((cantidad_actual >= (0)::numeric)),
    CONSTRAINT entrada_material_cantidad_anterior_check CHECK ((cantidad_anterior >= (0)::numeric)),
    CONSTRAINT entrada_material_cantidad_entrante_check CHECK ((cantidad_entrante > (0)::numeric)),
    CONSTRAINT entrada_material_precio_unitario_check CHECK ((precio_unitario >= (0)::numeric)),
    CONSTRAINT entrada_material_tipo_moneda_check CHECK (((tipo_moneda)::text = ANY ((ARRAY['MXN'::character varying, 'USD'::character varying, 'EUR'::character varying])::text[])))
);


--
-- TOC entry 231 (class 1259 OID 16566)
-- Name: entrada_material_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entrada_material_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3817 (class 0 OID 0)
-- Dependencies: 231
-- Name: entrada_material_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entrada_material_id_seq OWNED BY public.entrada_material.id;


--
-- TOC entry 236 (class 1259 OID 16641)
-- Name: entrada_producto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entrada_producto (
    id integer NOT NULL,
    id_producto integer NOT NULL,
    fecha_caducidad date,
    cantidad_anterior numeric(10,2) NOT NULL,
    cantidad_entrante numeric(10,2) NOT NULL,
    cantidad_actual numeric(10,2) NOT NULL,
    numero_lotes integer,
    cantidad_por_lote numeric(10,2),
    codigo_lotes character varying(100),
    estado_producto character varying(100) NOT NULL,
    numero_orden_produccion character varying(100),
    embalaje character varying(200),
    otro_embalaje character varying(100),
    pallet character varying(100),
    id_usuario integer NOT NULL,
    fecha_movimiento timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    comentarios text,
    CONSTRAINT entrada_producto_cantidad_actual_check CHECK ((cantidad_actual >= (0)::numeric)),
    CONSTRAINT entrada_producto_cantidad_anterior_check CHECK ((cantidad_anterior >= (0)::numeric)),
    CONSTRAINT entrada_producto_cantidad_entrante_check CHECK ((cantidad_entrante > (0)::numeric))
);


--
-- TOC entry 235 (class 1259 OID 16640)
-- Name: entrada_producto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entrada_producto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3818 (class 0 OID 0)
-- Dependencies: 235
-- Name: entrada_producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entrada_producto_id_seq OWNED BY public.entrada_producto.id;


--
-- TOC entry 215 (class 1259 OID 16386)
-- Name: institucion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.institucion (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    estatus character varying(20) DEFAULT 'ACTIVO'::character varying NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 214 (class 1259 OID 16385)
-- Name: institucion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.institucion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3819 (class 0 OID 0)
-- Dependencies: 214
-- Name: institucion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.institucion_id_seq OWNED BY public.institucion.id;


--
-- TOC entry 246 (class 1259 OID 24973)
-- Name: kysely_migration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kysely_migration (
    name character varying(255) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 247 (class 1259 OID 24979)
-- Name: materia_prima; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materia_prima (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo_barras character varying(50) NOT NULL,
    nombre character varying(255) NOT NULL,
    marca character varying(100),
    modelo character varying(100),
    presentacion character varying(50) NOT NULL,
    stock_actual numeric(10,2) DEFAULT 0 NOT NULL,
    stock_minimo numeric(10,2) DEFAULT 0 NOT NULL,
    costo_unitario numeric(10,2),
    fecha_caducidad date,
    imagen_url character varying(500),
    descripcion text,
    categoria character varying(100),
    proveedor_id uuid,
    activo boolean DEFAULT true,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    eliminado_en timestamp with time zone,
    presentacion_id integer,
    categoria_id integer
);


--
-- TOC entry 248 (class 1259 OID 24994)
-- Name: materia_prima_auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materia_prima_auditoria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    materia_prima_id uuid,
    accion character varying(20) NOT NULL,
    datos_anteriores jsonb,
    datos_nuevos jsonb,
    usuario_id uuid,
    fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    materia_prima_legacy_id integer NOT NULL
);


--
-- TOC entry 222 (class 1259 OID 16445)
-- Name: materia_prima_legacy_20251114; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materia_prima_legacy_20251114 (
    id integer NOT NULL,
    codigo_barras character varying(255) NOT NULL,
    nombre character varying(255) NOT NULL,
    marca character varying(255) NOT NULL,
    modelo character varying(255) NOT NULL,
    presentacion character varying(255) NOT NULL,
    stock numeric(10,2) DEFAULT 0 NOT NULL,
    stock_minimo numeric(10,2) DEFAULT 0,
    estatus character varying(50) DEFAULT 'ACTIVO'::character varying NOT NULL,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id_institucion integer NOT NULL,
    imagen_url character varying(500),
    unidad_medida character varying(50) DEFAULT 'PIEZA'::character varying NOT NULL,
    actualizado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    eliminado_en timestamp with time zone,
    activo boolean DEFAULT true,
    costo_unitario numeric(10,2),
    fecha_caducidad date,
    descripcion text,
    categoria character varying(100),
    proveedor_id uuid,
    CONSTRAINT materia_prima_estatus_check CHECK (((estatus)::text = ANY ((ARRAY['ACTIVO'::character varying, 'INACTIVO'::character varying, 'SUSPENDIDO'::character varying])::text[]))),
    CONSTRAINT materia_prima_stock_check CHECK ((stock >= (0)::numeric)),
    CONSTRAINT materia_prima_stock_minimo_check CHECK ((stock_minimo >= (0)::numeric))
);


--
-- TOC entry 221 (class 1259 OID 16444)
-- Name: materia_prima_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.materia_prima_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3820 (class 0 OID 0)
-- Dependencies: 221
-- Name: materia_prima_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.materia_prima_id_seq OWNED BY public.materia_prima_legacy_20251114.id;


--
-- TOC entry 240 (class 1259 OID 16692)
-- Name: parametro_sistema; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parametro_sistema (
    id integer NOT NULL,
    clave character varying(100) NOT NULL,
    valor text,
    descripcion text,
    tipo_dato character varying(20) DEFAULT 'STRING'::character varying NOT NULL,
    id_institucion integer,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT parametro_sistema_tipo_dato_check CHECK (((tipo_dato)::text = ANY ((ARRAY['STRING'::character varying, 'NUMBER'::character varying, 'BOOLEAN'::character varying, 'DATE'::character varying])::text[])))
);


--
-- TOC entry 239 (class 1259 OID 16691)
-- Name: parametro_sistema_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parametro_sistema_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3821 (class 0 OID 0)
-- Dependencies: 239
-- Name: parametro_sistema_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parametro_sistema_id_seq OWNED BY public.parametro_sistema.id;


--
-- TOC entry 250 (class 1259 OID 41624)
-- Name: presentacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presentacion (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    abreviatura character varying(20),
    unidad_base character varying(20),
    factor_conversion numeric(10,4),
    activo boolean DEFAULT true,
    es_predeterminado boolean DEFAULT false,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_institucion integer NOT NULL
);


--
-- TOC entry 3822 (class 0 OID 0)
-- Dependencies: 250
-- Name: TABLE presentacion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.presentacion IS 'Tabla de presentaciones dinámicas con soporte para unidades y conversiones';


--
-- TOC entry 3823 (class 0 OID 0)
-- Dependencies: 250
-- Name: COLUMN presentacion.abreviatura; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.presentacion.abreviatura IS 'Abreviatura para display en selects y formularios';


--
-- TOC entry 3824 (class 0 OID 0)
-- Dependencies: 250
-- Name: COLUMN presentacion.factor_conversion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.presentacion.factor_conversion IS 'Factor para convertir a unidad_base';


--
-- TOC entry 3825 (class 0 OID 0)
-- Dependencies: 250
-- Name: COLUMN presentacion.id_institucion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.presentacion.id_institucion IS 'Institution to which this presentation belongs (multi-tenant support)';


--
-- TOC entry 249 (class 1259 OID 41623)
-- Name: presentacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.presentacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3826 (class 0 OID 0)
-- Dependencies: 249
-- Name: presentacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.presentacion_id_seq OWNED BY public.presentacion.id;


--
-- TOC entry 224 (class 1259 OID 16469)
-- Name: producto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.producto (
    id integer NOT NULL,
    codigo_barras character varying(255) NOT NULL,
    nombre character varying(255) NOT NULL,
    marca character varying(255) NOT NULL,
    modelo character varying(255) NOT NULL,
    cantidad numeric(10,2) DEFAULT 0 NOT NULL,
    sku character varying(255) NOT NULL,
    descripcion text,
    unidad_medida character varying(50) NOT NULL,
    tiempo_produccion numeric(8,2) DEFAULT 0 NOT NULL,
    unidad_medida_secundaria character varying(50),
    stock numeric(10,2) DEFAULT 0 NOT NULL,
    estatus character varying(50) DEFAULT 'ACTIVO'::character varying NOT NULL,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id_institucion integer NOT NULL,
    imagen_url character varying(500),
    CONSTRAINT producto_cantidad_check CHECK ((cantidad >= (0)::numeric)),
    CONSTRAINT producto_estatus_check CHECK (((estatus)::text = ANY ((ARRAY['ACTIVO'::character varying, 'INACTIVO'::character varying])::text[]))),
    CONSTRAINT producto_stock_check CHECK ((stock >= (0)::numeric))
);


--
-- TOC entry 226 (class 1259 OID 16495)
-- Name: producto_detalle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.producto_detalle (
    id integer NOT NULL,
    id_producto integer NOT NULL,
    longitud numeric(8,2),
    anchura numeric(8,2),
    alto numeric(8,2),
    peso_bruto numeric(8,2),
    peso_neto numeric(8,2),
    precio numeric(12,2) DEFAULT 0 NOT NULL,
    cantidad integer DEFAULT 0 NOT NULL,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT producto_detalle_precio_check CHECK ((precio >= (0)::numeric))
);


--
-- TOC entry 225 (class 1259 OID 16494)
-- Name: producto_detalle_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.producto_detalle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3827 (class 0 OID 0)
-- Dependencies: 225
-- Name: producto_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.producto_detalle_id_seq OWNED BY public.producto_detalle.id;


--
-- TOC entry 228 (class 1259 OID 16511)
-- Name: producto_detalle_produccion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.producto_detalle_produccion (
    id integer NOT NULL,
    id_producto integer NOT NULL,
    orden_produccion character varying(200) NOT NULL,
    fecha_fabricacion date,
    fecha_caducidad date,
    clave_empresa character varying(200),
    status character varying(50) DEFAULT 'PRODUCCION'::character varying,
    escuela character varying(200),
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 227 (class 1259 OID 16510)
-- Name: producto_detalle_produccion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.producto_detalle_produccion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3828 (class 0 OID 0)
-- Dependencies: 227
-- Name: producto_detalle_produccion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.producto_detalle_produccion_id_seq OWNED BY public.producto_detalle_produccion.id;


--
-- TOC entry 223 (class 1259 OID 16468)
-- Name: producto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.producto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3829 (class 0 OID 0)
-- Dependencies: 223
-- Name: producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.producto_id_seq OWNED BY public.producto.id;


--
-- TOC entry 219 (class 1259 OID 16418)
-- Name: proveedor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proveedor (
    id integer NOT NULL,
    id_fiscal character varying(50) NOT NULL,
    nombre character varying(255) NOT NULL,
    domicilio text,
    telefono character varying(50),
    email character varying(255),
    contacto character varying(255),
    rfc character varying(20),
    curp character varying(20),
    estatus character varying(50) DEFAULT 'ACTIVO'::character varying NOT NULL,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id_institucion integer NOT NULL,
    CONSTRAINT proveedor_estatus_check CHECK (((estatus)::text = ANY ((ARRAY['ACTIVO'::character varying, 'INACTIVO'::character varying])::text[])))
);


--
-- TOC entry 218 (class 1259 OID 16417)
-- Name: proveedor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proveedor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3830 (class 0 OID 0)
-- Dependencies: 218
-- Name: proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proveedor_id_seq OWNED BY public.proveedor.id;


--
-- TOC entry 234 (class 1259 OID 16608)
-- Name: salida_material; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salida_material (
    id integer NOT NULL,
    id_material integer NOT NULL,
    cantidad_anterior numeric(10,2) NOT NULL,
    cantidad_saliente numeric(10,2) NOT NULL,
    cantidad_posterior numeric(10,2) NOT NULL,
    estado_material character varying(100) NOT NULL,
    solicitante character varying(250) NOT NULL,
    id_usuario integer NOT NULL,
    razon_uso text NOT NULL,
    orden_produccion character varying(250),
    fecha_movimiento timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id_institucion integer NOT NULL,
    autorizado_por integer,
    comentarios text,
    CONSTRAINT salida_material_cantidad_anterior_check CHECK ((cantidad_anterior >= (0)::numeric)),
    CONSTRAINT salida_material_cantidad_posterior_check CHECK ((cantidad_posterior >= (0)::numeric)),
    CONSTRAINT salida_material_cantidad_saliente_check CHECK ((cantidad_saliente > (0)::numeric))
);


--
-- TOC entry 233 (class 1259 OID 16607)
-- Name: salida_material_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salida_material_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3831 (class 0 OID 0)
-- Dependencies: 233
-- Name: salida_material_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salida_material_id_seq OWNED BY public.salida_material.id;


--
-- TOC entry 238 (class 1259 OID 16664)
-- Name: salida_producto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salida_producto (
    id integer NOT NULL,
    id_producto integer NOT NULL,
    fecha_caducidad date,
    cantidad_anterior numeric(10,2) NOT NULL,
    cantidad_saliente numeric(10,2) NOT NULL,
    cantidad_posterior numeric(10,2) NOT NULL,
    numero_lotes integer,
    codigo_lotes character varying(200),
    estado_producto character varying(100) NOT NULL,
    orden_produccion character varying(200) NOT NULL,
    autorizacion character varying(250),
    id_cliente integer,
    id_usuario integer NOT NULL,
    fecha_movimiento timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id_institucion integer NOT NULL,
    comentarios text,
    CONSTRAINT salida_producto_cantidad_anterior_check CHECK ((cantidad_anterior >= (0)::numeric)),
    CONSTRAINT salida_producto_cantidad_posterior_check CHECK ((cantidad_posterior >= (0)::numeric)),
    CONSTRAINT salida_producto_cantidad_saliente_check CHECK ((cantidad_saliente > (0)::numeric))
);


--
-- TOC entry 237 (class 1259 OID 16663)
-- Name: salida_producto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salida_producto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3832 (class 0 OID 0)
-- Dependencies: 237
-- Name: salida_producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salida_producto_id_seq OWNED BY public.salida_producto.id;


--
-- TOC entry 230 (class 1259 OID 16527)
-- Name: solicitud_compra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitud_compra (
    id integer NOT NULL,
    folio character varying(100) NOT NULL,
    empresa_solicitante character varying(255) NOT NULL,
    nombre_solicitante character varying(255) NOT NULL,
    direccion_solicitante text,
    rfc_solicitante character varying(50),
    telefono_solicitante character varying(50),
    correo_solicitante character varying(100),
    uso_cfdi character varying(100),
    forma_pago character varying(100),
    departamento_solicitante character varying(100),
    fecha_solicitud date NOT NULL,
    id_material integer NOT NULL,
    modelo_material character varying(255),
    marca_material character varying(255),
    cantidad_solicitada numeric(10,2) NOT NULL,
    unidad_medida character varying(50) NOT NULL,
    id_proveedor integer,
    id_usuario_solicitante integer NOT NULL,
    lugar_entrega text,
    fecha_esperada date,
    id_institucion integer NOT NULL,
    estatus character varying(50) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion timestamp without time zone,
    id_usuario_autorizo integer,
    comentarios text,
    CONSTRAINT solicitud_compra_cantidad_solicitada_check CHECK ((cantidad_solicitada > (0)::numeric)),
    CONSTRAINT solicitud_compra_estatus_check CHECK (((estatus)::text = ANY ((ARRAY['PENDIENTE'::character varying, 'APROBADO'::character varying, 'RECHAZADO'::character varying, 'COMPRADO'::character varying, 'RECIBIDO'::character varying])::text[])))
);


--
-- TOC entry 229 (class 1259 OID 16526)
-- Name: solicitud_compra_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solicitud_compra_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3833 (class 0 OID 0)
-- Dependencies: 229
-- Name: solicitud_compra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solicitud_compra_id_seq OWNED BY public.solicitud_compra.id;


--
-- TOC entry 217 (class 1259 OID 16399)
-- Name: usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario (
    id integer NOT NULL,
    nombre character varying(80) NOT NULL,
    apellido_paterno character varying(30) NOT NULL,
    apellido_materno character varying(30),
    username character varying(30) NOT NULL,
    password_hash character varying(255) NOT NULL,
    tipo_usuario character varying(30) DEFAULT 'CONSULTA'::character varying NOT NULL,
    id_institucion integer NOT NULL,
    estatus character varying(20) DEFAULT 'ACTIVO'::character varying NOT NULL,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ultimo_login timestamp without time zone,
    CONSTRAINT usuario_estatus_check CHECK (((estatus)::text = ANY ((ARRAY['ACTIVO'::character varying, 'INACTIVO'::character varying])::text[]))),
    CONSTRAINT usuario_tipo_usuario_check CHECK (((tipo_usuario)::text = ANY ((ARRAY['ADMIN'::character varying, 'PROFESOR'::character varying, 'CONSULTA'::character varying])::text[])))
);


--
-- TOC entry 216 (class 1259 OID 16398)
-- Name: usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3834 (class 0 OID 0)
-- Dependencies: 216
-- Name: usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuario_id_seq OWNED BY public.usuario.id;


--
-- TOC entry 244 (class 1259 OID 16772)
-- Name: vw_movimientos_material; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_movimientos_material AS
 SELECT 'ENTRADA'::text AS tipo_movimiento,
    em.id,
    em.fecha_movimiento,
    mp.codigo_barras,
    mp.nombre AS material_nombre,
    p.nombre AS proveedor_nombre,
    em.cantidad_entrante AS cantidad,
    em.cantidad_anterior,
    em.cantidad_actual,
    em.tipo_moneda,
    em.precio_unitario,
    u.nombre AS usuario_nombre,
    i.nombre AS institucion,
    em.numero_factura
   FROM ((((public.entrada_material em
     JOIN public.materia_prima_legacy_20251114 mp ON ((em.id_material = mp.id)))
     JOIN public.proveedor p ON ((em.id_proveedor = p.id)))
     JOIN public.usuario u ON ((em.id_usuario = u.id)))
     JOIN public.institucion i ON ((em.id_institucion = i.id)))
UNION ALL
 SELECT 'SALIDA'::text AS tipo_movimiento,
    sm.id,
    sm.fecha_movimiento,
    mp.codigo_barras,
    mp.nombre AS material_nombre,
    NULL::character varying AS proveedor_nombre,
    sm.cantidad_saliente AS cantidad,
    sm.cantidad_anterior,
    sm.cantidad_posterior AS cantidad_actual,
    NULL::character varying AS tipo_moneda,
    NULL::numeric AS precio_unitario,
    u.nombre AS usuario_nombre,
    i.nombre AS institucion,
    NULL::character varying AS numero_factura
   FROM (((public.salida_material sm
     JOIN public.materia_prima_legacy_20251114 mp ON ((sm.id_material = mp.id)))
     JOIN public.usuario u ON ((sm.id_usuario = u.id)))
     JOIN public.institucion i ON ((sm.id_institucion = i.id)));


--
-- TOC entry 245 (class 1259 OID 16777)
-- Name: vw_solicitudes_resumen; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_solicitudes_resumen AS
 SELECT solicitud_compra.estatus,
    count(*) AS total_solicitudes,
    sum(solicitud_compra.cantidad_solicitada) AS cantidad_total,
    count(DISTINCT solicitud_compra.id_material) AS materiales_distintos,
    count(DISTINCT solicitud_compra.id_proveedor) AS proveedores_distintos
   FROM public.solicitud_compra
  GROUP BY solicitud_compra.estatus;


--
-- TOC entry 243 (class 1259 OID 16767)
-- Name: vw_stock_materia_prima; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_stock_materia_prima AS
 SELECT mp.id,
    mp.codigo_barras,
    mp.nombre,
    mp.marca,
    mp.modelo,
    mp.presentacion,
    mp.stock,
    mp.stock_minimo,
        CASE
            WHEN (mp.stock <= mp.stock_minimo) THEN 'STOCK BAJO'::text
            WHEN (mp.stock = (0)::numeric) THEN 'SIN STOCK'::text
            ELSE 'OK'::text
        END AS estatus_stock,
    mp.unidad_medida,
    i.nombre AS institucion,
    mp.estatus
   FROM (public.materia_prima_legacy_20251114 mp
     JOIN public.institucion i ON ((mp.id_institucion = i.id)))
  WHERE ((mp.estatus)::text = 'ACTIVO'::text);


--
-- TOC entry 3416 (class 2604 OID 16714)
-- Name: auditoria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);


--
-- TOC entry 3432 (class 2604 OID 41642)
-- Name: categoria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria ALTER COLUMN id SET DEFAULT nextval('public.categoria_id_seq'::regclass);


--
-- TOC entry 3404 (class 2604 OID 16570)
-- Name: entrada_material id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrada_material ALTER COLUMN id SET DEFAULT nextval('public.entrada_material_id_seq'::regclass);


--
-- TOC entry 3409 (class 2604 OID 16644)
-- Name: entrada_producto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrada_producto ALTER COLUMN id SET DEFAULT nextval('public.entrada_producto_id_seq'::regclass);


--
-- TOC entry 3369 (class 2604 OID 16389)
-- Name: institucion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institucion ALTER COLUMN id SET DEFAULT nextval('public.institucion_id_seq'::regclass);


--
-- TOC entry 3380 (class 2604 OID 16448)
-- Name: materia_prima_legacy_20251114 id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materia_prima_legacy_20251114 ALTER COLUMN id SET DEFAULT nextval('public.materia_prima_id_seq'::regclass);


--
-- TOC entry 3413 (class 2604 OID 16695)
-- Name: parametro_sistema id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametro_sistema ALTER COLUMN id SET DEFAULT nextval('public.parametro_sistema_id_seq'::regclass);


--
-- TOC entry 3427 (class 2604 OID 41627)
-- Name: presentacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentacion ALTER COLUMN id SET DEFAULT nextval('public.presentacion_id_seq'::regclass);


--
-- TOC entry 3388 (class 2604 OID 16472)
-- Name: producto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto ALTER COLUMN id SET DEFAULT nextval('public.producto_id_seq'::regclass);


--
-- TOC entry 3394 (class 2604 OID 16498)
-- Name: producto_detalle id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_detalle ALTER COLUMN id SET DEFAULT nextval('public.producto_detalle_id_seq'::regclass);


--
-- TOC entry 3398 (class 2604 OID 16514)
-- Name: producto_detalle_produccion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_detalle_produccion ALTER COLUMN id SET DEFAULT nextval('public.producto_detalle_produccion_id_seq'::regclass);


--
-- TOC entry 3376 (class 2604 OID 16421)
-- Name: proveedor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedor ALTER COLUMN id SET DEFAULT nextval('public.proveedor_id_seq'::regclass);


--
-- TOC entry 3407 (class 2604 OID 16611)
-- Name: salida_material id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salida_material ALTER COLUMN id SET DEFAULT nextval('public.salida_material_id_seq'::regclass);


--
-- TOC entry 3411 (class 2604 OID 16667)
-- Name: salida_producto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salida_producto ALTER COLUMN id SET DEFAULT nextval('public.salida_producto_id_seq'::regclass);


--
-- TOC entry 3401 (class 2604 OID 16530)
-- Name: solicitud_compra id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitud_compra ALTER COLUMN id SET DEFAULT nextval('public.solicitud_compra_id_seq'::regclass);


--
-- TOC entry 3372 (class 2604 OID 16402)
-- Name: usuario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario ALTER COLUMN id SET DEFAULT nextval('public.usuario_id_seq'::regclass);


--
-- TOC entry 3798 (class 0 OID 16711)
-- Dependencies: 242
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auditoria (id, tabla_afectada, id_registro_afectado, tipo_operacion, valor_anterior, valor_nuevo, id_usuario, fecha_operacion, ip_address, user_agent) FROM stdin;
\.


--
-- TOC entry 3805 (class 0 OID 41639)
-- Dependencies: 252
-- Data for Name: categoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categoria (id, nombre, descripcion, categoria_padre_id, nivel, ruta_completa, icono, color, orden, activo, es_predeterminado, creado_en, actualizado_en, id_institucion) FROM stdin;
1	Construcción	Materiales de construcción	\N	1	Construcción	\N	\N	0	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
2	Electricidad	Materiales eléctricos	\N	1	Electricidad	\N	\N	0	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
3	Plomería	Materiales de plomería	\N	1	Plomería	\N	\N	0	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
4	Pinturas	Pinturas y recubrimientos	\N	1	Pinturas	\N	\N	0	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
5	Herramientas	Herramientas y equipamiento	\N	1	Herramientas	\N	\N	0	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
6	Ferretería	Artículos de ferretería	\N	1	Ferretería	\N	\N	0	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
7	Limpieza	Productos de limpieza	\N	1	Limpieza	\N	\N	0	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
8	Oficina	Suministros de oficina	\N	1	Oficina	\N	\N	0	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
9	Seguridad	Equipamiento de seguridad	\N	1	Seguridad	\N	\N	0	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
10	Jardinería	Artículos de jardinería	\N	1	Jardinería	\N	\N	0	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
11	Automotriz	Repuestos y accesorios automotrices	\N	1	Automotriz	\N	\N	0	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
12	Electrónica	Componentes electrónicos	\N	1	Electrónica	\N	\N	0	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
13	Otros	Otros productos no clasificados	\N	1	Otros	\N	\N	0	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
14	herr	\N	\N	1	herr	\N	\N	0	t	f	2025-11-28 18:13:36.861	2025-11-28 18:13:36.861	1
15	Plomería e hidráulica	\N	\N	1	Plomería e hidráulica	\N	\N	0	t	f	2025-12-01 17:30:20.425	2025-12-01 17:30:20.425	1
16	Metales y aceros	\N	\N	1	Metales y aceros	\N	\N	0	t	f	2025-12-01 17:31:40.592	2025-12-01 17:31:40.592	1
17	Material Químico	\N	\N	1	Material Químico	\N	\N	0	t	f	2025-12-01 17:33:10.242	2025-12-01 17:33:10.242	1
\.


--
-- TOC entry 3776 (class 0 OID 16436)
-- Dependencies: 220
-- Data for Name: empresa_proveedora; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.empresa_proveedora (id_fiscal, nombre, domicilio, numero_interior, numero_exterior, colonia, ciudad, pais, codigo_postal, telefono, email, contacto, condicion_pago, condicion_entrega, fecha_registro) FROM stdin;
\.


--
-- TOC entry 3788 (class 0 OID 16567)
-- Dependencies: 232
-- Data for Name: entrada_material; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.entrada_material (id, id_material, id_proveedor, cantidad_anterior, cantidad_entrante, cantidad_actual, precio_unitario, tipo_moneda, estado_material, id_usuario, fecha_movimiento, id_institucion, numero_factura, fecha_factura, comentarios, id_solicitud_compra) FROM stdin;
\.


--
-- TOC entry 3792 (class 0 OID 16641)
-- Dependencies: 236
-- Data for Name: entrada_producto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.entrada_producto (id, id_producto, fecha_caducidad, cantidad_anterior, cantidad_entrante, cantidad_actual, numero_lotes, cantidad_por_lote, codigo_lotes, estado_producto, numero_orden_produccion, embalaje, otro_embalaje, pallet, id_usuario, fecha_movimiento, comentarios) FROM stdin;
\.


--
-- TOC entry 3771 (class 0 OID 16386)
-- Dependencies: 215
-- Data for Name: institucion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.institucion (id, nombre, descripcion, estatus, fecha_creacion) FROM stdin;
1	ACK	Institución ACK por defecto	ACTIVO	2025-11-13 03:31:09.000223
\.


--
-- TOC entry 3799 (class 0 OID 24973)
-- Dependencies: 246
-- Data for Name: kysely_migration; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kysely_migration (name, executed_at) FROM stdin;
000_create_materia_prima.sql	2025-11-28 19:05:48.631666
001_create_reference_tables_with_hierarchy.sql	2025-11-28 19:05:28.499665
rollback_001_reference_tables.sql	2025-11-28 19:06:42.590192
\.


--
-- TOC entry 3800 (class 0 OID 24979)
-- Dependencies: 247
-- Data for Name: materia_prima; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.materia_prima (id, codigo_barras, nombre, marca, modelo, presentacion, stock_actual, stock_minimo, costo_unitario, fecha_caducidad, imagen_url, descripcion, categoria, proveedor_id, activo, creado_en, actualizado_en, eliminado_en, presentacion_id, categoria_id) FROM stdin;
8c82978b-0f26-4f64-8599-5c4b3af657c5	7549392816859	Comprimido Pet	Generico	\N	Presentación ID: 6	5.00	1.00	1.00	\N	\N	\N	13	\N	t	2025-11-29 01:31:24.745+00	2025-11-29 01:31:24.745+00	\N	6	13
a3d0f7bc-f45f-44a1-a54f-bb0cdba83163	7009937536944	TEST DEBUG	\N	\N	Unidad	1.00	1.00	\N	\N	\N	\N	\N	\N	t	2025-11-29 00:09:38.442+00	2025-11-29 02:00:21.939935+00	\N	1	13
d65cfddb-426c-4aa3-af15-e91f5ff47a1e	7565061911908	Arandela plana	Generico	1 pulgada	Unidad	10.00	5.00	1.00	\N	almacen-img://7565061911908_arandela_plana_1764382531770_a3f33a24.png	\N	5	\N	t	2025-11-29 00:16:21.484+00	2025-11-29 02:14:53.192607+00	\N	1	5
\.


--
-- TOC entry 3801 (class 0 OID 24994)
-- Dependencies: 248
-- Data for Name: materia_prima_auditoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.materia_prima_auditoria (id, materia_prima_id, accion, datos_anteriores, datos_nuevos, usuario_id, fecha, materia_prima_legacy_id) FROM stdin;
48355e2c-173f-403a-849e-e4bd26cad1e6	\N	INSERT	\N	{"id": 4, "marca": "MarcaTest", "stock": 100.00, "activo": true, "modelo": "ModeloX", "nombre": "Material Prueba 1", "estatus": "ACTIVO", "categoria": "TEST", "imagen_url": null, "descripcion": "Material de prueba para validar migración", "eliminado_en": null, "presentacion": "CAJA", "proveedor_id": null, "stock_minimo": 10.00, "codigo_barras": "TEST001", "unidad_medida": "PIEZA", "actualizado_en": "2025-11-14T19:35:50.845112+00:00", "costo_unitario": 15.50, "fecha_registro": "2025-11-14T19:35:50.845112", "id_institucion": 1, "fecha_caducidad": null}	\N	2025-11-14 19:35:50.845112+00	4
4e60e0b7-e8de-4b6c-aa23-2716b7210693	\N	UPDATE	{"id": 4, "marca": "MarcaTest", "stock": 100.00, "activo": true, "modelo": "ModeloX", "nombre": "Material Prueba 1", "estatus": "ACTIVO", "categoria": "TEST", "imagen_url": null, "descripcion": "Material de prueba para validar migración", "eliminado_en": null, "presentacion": "CAJA", "proveedor_id": null, "stock_minimo": 10.00, "codigo_barras": "TEST001", "unidad_medida": "PIEZA", "actualizado_en": "2025-11-14T19:35:50.845112+00:00", "costo_unitario": 15.50, "fecha_registro": "2025-11-14T19:35:50.845112", "id_institucion": 1, "fecha_caducidad": null}	{"id": 4, "marca": "MarcaTest", "stock": 100.00, "activo": true, "modelo": "ModeloX", "nombre": "Material Prueba 1", "estatus": "ACTIVO", "categoria": "TEST", "imagen_url": null, "descripcion": "Descripción actualizada para prueba", "eliminado_en": null, "presentacion": "CAJA", "proveedor_id": null, "stock_minimo": 10.00, "codigo_barras": "TEST001", "unidad_medida": "PIEZA", "actualizado_en": "2025-11-14T19:36:00.485361+00:00", "costo_unitario": 20.00, "fecha_registro": "2025-11-14T19:35:50.845112", "id_institucion": 1, "fecha_caducidad": null}	\N	2025-11-14 19:36:00.485361+00	4
0422b5ee-e4ed-4cd1-a2ed-8eebfd55ae46	\N	INSERT	\N	{"id": 5, "marca": "Stanley", "stock": 500.00, "activo": true, "modelo": "PH2", "nombre": "Tornillo 3/4\\"", "estatus": "ACTIVO", "categoria": "HERRAMIENTAS", "imagen_url": null, "descripcion": "Tornillo cruciforme de acero inoxidable", "eliminado_en": null, "presentacion": "CAJA 100 UNIDADES", "proveedor_id": null, "stock_minimo": 50.00, "codigo_barras": "TEST002", "unidad_medida": "UNIDAD", "actualizado_en": "2025-11-14T19:53:45.382919+00:00", "costo_unitario": 2.50, "fecha_registro": "2025-11-14T19:53:45.382919", "id_institucion": 1, "fecha_caducidad": null}	\N	2025-11-14 19:53:45.382919+00	5
8928a22a-4e73-46e1-84aa-c26e87f7d562	\N	INSERT	\N	{"id": 6, "marca": "Stanley", "stock": 1000.00, "activo": true, "modelo": "AP-8", "nombre": "Arandela plana", "estatus": "ACTIVO", "categoria": "HERRAMIENTAS", "imagen_url": null, "descripcion": "Arandela plana de acero galvanizado", "eliminado_en": null, "presentacion": "BOLSA 200 UNIDADES", "proveedor_id": null, "stock_minimo": 100.00, "codigo_barras": "TEST003", "unidad_medida": "UNIDAD", "actualizado_en": "2025-11-14T19:53:45.382919+00:00", "costo_unitario": 0.75, "fecha_registro": "2025-11-14T19:53:45.382919", "id_institucion": 1, "fecha_caducidad": null}	\N	2025-11-14 19:53:45.382919+00	6
3aa8f74a-87b8-47fb-a43c-2698b9243aca	\N	INSERT	\N	{"id": 7, "marca": "Martin", "stock": 300.00, "activo": true, "modelo": "CL-20", "nombre": "Clavo 2\\"", "estatus": "ACTIVO", "categoria": "HERRAMIENTAS", "imagen_url": null, "descripcion": "Clavo de acero con cabeza", "eliminado_en": null, "presentacion": "CAJA 1 KG", "proveedor_id": null, "stock_minimo": 30.00, "codigo_barras": "TEST004", "unidad_medida": "UNIDAD", "actualizado_en": "2025-11-14T19:53:45.382919+00:00", "costo_unitario": 1.20, "fecha_registro": "2025-11-14T19:53:45.382919", "id_institucion": 1, "fecha_caducidad": null}	\N	2025-11-14 19:53:45.382919+00	7
5d08997c-4717-4922-8483-1480cff042b0	\N	INSERT	\N	{"id": 8, "marca": "DeWalt", "stock": 15.00, "activo": true, "modelo": "DCD710", "nombre": "Taladro inalámbrico", "estatus": "ACTIVO", "categoria": "EQUIPO", "imagen_url": null, "descripcion": "Taladro inalámbrico 12V", "eliminado_en": null, "presentacion": "UNIDAD", "proveedor_id": null, "stock_minimo": 5.00, "codigo_barras": "TEST005", "unidad_medida": "UNIDAD", "actualizado_en": "2025-11-14T19:53:45.382919+00:00", "costo_unitario": 89.99, "fecha_registro": "2025-11-14T19:53:45.382919", "id_institucion": 1, "fecha_caducidad": null}	\N	2025-11-14 19:53:45.382919+00	8
ea75897e-6dea-47dc-855f-9345d25db413	\N	INSERT	\N	{"id": 9, "marca": "Stanley", "stock": 25.00, "activo": true, "modelo": "ST-30", "nombre": "Cinta métrica", "estatus": "ACTIVO", "categoria": "HERRAMIENTAS", "imagen_url": null, "descripcion": "Cinta métrica de 30 pies", "eliminado_en": null, "presentacion": "UNIDAD", "proveedor_id": null, "stock_minimo": 5.00, "codigo_barras": "TEST006", "unidad_medida": "UNIDAD", "actualizado_en": "2025-11-14T19:53:45.382919+00:00", "costo_unitario": 12.50, "fecha_registro": "2025-11-14T19:53:45.382919", "id_institucion": 1, "fecha_caducidad": null}	\N	2025-11-14 19:53:45.382919+00	9
e2a86867-9467-4fb3-a2e3-a64ab4c8f901	0c439bde-13cb-40e3-a590-fd049c9668f1	UPDATE	{"id": "0c439bde-13cb-40e3-a590-fd049c9668f1", "marca": "Stanley", "activo": true, "modelo": "AP-8", "nombre": "Arandela plana", "categoria": "HERRAMIENTAS", "creado_en": "2025-11-14T19:53:45.382Z", "imagen_url": null, "descripcion": "Arandela plana de acero galvanizado", "eliminado_en": null, "presentacion": "BOLSA 200 UNIDADES", "proveedor_id": null, "stock_actual": 1000, "stock_minimo": 100, "codigo_barras": "TEST003", "actualizado_en": "2025-11-14T19:53:45.382Z", "costo_unitario": 0.75, "fecha_caducidad": null}	{"marca": "Stanley", "modelo": "AP-8", "nombre": "Arandela plana", "categoria": "HERRAMIENTAS", "imagen_url": null, "descripcion": "Arandela plana de acero galvanizado", "presentacion": "BOLSA 200 UNIDADES", "proveedor_id": null, "stock_actual": 1000, "stock_minimo": 100, "codigo_barras": "TEST003", "costo_unitario": 0.8, "fecha_caducidad": null}	\N	2025-11-15 03:24:22.173+00	-1
8336af92-dff8-466c-a102-dd614fcc5964	0c439bde-13cb-40e3-a590-fd049c9668f1	UPDATE	{"id": "0c439bde-13cb-40e3-a590-fd049c9668f1", "marca": "Stanley", "activo": true, "modelo": "AP-8", "nombre": "Arandela plana", "categoria": "HERRAMIENTAS", "creado_en": "2025-11-14T19:53:45.382Z", "imagen_url": null, "descripcion": "Arandela plana de acero galvanizado", "eliminado_en": null, "presentacion": "BOLSA 200 UNIDADES", "proveedor_id": null, "stock_actual": 1000, "stock_minimo": 100, "codigo_barras": "TEST003", "actualizado_en": "2025-11-15T03:23:57.281Z", "costo_unitario": 0.8, "fecha_caducidad": null}	{"marca": "Stanley", "modelo": "AP-8", "nombre": "Arandela plana", "categoria": "HERRAMIENTAS", "imagen_url": null, "descripcion": "Arandela plana de acero galvanizado", "presentacion": "BOLSA 200 UNIDADES", "proveedor_id": null, "stock_actual": 1001, "stock_minimo": 100, "codigo_barras": "TEST003", "costo_unitario": 0.8, "fecha_caducidad": null}	\N	2025-11-15 03:24:49.606+00	-1
4f8a023f-53a4-48b8-a13f-8031d4edc756	00423d8c-24b6-41af-979f-a33233a24fda	STOCK_UPDATE	{"stock_anterior": 5}	{"motivo": "ajuste de prueba para stock 0", "cantidad": -5, "stock_nuevo": 0}	\N	2025-11-20 01:00:08.151+00	-1
8fa5c3ec-b2a0-430f-9e5c-900ce90f0022	fd68adb4-5cea-4356-9613-25981e6ca66f	STOCK_UPDATE	{"stock_anterior": 20}	{"motivo": "Prueba", "cantidad": -10, "stock_nuevo": 10}	\N	2025-11-20 01:58:33.564+00	-1
dd8c1095-6615-4825-b328-9c735fdc56d4	fd68adb4-5cea-4356-9613-25981e6ca66f	STOCK_UPDATE	{"stock_anterior": 10}	{"motivo": "Ajuste de prueba para agotado", "cantidad": -10, "stock_nuevo": 0}	\N	2025-11-20 01:59:20.889+00	-1
f4ea2eb1-4446-43cf-bf5e-df98958b0ec3	0c439bde-13cb-40e3-a590-fd049c9668f1	UPDATE	{"id": "0c439bde-13cb-40e3-a590-fd049c9668f1", "marca": "Stanley", "activo": true, "modelo": "AP-8", "nombre": "Arandela plana", "categoria": "HERRAMIENTAS", "creado_en": "2025-11-14T19:53:45.382Z", "imagen_url": null, "descripcion": "Arandela plana de acero galvanizado", "eliminado_en": null, "presentacion": "BOLSA 200 UNIDADES", "proveedor_id": null, "stock_actual": 1001, "stock_minimo": 100, "codigo_barras": "TEST003", "actualizado_en": "2025-11-15T03:24:24.715Z", "costo_unitario": 0.8, "fecha_caducidad": null}	{"marca": "Stanley", "modelo": "AP-8", "nombre": "Arandela plana", "categoria": "HERRAMIENTAS", "imagen_url": null, "descripcion": "Arandela plana de acero galvanizado", "presentacion": "BOLSA 200 UNIDADES", "proveedor_id": null, "stock_actual": 1000, "stock_minimo": 100, "codigo_barras": "TEST003", "costo_unitario": 0.95, "fecha_caducidad": null}	\N	2025-11-15 03:25:07.899+00	-1
5aad4aba-72e7-4cb5-8a05-36fdece8f5f1	0c439bde-13cb-40e3-a590-fd049c9668f1	UPDATE	{"id": "0c439bde-13cb-40e3-a590-fd049c9668f1", "marca": "Stanley", "activo": true, "modelo": "AP-8", "nombre": "Arandela plana", "categoria": "HERRAMIENTAS", "creado_en": "2025-11-14T19:53:45.382Z", "imagen_url": null, "descripcion": "Arandela plana de acero galvanizado", "eliminado_en": null, "presentacion": "BOLSA 200 UNIDADES", "proveedor_id": null, "stock_actual": 1000, "stock_minimo": 100, "codigo_barras": "7500001234587", "actualizado_en": "2025-11-19T00:43:33.484Z", "costo_unitario": 0.95, "fecha_caducidad": null}	{"marca": "Stanley", "modelo": "AP-8", "nombre": "Arandela plana", "categoria": "HERRAMIENTAS", "imagen_url": null, "descripcion": "Arandela plana de acero galvanizado", "presentacion": "BOLSA 200 UNIDADES", "proveedor_id": null, "stock_actual": 99, "stock_minimo": 100, "codigo_barras": "7500001234587", "costo_unitario": 0.95, "fecha_caducidad": null}	\N	2025-11-19 00:45:04.464+00	-1
9938ad85-4e4e-456b-85ff-108bb69a4412	0c439bde-13cb-40e3-a590-fd049c9668f1	STOCK_UPDATE	{"stock_anterior": 99}	{"motivo": "Prueba", "cantidad": 100, "stock_nuevo": 199}	\N	2025-11-19 01:01:23.93+00	-1
a3cfdbdd-98f0-4b04-a8ed-33b483289989	0c439bde-13cb-40e3-a590-fd049c9668f1	STOCK_UPDATE	{"stock_anterior": 199}	{"motivo": "Prueba quitar 99 unidades", "cantidad": -99, "stock_nuevo": 100}	\N	2025-11-19 01:02:10.437+00	-1
845a5e21-2d95-42af-8cc6-e66a0e4faba2	0c439bde-13cb-40e3-a590-fd049c9668f1	STOCK_UPDATE	{"stock_anterior": 100}	{"motivo": "prueba agregar una unidad", "cantidad": 1, "stock_nuevo": 101}	\N	2025-11-19 01:02:46.847+00	-1
b9bfd58f-d520-4f86-b6a9-dade935d4fd4	0c439bde-13cb-40e3-a590-fd049c9668f1	STOCK_UPDATE	{"stock_anterior": 101}	{"motivo": "Prueba stock bajo", "cantidad": -2, "stock_nuevo": 99}	\N	2025-11-19 01:11:30.464+00	-1
a497fde7-0e17-40cb-af34-a716b4ba5729	0c439bde-13cb-40e3-a590-fd049c9668f1	STOCK_UPDATE	{"stock_anterior": 99}	{"motivo": "ajuste de prueba", "cantidad": 2, "stock_nuevo": 101}	\N	2025-11-19 01:34:07.665+00	-1
e3cad609-413d-4885-a7ea-2ac25b817bf0	0c439bde-13cb-40e3-a590-fd049c9668f1	STOCK_UPDATE	{"stock_anterior": 101}	{"motivo": "ajuste de prueba", "cantidad": 2, "stock_nuevo": 103}	\N	2025-11-19 01:34:25.013+00	-1
9fc6ff6d-c591-42dd-8463-77e513d81719	0c439bde-13cb-40e3-a590-fd049c9668f1	STOCK_UPDATE	{"stock_anterior": 103}	{"motivo": "ajuste de prueba", "cantidad": -3, "stock_nuevo": 100}	\N	2025-11-19 01:34:50.347+00	-1
c72c6d08-62dc-48b4-b7c8-33ca5deff001	0c439bde-13cb-40e3-a590-fd049c9668f1	STOCK_UPDATE	{"stock_anterior": 100}	{"motivo": "prueba para borrar", "cantidad": -100, "stock_nuevo": 0}	\N	2025-11-19 04:47:12.496+00	-1
dc3587c0-6436-4872-b3c3-3959d7ab39ad	0c439bde-13cb-40e3-a590-fd049c9668f1	DELETE	{"id": "0c439bde-13cb-40e3-a590-fd049c9668f1", "marca": "Stanley", "activo": true, "modelo": "AP-8", "nombre": "Arandela plana", "categoria": "HERRAMIENTAS", "creado_en": "2025-11-14T19:53:45.382Z", "imagen_url": null, "descripcion": "Arandela plana de acero galvanizado", "eliminado_en": null, "presentacion": "BOLSA 200 UNIDADES", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 100, "codigo_barras": "7500001234587", "actualizado_en": "2025-11-19T04:46:43.217Z", "costo_unitario": 0.95, "fecha_caducidad": null}	\N	\N	2025-11-19 04:47:21.606+00	-1
f26aa09b-55a1-4397-ac39-b897d02361f5	2ae53be7-049a-4658-975c-31992c1e19b6	STOCK_UPDATE	{"stock_anterior": 100}	{"motivo": "Prueba", "cantidad": -91, "stock_nuevo": 9}	\N	2025-11-19 17:32:51.505+00	-1
f3b92b44-23dc-4ed8-a29a-0335b913220e	2ae53be7-049a-4658-975c-31992c1e19b6	STOCK_UPDATE	{"stock_anterior": 9}	{"motivo": "Prueba", "cantidad": 2, "stock_nuevo": 11}	\N	2025-11-19 17:33:25.217+00	-1
9b75741e-0b22-47b6-a811-a98fc7c2a50c	2ae53be7-049a-4658-975c-31992c1e19b6	STOCK_UPDATE	{"stock_anterior": 11}	{"motivo": "Prueba", "cantidad": -2, "stock_nuevo": 9}	\N	2025-11-19 17:34:48.589+00	-1
d8f47779-f8a0-4b74-b2f4-1aee8b795517	fd68adb4-5cea-4356-9613-25981e6ca66f	INSERT	\N	{"marca": "USHO", "modelo": "3HS", "nombre": "Comprimido Pet", "categoria": "Otros", "imagen_url": null, "descripcion": "Comprimido 600Ml", "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 20, "stock_minimo": 10, "codigo_barras": "5901234123457", "costo_unitario": 10, "fecha_caducidad": null}	\N	2025-11-19 18:52:09.792+00	-1
9e69dddb-1722-4e37-b757-b5c175df4f06	00423d8c-24b6-41af-979f-a33233a24fda	INSERT	\N	{"marca": "PaperM", "modelo": "S5A2", "nombre": "Bobina de papel", "categoria": "Otros", "imagen_url": null, "descripcion": null, "presentacion": "Rollo", "proveedor_id": null, "stock_actual": 3, "stock_minimo": 5, "codigo_barras": "8410564006257", "costo_unitario": 578, "fecha_caducidad": null}	\N	2025-11-19 18:54:37.714+00	-1
c51719a9-ab4d-4165-ad52-715097ff9f9e	2ae53be7-049a-4658-975c-31992c1e19b6	STOCK_UPDATE	{"stock_anterior": 9}	{"motivo": "Prueba", "cantidad": -9, "stock_nuevo": 0}	\N	2025-11-19 19:00:04.912+00	-1
bdc89e84-9b0b-453a-9b39-1390bc04e346	2ae53be7-049a-4658-975c-31992c1e19b6	DELETE	{"id": "2ae53be7-049a-4658-975c-31992c1e19b6", "marca": "MarcaTest", "activo": true, "modelo": "ModeloX", "nombre": "Material Prueba 1", "categoria": "TEST", "creado_en": "2025-11-14T19:35:50.845Z", "imagen_url": null, "descripcion": "Descripción actualizada para prueba", "eliminado_en": null, "presentacion": "CAJA", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 10, "codigo_barras": "7500001234563", "actualizado_en": "2025-11-19T18:59:34.068Z", "costo_unitario": 20, "fecha_caducidad": null}	\N	\N	2025-11-19 19:00:38.136+00	-1
28072303-c5d1-4610-ba66-94c93b078909	00423d8c-24b6-41af-979f-a33233a24fda	UPDATE	{"id": "00423d8c-24b6-41af-979f-a33233a24fda", "marca": "PaperM", "activo": true, "modelo": "S5A2", "nombre": "Bobina de papel", "categoria": "Otros", "creado_en": "2025-11-19T18:54:37.709Z", "imagen_url": null, "descripcion": null, "eliminado_en": null, "presentacion": "Rollo", "proveedor_id": null, "stock_actual": 3, "stock_minimo": 5, "codigo_barras": "8410564006257", "actualizado_en": "2025-11-19T18:54:37.709Z", "costo_unitario": 578, "fecha_caducidad": null}	{"marca": "PaperM", "modelo": "S5A2", "nombre": "Bobina de papel", "categoria": "Otros", "imagen_url": null, "descripcion": null, "presentacion": "Rollo", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 5, "codigo_barras": "8410564006257", "costo_unitario": 578, "fecha_caducidad": null}	\N	2025-11-19 19:00:59.923+00	-1
f5fa308a-9510-4419-b3a1-ba9d7407afd5	00423d8c-24b6-41af-979f-a33233a24fda	STOCK_UPDATE	{"stock_anterior": 0}	{"motivo": "Reconteo", "cantidad": 10, "stock_nuevo": 10}	\N	2025-11-19 19:01:16.358+00	-1
e1a96175-b895-4289-99ca-0bb7ab9af983	00423d8c-24b6-41af-979f-a33233a24fda	STOCK_UPDATE	{"stock_anterior": 10}	{"motivo": "ajuste de prueba", "cantidad": -5, "stock_nuevo": 5}	\N	2025-11-19 19:03:14.914+00	-1
d4df01dc-fbb8-4578-8d9b-1fbfe2069677	fd68adb4-5cea-4356-9613-25981e6ca66f	DELETE	{"id": "fd68adb4-5cea-4356-9613-25981e6ca66f", "marca": "USHO", "activo": true, "modelo": "3HS", "nombre": "Comprimido Pet", "categoria": "Otros", "creado_en": "2025-11-19T18:52:09.787Z", "imagen_url": null, "descripcion": "Comprimido 600Ml", "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 10, "codigo_barras": "5901234123457", "actualizado_en": "2025-11-20T01:58:51.371Z", "costo_unitario": 10, "fecha_caducidad": null}	\N	\N	2025-11-20 01:59:38.491+00	-1
006c5025-9aba-4319-aa8b-e4d6bc70d0ed	00423d8c-24b6-41af-979f-a33233a24fda	DELETE	{"id": "00423d8c-24b6-41af-979f-a33233a24fda", "marca": "PaperM", "activo": true, "modelo": "S5A2", "nombre": "Bobina de papel", "categoria": "Otros", "creado_en": "2025-11-19T18:54:37.709Z", "imagen_url": null, "descripcion": null, "eliminado_en": null, "presentacion": "Rollo", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 5, "codigo_barras": "8410564006257", "actualizado_en": "2025-11-20T00:59:38.432Z", "costo_unitario": 578, "fecha_caducidad": null}	\N	\N	2025-11-20 02:00:13.464+00	-1
1ab70482-6c62-4b07-96b6-3950434576ba	0c439bde-13cb-40e3-a590-fd049c9668f1	STOCK_UPDATE	{"stock_anterior": 0}	{"motivo": "ajuste", "cantidad": 11, "stock_nuevo": 11}	\N	2025-11-20 05:00:57.361+00	-1
ad3386b3-d6dc-4154-b0ba-e17d5142f238	40e015d1-8d5b-4685-a862-9b00a54e7c2e	STATUS_UPDATE	{"stock_actual": 25, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-20 05:40:38.797+00	-1
42b44d56-42de-4178-a63b-e94d56482e48	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-20 05:40:48.601+00	-1
95ea59cf-3458-4206-b3ae-e3a758084a27	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-20 05:40:57.212+00	-1
21596c65-ad59-46f6-af8f-d4863a89084c	2ae53be7-049a-4658-975c-31992c1e19b6	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-20 05:41:12.36+00	-1
36e693d4-8ddc-41d0-9aa1-1c79d49ebc93	00423d8c-24b6-41af-979f-a33233a24fda	STOCK_UPDATE	{"stock_anterior": 0}	{"motivo": "Ajuste de prueba", "cantidad": 4, "stock_nuevo": 4}	\N	2025-11-20 05:46:24.657+00	-1
59fe3b20-4fe3-4297-8d84-ce268298e440	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 11, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-20 18:33:04.641+00	-1
2e87661d-dc4e-4731-9bb2-7147948fdda2	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 11, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-20 18:33:10.915+00	-1
c751d0ca-3d9e-4eaa-a09c-da7b02b82c6a	d5b46041-f3a4-4da7-893a-2a9b55cc7f9f	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-20 19:22:21.183+00	-1
1b3d93b0-a1ac-4f84-8c6b-45e76b5d7707	d5b46041-f3a4-4da7-893a-2a9b55cc7f9f	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-20 19:22:41.345+00	-1
5df24c63-e21d-4689-9d4f-4fb799d79b43	40e015d1-8d5b-4685-a862-9b00a54e7c2e	STATUS_UPDATE	{"stock_actual": 25, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-20 19:22:51.354+00	-1
3e1476f6-570f-47c1-bc0a-e94ab4efdaa4	40e015d1-8d5b-4685-a862-9b00a54e7c2e	STATUS_UPDATE	{"stock_actual": 25, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-20 19:22:57.381+00	-1
78c5b66b-3892-47c0-8031-5f107a8007e1	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 4, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-20 22:19:20.116+00	-1
adf26ef4-211a-42b0-9cad-0ff23d3df6ff	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 4, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-20 22:19:24.593+00	-1
19d39ea8-c729-47c4-9487-fd31485f3780	d5b46041-f3a4-4da7-893a-2a9b55cc7f9f	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-20 22:54:55.493+00	-1
c5ccfdbc-fe48-414b-babb-e07d313122f4	d5b46041-f3a4-4da7-893a-2a9b55cc7f9f	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-20 22:55:01.472+00	-1
8645c8b7-7813-41db-914c-5959d41b335e	d5b46041-f3a4-4da7-893a-2a9b55cc7f9f	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-20 23:10:46.58+00	-1
d33c7ffa-5e76-4e36-95a2-db82aedc757c	d5b46041-f3a4-4da7-893a-2a9b55cc7f9f	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-20 23:10:51.006+00	-1
14935db7-115a-4e1e-8501-9ce89b88fb14	d5b46041-f3a4-4da7-893a-2a9b55cc7f9f	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-21 00:23:10.639+00	-1
8603942d-ecd9-4278-9698-ced1ef393954	d5b46041-f3a4-4da7-893a-2a9b55cc7f9f	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-21 00:23:16.142+00	-1
00343010-7701-4f68-ae35-d4b324f1e004	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 11, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-21 00:56:56.411+00	-1
f7db9ffa-c0ca-4a33-868d-338abb962747	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 11, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-21 00:57:03.777+00	-1
175a1167-9825-484d-ab3f-4a88b7189b56	fd68adb4-5cea-4356-9613-25981e6ca66f	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-22 06:45:39.813+00	-1
8e783236-91a5-471c-8519-9413b1938a03	2ae53be7-049a-4658-975c-31992c1e19b6	DELETE	{"id": "2ae53be7-049a-4658-975c-31992c1e19b6", "marca": "MarcaTest", "activo": false, "modelo": "ModeloX", "nombre": "Material Prueba 1", "categoria": "TEST", "creado_en": "2025-11-14T19:35:50.845Z", "imagen_url": null, "descripcion": "Descripción actualizada para prueba", "eliminado_en": "2025-11-19T19:00:38.133Z", "presentacion": "CAJA", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 10, "codigo_barras": "7500001234563", "actualizado_en": "2025-11-20T05:40:43.551Z", "costo_unitario": 20, "fecha_caducidad": null}	\N	\N	2025-11-21 05:38:45.61+00	-1
b84662ee-7e62-4a92-a776-d4d484751274	2ae53be7-049a-4658-975c-31992c1e19b6	DELETE	{"id": "2ae53be7-049a-4658-975c-31992c1e19b6", "marca": "MarcaTest", "activo": false, "modelo": "ModeloX", "nombre": "Material Prueba 1", "categoria": "TEST", "creado_en": "2025-11-14T19:35:50.845Z", "imagen_url": null, "descripcion": "Descripción actualizada para prueba", "eliminado_en": "2025-11-21T05:38:45.605Z", "presentacion": "CAJA", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 10, "codigo_barras": "7500001234563", "actualizado_en": "2025-11-21T05:38:15.005Z", "costo_unitario": 20, "fecha_caducidad": null}	\N	\N	2025-11-21 05:39:01.441+00	-1
89b131ad-5f06-41d5-ae80-200f555b9117	00423d8c-24b6-41af-979f-a33233a24fda	STOCK_UPDATE	{"stock_anterior": 4}	{"motivo": "prueba", "cantidad": 1, "stock_nuevo": 5}	\N	2025-11-21 05:41:26.501+00	-1
428046ac-7a5a-4e92-9519-2ebc8c87ee54	2ae53be7-049a-4658-975c-31992c1e19b6	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-21 05:41:39.421+00	-1
13e484b6-ff1e-4394-b9a8-2384d21acf05	2ae53be7-049a-4658-975c-31992c1e19b6	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-21 05:41:44.451+00	-1
a0df5b5a-68f7-412f-93c5-9a7b27897090	2ae53be7-049a-4658-975c-31992c1e19b6	DELETE	{"id": "2ae53be7-049a-4658-975c-31992c1e19b6", "marca": "MarcaTest", "activo": false, "modelo": "ModeloX", "nombre": "Material Prueba 1", "categoria": "TEST", "creado_en": "2025-11-14T19:35:50.845Z", "imagen_url": null, "descripcion": "Descripción actualizada para prueba", "eliminado_en": "2025-11-21T05:39:01.438Z", "presentacion": "CAJA", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 10, "codigo_barras": "7500001234563", "actualizado_en": "2025-11-21T05:41:13.858Z", "costo_unitario": 20, "fecha_caducidad": null}	\N	\N	2025-11-21 05:41:49.899+00	-1
f241e51a-e6ab-413e-bde3-9ba57e03cafb	2ae53be7-049a-4658-975c-31992c1e19b6	DELETE	{"id": "2ae53be7-049a-4658-975c-31992c1e19b6", "marca": "MarcaTest", "activo": false, "modelo": "ModeloX", "nombre": "Material Prueba 1", "categoria": "TEST", "creado_en": "2025-11-14T19:35:50.845Z", "imagen_url": null, "descripcion": "Descripción actualizada para prueba", "eliminado_en": "2025-11-21T05:41:49.897Z", "presentacion": "CAJA", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 10, "codigo_barras": "7500001234563", "actualizado_en": "2025-11-21T05:41:19.306Z", "costo_unitario": 20, "fecha_caducidad": null}	\N	\N	2025-11-21 05:42:13.085+00	-1
1e2cec92-2fb0-439a-95b5-abfd8ccd4604	ca1d5e27-ac76-4bb1-b12a-0f3f6722252f	STOCK_UPDATE	{"stock_anterior": 25}	{"motivo": "prueba", "cantidad": -25, "stock_nuevo": 0}	\N	2025-11-21 05:45:04.787+00	-1
85c921f5-5c19-49a5-a737-2cbcd4257880	ca1d5e27-ac76-4bb1-b12a-0f3f6722252f	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-21 05:45:15.414+00	-1
aafa9ebf-3b19-47de-9a41-cc3fa099633b	ca1d5e27-ac76-4bb1-b12a-0f3f6722252f	DELETE	{"id": "ca1d5e27-ac76-4bb1-b12a-0f3f6722252f", "marca": "DeWalt", "activo": false, "modelo": "DCD710", "nombre": "Taladro inalámbrico", "categoria": "EQUIPO", "creado_en": "2025-11-14T19:53:45.382Z", "imagen_url": null, "descripcion": "Taladro inalámbrico 12V", "eliminado_en": null, "presentacion": "UNIDAD", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 5, "codigo_barras": "7500001234600", "actualizado_en": "2025-11-21T05:44:44.828Z", "costo_unitario": 89.99, "fecha_caducidad": null}	\N	\N	2025-11-21 05:45:22.26+00	-1
1988360a-2c94-4da0-b0de-c81ce7bd1a75	ca1d5e27-ac76-4bb1-b12a-0f3f6722252f	DELETE	{"id": "ca1d5e27-ac76-4bb1-b12a-0f3f6722252f", "marca": "DeWalt", "activo": false, "modelo": "DCD710", "nombre": "Taladro inalámbrico", "categoria": "EQUIPO", "creado_en": "2025-11-14T19:53:45.382Z", "imagen_url": null, "descripcion": "Taladro inalámbrico 12V", "eliminado_en": "2025-11-21T05:45:22.259Z", "presentacion": "UNIDAD", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 5, "codigo_barras": "7500001234600", "actualizado_en": "2025-11-21T05:44:51.679Z", "costo_unitario": 89.99, "fecha_caducidad": null}	\N	\N	2025-11-21 05:49:46.019+00	-1
0f4af192-0336-4e75-8914-14987409edc7	2ae53be7-049a-4658-975c-31992c1e19b6	DELETE	{"id": "2ae53be7-049a-4658-975c-31992c1e19b6", "marca": "MarcaTest", "activo": false, "modelo": "ModeloX", "nombre": "Material Prueba 1", "categoria": "TEST", "creado_en": "2025-11-14T19:35:50.845Z", "imagen_url": null, "descripcion": "Descripción actualizada para prueba", "eliminado_en": "2025-11-21T05:42:13.082Z", "presentacion": "CAJA", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 10, "codigo_barras": "7500001234563", "actualizado_en": "2025-11-21T05:41:42.494Z", "costo_unitario": 20, "fecha_caducidad": null}	\N	\N	2025-11-21 06:06:00.269+00	-1
241d9f02-889b-40a4-bb3b-7a1f7fa3021a	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 5, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-22 04:29:40.765+00	-1
9a0dec49-8065-4fd6-ab53-69563627eeed	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 5, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-22 04:29:45.536+00	-1
790568ae-8b38-4b92-b3e5-c4d9a2442ac2	d5b46041-f3a4-4da7-893a-2a9b55cc7f9f	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-22 04:29:54.145+00	-1
aa524e2c-7040-4857-8929-55817eafbe38	d5b46041-f3a4-4da7-893a-2a9b55cc7f9f	DELETE	{"id": "d5b46041-f3a4-4da7-893a-2a9b55cc7f9f", "marca": "Martin", "activo": false, "modelo": "CL-20", "nombre": "Clavo 2\\"", "categoria": "HERRAMIENTAS", "creado_en": "2025-11-14T19:53:45.382Z", "imagen_url": null, "descripcion": "Clavo de acero con cabeza", "eliminado_en": "2025-11-19T04:45:36.208Z", "presentacion": "CAJA 1 KG", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 30, "codigo_barras": "7500001234594", "actualizado_en": "2025-11-22T04:29:21.038Z", "costo_unitario": 1.2, "fecha_caducidad": null}	\N	\N	2025-11-22 04:30:06.366+00	-1
99c1aef1-2f90-464c-b233-df32892bf9dd	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 11, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-22 06:02:36.949+00	-1
27adf65c-7cbb-4af8-9d28-a46c7aea2422	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 11, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-22 06:02:41.637+00	-1
229986c0-a233-446b-8e89-0c8bbefbbd9e	fd68adb4-5cea-4356-9613-25981e6ca66f	DELETE	{"id": "fd68adb4-5cea-4356-9613-25981e6ca66f", "marca": "USHO", "activo": false, "modelo": "3HS", "nombre": "Comprimido Pet", "categoria": "Otros", "creado_en": "2025-11-19T18:52:09.787Z", "imagen_url": null, "descripcion": "Comprimido 600Ml", "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 10, "codigo_barras": "5901234123457", "actualizado_en": "2025-11-22T06:45:07.116Z", "costo_unitario": 10, "fecha_caducidad": null}	\N	\N	2025-11-22 06:45:44.876+00	-1
a613af3d-4f02-4531-ad3a-3dd14f04ccf9	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 11, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-22 06:58:04.658+00	-1
b5979e31-3038-4575-ad3b-793dbf2606d4	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 11, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-22 06:58:12.37+00	-1
ac555512-c2bd-4ad3-a8a6-10d4ab17ef43	ca1d5e27-ac76-4bb1-b12a-0f3f6722252f	DELETE	{"id": "ca1d5e27-ac76-4bb1-b12a-0f3f6722252f", "marca": "DeWalt", "activo": false, "modelo": "DCD710", "nombre": "Taladro inalámbrico", "categoria": "EQUIPO", "creado_en": "2025-11-14T19:53:45.382Z", "imagen_url": null, "descripcion": "Taladro inalámbrico 12V", "eliminado_en": null, "presentacion": "UNIDAD", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 5, "codigo_barras": "7500001234600", "actualizado_en": "2025-11-22T06:32:03.997Z", "costo_unitario": 89.99, "fecha_caducidad": null}	\N	\N	2025-11-22 06:58:19.32+00	-1
c01e4668-4155-4df7-8b5a-048b1921b11f	fd68adb4-5cea-4356-9613-25981e6ca66f	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-22 07:00:51.97+00	-1
74b8d084-b0fa-4459-baed-e15e47d6feda	fd68adb4-5cea-4356-9613-25981e6ca66f	STOCK_UPDATE	{"stock_anterior": 0}	{"motivo": "ajuste de prueba", "cantidad": 11, "stock_nuevo": 11}	\N	2025-11-22 07:01:10.525+00	-1
956886b9-7638-4fe6-988b-73de57162c4a	ca1d5e27-ac76-4bb1-b12a-0f3f6722252f	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-22 07:01:40.104+00	-1
897ee064-74de-4d62-ad08-99a0c016b0bb	40e015d1-8d5b-4685-a862-9b00a54e7c2e	STATUS_UPDATE	{"stock_actual": 25, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 00:32:48.213+00	-1
d8f3157e-0d1d-4f53-996c-76006b9254a6	0c439bde-13cb-40e3-a590-fd049c9668f1	UPDATE	{"id": "0c439bde-13cb-40e3-a590-fd049c9668f1", "marca": "Generic", "activo": true, "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "FERRETERIA", "creado_en": "2025-11-20T03:14:12.386Z", "imagen_url": null, "descripcion": "Arandela plana estándar", "eliminado_en": null, "presentacion": "CAJA", "proveedor_id": null, "stock_actual": 11, "stock_minimo": 10, "codigo_barras": "7500001234601", "actualizado_en": "2025-11-22T07:14:55.391Z", "costo_unitario": 0.5, "fecha_caducidad": null}	{"marca": "Generic", "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "Herramientas", "imagen_url": null, "descripcion": "Arandela plana estándar", "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 15, "stock_minimo": 10, "codigo_barras": "4047024699274", "costo_unitario": 0.5, "fecha_caducidad": null}	\N	2025-11-25 01:41:03.096+00	-1
07e7339b-5d11-4a85-8b74-11c344b8e200	0c439bde-13cb-40e3-a590-fd049c9668f1	UPDATE	{"id": "0c439bde-13cb-40e3-a590-fd049c9668f1", "marca": "Generic", "activo": true, "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "Herramientas", "creado_en": "2025-11-20T03:14:12.386Z", "imagen_url": null, "descripcion": "Arandela plana estándar", "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 15, "stock_minimo": 10, "codigo_barras": "4047024699274", "actualizado_en": "2025-11-25T01:40:25.048Z", "costo_unitario": 0.5, "fecha_caducidad": null}	{"marca": "Generic", "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "Herramientas", "imagen_url": null, "descripcion": "Arandela plana estándar", "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 17, "stock_minimo": 10, "codigo_barras": "4047024699274", "costo_unitario": 0.5, "fecha_caducidad": null}	\N	2025-11-25 01:41:46.733+00	-1
33e1c63c-2a30-43d4-8411-181aa02abd71	00423d8c-24b6-41af-979f-a33233a24fda	UPDATE	{"id": "00423d8c-24b6-41af-979f-a33233a24fda", "marca": "PaperM", "activo": true, "modelo": "S5A2", "nombre": "Bobina de papel", "categoria": "Otros", "creado_en": "2025-11-19T18:54:37.709Z", "imagen_url": null, "descripcion": null, "eliminado_en": null, "presentacion": "Rollo", "proveedor_id": null, "stock_actual": 5, "stock_minimo": 5, "codigo_barras": "8410564006257", "actualizado_en": "2025-11-22T07:03:45.698Z", "costo_unitario": 578, "fecha_caducidad": null}	{"marca": "PaperM", "modelo": "S5A2", "nombre": "Bobina de papel", "categoria": "Otros", "imagen_url": null, "descripcion": null, "presentacion": "Rollo", "proveedor_id": null, "stock_actual": 6, "stock_minimo": 5, "codigo_barras": "8410564006257", "costo_unitario": 578, "fecha_caducidad": null}	\N	2025-11-25 15:19:25.229+00	-1
5f18d961-55e3-4d6c-9b85-9ed041f3da80	40e015d1-8d5b-4685-a862-9b00a54e7c2e	UPDATE	{"id": "40e015d1-8d5b-4685-a862-9b00a54e7c2e", "marca": "Stanley", "activo": true, "modelo": "ST-30", "nombre": "Cinta métrica", "categoria": "HERRAMIENTAS", "creado_en": "2025-11-14T19:53:45.382Z", "imagen_url": null, "descripcion": "Cinta métrica de 30 pies", "eliminado_en": null, "presentacion": "UNIDAD", "proveedor_id": null, "stock_actual": 25, "stock_minimo": 5, "codigo_barras": "7500001234617", "actualizado_en": "2025-11-25T01:37:59.238Z", "costo_unitario": 12.5, "fecha_caducidad": null}	{"marca": "Stanley", "modelo": "ST-30", "nombre": "Cinta métrica", "categoria": "HERRAMIENTAS", "imagen_url": null, "descripcion": "Cinta métrica de 30 pies", "presentacion": "UNIDAD", "proveedor_id": null, "stock_actual": 25, "stock_minimo": 5, "codigo_barras": "7500001234617", "costo_unitario": 14, "fecha_caducidad": null}	\N	2025-11-25 15:37:09.447+00	-1
3a2fc362-f43f-4c65-a80c-5ccf0ad4d233	00423d8c-24b6-41af-979f-a33233a24fda	STOCK_UPDATE	{"stock_anterior": 6}	{"motivo": "ajuste de prueba", "cantidad": -1, "stock_nuevo": 5}	\N	2025-11-25 15:45:26.608+00	-1
a59c59d2-a9b0-44a1-812b-1a1dfab215ac	ca1d5e27-ac76-4bb1-b12a-0f3f6722252f	STOCK_UPDATE	{"stock_anterior": 20}	{"motivo": "prueba", "cantidad": -16, "stock_nuevo": 4}	\N	2025-11-25 16:52:44.295+00	-1
e515791c-fa84-4ee7-a454-f31ddb6e7120	00423d8c-24b6-41af-979f-a33233a24fda	UPDATE	{"id": "00423d8c-24b6-41af-979f-a33233a24fda", "marca": "PaperM", "activo": true, "modelo": "S5A2", "nombre": "Bobina de papel", "categoria": "Otros", "creado_en": "2025-11-19T18:54:37.709Z", "imagen_url": null, "descripcion": null, "eliminado_en": null, "presentacion": "Rollo", "proveedor_id": null, "stock_actual": 5, "stock_minimo": 5, "codigo_barras": "8410564006257", "actualizado_en": "2025-11-25T15:44:47.909Z", "costo_unitario": 578, "fecha_caducidad": null}	{"marca": "PaperM", "modelo": "S5A2", "nombre": "Bobina de papel", "categoria": "Otros", "imagen_url": null, "descripcion": null, "presentacion": "Rollo", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 5, "codigo_barras": "8410564006257", "costo_unitario": 578, "fecha_caducidad": null}	\N	2025-11-25 16:53:11.465+00	-1
7f86dc53-d5b6-4d51-9305-30513f262daa	ca1d5e27-ac76-4bb1-b12a-0f3f6722252f	UPDATE	{"id": "ca1d5e27-ac76-4bb1-b12a-0f3f6722252f", "marca": "DeWalt", "activo": true, "modelo": "DCD710", "nombre": "Taladro inalámbrico", "categoria": "EQUIPO", "creado_en": "2025-11-14T19:53:45.382Z", "imagen_url": null, "descripcion": "Taladro inalámbrico 12V", "eliminado_en": null, "presentacion": "UNIDAD", "proveedor_id": null, "stock_actual": 4, "stock_minimo": 5, "codigo_barras": "7500001234600", "actualizado_en": "2025-11-25T16:52:05.877Z", "costo_unitario": 99.99, "fecha_caducidad": null}	{"marca": "DeWalt", "modelo": "DCD710", "nombre": "Taladro inalámbrico", "categoria": "EQUIPO", "imagen_url": null, "descripcion": "Taladro inalámbrico 12V", "presentacion": "UNIDAD", "proveedor_id": null, "stock_actual": 5, "stock_minimo": 5, "codigo_barras": "7500001234600", "costo_unitario": 99.99, "fecha_caducidad": null}	\N	2025-11-25 16:52:57.538+00	-1
5d8255ce-0bd2-4b1f-9377-61ab1c22043b	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 16:53:25.171+00	-1
de05996e-efcc-4367-8362-5d078c2fbf2f	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:01:16.918+00	-1
e63e63e0-6f12-4854-b8b8-0aa188cf2d82	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 17:04:58.974+00	-1
0756481a-ee50-43ff-8d04-e34bda11deec	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:05:03.112+00	-1
b3708d63-634e-4b63-ada0-2db775f13848	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:16:01.756+00	-1
cfc6c454-3dcc-4f5a-80a4-eebd7d349b53	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 17:16:06.984+00	-1
847b6684-54a1-47ec-b152-9b16e7272163	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:17:30.621+00	-1
d5d0dcb7-690d-43b3-b4c5-4fcb5bb15a77	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 17:17:37.133+00	-1
e3e933fa-3833-44ec-a760-359e2498437a	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:17:41.79+00	-1
db13bae3-1889-49b3-aee1-4164a8e86d4d	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 17:17:45.709+00	-1
d88ee985-cb5c-4def-ba15-b658766cce0b	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:21:12.542+00	-1
98f196f8-a024-41ff-b5a7-87cba1a17e96	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 17:21:18.356+00	-1
8c6eb1c1-8849-4cb0-94b7-5474738da0f1	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:22:05.311+00	-1
d10dfd6b-ce7c-4965-8336-7bf58460503c	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 17:22:09.464+00	-1
76508f0c-fef9-415a-9ce4-d8538ed82c79	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:26:43.705+00	-1
deba6961-ebbb-4545-8c13-55365ce1845a	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 17:26:47.049+00	-1
1c122060-966c-4f8f-9aa1-9e2417654466	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:30:12.807+00	-1
5737dc35-98ba-4e74-9e73-79127a597933	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 17:30:16.027+00	-1
fbe29158-61ff-4272-8754-83ef5c3e19d1	75713726-04e8-4453-8b13-24e59a948578	STATUS_UPDATE	{"stock_actual": 10, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:34:04.571+00	-1
f5ee98d8-37a0-4184-8806-0c4d046bbf6d	75713726-04e8-4453-8b13-24e59a948578	STATUS_UPDATE	{"stock_actual": 10, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 17:34:08.614+00	-1
f1802478-aa15-44a0-8d1f-536c7c54ad4a	75713726-04e8-4453-8b13-24e59a948578	STATUS_UPDATE	{"stock_actual": 10, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:34:12.336+00	-1
78f8e9c6-53ee-4c05-b8da-6928bf86c539	75713726-04e8-4453-8b13-24e59a948578	STATUS_UPDATE	{"stock_actual": 10, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 17:34:16.72+00	-1
3bb5b828-8303-426e-b6b8-5541bf41f85b	75713726-04e8-4453-8b13-24e59a948578	STATUS_UPDATE	{"stock_actual": 10, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:34:20.527+00	-1
7c6ac9ff-873c-4f78-97e2-066f6b9b8573	75713726-04e8-4453-8b13-24e59a948578	UPDATE	{"id": "75713726-04e8-4453-8b13-24e59a948578", "marca": "TestBrand", "activo": true, "modelo": "TEST-001", "nombre": "Material de Prueba Delete", "categoria": "TEST", "creado_en": "2025-11-25T17:24:06.719Z", "imagen_url": null, "descripcion": null, "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 10, "stock_minimo": 5, "codigo_barras": "TEST1234567890", "actualizado_en": "2025-11-25T17:34:36.647Z", "costo_unitario": 15.5, "fecha_caducidad": null}	{"marca": "TestBrand", "modelo": "TEST-001", "nombre": "Material de Prueba Delete", "categoria": "Otros", "imagen_url": null, "descripcion": "Material para probar soft delete", "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 1, "codigo_barras": "5000000017065", "costo_unitario": 15.5, "fecha_caducidad": null}	\N	2025-11-25 17:36:20.131+00	-1
4425d04b-6c1d-4dc3-bf08-bbcb319fe00f	75713726-04e8-4453-8b13-24e59a948578	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 17:36:32.073+00	-1
95bc1fc3-9693-4089-b8af-a998718a0570	75713726-04e8-4453-8b13-24e59a948578	DELETE	{"id": "75713726-04e8-4453-8b13-24e59a948578", "marca": "TestBrand", "activo": false, "modelo": "TEST-001", "nombre": "Material de Prueba Delete", "categoria": "Otros", "creado_en": "2025-11-25T17:24:06.719Z", "imagen_url": null, "descripcion": "Material para probar soft delete", "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 1, "codigo_barras": "5000000017065", "actualizado_en": "2025-11-25T17:35:53.800Z", "costo_unitario": 15.5, "fecha_caducidad": null}	\N	\N	2025-11-25 17:36:36.171+00	-1
3e49afe6-eb85-4135-b89a-470719a9349f	75713726-04e8-4453-8b13-24e59a948578	DELETE	{"id": "75713726-04e8-4453-8b13-24e59a948578", "marca": "TestBrand", "activo": false, "modelo": "TEST-001", "nombre": "Material de Prueba Delete", "categoria": "Otros", "creado_en": "2025-11-25T17:24:06.719Z", "imagen_url": null, "descripcion": "Material para probar soft delete", "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 1, "codigo_barras": "5000000017065", "actualizado_en": "2025-11-25T17:36:23.906Z", "costo_unitario": 15.5, "fecha_caducidad": null}	\N	\N	2025-11-25 17:37:36.721+00	-1
b0a9f46e-2c67-4baf-b49e-d984c58efb1c	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:49:34.298+00	-1
d87eb4a2-195e-41e8-9f32-903b3120e67a	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 17:49:38.3+00	-1
c248a2ec-efc9-4978-b855-f340cc48b530	75713726-04e8-4453-8b13-24e59a948578	DELETE	{"id": "75713726-04e8-4453-8b13-24e59a948578", "marca": "TestBrand", "activo": false, "modelo": "TEST-001", "nombre": "Material de Prueba Delete", "categoria": "Otros", "creado_en": "2025-11-25T17:24:06.719Z", "imagen_url": null, "descripcion": "Material para probar soft delete", "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 1, "codigo_barras": "5000000017065", "actualizado_en": "2025-11-25T17:48:21.368Z", "costo_unitario": 15.5, "fecha_caducidad": null}	\N	\N	2025-11-25 17:49:47.625+00	-1
a33f13e9-f783-489b-bdcd-0f2b754c58b2	75713726-04e8-4453-8b13-24e59a948578	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 17:50:12.807+00	-1
25c1f000-692a-4119-9fe8-e375afa9f4a5	75713726-04e8-4453-8b13-24e59a948578	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 17:50:20.695+00	-1
4a18b3d2-ad36-438a-9b99-464e2acc680e	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 18:08:55.213+00	-1
8a262983-0ca4-42f3-b9be-d4d59a30273e	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 18:08:59.075+00	-1
69e02f97-f665-475f-a65a-14d5cbd5705e	75713726-04e8-4453-8b13-24e59a948578	DELETE	{"id": "75713726-04e8-4453-8b13-24e59a948578", "marca": "TestBrand", "activo": false, "modelo": "TEST-001", "nombre": "Material de Prueba Delete", "categoria": "Otros", "creado_en": "2025-11-25T17:24:06.719Z", "imagen_url": null, "descripcion": "Material para probar soft delete", "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 1, "codigo_barras": "5000000017065", "actualizado_en": "2025-11-25T17:49:42.466Z", "costo_unitario": 15.5, "fecha_caducidad": null}	\N	\N	2025-11-25 18:09:15.54+00	-1
e8155731-3e97-48e0-9050-1366778caa6c	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 18:09:22.25+00	-1
060f3259-01f2-434e-b618-054183ef708e	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 18:09:26.04+00	-1
4885ed2a-1871-4e03-afe6-c0fe9239d3ff	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 21:50:58.187+00	-1
0da585a1-2552-4ace-9e21-dc787fde6121	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 22:43:51.108+00	-1
fdc9a3f7-e182-4584-8a1d-1d3c1f178f56	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 23:02:58.073+00	-1
7232f3eb-e5fc-4649-943c-bde2e1e63384	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 23:03:02.148+00	-1
a1e81a8f-e52b-44af-a29d-ddf09427cc2b	ca1d5e27-ac76-4bb1-b12a-0f3f6722252f	STATUS_UPDATE	{"stock_actual": 5, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-25 23:03:08.949+00	-1
074bdfbe-73d5-4325-97a0-3559539a3272	ca1d5e27-ac76-4bb1-b12a-0f3f6722252f	STATUS_UPDATE	{"stock_actual": 5, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-25 23:03:18.025+00	-1
ba32c737-72da-417b-9632-65ba31ebff49	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-26 02:00:10.839+00	-1
10001c53-5aab-40db-87f4-573d6fd9c44c	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-26 02:00:15.356+00	-1
fe6feabf-89a0-4dde-8d57-b0361bb8cc60	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-26 02:00:19.326+00	-1
516b2df8-e0e4-4b0b-8a33-e6bd560072dc	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-26 02:00:31.157+00	-1
2155d804-e85b-43ad-8001-808fd180c22a	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-26 02:13:32.558+00	-1
e6fcfde0-9ca7-44be-9c3e-bd6a465b38f8	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-26 03:35:08.16+00	-1
8be65693-ae99-4268-a0a9-467f82c5dbf7	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-26 03:50:10.612+00	-1
5b05d790-6ec0-4e6e-af7a-1b98575e63c8	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-26 03:50:15.105+00	-1
1091eba4-1557-4461-8026-3f066112c3a0	75713726-04e8-4453-8b13-24e59a948578	DELETE	{"id": "75713726-04e8-4453-8b13-24e59a948578", "marca": "TestBrand", "activo": false, "modelo": "TEST-001", "nombre": "Material de Prueba Delete", "categoria": "Otros", "creado_en": "2025-11-25T17:24:06.719Z", "imagen_url": null, "descripcion": "Material para probar soft delete", "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 1, "codigo_barras": "5000000017065", "actualizado_en": "2025-11-25T21:52:02.927Z", "costo_unitario": 15.5, "fecha_caducidad": null}	\N	\N	2025-11-26 03:50:28.965+00	-1
21ae7d61-2f4d-479a-bcac-c6f07256d2a3	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-26 04:25:29.416+00	-1
231a7190-3f71-4dec-82cc-a87140de45da	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-26 04:59:55.1+00	-1
bd066e93-154e-44e6-8a84-307094c0fc95	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-26 05:30:11.56+00	-1
39fd404e-1d1a-4846-88c7-7f3d143ecb42	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-26 06:05:28.733+00	-1
a9f97da6-04d3-431c-a32b-07959227e1b5	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-26 06:05:55.766+00	-1
83fe6f3f-dabf-4084-b2a7-44f91a619d27	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-26 06:06:06.425+00	-1
94ea3ce1-8f0c-4ad3-8d43-f935641ea618	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-26 06:12:49.972+00	-1
23837622-1326-4cf3-94a2-ac711fd6f77d	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-26 06:27:46.414+00	-1
aaf16654-4061-4271-900d-dd63403b59b2	00423d8c-24b6-41af-979f-a33233a24fda	STATUS_UPDATE	{"stock_actual": 0, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-26 06:27:56.451+00	-1
19ff1874-bfd6-4c88-bc9a-626f1bc7efe8	00423d8c-24b6-41af-979f-a33233a24fda	DELETE	{"id": "00423d8c-24b6-41af-979f-a33233a24fda", "marca": "PaperM", "activo": false, "modelo": "S5A2", "nombre": "Bobina de papel", "categoria": "Otros", "creado_en": "2025-11-19T18:54:37.709Z", "imagen_url": null, "descripcion": null, "eliminado_en": null, "presentacion": "Rollo", "proveedor_id": null, "stock_actual": 0, "stock_minimo": 5, "codigo_barras": "8410564006257", "actualizado_en": "2025-11-26T06:27:18.521Z", "costo_unitario": 578, "fecha_caducidad": null}	\N	\N	2025-11-26 07:04:40.897+00	-1
ab77ca57-c5f1-4ede-a36a-1ffe4648655b	40e015d1-8d5b-4685-a862-9b00a54e7c2e	STATUS_UPDATE	{"stock_actual": 25, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-26 18:22:57.982+00	-1
0fc3c038-422b-465a-987c-1b922e37b5e3	40e015d1-8d5b-4685-a862-9b00a54e7c2e	STATUS_UPDATE	{"stock_actual": 25, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-26 18:23:09.759+00	-1
e0296ac2-fba4-4954-b43f-54905f621b57	40e015d1-8d5b-4685-a862-9b00a54e7c2e	STATUS_UPDATE	{"stock_actual": 25, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-26 18:23:17.385+00	-1
570f1f6e-1378-40f8-b823-75488ef5f8c1	fd68adb4-5cea-4356-9613-25981e6ca66f	STOCK_UPDATE	{"stock_anterior": 11}	{"motivo": "Prueba", "cantidad": -2, "stock_nuevo": 9}	\N	2025-11-26 18:24:03.757+00	-1
74232601-3959-4b92-9b65-a2da5410182f	fd68adb4-5cea-4356-9613-25981e6ca66f	STOCK_UPDATE	{"stock_anterior": 9}	{"motivo": "Prueba", "cantidad": 6, "stock_nuevo": 15}	\N	2025-11-26 18:24:21.541+00	-1
8768991d-a1bb-4173-9f49-a4a125d5cca8	ca1d5e27-ac76-4bb1-b12a-0f3f6722252f	STOCK_UPDATE	{"stock_anterior": 5}	{"motivo": "Prueba", "cantidad": -5, "stock_nuevo": 0}	\N	2025-11-26 18:24:58.355+00	-1
fa367ba8-4d95-45ae-884f-a0a0b0b050f6	40e015d1-8d5b-4685-a862-9b00a54e7c2e	STATUS_UPDATE	{"stock_actual": 25, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-26 18:25:48.758+00	-1
48857cad-f5ac-4f23-b0f9-90dc436a3228	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-27 23:27:24.729+00	-1
4521fada-f782-48d7-bcbd-5f2642c3ce85	0c439bde-13cb-40e3-a590-fd049c9668f1	STATUS_UPDATE	{"stock_actual": 17, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-27 23:27:31.842+00	-1
e68e1f6d-c0f8-437b-904e-a00e5d497bf8	0c439bde-13cb-40e3-a590-fd049c9668f1	UPDATE	{"id": "0c439bde-13cb-40e3-a590-fd049c9668f1", "marca": "Generic", "activo": true, "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "Herramientas", "creado_en": "2025-11-20T03:14:12.386Z", "imagen_url": null, "descripcion": "Arandela plana estándar", "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 17, "stock_minimo": 10, "codigo_barras": "4047024699274", "actualizado_en": "2025-11-27T23:26:50.513Z", "costo_unitario": 0.5, "fecha_caducidad": null}	{"marca": "Generic", "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "Herramientas", "imagen_url": null, "descripcion": "Arandela plana estándar", "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 17, "stock_minimo": 10, "codigo_barras": "4047024699274", "costo_unitario": 0.5, "fecha_caducidad": null}	\N	2025-11-28 00:54:58.995+00	-1
c3585f3b-7a80-4b4c-aab2-55d15ba34280	0c439bde-13cb-40e3-a590-fd049c9668f1	UPDATE	{"id": "0c439bde-13cb-40e3-a590-fd049c9668f1", "marca": "Generic", "activo": true, "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "Herramientas", "creado_en": "2025-11-20T03:14:12.386Z", "imagen_url": null, "descripcion": "Arandela plana estándar", "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 17, "stock_minimo": 10, "codigo_barras": "4047024699274", "actualizado_en": "2025-11-28T00:54:17.929Z", "costo_unitario": 0.5, "fecha_caducidad": null}	{"marca": "Generic", "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "Herramientas", "imagen_url": null, "descripcion": "Arandela plana estándar", "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 17, "stock_minimo": 10, "codigo_barras": "4047024699274", "costo_unitario": 0.5, "fecha_caducidad": null}	\N	2025-11-28 00:58:19.731+00	-1
5e28cdae-f15e-49d7-b7f8-7427415fefbd	0c439bde-13cb-40e3-a590-fd049c9668f1	UPDATE	{"id": "0c439bde-13cb-40e3-a590-fd049c9668f1", "marca": "Generic", "activo": true, "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "Herramientas", "creado_en": "2025-11-20T03:14:12.386Z", "imagen_url": null, "descripcion": "Arandela plana estándar", "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 17, "stock_minimo": 10, "codigo_barras": "4047024699274", "actualizado_en": "2025-11-28T00:57:38.671Z", "costo_unitario": 0.5, "fecha_caducidad": null}	{"marca": "Generic", "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "Herramientas", "imagen_url": null, "descripcion": "Arandela plana estándar", "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 17, "stock_minimo": 10, "codigo_barras": "4047024699274", "costo_unitario": 0.5, "fecha_caducidad": null}	\N	2025-11-28 01:06:01.497+00	-1
6b80d8ef-d10a-47c8-a708-5ca30008cb96	0c439bde-13cb-40e3-a590-fd049c9668f1	UPDATE	{"id": "0c439bde-13cb-40e3-a590-fd049c9668f1", "marca": "Generic", "activo": true, "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "Herramientas", "creado_en": "2025-11-20T03:14:12.386Z", "imagen_url": null, "descripcion": "Arandela plana estándar", "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 17, "stock_minimo": 10, "codigo_barras": "4047024699274", "actualizado_en": "2025-11-28T01:05:20.467Z", "costo_unitario": 0.5, "fecha_caducidad": null}	{"marca": "Generic", "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "Herramientas", "imagen_url": "file://C:\\\\Users\\\\frive\\\\AppData\\\\Roaming\\\\almacen-electron\\\\assets\\\\images\\\\materia-prima\\\\4047024699274_arandela_plana_1764292528772_2994951f.png", "descripcion": "Arandela plana estándar", "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 17, "stock_minimo": 10, "codigo_barras": "4047024699274", "costo_unitario": 0.5, "fecha_caducidad": null}	\N	2025-11-28 01:15:31.85+00	-1
4b8619a6-ad85-467f-a1a1-dc610f51fc13	0c439bde-13cb-40e3-a590-fd049c9668f1	UPDATE	{"id": "0c439bde-13cb-40e3-a590-fd049c9668f1", "marca": "Generic", "activo": true, "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "Herramientas", "creado_en": "2025-11-20T03:14:12.386Z", "imagen_url": "file://C:\\\\Users\\\\frive\\\\AppData\\\\Roaming\\\\almacen-electron\\\\assets\\\\images\\\\materia-prima\\\\4047024699274_arandela_plana_1764292528772_2994951f.png", "descripcion": "Arandela plana estándar", "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 17, "stock_minimo": 10, "codigo_barras": "4047024699274", "actualizado_en": "2025-11-28T01:14:50.838Z", "costo_unitario": 0.5, "fecha_caducidad": null}	{"marca": "Generic", "modelo": "AP-100", "nombre": "Arandela plana", "categoria": "Herramientas", "imagen_url": "almacen-img://4047024699274_arandela_plana_1764294477336_664965e4.png", "descripcion": "Arandela plana estándar", "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 17, "stock_minimo": 10, "codigo_barras": "4047024699274", "costo_unitario": 0.5, "fecha_caducidad": null}	\N	2025-11-28 01:48:00.737+00	-1
5338d3f9-794b-403e-8e55-625901f84580	a3d0f7bc-f45f-44a1-a54f-bb0cdba83163	INSERT	\N	{"marca": null, "modelo": null, "nombre": "TEST DEBUG", "categoria": null, "imagen_url": null, "descripcion": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 1, "stock_minimo": 1, "codigo_barras": "7009937536944", "costo_unitario": null, "fecha_caducidad": null}	\N	2025-11-29 00:09:38.459+00	-1
9e2d33e9-3b33-4ba7-be53-ba83389fba7c	a3d0f7bc-f45f-44a1-a54f-bb0cdba83163	STATUS_UPDATE	{"stock_actual": 1, "activo_anterior": true, "estatus_anterior": "ACTIVO"}	{"motivo": "Cambio de estatus: ACTIVO → INACTIVO", "usuario_id": null, "activo_nuevo": false, "estatus_nuevo": "INACTIVO"}	\N	2025-11-29 00:10:32.898+00	-1
b7a69e3a-86b3-4390-ae15-4b78f5fcdec9	a3d0f7bc-f45f-44a1-a54f-bb0cdba83163	STATUS_UPDATE	{"stock_actual": 1, "activo_anterior": false, "estatus_anterior": "INACTIVO"}	{"motivo": "Cambio de estatus: INACTIVO → ACTIVO", "usuario_id": null, "activo_nuevo": true, "estatus_nuevo": "ACTIVO"}	\N	2025-11-29 00:10:40.085+00	-1
e1a04363-9541-4c88-9018-40bd6283630f	d65cfddb-426c-4aa3-af15-e91f5ff47a1e	INSERT	\N	{"marca": null, "modelo": null, "nombre": "Arandela plana - 21", "categoria": null, "imagen_url": null, "descripcion": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 10, "stock_minimo": 5, "codigo_barras": "764375381473", "costo_unitario": null, "fecha_caducidad": null}	\N	2025-11-29 00:16:21.491+00	-1
08dab150-b020-4c70-9f4c-c3ce772d7760	8c82978b-0f26-4f64-8599-5c4b3af657c5	INSERT	\N	{"marca": "Generico", "modelo": null, "nombre": "Comprimido Pet", "categoria": "13", "imagen_url": null, "descripcion": null, "categoria_id": 13, "presentacion": "Presentación ID: 6", "proveedor_id": null, "stock_actual": 5, "stock_minimo": 1, "codigo_barras": "7549392816859", "costo_unitario": 1, "fecha_caducidad": null, "presentacion_id": 6}	\N	2025-11-29 01:31:24.761+00	-1
4e6ed411-165d-45f2-8e28-c4e00322f77b	d65cfddb-426c-4aa3-af15-e91f5ff47a1e	UPDATE	{"id": "d65cfddb-426c-4aa3-af15-e91f5ff47a1e", "marca": null, "activo": true, "modelo": null, "nombre": "Arandela plana - 21", "categoria": null, "creado_en": "2025-11-29T00:16:21.484Z", "imagen_url": null, "descripcion": null, "categoria_id": null, "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 10, "stock_minimo": 5, "codigo_barras": "764375381473", "actualizado_en": "2025-11-29T00:16:21.484Z", "costo_unitario": null, "fecha_caducidad": null, "presentacion_id": null}	{"marca": "Generico", "modelo": "1 pulgada", "nombre": "Arandela plana", "categoria": "5", "imagen_url": null, "descripcion": null, "categoria_id": 5, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 10, "stock_minimo": 5, "codigo_barras": "7565061911908", "costo_unitario": null, "fecha_caducidad": null, "presentacion_id": 1}	\N	2025-11-29 01:32:56.506+00	-1
4ef0adbe-ab49-4586-ad9d-7fe06cdbfbe3	d65cfddb-426c-4aa3-af15-e91f5ff47a1e	UPDATE	{"id": "d65cfddb-426c-4aa3-af15-e91f5ff47a1e", "marca": "Generico", "activo": true, "modelo": "1 pulgada", "nombre": "Arandela plana", "categoria": "5", "creado_en": "2025-11-29T00:16:21.484Z", "imagen_url": null, "descripcion": null, "categoria_id": 5, "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 10, "stock_minimo": 5, "codigo_barras": "7565061911908", "actualizado_en": "2025-11-29T01:32:14.165Z", "costo_unitario": null, "fecha_caducidad": null, "presentacion_id": 1}	{"marca": "Generico", "modelo": "1 pulgada", "nombre": "Arandela plana", "categoria": "13", "imagen_url": null, "descripcion": null, "categoria_id": 13, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 10, "stock_minimo": 5, "codigo_barras": "7565061911908", "costo_unitario": null, "fecha_caducidad": null, "presentacion_id": 1}	\N	2025-11-29 01:33:20.338+00	-1
2f3db6fa-55f6-4291-9c90-97875f43c159	d65cfddb-426c-4aa3-af15-e91f5ff47a1e	UPDATE	{"id": "d65cfddb-426c-4aa3-af15-e91f5ff47a1e", "marca": "Generico", "activo": true, "modelo": "1 pulgada", "nombre": "Arandela plana", "categoria": "13", "creado_en": "2025-11-29T00:16:21.484Z", "imagen_url": null, "descripcion": null, "categoria_id": 13, "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 10, "stock_minimo": 5, "codigo_barras": "7565061911908", "actualizado_en": "2025-11-29T01:32:38.002Z", "costo_unitario": null, "fecha_caducidad": null, "presentacion_id": 1}	{"marca": "Generico", "modelo": "1 pulgada", "nombre": "Arandela plana", "categoria": "5", "imagen_url": null, "descripcion": null, "categoria_id": 5, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 10, "stock_minimo": 5, "codigo_barras": "7565061911908", "costo_unitario": 1, "fecha_caducidad": null, "presentacion_id": 1}	\N	2025-11-29 02:07:20.999+00	-1
e22c9386-75e0-4b05-b036-d1e4776c11a8	d65cfddb-426c-4aa3-af15-e91f5ff47a1e	UPDATE	{"id": "d65cfddb-426c-4aa3-af15-e91f5ff47a1e", "marca": "Generico", "activo": true, "modelo": "1 pulgada", "nombre": "Arandela plana", "categoria": "5", "creado_en": "2025-11-29T00:16:21.484Z", "imagen_url": null, "descripcion": null, "categoria_id": 5, "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 10, "stock_minimo": 5, "codigo_barras": "7565061911908", "actualizado_en": "2025-11-29T02:06:38.759Z", "costo_unitario": 1, "fecha_caducidad": null, "presentacion_id": 1}	{"marca": "Generico", "modelo": "1 pulgada", "nombre": "Arandela plana", "categoria": "5", "imagen_url": null, "descripcion": null, "categoria_id": 5, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 10, "stock_minimo": 5, "codigo_barras": "7565061911908", "costo_unitario": 1, "fecha_caducidad": null, "presentacion_id": 1}	\N	2025-11-29 02:08:06.097+00	-1
f50b22f7-c9bb-417b-9b17-f14eaa28ad42	d65cfddb-426c-4aa3-af15-e91f5ff47a1e	UPDATE	{"id": "d65cfddb-426c-4aa3-af15-e91f5ff47a1e", "marca": "Generico", "activo": true, "modelo": "1 pulgada", "nombre": "Arandela plana", "categoria": "5", "creado_en": "2025-11-29T00:16:21.484Z", "imagen_url": null, "descripcion": null, "categoria_id": 5, "eliminado_en": null, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 10, "stock_minimo": 5, "codigo_barras": "7565061911908", "actualizado_en": "2025-11-29T02:07:23.876Z", "costo_unitario": 1, "fecha_caducidad": null, "presentacion_id": 1}	{"marca": "Generico", "modelo": "1 pulgada", "nombre": "Arandela plana", "categoria": "5", "imagen_url": "almacen-img://7565061911908_arandela_plana_1764382531770_a3f33a24.png", "descripcion": null, "categoria_id": 5, "presentacion": "Unidad", "proveedor_id": null, "stock_actual": 10, "stock_minimo": 5, "codigo_barras": "7565061911908", "costo_unitario": 1, "fecha_caducidad": null, "presentacion_id": 1}	\N	2025-11-29 02:15:35.4+00	-1
\.


--
-- TOC entry 3778 (class 0 OID 16445)
-- Dependencies: 222
-- Data for Name: materia_prima_legacy_20251114; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.materia_prima_legacy_20251114 (id, codigo_barras, nombre, marca, modelo, presentacion, stock, stock_minimo, estatus, fecha_registro, id_institucion, imagen_url, unidad_medida, actualizado_en, eliminado_en, activo, costo_unitario, fecha_caducidad, descripcion, categoria, proveedor_id) FROM stdin;
4	TEST001	Material Prueba 1	MarcaTest	ModeloX	CAJA	100.00	10.00	ACTIVO	2025-11-14 19:35:50.845112	1	\N	PIEZA	2025-11-14 19:36:00.485361+00	\N	t	20.00	\N	Descripción actualizada para prueba	TEST	\N
5	TEST002	Tornillo 3/4"	Stanley	PH2	CAJA 100 UNIDADES	500.00	50.00	ACTIVO	2025-11-14 19:53:45.382919	1	\N	UNIDAD	2025-11-14 19:53:45.382919+00	\N	t	2.50	\N	Tornillo cruciforme de acero inoxidable	HERRAMIENTAS	\N
6	TEST003	Arandela plana	Stanley	AP-8	BOLSA 200 UNIDADES	1000.00	100.00	ACTIVO	2025-11-14 19:53:45.382919	1	\N	UNIDAD	2025-11-14 19:53:45.382919+00	\N	t	0.75	\N	Arandela plana de acero galvanizado	HERRAMIENTAS	\N
7	TEST004	Clavo 2"	Martin	CL-20	CAJA 1 KG	300.00	30.00	ACTIVO	2025-11-14 19:53:45.382919	1	\N	UNIDAD	2025-11-14 19:53:45.382919+00	\N	t	1.20	\N	Clavo de acero con cabeza	HERRAMIENTAS	\N
8	TEST005	Taladro inalámbrico	DeWalt	DCD710	UNIDAD	15.00	5.00	ACTIVO	2025-11-14 19:53:45.382919	1	\N	UNIDAD	2025-11-14 19:53:45.382919+00	\N	t	89.99	\N	Taladro inalámbrico 12V	EQUIPO	\N
9	TEST006	Cinta métrica	Stanley	ST-30	UNIDAD	25.00	5.00	ACTIVO	2025-11-14 19:53:45.382919	1	\N	UNIDAD	2025-11-14 19:53:45.382919+00	\N	t	12.50	\N	Cinta métrica de 30 pies	HERRAMIENTAS	\N
\.


--
-- TOC entry 3796 (class 0 OID 16692)
-- Dependencies: 240
-- Data for Name: parametro_sistema; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parametro_sistema (id, clave, valor, descripcion, tipo_dato, id_institucion, fecha_actualizacion) FROM stdin;
1	STOCK_MINIMO_DEFAULT	10	Stock mínimo por defecto para nueva materia prima	NUMBER	\N	2025-11-13 03:31:09.002047
2	MONEDA_DEFAULT	MXN	Moneda por defecto para movimientos	STRING	\N	2025-11-13 03:31:09.002047
3	DIAS_CADUCIDAD_ALERTA	30	Días antes de la fecha de caducidad para alertar	NUMBER	\N	2025-11-13 03:31:09.002047
4	MAX_INTENTOS_LOGIN	3	Máximo de intentos fallidos de login	NUMBER	\N	2025-11-13 03:31:09.002047
\.


--
-- TOC entry 3803 (class 0 OID 41624)
-- Dependencies: 250
-- Data for Name: presentacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.presentacion (id, nombre, descripcion, abreviatura, unidad_base, factor_conversion, activo, es_predeterminado, creado_en, actualizado_en, id_institucion) FROM stdin;
1	Unidad	Unidad básica de medida	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
2	Caja	Contenedor tipo caja	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
3	Paquete	Contenedor tipo paquete	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
4	Saco	Contenedor tipo saco	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
5	Bolsa	Contenedor tipo bolsa	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
6	Kilogramo	Unidad de peso (kg)	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
7	Gramo	Unidad de peso (g)	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
8	Litro	Unidad de volumen (L)	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
9	Mililitro	Unidad de volumen (mL)	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
10	Metro	Unidad de longitud (m)	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
11	Centímetro	Unidad de longitud (cm)	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
12	Rollo	Material en rollo	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
13	Tubo	Material en tubo	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
14	Botella	Contenedor tipo botella	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
15	Frasco	Contenedor tipo frasco	\N	\N	\N	t	f	2025-11-28 19:09:24.016604	2025-11-28 19:09:24.016604	1
16	Plomería e Hidráulica	\N	\N	\N	\N	t	f	2025-12-01 17:29:55.2	2025-12-01 17:29:55.2	1
17	Pieza	\N	\N	\N	\N	t	f	2025-12-01 17:33:38.607	2025-12-01 17:33:38.607	1
\.


--
-- TOC entry 3780 (class 0 OID 16469)
-- Dependencies: 224
-- Data for Name: producto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.producto (id, codigo_barras, nombre, marca, modelo, cantidad, sku, descripcion, unidad_medida, tiempo_produccion, unidad_medida_secundaria, stock, estatus, fecha_registro, id_institucion, imagen_url) FROM stdin;
\.


--
-- TOC entry 3782 (class 0 OID 16495)
-- Dependencies: 226
-- Data for Name: producto_detalle; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.producto_detalle (id, id_producto, longitud, anchura, alto, peso_bruto, peso_neto, precio, cantidad, fecha_actualizacion) FROM stdin;
\.


--
-- TOC entry 3784 (class 0 OID 16511)
-- Dependencies: 228
-- Data for Name: producto_detalle_produccion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.producto_detalle_produccion (id, id_producto, orden_produccion, fecha_fabricacion, fecha_caducidad, clave_empresa, status, escuela, fecha_registro) FROM stdin;
\.


--
-- TOC entry 3775 (class 0 OID 16418)
-- Dependencies: 219
-- Data for Name: proveedor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proveedor (id, id_fiscal, nombre, domicilio, telefono, email, contacto, rfc, curp, estatus, fecha_registro, id_institucion) FROM stdin;
\.


--
-- TOC entry 3790 (class 0 OID 16608)
-- Dependencies: 234
-- Data for Name: salida_material; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salida_material (id, id_material, cantidad_anterior, cantidad_saliente, cantidad_posterior, estado_material, solicitante, id_usuario, razon_uso, orden_produccion, fecha_movimiento, id_institucion, autorizado_por, comentarios) FROM stdin;
\.


--
-- TOC entry 3794 (class 0 OID 16664)
-- Dependencies: 238
-- Data for Name: salida_producto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salida_producto (id, id_producto, fecha_caducidad, cantidad_anterior, cantidad_saliente, cantidad_posterior, numero_lotes, codigo_lotes, estado_producto, orden_produccion, autorizacion, id_cliente, id_usuario, fecha_movimiento, id_institucion, comentarios) FROM stdin;
\.


--
-- TOC entry 3786 (class 0 OID 16527)
-- Dependencies: 230
-- Data for Name: solicitud_compra; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.solicitud_compra (id, folio, empresa_solicitante, nombre_solicitante, direccion_solicitante, rfc_solicitante, telefono_solicitante, correo_solicitante, uso_cfdi, forma_pago, departamento_solicitante, fecha_solicitud, id_material, modelo_material, marca_material, cantidad_solicitada, unidad_medida, id_proveedor, id_usuario_solicitante, lugar_entrega, fecha_esperada, id_institucion, estatus, fecha_creacion, fecha_actualizacion, id_usuario_autorizo, comentarios) FROM stdin;
\.


--
-- TOC entry 3773 (class 0 OID 16399)
-- Dependencies: 217
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuario (id, nombre, apellido_paterno, apellido_materno, username, password_hash, tipo_usuario, id_institucion, estatus, fecha_registro, ultimo_login) FROM stdin;
\.


--
-- TOC entry 3835 (class 0 OID 0)
-- Dependencies: 241
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 1, false);


--
-- TOC entry 3836 (class 0 OID 0)
-- Dependencies: 251
-- Name: categoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categoria_id_seq', 17, true);


--
-- TOC entry 3837 (class 0 OID 0)
-- Dependencies: 231
-- Name: entrada_material_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.entrada_material_id_seq', 1, false);


--
-- TOC entry 3838 (class 0 OID 0)
-- Dependencies: 235
-- Name: entrada_producto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.entrada_producto_id_seq', 1, false);


--
-- TOC entry 3839 (class 0 OID 0)
-- Dependencies: 214
-- Name: institucion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.institucion_id_seq', 17, true);


--
-- TOC entry 3840 (class 0 OID 0)
-- Dependencies: 221
-- Name: materia_prima_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.materia_prima_id_seq', 9, true);


--
-- TOC entry 3841 (class 0 OID 0)
-- Dependencies: 239
-- Name: parametro_sistema_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.parametro_sistema_id_seq', 4, true);


--
-- TOC entry 3842 (class 0 OID 0)
-- Dependencies: 249
-- Name: presentacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.presentacion_id_seq', 17, true);


--
-- TOC entry 3843 (class 0 OID 0)
-- Dependencies: 225
-- Name: producto_detalle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.producto_detalle_id_seq', 1, false);


--
-- TOC entry 3844 (class 0 OID 0)
-- Dependencies: 227
-- Name: producto_detalle_produccion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.producto_detalle_produccion_id_seq', 1, false);


--
-- TOC entry 3845 (class 0 OID 0)
-- Dependencies: 223
-- Name: producto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.producto_id_seq', 1, false);


--
-- TOC entry 3846 (class 0 OID 0)
-- Dependencies: 218
-- Name: proveedor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.proveedor_id_seq', 4, true);


--
-- TOC entry 3847 (class 0 OID 0)
-- Dependencies: 233
-- Name: salida_material_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.salida_material_id_seq', 1, false);


--
-- TOC entry 3848 (class 0 OID 0)
-- Dependencies: 237
-- Name: salida_producto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.salida_producto_id_seq', 1, false);


--
-- TOC entry 3849 (class 0 OID 0)
-- Dependencies: 229
-- Name: solicitud_compra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.solicitud_compra_id_seq', 1, false);


--
-- TOC entry 3850 (class 0 OID 0)
-- Dependencies: 216
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuario_id_seq', 1, false);


--
-- TOC entry 3543 (class 2606 OID 16720)
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- TOC entry 3577 (class 2606 OID 41652)
-- Name: categoria categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT categoria_pkey PRIMARY KEY (id);


--
-- TOC entry 3579 (class 2606 OID 41690)
-- Name: categoria categoria_unique_institution; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT categoria_unique_institution UNIQUE (nombre, categoria_padre_id, id_institucion);


--
-- TOC entry 3851 (class 0 OID 0)
-- Dependencies: 3579
-- Name: CONSTRAINT categoria_unique_institution ON categoria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT categoria_unique_institution ON public.categoria IS 'Ensures category names are unique within each institution and parent category';


--
-- TOC entry 3484 (class 2606 OID 16443)
-- Name: empresa_proveedora empresa_proveedora_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa_proveedora
    ADD CONSTRAINT empresa_proveedora_pkey PRIMARY KEY (id_fiscal);


--
-- TOC entry 3519 (class 2606 OID 16581)
-- Name: entrada_material entrada_material_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrada_material
    ADD CONSTRAINT entrada_material_pkey PRIMARY KEY (id);


--
-- TOC entry 3531 (class 2606 OID 16652)
-- Name: entrada_producto entrada_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrada_producto
    ADD CONSTRAINT entrada_producto_pkey PRIMARY KEY (id);


--
-- TOC entry 3468 (class 2606 OID 16397)
-- Name: institucion institucion_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institucion
    ADD CONSTRAINT institucion_nombre_key UNIQUE (nombre);


--
-- TOC entry 3470 (class 2606 OID 16395)
-- Name: institucion institucion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institucion
    ADD CONSTRAINT institucion_pkey PRIMARY KEY (id);


--
-- TOC entry 3548 (class 2606 OID 24978)
-- Name: kysely_migration kysely_migration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kysely_migration
    ADD CONSTRAINT kysely_migration_pkey PRIMARY KEY (name);


--
-- TOC entry 3568 (class 2606 OID 25002)
-- Name: materia_prima_auditoria materia_prima_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materia_prima_auditoria
    ADD CONSTRAINT materia_prima_auditoria_pkey PRIMARY KEY (id);


--
-- TOC entry 3491 (class 2606 OID 16462)
-- Name: materia_prima_legacy_20251114 materia_prima_codigo_barras_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materia_prima_legacy_20251114
    ADD CONSTRAINT materia_prima_codigo_barras_key UNIQUE (codigo_barras);


--
-- TOC entry 3560 (class 2606 OID 24991)
-- Name: materia_prima materia_prima_migration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materia_prima
    ADD CONSTRAINT materia_prima_migration_pkey PRIMARY KEY (id);


--
-- TOC entry 3493 (class 2606 OID 16460)
-- Name: materia_prima_legacy_20251114 materia_prima_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materia_prima_legacy_20251114
    ADD CONSTRAINT materia_prima_pkey PRIMARY KEY (id);


--
-- TOC entry 3539 (class 2606 OID 16704)
-- Name: parametro_sistema parametro_sistema_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametro_sistema
    ADD CONSTRAINT parametro_sistema_clave_key UNIQUE (clave);


--
-- TOC entry 3541 (class 2606 OID 16702)
-- Name: parametro_sistema parametro_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametro_sistema
    ADD CONSTRAINT parametro_sistema_pkey PRIMARY KEY (id);


--
-- TOC entry 3573 (class 2606 OID 41635)
-- Name: presentacion presentacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentacion
    ADD CONSTRAINT presentacion_pkey PRIMARY KEY (id);


--
-- TOC entry 3575 (class 2606 OID 41688)
-- Name: presentacion presentacion_unique_institution; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentacion
    ADD CONSTRAINT presentacion_unique_institution UNIQUE (nombre, id_institucion);


--
-- TOC entry 3852 (class 0 OID 0)
-- Dependencies: 3575
-- Name: CONSTRAINT presentacion_unique_institution ON presentacion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT presentacion_unique_institution ON public.presentacion IS 'Ensures presentation names are unique within each institution';


--
-- TOC entry 3499 (class 2606 OID 16486)
-- Name: producto producto_codigo_barras_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_codigo_barras_key UNIQUE (codigo_barras);


--
-- TOC entry 3505 (class 2606 OID 16504)
-- Name: producto_detalle producto_detalle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_detalle
    ADD CONSTRAINT producto_detalle_pkey PRIMARY KEY (id);


--
-- TOC entry 3507 (class 2606 OID 16520)
-- Name: producto_detalle_produccion producto_detalle_produccion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_detalle_produccion
    ADD CONSTRAINT producto_detalle_produccion_pkey PRIMARY KEY (id);


--
-- TOC entry 3501 (class 2606 OID 16484)
-- Name: producto producto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (id);


--
-- TOC entry 3503 (class 2606 OID 16488)
-- Name: producto producto_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_sku_key UNIQUE (sku);


--
-- TOC entry 3480 (class 2606 OID 16430)
-- Name: proveedor proveedor_id_fiscal_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedor
    ADD CONSTRAINT proveedor_id_fiscal_key UNIQUE (id_fiscal);


--
-- TOC entry 3482 (class 2606 OID 16428)
-- Name: proveedor proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedor
    ADD CONSTRAINT proveedor_pkey PRIMARY KEY (id);


--
-- TOC entry 3529 (class 2606 OID 16619)
-- Name: salida_material salida_material_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salida_material
    ADD CONSTRAINT salida_material_pkey PRIMARY KEY (id);


--
-- TOC entry 3537 (class 2606 OID 16675)
-- Name: salida_producto salida_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salida_producto
    ADD CONSTRAINT salida_producto_pkey PRIMARY KEY (id);


--
-- TOC entry 3515 (class 2606 OID 16540)
-- Name: solicitud_compra solicitud_compra_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_folio_key UNIQUE (folio);


--
-- TOC entry 3517 (class 2606 OID 16538)
-- Name: solicitud_compra solicitud_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_pkey PRIMARY KEY (id);


--
-- TOC entry 3562 (class 2606 OID 24993)
-- Name: materia_prima unique_codigo_barras_active; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materia_prima
    ADD CONSTRAINT unique_codigo_barras_active UNIQUE (codigo_barras, activo);


--
-- TOC entry 3472 (class 2606 OID 16409)
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- TOC entry 3474 (class 2606 OID 16411)
-- Name: usuario usuario_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_username_key UNIQUE (username);


--
-- TOC entry 3544 (class 1259 OID 16757)
-- Name: idx_auditoria_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_fecha ON public.auditoria USING btree (fecha_operacion);


--
-- TOC entry 3545 (class 1259 OID 16758)
-- Name: idx_auditoria_tabla; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_tabla ON public.auditoria USING btree (tabla_afectada);


--
-- TOC entry 3546 (class 1259 OID 16759)
-- Name: idx_auditoria_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_usuario ON public.auditoria USING btree (id_usuario);


--
-- TOC entry 3580 (class 1259 OID 41661)
-- Name: idx_categorias_activas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_activas ON public.categoria USING btree (activo) WHERE (activo = true);


--
-- TOC entry 3581 (class 1259 OID 41694)
-- Name: idx_categorias_activas_institution; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_activas_institution ON public.categoria USING btree (activo, id_institucion) WHERE (activo = true);


--
-- TOC entry 3582 (class 1259 OID 41692)
-- Name: idx_categorias_institution; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_institution ON public.categoria USING btree (id_institucion);


--
-- TOC entry 3583 (class 1259 OID 41662)
-- Name: idx_categorias_jerarquia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_jerarquia ON public.categoria USING btree (categoria_padre_id, nivel);


--
-- TOC entry 3584 (class 1259 OID 41663)
-- Name: idx_categorias_orden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_orden ON public.categoria USING btree (nivel, orden);


--
-- TOC entry 3520 (class 1259 OID 16745)
-- Name: idx_entrada_material_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entrada_material_fecha ON public.entrada_material USING btree (fecha_movimiento);


--
-- TOC entry 3521 (class 1259 OID 16748)
-- Name: idx_entrada_material_institucion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entrada_material_institucion ON public.entrada_material USING btree (id_institucion);


--
-- TOC entry 3522 (class 1259 OID 16746)
-- Name: idx_entrada_material_material; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entrada_material_material ON public.entrada_material USING btree (id_material);


--
-- TOC entry 3523 (class 1259 OID 16747)
-- Name: idx_entrada_material_proveedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entrada_material_proveedor ON public.entrada_material USING btree (id_proveedor);


--
-- TOC entry 3532 (class 1259 OID 16753)
-- Name: idx_entrada_producto_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entrada_producto_fecha ON public.entrada_producto USING btree (fecha_movimiento);


--
-- TOC entry 3533 (class 1259 OID 16754)
-- Name: idx_entrada_producto_producto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entrada_producto_producto ON public.entrada_producto USING btree (id_producto);


--
-- TOC entry 3563 (class 1259 OID 25014)
-- Name: idx_materia_prima_auditoria_accion_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_auditoria_accion_fecha ON public.materia_prima_auditoria USING btree (accion, fecha);


--
-- TOC entry 3564 (class 1259 OID 25013)
-- Name: idx_materia_prima_auditoria_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_auditoria_fecha ON public.materia_prima_auditoria USING btree (fecha);


--
-- TOC entry 3565 (class 1259 OID 25011)
-- Name: idx_materia_prima_auditoria_materia_prima_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_auditoria_materia_prima_id ON public.materia_prima_auditoria USING btree (materia_prima_id);


--
-- TOC entry 3566 (class 1259 OID 25012)
-- Name: idx_materia_prima_auditoria_materia_prima_legacy_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_auditoria_materia_prima_legacy_id ON public.materia_prima_auditoria USING btree (materia_prima_legacy_id);


--
-- TOC entry 3549 (class 1259 OID 25043)
-- Name: idx_materia_prima_busqueda_texto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_busqueda_texto ON public.materia_prima USING gin (to_tsvector('spanish'::regconfig, (((nombre)::text || ' '::text) || COALESCE(descripcion, ''::text)))) WHERE (activo = true);


--
-- TOC entry 3550 (class 1259 OID 25042)
-- Name: idx_materia_prima_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_categoria ON public.materia_prima USING btree (categoria) WHERE ((activo = true) AND (categoria IS NOT NULL));


--
-- TOC entry 3485 (class 1259 OID 16726)
-- Name: idx_materia_prima_codigo_barras; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_codigo_barras ON public.materia_prima_legacy_20251114 USING btree (codigo_barras);


--
-- TOC entry 3486 (class 1259 OID 16728)
-- Name: idx_materia_prima_estatus; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_estatus ON public.materia_prima_legacy_20251114 USING btree (estatus);


--
-- TOC entry 3551 (class 1259 OID 25044)
-- Name: idx_materia_prima_fecha_caducidad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_fecha_caducidad ON public.materia_prima USING btree (fecha_caducidad) WHERE ((activo = true) AND (fecha_caducidad IS NOT NULL));


--
-- TOC entry 3487 (class 1259 OID 16729)
-- Name: idx_materia_prima_institucion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_institucion ON public.materia_prima_legacy_20251114 USING btree (id_institucion);


--
-- TOC entry 3552 (class 1259 OID 25007)
-- Name: idx_materia_prima_migration_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_migration_categoria ON public.materia_prima USING btree (categoria) WHERE (activo = true);


--
-- TOC entry 3553 (class 1259 OID 25003)
-- Name: idx_materia_prima_migration_codigo_barras; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_migration_codigo_barras ON public.materia_prima USING btree (codigo_barras) WHERE (activo = true);


--
-- TOC entry 3554 (class 1259 OID 25004)
-- Name: idx_materia_prima_migration_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_migration_nombre ON public.materia_prima USING btree (nombre) WHERE (activo = true);


--
-- TOC entry 3555 (class 1259 OID 25006)
-- Name: idx_materia_prima_migration_proveedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_migration_proveedor ON public.materia_prima USING btree (proveedor_id) WHERE (activo = true);


--
-- TOC entry 3556 (class 1259 OID 25005)
-- Name: idx_materia_prima_migration_stock_bajo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_migration_stock_bajo ON public.materia_prima USING btree (stock_actual, stock_minimo) WHERE (activo = true);


--
-- TOC entry 3488 (class 1259 OID 16727)
-- Name: idx_materia_prima_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_nombre ON public.materia_prima_legacy_20251114 USING btree (nombre);


--
-- TOC entry 3557 (class 1259 OID 25041)
-- Name: idx_materia_prima_proveedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_proveedor ON public.materia_prima USING btree (proveedor_id) WHERE ((activo = true) AND (proveedor_id IS NOT NULL));


--
-- TOC entry 3489 (class 1259 OID 16730)
-- Name: idx_materia_prima_stock; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_stock ON public.materia_prima_legacy_20251114 USING btree (stock) WHERE (stock <= stock_minimo);


--
-- TOC entry 3558 (class 1259 OID 25040)
-- Name: idx_materia_prima_stock_bajo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materia_prima_stock_bajo ON public.materia_prima USING btree (stock_actual, stock_minimo) WHERE ((activo = true) AND (stock_actual <= stock_minimo));


--
-- TOC entry 3569 (class 1259 OID 41660)
-- Name: idx_presentaciones_activas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presentaciones_activas ON public.presentacion USING btree (activo) WHERE (activo = true);


--
-- TOC entry 3570 (class 1259 OID 41693)
-- Name: idx_presentaciones_activas_institution; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presentaciones_activas_institution ON public.presentacion USING btree (activo, id_institucion) WHERE (activo = true);


--
-- TOC entry 3571 (class 1259 OID 41691)
-- Name: idx_presentaciones_institution; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presentaciones_institution ON public.presentacion USING btree (id_institucion);


--
-- TOC entry 3494 (class 1259 OID 16735)
-- Name: idx_producto_codigo_barras; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_producto_codigo_barras ON public.producto USING btree (codigo_barras);


--
-- TOC entry 3495 (class 1259 OID 16738)
-- Name: idx_producto_estatus; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_producto_estatus ON public.producto USING btree (estatus);


--
-- TOC entry 3496 (class 1259 OID 16737)
-- Name: idx_producto_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_producto_nombre ON public.producto USING btree (nombre);


--
-- TOC entry 3497 (class 1259 OID 16736)
-- Name: idx_producto_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_producto_sku ON public.producto USING btree (sku);


--
-- TOC entry 3475 (class 1259 OID 16734)
-- Name: idx_proveedor_estatus; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proveedor_estatus ON public.proveedor USING btree (estatus);


--
-- TOC entry 3476 (class 1259 OID 16731)
-- Name: idx_proveedor_id_fiscal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proveedor_id_fiscal ON public.proveedor USING btree (id_fiscal);


--
-- TOC entry 3477 (class 1259 OID 16732)
-- Name: idx_proveedor_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proveedor_nombre ON public.proveedor USING btree (nombre);


--
-- TOC entry 3478 (class 1259 OID 16733)
-- Name: idx_proveedor_rfc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proveedor_rfc ON public.proveedor USING btree (rfc);


--
-- TOC entry 3524 (class 1259 OID 16749)
-- Name: idx_salida_material_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salida_material_fecha ON public.salida_material USING btree (fecha_movimiento);


--
-- TOC entry 3525 (class 1259 OID 16752)
-- Name: idx_salida_material_institucion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salida_material_institucion ON public.salida_material USING btree (id_institucion);


--
-- TOC entry 3526 (class 1259 OID 16750)
-- Name: idx_salida_material_material; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salida_material_material ON public.salida_material USING btree (id_material);


--
-- TOC entry 3527 (class 1259 OID 16751)
-- Name: idx_salida_material_solicitante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salida_material_solicitante ON public.salida_material USING btree (solicitante);


--
-- TOC entry 3534 (class 1259 OID 16755)
-- Name: idx_salida_producto_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salida_producto_fecha ON public.salida_producto USING btree (fecha_movimiento);


--
-- TOC entry 3535 (class 1259 OID 16756)
-- Name: idx_salida_producto_producto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salida_producto_producto ON public.salida_producto USING btree (id_producto);


--
-- TOC entry 3508 (class 1259 OID 16740)
-- Name: idx_solicitud_estatus; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitud_estatus ON public.solicitud_compra USING btree (estatus);


--
-- TOC entry 3509 (class 1259 OID 16741)
-- Name: idx_solicitud_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitud_fecha ON public.solicitud_compra USING btree (fecha_solicitud);


--
-- TOC entry 3510 (class 1259 OID 16739)
-- Name: idx_solicitud_folio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitud_folio ON public.solicitud_compra USING btree (folio);


--
-- TOC entry 3511 (class 1259 OID 16744)
-- Name: idx_solicitud_institucion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitud_institucion ON public.solicitud_compra USING btree (id_institucion);


--
-- TOC entry 3512 (class 1259 OID 16742)
-- Name: idx_solicitud_material; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitud_material ON public.solicitud_compra USING btree (id_material);


--
-- TOC entry 3513 (class 1259 OID 16743)
-- Name: idx_solicitud_proveedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitud_proveedor ON public.solicitud_compra USING btree (id_proveedor);


--
-- TOC entry 3621 (class 2620 OID 16765)
-- Name: entrada_material aud_entrada_material; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER aud_entrada_material AFTER INSERT OR DELETE OR UPDATE ON public.entrada_material FOR EACH ROW EXECUTE FUNCTION public.auditar_cambios();


--
-- TOC entry 3617 (class 2620 OID 16764)
-- Name: proveedor aud_proveedor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER aud_proveedor AFTER INSERT OR DELETE OR UPDATE ON public.proveedor FOR EACH ROW EXECUTE FUNCTION public.auditar_cambios();


--
-- TOC entry 3622 (class 2620 OID 16766)
-- Name: salida_material aud_salida_material; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER aud_salida_material AFTER INSERT OR DELETE OR UPDATE ON public.salida_material FOR EACH ROW EXECUTE FUNCTION public.auditar_cambios();


--
-- TOC entry 3624 (class 2620 OID 41665)
-- Name: categoria trg_actualizar_ruta_categoria; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_actualizar_ruta_categoria BEFORE INSERT OR UPDATE ON public.categoria FOR EACH ROW EXECUTE FUNCTION public.actualizar_ruta_categoria();


--
-- TOC entry 3620 (class 2620 OID 16761)
-- Name: solicitud_compra trg_solicitud_compra_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_solicitud_compra_timestamp BEFORE UPDATE ON public.solicitud_compra FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();


--
-- TOC entry 3618 (class 2620 OID 25017)
-- Name: materia_prima_legacy_20251114 trigger_auditoria_materia_prima; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auditoria_materia_prima AFTER INSERT OR DELETE OR UPDATE ON public.materia_prima_legacy_20251114 FOR EACH ROW EXECUTE FUNCTION public.auditoria_materia_prima();


--
-- TOC entry 3623 (class 2620 OID 25008)
-- Name: materia_prima trigger_materia_prima_actualizado_en; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_materia_prima_actualizado_en BEFORE UPDATE ON public.materia_prima FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();


--
-- TOC entry 3619 (class 2620 OID 25015)
-- Name: materia_prima_legacy_20251114 trigger_materia_prima_actualizado_en; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_materia_prima_actualizado_en BEFORE UPDATE ON public.materia_prima_legacy_20251114 FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();


--
-- TOC entry 3611 (class 2606 OID 16721)
-- Name: auditoria auditoria_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id);


--
-- TOC entry 3615 (class 2606 OID 41655)
-- Name: categoria categoria_categoria_padre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT categoria_categoria_padre_id_fkey FOREIGN KEY (categoria_padre_id) REFERENCES public.categoria(id);


--
-- TOC entry 3616 (class 2606 OID 41682)
-- Name: categoria categoria_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT categoria_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- TOC entry 3596 (class 2606 OID 16597)
-- Name: entrada_material entrada_material_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrada_material
    ADD CONSTRAINT entrada_material_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- TOC entry 3597 (class 2606 OID 16582)
-- Name: entrada_material entrada_material_id_material_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrada_material
    ADD CONSTRAINT entrada_material_id_material_fkey FOREIGN KEY (id_material) REFERENCES public.materia_prima_legacy_20251114(id);


--
-- TOC entry 3598 (class 2606 OID 16587)
-- Name: entrada_material entrada_material_id_proveedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrada_material
    ADD CONSTRAINT entrada_material_id_proveedor_fkey FOREIGN KEY (id_proveedor) REFERENCES public.proveedor(id);


--
-- TOC entry 3599 (class 2606 OID 16602)
-- Name: entrada_material entrada_material_id_solicitud_compra_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrada_material
    ADD CONSTRAINT entrada_material_id_solicitud_compra_fkey FOREIGN KEY (id_solicitud_compra) REFERENCES public.solicitud_compra(id);


--
-- TOC entry 3600 (class 2606 OID 16592)
-- Name: entrada_material entrada_material_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrada_material
    ADD CONSTRAINT entrada_material_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id);


--
-- TOC entry 3605 (class 2606 OID 16653)
-- Name: entrada_producto entrada_producto_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrada_producto
    ADD CONSTRAINT entrada_producto_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id);


--
-- TOC entry 3606 (class 2606 OID 16658)
-- Name: entrada_producto entrada_producto_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrada_producto
    ADD CONSTRAINT entrada_producto_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id);


--
-- TOC entry 3612 (class 2606 OID 41671)
-- Name: materia_prima materia_prima_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materia_prima
    ADD CONSTRAINT materia_prima_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categoria(id);


--
-- TOC entry 3587 (class 2606 OID 16463)
-- Name: materia_prima_legacy_20251114 materia_prima_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materia_prima_legacy_20251114
    ADD CONSTRAINT materia_prima_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- TOC entry 3613 (class 2606 OID 41666)
-- Name: materia_prima materia_prima_presentacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materia_prima
    ADD CONSTRAINT materia_prima_presentacion_id_fkey FOREIGN KEY (presentacion_id) REFERENCES public.presentacion(id);


--
-- TOC entry 3610 (class 2606 OID 16705)
-- Name: parametro_sistema parametro_sistema_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametro_sistema
    ADD CONSTRAINT parametro_sistema_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- TOC entry 3614 (class 2606 OID 41677)
-- Name: presentacion presentacion_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentacion
    ADD CONSTRAINT presentacion_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- TOC entry 3589 (class 2606 OID 16505)
-- Name: producto_detalle producto_detalle_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_detalle
    ADD CONSTRAINT producto_detalle_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id) ON DELETE CASCADE;


--
-- TOC entry 3590 (class 2606 OID 16521)
-- Name: producto_detalle_produccion producto_detalle_produccion_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_detalle_produccion
    ADD CONSTRAINT producto_detalle_produccion_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id) ON DELETE CASCADE;


--
-- TOC entry 3588 (class 2606 OID 16489)
-- Name: producto producto_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- TOC entry 3586 (class 2606 OID 16431)
-- Name: proveedor proveedor_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedor
    ADD CONSTRAINT proveedor_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- TOC entry 3601 (class 2606 OID 16635)
-- Name: salida_material salida_material_autorizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salida_material
    ADD CONSTRAINT salida_material_autorizado_por_fkey FOREIGN KEY (autorizado_por) REFERENCES public.usuario(id);


--
-- TOC entry 3602 (class 2606 OID 16630)
-- Name: salida_material salida_material_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salida_material
    ADD CONSTRAINT salida_material_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- TOC entry 3603 (class 2606 OID 16620)
-- Name: salida_material salida_material_id_material_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salida_material
    ADD CONSTRAINT salida_material_id_material_fkey FOREIGN KEY (id_material) REFERENCES public.materia_prima_legacy_20251114(id);


--
-- TOC entry 3604 (class 2606 OID 16625)
-- Name: salida_material salida_material_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salida_material
    ADD CONSTRAINT salida_material_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id);


--
-- TOC entry 3607 (class 2606 OID 16686)
-- Name: salida_producto salida_producto_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salida_producto
    ADD CONSTRAINT salida_producto_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- TOC entry 3608 (class 2606 OID 16676)
-- Name: salida_producto salida_producto_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salida_producto
    ADD CONSTRAINT salida_producto_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id);


--
-- TOC entry 3609 (class 2606 OID 16681)
-- Name: salida_producto salida_producto_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salida_producto
    ADD CONSTRAINT salida_producto_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id);


--
-- TOC entry 3591 (class 2606 OID 16556)
-- Name: solicitud_compra solicitud_compra_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- TOC entry 3592 (class 2606 OID 16541)
-- Name: solicitud_compra solicitud_compra_id_material_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_id_material_fkey FOREIGN KEY (id_material) REFERENCES public.materia_prima_legacy_20251114(id);


--
-- TOC entry 3593 (class 2606 OID 16546)
-- Name: solicitud_compra solicitud_compra_id_proveedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_id_proveedor_fkey FOREIGN KEY (id_proveedor) REFERENCES public.proveedor(id);


--
-- TOC entry 3594 (class 2606 OID 16561)
-- Name: solicitud_compra solicitud_compra_id_usuario_autorizo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_id_usuario_autorizo_fkey FOREIGN KEY (id_usuario_autorizo) REFERENCES public.usuario(id);


--
-- TOC entry 3595 (class 2606 OID 16551)
-- Name: solicitud_compra solicitud_compra_id_usuario_solicitante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_id_usuario_solicitante_fkey FOREIGN KEY (id_usuario_solicitante) REFERENCES public.usuario(id);


--
-- TOC entry 3585 (class 2606 OID 16412)
-- Name: usuario usuario_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


-- Completed on 2025-12-02 01:13:23 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict iXfG4byUI7Cq1WFh0v2DTdO4aYpPeaWkFN0KUwH7Rm9zUa6hPDRx9YirDwokagS

