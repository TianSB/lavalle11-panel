-- ============================================================
-- 011_configuracion.sql
-- Tabla: configuracion (caché de Google Sheets)
-- Seed data con configuración inicial del sistema
-- ============================================================
-- Depende de: sin dependencias de FK
-- ============================================================

CREATE TABLE public.configuracion (
    clave       VARCHAR(50)     PRIMARY KEY,
    valor       JSONB           NOT NULL,
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Seed data: configuración inicial del sistema
INSERT INTO public.configuracion (clave, valor) VALUES
-- Prácticas no realizadas en el instituto (BR-04)
('practicas_no_disponibles', '[
    "Resonancia magnética",
    "Histerosalpingografía",
    "Electromiografía",
    "Polisomnografía",
    "Endoscopía alta",
    "Endoscopía baja",
    "Colonoscopía",
    "Tomografía de senos paranasales"
]'::JSONB),

-- Estudios que se resuelven automáticamente sin turno previo (BR-02)
('estudios_sin_turno', '[
    "Radiografía",
    "Panorámica dental",
    "TAC Cone Beam"
]'::JSONB),

-- Prácticas de Medicina Nuclear que se derivan a Chiclana (BR-03)
('practicas_chiclana', '[
    "PET CT",
    "SPECT CT",
    "Centellograma",
    "Perfusión miocárdica",
    "Cámara Gamma",
    "Gammagrafía"
]'::JSONB),

-- Obras sociales con sus reglas de cobertura (BR-01)
('obras_sociales', '[
    {
        "nombre": "IOMA",
        "requiere_copago": true,
        "monto_copago": 500,
        "requiere_llamada": false,
        "requiere_autorizacion": true,
        "codigo_femeba": "disponible",
        "notas": "Token obligatorio desde app IOMA"
    },
    {
        "nombre": "PAMI",
        "requiere_copago": true,
        "monto_copago": 300,
        "requiere_llamada": true,
        "requiere_autorizacion": true,
        "codigo_femeba": "no_disponible",
        "notas": "Llamar para verificar cobertura"
    },
    {
        "nombre": "OSDE",
        "requiere_copago": false,
        "monto_copago": null,
        "requiere_llamada": false,
        "requiere_autorizacion": false,
        "codigo_femeba": "no_aplica",
        "notas": null
    },
    {
        "nombre": "Particular",
        "requiere_copago": false,
        "monto_copago": null,
        "requiere_llamada": false,
        "requiere_autorizacion": false,
        "codigo_femeba": "no_aplica",
        "notas": "Pago en efectivo o transferencia"
    },
    {
        "nombre": "Swiss Medical",
        "requiere_copago": false,
        "monto_copago": null,
        "requiere_llamada": false,
        "requiere_autorizacion": true,
        "codigo_femeba": "disponible",
        "notas": null
    },
    {
        "nombre": "Sancor Salud",
        "requiere_copago": false,
        "monto_copago": null,
        "requiere_llamada": false,
        "requiere_autorizacion": true,
        "codigo_femeba": "disponible",
        "notas": null
    }
]'::JSONB),

-- Precios de estudios (vigencia mensual, BR-08)
('precios', '[
    {
        "practica": "Ecografía abdominal",
        "precio_transferencia": 8000,
        "precio_efectivo": 7000,
        "vigencia": "Junio 2026"
    },
    {
        "practica": "Ecografía mamaria bilateral",
        "precio_transferencia": 9000,
        "precio_efectivo": 7800,
        "vigencia": "Junio 2026"
    },
    {
        "practica": "Mamografía bilateral",
        "precio_transferencia": 10000,
        "precio_efectivo": 8500,
        "vigencia": "Junio 2026"
    },
    {
        "practica": "Densitometría ósea",
        "precio_transferencia": 7000,
        "precio_efectivo": 6000,
        "vigencia": "Junio 2026"
    },
    {
        "practica": "Radiografía de tórax",
        "precio_transferencia": 3000,
        "precio_efectivo": 2500,
        "vigencia": "Junio 2026"
    },
    {
        "practica": "TAC Cone Beam dental",
        "precio_transferencia": 12000,
        "precio_efectivo": 10000,
        "vigencia": "Junio 2026"
    },
    {
        "practica": "Panorámica dental",
        "precio_transferencia": 5000,
        "precio_efectivo": 4000,
        "vigencia": "Junio 2026"
    },
    {
        "practica": "Ecocardiograma",
        "precio_transferencia": 12000,
        "precio_efectivo": 10000,
        "vigencia": "Junio 2026"
    },
    {
        "practica": "Punción de tiroides",
        "precio_transferencia": 25000,
        "precio_efectivo": 22000,
        "vigencia": "Junio 2026"
    }
]'::JSONB)
ON CONFLICT (clave) DO NOTHING;
