--
-- PostgreSQL database dump
--

\restrict YONeT2NZCnx1DjsV8u6OKicey7DTGB72rgbdEPzR2ZhYgSE9Cad4HdYQxkwQjhq

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

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
-- Name: actualizar_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_timestamp() OWNER TO postgres;

--
-- Name: auditar_cambios(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.auditar_cambios() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.auditoria OWNER TO postgres;

--
-- Name: auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.auditoria_id_seq OWNER TO postgres;

--
-- Name: auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;


--
-- Name: empresa_proveedora; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.empresa_proveedora OWNER TO postgres;

--
-- Name: entrada_material; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.entrada_material OWNER TO postgres;

--
-- Name: entrada_material_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.entrada_material_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.entrada_material_id_seq OWNER TO postgres;

--
-- Name: entrada_material_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.entrada_material_id_seq OWNED BY public.entrada_material.id;


--
-- Name: entrada_producto; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.entrada_producto OWNER TO postgres;

--
-- Name: entrada_producto_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.entrada_producto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.entrada_producto_id_seq OWNER TO postgres;

--
-- Name: entrada_producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.entrada_producto_id_seq OWNED BY public.entrada_producto.id;


--
-- Name: institucion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.institucion (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    estatus character varying(20) DEFAULT 'ACTIVO'::character varying NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.institucion OWNER TO postgres;

--
-- Name: institucion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.institucion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.institucion_id_seq OWNER TO postgres;

--
-- Name: institucion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.institucion_id_seq OWNED BY public.institucion.id;


--
-- Name: kysely_migration; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kysely_migration (
    name character varying(255) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.kysely_migration OWNER TO postgres;

--
-- Name: materia_prima; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.materia_prima (
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
    CONSTRAINT materia_prima_estatus_check CHECK (((estatus)::text = ANY ((ARRAY['ACTIVO'::character varying, 'INACTIVO'::character varying, 'SUSPENDIDO'::character varying])::text[]))),
    CONSTRAINT materia_prima_stock_check CHECK ((stock >= (0)::numeric)),
    CONSTRAINT materia_prima_stock_minimo_check CHECK ((stock_minimo >= (0)::numeric))
);


ALTER TABLE public.materia_prima OWNER TO postgres;

--
-- Name: materia_prima_auditoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.materia_prima_auditoria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    materia_prima_id uuid NOT NULL,
    accion character varying(20) NOT NULL,
    datos_anteriores jsonb,
    datos_nuevos jsonb,
    usuario_id uuid,
    fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.materia_prima_auditoria OWNER TO postgres;

--
-- Name: materia_prima_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.materia_prima_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.materia_prima_id_seq OWNER TO postgres;

--
-- Name: materia_prima_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.materia_prima_id_seq OWNED BY public.materia_prima.id;


--
-- Name: materia_prima_migration; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.materia_prima_migration (
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
    eliminado_en timestamp with time zone
);


ALTER TABLE public.materia_prima_migration OWNER TO postgres;

--
-- Name: parametro_sistema; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.parametro_sistema OWNER TO postgres;

--
-- Name: parametro_sistema_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.parametro_sistema_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.parametro_sistema_id_seq OWNER TO postgres;

--
-- Name: parametro_sistema_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.parametro_sistema_id_seq OWNED BY public.parametro_sistema.id;


--
-- Name: producto; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.producto OWNER TO postgres;

--
-- Name: producto_detalle; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.producto_detalle OWNER TO postgres;

--
-- Name: producto_detalle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.producto_detalle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.producto_detalle_id_seq OWNER TO postgres;

--
-- Name: producto_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.producto_detalle_id_seq OWNED BY public.producto_detalle.id;


--
-- Name: producto_detalle_produccion; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.producto_detalle_produccion OWNER TO postgres;

--
-- Name: producto_detalle_produccion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.producto_detalle_produccion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.producto_detalle_produccion_id_seq OWNER TO postgres;

--
-- Name: producto_detalle_produccion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.producto_detalle_produccion_id_seq OWNED BY public.producto_detalle_produccion.id;


--
-- Name: producto_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.producto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.producto_id_seq OWNER TO postgres;

--
-- Name: producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.producto_id_seq OWNED BY public.producto.id;


--
-- Name: proveedor; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.proveedor OWNER TO postgres;

--
-- Name: proveedor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proveedor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.proveedor_id_seq OWNER TO postgres;

--
-- Name: proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proveedor_id_seq OWNED BY public.proveedor.id;


--
-- Name: salida_material; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.salida_material OWNER TO postgres;

--
-- Name: salida_material_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.salida_material_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.salida_material_id_seq OWNER TO postgres;

--
-- Name: salida_material_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.salida_material_id_seq OWNED BY public.salida_material.id;


--
-- Name: salida_producto; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.salida_producto OWNER TO postgres;

--
-- Name: salida_producto_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.salida_producto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.salida_producto_id_seq OWNER TO postgres;

--
-- Name: salida_producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.salida_producto_id_seq OWNED BY public.salida_producto.id;


--
-- Name: solicitud_compra; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.solicitud_compra OWNER TO postgres;

--
-- Name: solicitud_compra_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.solicitud_compra_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.solicitud_compra_id_seq OWNER TO postgres;

--
-- Name: solicitud_compra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.solicitud_compra_id_seq OWNED BY public.solicitud_compra.id;


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.usuario OWNER TO postgres;

--
-- Name: usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.usuario_id_seq OWNER TO postgres;

--
-- Name: usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuario_id_seq OWNED BY public.usuario.id;


--
-- Name: vw_movimientos_material; Type: VIEW; Schema: public; Owner: postgres
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
     JOIN public.materia_prima mp ON ((em.id_material = mp.id)))
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
     JOIN public.materia_prima mp ON ((sm.id_material = mp.id)))
     JOIN public.usuario u ON ((sm.id_usuario = u.id)))
     JOIN public.institucion i ON ((sm.id_institucion = i.id)));


ALTER TABLE public.vw_movimientos_material OWNER TO postgres;

--
-- Name: vw_solicitudes_resumen; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_solicitudes_resumen AS
 SELECT solicitud_compra.estatus,
    count(*) AS total_solicitudes,
    sum(solicitud_compra.cantidad_solicitada) AS cantidad_total,
    count(DISTINCT solicitud_compra.id_material) AS materiales_distintos,
    count(DISTINCT solicitud_compra.id_proveedor) AS proveedores_distintos
   FROM public.solicitud_compra
  GROUP BY solicitud_compra.estatus;


ALTER TABLE public.vw_solicitudes_resumen OWNER TO postgres;

--
-- Name: vw_stock_materia_prima; Type: VIEW; Schema: public; Owner: postgres
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
   FROM (public.materia_prima mp
     JOIN public.institucion i ON ((mp.id_institucion = i.id)))
  WHERE ((mp.estatus)::text = 'ACTIVO'::text);


ALTER TABLE public.vw_stock_materia_prima OWNER TO postgres;

--
-- Name: auditoria id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);


--
-- Name: entrada_material id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrada_material ALTER COLUMN id SET DEFAULT nextval('public.entrada_material_id_seq'::regclass);


--
-- Name: entrada_producto id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrada_producto ALTER COLUMN id SET DEFAULT nextval('public.entrada_producto_id_seq'::regclass);


--
-- Name: institucion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.institucion ALTER COLUMN id SET DEFAULT nextval('public.institucion_id_seq'::regclass);


--
-- Name: materia_prima id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materia_prima ALTER COLUMN id SET DEFAULT nextval('public.materia_prima_id_seq'::regclass);


--
-- Name: parametro_sistema id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parametro_sistema ALTER COLUMN id SET DEFAULT nextval('public.parametro_sistema_id_seq'::regclass);


--
-- Name: producto id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto ALTER COLUMN id SET DEFAULT nextval('public.producto_id_seq'::regclass);


--
-- Name: producto_detalle id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_detalle ALTER COLUMN id SET DEFAULT nextval('public.producto_detalle_id_seq'::regclass);


--
-- Name: producto_detalle_produccion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_detalle_produccion ALTER COLUMN id SET DEFAULT nextval('public.producto_detalle_produccion_id_seq'::regclass);


--
-- Name: proveedor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedor ALTER COLUMN id SET DEFAULT nextval('public.proveedor_id_seq'::regclass);


--
-- Name: salida_material id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_material ALTER COLUMN id SET DEFAULT nextval('public.salida_material_id_seq'::regclass);


--
-- Name: salida_producto id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_producto ALTER COLUMN id SET DEFAULT nextval('public.salida_producto_id_seq'::regclass);


--
-- Name: solicitud_compra id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_compra ALTER COLUMN id SET DEFAULT nextval('public.solicitud_compra_id_seq'::regclass);


--
-- Name: usuario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario ALTER COLUMN id SET DEFAULT nextval('public.usuario_id_seq'::regclass);


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria (id, tabla_afectada, id_registro_afectado, tipo_operacion, valor_anterior, valor_nuevo, id_usuario, fecha_operacion, ip_address, user_agent) FROM stdin;
\.


--
-- Data for Name: empresa_proveedora; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.empresa_proveedora (id_fiscal, nombre, domicilio, numero_interior, numero_exterior, colonia, ciudad, pais, codigo_postal, telefono, email, contacto, condicion_pago, condicion_entrega, fecha_registro) FROM stdin;
\.


--
-- Data for Name: entrada_material; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.entrada_material (id, id_material, id_proveedor, cantidad_anterior, cantidad_entrante, cantidad_actual, precio_unitario, tipo_moneda, estado_material, id_usuario, fecha_movimiento, id_institucion, numero_factura, fecha_factura, comentarios, id_solicitud_compra) FROM stdin;
\.


--
-- Data for Name: entrada_producto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.entrada_producto (id, id_producto, fecha_caducidad, cantidad_anterior, cantidad_entrante, cantidad_actual, numero_lotes, cantidad_por_lote, codigo_lotes, estado_producto, numero_orden_produccion, embalaje, otro_embalaje, pallet, id_usuario, fecha_movimiento, comentarios) FROM stdin;
\.


--
-- Data for Name: institucion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.institucion (id, nombre, descripcion, estatus, fecha_creacion) FROM stdin;
1	ACK	Institución ACK por defecto	ACTIVO	2025-11-13 03:31:09.000223
\.


--
-- Data for Name: kysely_migration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kysely_migration (name, executed_at) FROM stdin;
001_create_materia_prima.sql	2025-11-14 19:11:24.844598
\.


--
-- Data for Name: materia_prima; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.materia_prima (id, codigo_barras, nombre, marca, modelo, presentacion, stock, stock_minimo, estatus, fecha_registro, id_institucion, imagen_url, unidad_medida) FROM stdin;
\.


--
-- Data for Name: materia_prima_auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.materia_prima_auditoria (id, materia_prima_id, accion, datos_anteriores, datos_nuevos, usuario_id, fecha) FROM stdin;
\.


--
-- Data for Name: materia_prima_migration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.materia_prima_migration (id, codigo_barras, nombre, marca, modelo, presentacion, stock_actual, stock_minimo, costo_unitario, fecha_caducidad, imagen_url, descripcion, categoria, proveedor_id, activo, creado_en, actualizado_en, eliminado_en) FROM stdin;
\.


--
-- Data for Name: parametro_sistema; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parametro_sistema (id, clave, valor, descripcion, tipo_dato, id_institucion, fecha_actualizacion) FROM stdin;
1	STOCK_MINIMO_DEFAULT	10	Stock mínimo por defecto para nueva materia prima	NUMBER	\N	2025-11-13 03:31:09.002047
2	MONEDA_DEFAULT	MXN	Moneda por defecto para movimientos	STRING	\N	2025-11-13 03:31:09.002047
3	DIAS_CADUCIDAD_ALERTA	30	Días antes de la fecha de caducidad para alertar	NUMBER	\N	2025-11-13 03:31:09.002047
4	MAX_INTENTOS_LOGIN	3	Máximo de intentos fallidos de login	NUMBER	\N	2025-11-13 03:31:09.002047
\.


--
-- Data for Name: producto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.producto (id, codigo_barras, nombre, marca, modelo, cantidad, sku, descripcion, unidad_medida, tiempo_produccion, unidad_medida_secundaria, stock, estatus, fecha_registro, id_institucion, imagen_url) FROM stdin;
\.


--
-- Data for Name: producto_detalle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.producto_detalle (id, id_producto, longitud, anchura, alto, peso_bruto, peso_neto, precio, cantidad, fecha_actualizacion) FROM stdin;
\.


--
-- Data for Name: producto_detalle_produccion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.producto_detalle_produccion (id, id_producto, orden_produccion, fecha_fabricacion, fecha_caducidad, clave_empresa, status, escuela, fecha_registro) FROM stdin;
\.


--
-- Data for Name: proveedor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proveedor (id, id_fiscal, nombre, domicilio, telefono, email, contacto, rfc, curp, estatus, fecha_registro, id_institucion) FROM stdin;
\.


--
-- Data for Name: salida_material; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.salida_material (id, id_material, cantidad_anterior, cantidad_saliente, cantidad_posterior, estado_material, solicitante, id_usuario, razon_uso, orden_produccion, fecha_movimiento, id_institucion, autorizado_por, comentarios) FROM stdin;
\.


--
-- Data for Name: salida_producto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.salida_producto (id, id_producto, fecha_caducidad, cantidad_anterior, cantidad_saliente, cantidad_posterior, numero_lotes, codigo_lotes, estado_producto, orden_produccion, autorizacion, id_cliente, id_usuario, fecha_movimiento, id_institucion, comentarios) FROM stdin;
\.


--
-- Data for Name: solicitud_compra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitud_compra (id, folio, empresa_solicitante, nombre_solicitante, direccion_solicitante, rfc_solicitante, telefono_solicitante, correo_solicitante, uso_cfdi, forma_pago, departamento_solicitante, fecha_solicitud, id_material, modelo_material, marca_material, cantidad_solicitada, unidad_medida, id_proveedor, id_usuario_solicitante, lugar_entrega, fecha_esperada, id_institucion, estatus, fecha_creacion, fecha_actualizacion, id_usuario_autorizo, comentarios) FROM stdin;
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario (id, nombre, apellido_paterno, apellido_materno, username, password_hash, tipo_usuario, id_institucion, estatus, fecha_registro, ultimo_login) FROM stdin;
\.


--
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 1, false);


--
-- Name: entrada_material_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.entrada_material_id_seq', 1, false);


--
-- Name: entrada_producto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.entrada_producto_id_seq', 1, false);


--
-- Name: institucion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.institucion_id_seq', 1, true);


--
-- Name: materia_prima_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.materia_prima_id_seq', 1, false);


--
-- Name: parametro_sistema_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parametro_sistema_id_seq', 4, true);


--
-- Name: producto_detalle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.producto_detalle_id_seq', 1, false);


--
-- Name: producto_detalle_produccion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.producto_detalle_produccion_id_seq', 1, false);


--
-- Name: producto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.producto_id_seq', 1, false);


--
-- Name: proveedor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proveedor_id_seq', 1, false);


--
-- Name: salida_material_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.salida_material_id_seq', 1, false);


--
-- Name: salida_producto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.salida_producto_id_seq', 1, false);


--
-- Name: solicitud_compra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.solicitud_compra_id_seq', 1, false);


--
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuario_id_seq', 1, false);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- Name: empresa_proveedora empresa_proveedora_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresa_proveedora
    ADD CONSTRAINT empresa_proveedora_pkey PRIMARY KEY (id_fiscal);


--
-- Name: entrada_material entrada_material_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrada_material
    ADD CONSTRAINT entrada_material_pkey PRIMARY KEY (id);


--
-- Name: entrada_producto entrada_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrada_producto
    ADD CONSTRAINT entrada_producto_pkey PRIMARY KEY (id);


--
-- Name: institucion institucion_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.institucion
    ADD CONSTRAINT institucion_nombre_key UNIQUE (nombre);


--
-- Name: institucion institucion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.institucion
    ADD CONSTRAINT institucion_pkey PRIMARY KEY (id);


--
-- Name: kysely_migration kysely_migration_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kysely_migration
    ADD CONSTRAINT kysely_migration_pkey PRIMARY KEY (name);


--
-- Name: materia_prima_auditoria materia_prima_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materia_prima_auditoria
    ADD CONSTRAINT materia_prima_auditoria_pkey PRIMARY KEY (id);


--
-- Name: materia_prima materia_prima_codigo_barras_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materia_prima
    ADD CONSTRAINT materia_prima_codigo_barras_key UNIQUE (codigo_barras);


--
-- Name: materia_prima_migration materia_prima_migration_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materia_prima_migration
    ADD CONSTRAINT materia_prima_migration_pkey PRIMARY KEY (id);


--
-- Name: materia_prima materia_prima_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materia_prima
    ADD CONSTRAINT materia_prima_pkey PRIMARY KEY (id);


--
-- Name: parametro_sistema parametro_sistema_clave_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parametro_sistema
    ADD CONSTRAINT parametro_sistema_clave_key UNIQUE (clave);


--
-- Name: parametro_sistema parametro_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parametro_sistema
    ADD CONSTRAINT parametro_sistema_pkey PRIMARY KEY (id);


--
-- Name: producto producto_codigo_barras_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_codigo_barras_key UNIQUE (codigo_barras);


--
-- Name: producto_detalle producto_detalle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_detalle
    ADD CONSTRAINT producto_detalle_pkey PRIMARY KEY (id);


--
-- Name: producto_detalle_produccion producto_detalle_produccion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_detalle_produccion
    ADD CONSTRAINT producto_detalle_produccion_pkey PRIMARY KEY (id);


--
-- Name: producto producto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (id);


--
-- Name: producto producto_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_sku_key UNIQUE (sku);


--
-- Name: proveedor proveedor_id_fiscal_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedor
    ADD CONSTRAINT proveedor_id_fiscal_key UNIQUE (id_fiscal);


--
-- Name: proveedor proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedor
    ADD CONSTRAINT proveedor_pkey PRIMARY KEY (id);


--
-- Name: salida_material salida_material_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_material
    ADD CONSTRAINT salida_material_pkey PRIMARY KEY (id);


--
-- Name: salida_producto salida_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_producto
    ADD CONSTRAINT salida_producto_pkey PRIMARY KEY (id);


--
-- Name: solicitud_compra solicitud_compra_folio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_folio_key UNIQUE (folio);


--
-- Name: solicitud_compra solicitud_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_pkey PRIMARY KEY (id);


--
-- Name: materia_prima_migration unique_codigo_barras_active; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materia_prima_migration
    ADD CONSTRAINT unique_codigo_barras_active UNIQUE (codigo_barras, activo);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- Name: usuario usuario_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_username_key UNIQUE (username);


--
-- Name: idx_auditoria_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_fecha ON public.auditoria USING btree (fecha_operacion);


--
-- Name: idx_auditoria_tabla; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_tabla ON public.auditoria USING btree (tabla_afectada);


--
-- Name: idx_auditoria_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_usuario ON public.auditoria USING btree (id_usuario);


--
-- Name: idx_entrada_material_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entrada_material_fecha ON public.entrada_material USING btree (fecha_movimiento);


--
-- Name: idx_entrada_material_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entrada_material_institucion ON public.entrada_material USING btree (id_institucion);


--
-- Name: idx_entrada_material_material; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entrada_material_material ON public.entrada_material USING btree (id_material);


--
-- Name: idx_entrada_material_proveedor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entrada_material_proveedor ON public.entrada_material USING btree (id_proveedor);


--
-- Name: idx_entrada_producto_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entrada_producto_fecha ON public.entrada_producto USING btree (fecha_movimiento);


--
-- Name: idx_entrada_producto_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entrada_producto_producto ON public.entrada_producto USING btree (id_producto);


--
-- Name: idx_materia_prima_codigo_barras; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materia_prima_codigo_barras ON public.materia_prima USING btree (codigo_barras);


--
-- Name: idx_materia_prima_estatus; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materia_prima_estatus ON public.materia_prima USING btree (estatus);


--
-- Name: idx_materia_prima_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materia_prima_institucion ON public.materia_prima USING btree (id_institucion);


--
-- Name: idx_materia_prima_migration_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materia_prima_migration_categoria ON public.materia_prima_migration USING btree (categoria) WHERE (activo = true);


--
-- Name: idx_materia_prima_migration_codigo_barras; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materia_prima_migration_codigo_barras ON public.materia_prima_migration USING btree (codigo_barras) WHERE (activo = true);


--
-- Name: idx_materia_prima_migration_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materia_prima_migration_nombre ON public.materia_prima_migration USING btree (nombre) WHERE (activo = true);


--
-- Name: idx_materia_prima_migration_proveedor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materia_prima_migration_proveedor ON public.materia_prima_migration USING btree (proveedor_id) WHERE (activo = true);


--
-- Name: idx_materia_prima_migration_stock_bajo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materia_prima_migration_stock_bajo ON public.materia_prima_migration USING btree (stock_actual, stock_minimo) WHERE (activo = true);


--
-- Name: idx_materia_prima_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materia_prima_nombre ON public.materia_prima USING btree (nombre);


--
-- Name: idx_materia_prima_stock; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materia_prima_stock ON public.materia_prima USING btree (stock) WHERE (stock <= stock_minimo);


--
-- Name: idx_producto_codigo_barras; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_producto_codigo_barras ON public.producto USING btree (codigo_barras);


--
-- Name: idx_producto_estatus; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_producto_estatus ON public.producto USING btree (estatus);


--
-- Name: idx_producto_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_producto_nombre ON public.producto USING btree (nombre);


--
-- Name: idx_producto_sku; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_producto_sku ON public.producto USING btree (sku);


--
-- Name: idx_proveedor_estatus; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_proveedor_estatus ON public.proveedor USING btree (estatus);


--
-- Name: idx_proveedor_id_fiscal; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_proveedor_id_fiscal ON public.proveedor USING btree (id_fiscal);


--
-- Name: idx_proveedor_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_proveedor_nombre ON public.proveedor USING btree (nombre);


--
-- Name: idx_proveedor_rfc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_proveedor_rfc ON public.proveedor USING btree (rfc);


--
-- Name: idx_salida_material_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salida_material_fecha ON public.salida_material USING btree (fecha_movimiento);


--
-- Name: idx_salida_material_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salida_material_institucion ON public.salida_material USING btree (id_institucion);


--
-- Name: idx_salida_material_material; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salida_material_material ON public.salida_material USING btree (id_material);


--
-- Name: idx_salida_material_solicitante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salida_material_solicitante ON public.salida_material USING btree (solicitante);


--
-- Name: idx_salida_producto_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salida_producto_fecha ON public.salida_producto USING btree (fecha_movimiento);


--
-- Name: idx_salida_producto_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salida_producto_producto ON public.salida_producto USING btree (id_producto);


--
-- Name: idx_solicitud_estatus; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_estatus ON public.solicitud_compra USING btree (estatus);


--
-- Name: idx_solicitud_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_fecha ON public.solicitud_compra USING btree (fecha_solicitud);


--
-- Name: idx_solicitud_folio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_folio ON public.solicitud_compra USING btree (folio);


--
-- Name: idx_solicitud_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_institucion ON public.solicitud_compra USING btree (id_institucion);


--
-- Name: idx_solicitud_material; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_material ON public.solicitud_compra USING btree (id_material);


--
-- Name: idx_solicitud_proveedor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_proveedor ON public.solicitud_compra USING btree (id_proveedor);


--
-- Name: entrada_material aud_entrada_material; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER aud_entrada_material AFTER INSERT OR DELETE OR UPDATE ON public.entrada_material FOR EACH ROW EXECUTE FUNCTION public.auditar_cambios();


--
-- Name: materia_prima aud_materia_prima; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER aud_materia_prima AFTER INSERT OR DELETE OR UPDATE ON public.materia_prima FOR EACH ROW EXECUTE FUNCTION public.auditar_cambios();


--
-- Name: proveedor aud_proveedor; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER aud_proveedor AFTER INSERT OR DELETE OR UPDATE ON public.proveedor FOR EACH ROW EXECUTE FUNCTION public.auditar_cambios();


--
-- Name: salida_material aud_salida_material; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER aud_salida_material AFTER INSERT OR DELETE OR UPDATE ON public.salida_material FOR EACH ROW EXECUTE FUNCTION public.auditar_cambios();


--
-- Name: solicitud_compra trg_solicitud_compra_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_solicitud_compra_timestamp BEFORE UPDATE ON public.solicitud_compra FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();


--
-- Name: materia_prima_migration trigger_materia_prima_actualizado_en; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_materia_prima_actualizado_en BEFORE UPDATE ON public.materia_prima_migration FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();


--
-- Name: auditoria auditoria_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id);


--
-- Name: entrada_material entrada_material_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrada_material
    ADD CONSTRAINT entrada_material_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- Name: entrada_material entrada_material_id_material_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrada_material
    ADD CONSTRAINT entrada_material_id_material_fkey FOREIGN KEY (id_material) REFERENCES public.materia_prima(id);


--
-- Name: entrada_material entrada_material_id_proveedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrada_material
    ADD CONSTRAINT entrada_material_id_proveedor_fkey FOREIGN KEY (id_proveedor) REFERENCES public.proveedor(id);


--
-- Name: entrada_material entrada_material_id_solicitud_compra_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrada_material
    ADD CONSTRAINT entrada_material_id_solicitud_compra_fkey FOREIGN KEY (id_solicitud_compra) REFERENCES public.solicitud_compra(id);


--
-- Name: entrada_material entrada_material_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrada_material
    ADD CONSTRAINT entrada_material_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id);


--
-- Name: entrada_producto entrada_producto_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrada_producto
    ADD CONSTRAINT entrada_producto_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id);


--
-- Name: entrada_producto entrada_producto_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrada_producto
    ADD CONSTRAINT entrada_producto_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id);


--
-- Name: materia_prima materia_prima_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materia_prima
    ADD CONSTRAINT materia_prima_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- Name: parametro_sistema parametro_sistema_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parametro_sistema
    ADD CONSTRAINT parametro_sistema_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- Name: producto_detalle producto_detalle_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_detalle
    ADD CONSTRAINT producto_detalle_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id) ON DELETE CASCADE;


--
-- Name: producto_detalle_produccion producto_detalle_produccion_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_detalle_produccion
    ADD CONSTRAINT producto_detalle_produccion_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id) ON DELETE CASCADE;


--
-- Name: producto producto_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- Name: proveedor proveedor_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedor
    ADD CONSTRAINT proveedor_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- Name: salida_material salida_material_autorizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_material
    ADD CONSTRAINT salida_material_autorizado_por_fkey FOREIGN KEY (autorizado_por) REFERENCES public.usuario(id);


--
-- Name: salida_material salida_material_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_material
    ADD CONSTRAINT salida_material_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- Name: salida_material salida_material_id_material_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_material
    ADD CONSTRAINT salida_material_id_material_fkey FOREIGN KEY (id_material) REFERENCES public.materia_prima(id);


--
-- Name: salida_material salida_material_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_material
    ADD CONSTRAINT salida_material_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id);


--
-- Name: salida_producto salida_producto_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_producto
    ADD CONSTRAINT salida_producto_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- Name: salida_producto salida_producto_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_producto
    ADD CONSTRAINT salida_producto_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id);


--
-- Name: salida_producto salida_producto_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salida_producto
    ADD CONSTRAINT salida_producto_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id);


--
-- Name: solicitud_compra solicitud_compra_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- Name: solicitud_compra solicitud_compra_id_material_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_id_material_fkey FOREIGN KEY (id_material) REFERENCES public.materia_prima(id);


--
-- Name: solicitud_compra solicitud_compra_id_proveedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_id_proveedor_fkey FOREIGN KEY (id_proveedor) REFERENCES public.proveedor(id);


--
-- Name: solicitud_compra solicitud_compra_id_usuario_autorizo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_id_usuario_autorizo_fkey FOREIGN KEY (id_usuario_autorizo) REFERENCES public.usuario(id);


--
-- Name: solicitud_compra solicitud_compra_id_usuario_solicitante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_compra
    ADD CONSTRAINT solicitud_compra_id_usuario_solicitante_fkey FOREIGN KEY (id_usuario_solicitante) REFERENCES public.usuario(id);


--
-- Name: usuario usuario_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.institucion(id);


--
-- PostgreSQL database dump complete
--

\unrestrict YONeT2NZCnx1DjsV8u6OKicey7DTGB72rgbdEPzR2ZhYgSE9Cad4HdYQxkwQjhq

