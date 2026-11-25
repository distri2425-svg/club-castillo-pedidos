/**
 * Armado del libro de Excel del modulo de reportes del propietario.
 *
 * La construccion de las hojas se mantiene separada del componente de React
 * para que dependa unicamente de los datos que recibe, sin tocar el estado ni
 * el navegador, lo que permite verificarla de forma independiente.
 */

import { descargarLibro, serieFecha, type Fila, type Hoja } from './xlsx';

// ─── Datos de entrada ────────────────────────────────────────────────────────

export interface VentaPorRestaurante {
    id: number;
    name: string;
    status: 'OPEN' | 'CLOSED';
    totalOrders: number;
    totalRevenue: number;
    averageTicket: number;
}

export interface PedidoDetallado {
    id: number;
    restaurantName: string;
    customerName?: string;
    status: string;
    total: number;
    isGuest: boolean;
    createdAt?: string;
}

export interface UsuarioAuditado {
    id: number;
    email: string;
    fullName: string;
    roleName: string;
    consentGiven: boolean;
    consentDateRaw?: string;
    active: boolean;
}

export interface DatosReporte {
    rango: 'all' | 'today' | 'month';
    generado: Date;
    ventas: VentaPorRestaurante[];
    pedidos: PedidoDetallado[];
    usuarios: UsuarioAuditado[];
    totalVentas: number;
    totalPedidos: number;
}

// ─── Etiquetas ───────────────────────────────────────────────────────────────

export const ETIQUETA_ESTADO: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    PREPARING: 'En preparación',
    READY: 'Listo para entrega',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
};

export const ETIQUETA_RANGO: Record<string, string> = {
    all: 'Histórico completo',
    today: 'Movimientos del día',
    month: 'Mes en curso',
};

// ─── Apoyos de presentacion ──────────────────────────────────────────────────

/** Barra proporcional dibujada con bloques, para leer el peso relativo. */
function barra(proporcion: number): string {
    const valor = Number.isFinite(proporcion) ? proporcion : 0;
    return '█'.repeat(Math.max(0, Math.min(20, Math.round(valor * 20))));
}

/** Banda de titulo que separa cada bloque de la hoja de resumen. */
function seccion(titulo: string, columnas = 5): Fila {
    return Array.from({ length: columnas }, (_, i) => ({
        v: i === 0 ? titulo : '',
        e: 'seccion' as const,
    }));
}

// ─── Construccion de las hojas ───────────────────────────────────────────────

export function construirHojasReporte(datos: DatosReporte): Hoja[] {
    const { generado, ventas, pedidos, usuarios, totalVentas, totalPedidos } = datos;

    const rotulo = ETIQUETA_RANGO[datos.rango] ?? 'Histórico completo';
    // Un pedido cancelado se cuenta como registrado, pero no es venta: no suma
    // al ingreso ni entra en el ticket promedio. totalVentas ya llega sin ellos.
    const esVenta = (pedido: PedidoDetallado) => pedido.status !== 'CANCELLED';
    const pedidosValidos = pedidos.filter(esVenta).length;
    const ticketPromedio = pedidosValidos > 0 ? totalVentas / pedidosValidos : 0;
    const abiertos = ventas.filter((r) => r.status === 'OPEN').length;
    const consentidos = usuarios.filter((u) => u.consentGiven).length;
    const coberturaConsentimiento = usuarios.length > 0 ? consentidos / usuarios.length : 0;

    // Agrupaciones que alimentan el tablero.
    const porEstado = new Map<string, { pedidos: number; ventas: number }>();
    const porDia = new Map<string, { pedidos: number; validos: number; ventas: number }>();
    let pedidosInvitado = 0;
    let ventasInvitado = 0;

    pedidos.forEach((pedido) => {
        const importe = Number(pedido.total) || 0;
        const venta = esVenta(pedido) ? importe : 0;

        const estado = porEstado.get(pedido.status) ?? { pedidos: 0, ventas: 0 };
        estado.pedidos += 1;
        estado.ventas += importe;
        porEstado.set(pedido.status, estado);

        if (pedido.createdAt) {
            const fecha = new Date(pedido.createdAt);
            if (!Number.isNaN(fecha.getTime())) {
                const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
                const dia = porDia.get(clave) ?? { pedidos: 0, validos: 0, ventas: 0 };
                dia.pedidos += 1;
                if (esVenta(pedido)) dia.validos += 1;
                dia.ventas += venta;
                porDia.set(clave, dia);
            }
        }

        if (pedido.isGuest) {
            pedidosInvitado += 1;
            ventasInvitado += venta;
        }
    });

    const ordenados = [...ventas].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const lider = ordenados[0];
    const pedidosSocio = totalPedidos - pedidosInvitado;
    const ventasSocio = totalVentas - ventasInvitado;

    // ── Hoja 1: resumen ejecutivo ────────────────────────────────────
    const resumen: Fila[] = [
        [{ v: 'CLUB CAMPESTRE CASTILLO DE AMAGUAÑA', e: 'titulo' }],
        [{ v: `Reporte de operación · ${rotulo}`, e: 'subtitulo' }],
        [
            {
                v: `Generado el ${generado.toLocaleDateString('es-EC')} a las ${generado.toLocaleTimeString('es-EC')} · Datos tomados de la base del sistema`,
                e: 'subtitulo',
            },
        ],
        [],
        seccion('INDICADORES GENERALES'),
        [
            { v: 'Ventas del período', e: 'etiquetaKpi' },
            { v: totalVentas, e: 'kpiMoneda' },
            { v: '', e: 'etiquetaKpi' },
            { v: 'Pedidos registrados', e: 'etiquetaKpi' },
            { v: totalPedidos, e: 'kpiNumero' },
        ],
        [
            { v: 'Ticket promedio', e: 'etiquetaKpi' },
            { v: ticketPromedio, e: 'kpiMoneda' },
            { v: '', e: 'etiquetaKpi' },
            { v: 'Restaurantes en servicio', e: 'etiquetaKpi' },
            { v: `${abiertos} de ${ventas.length}`, e: 'kpiTexto' },
        ],
        [
            { v: 'Usuarios registrados', e: 'etiquetaKpi' },
            { v: usuarios.length, e: 'kpiNumero' },
            { v: '', e: 'etiquetaKpi' },
            { v: 'Unidad con mayor venta', e: 'etiquetaKpi' },
            { v: lider ? lider.name : 'Sin movimientos', e: 'kpiTexto' },
        ],
        [],
        seccion('VENTAS POR RESTAURANTE'),
        [
            { v: 'Restaurante', e: 'encabezado' },
            { v: 'Pedidos', e: 'encabezado' },
            { v: 'Ventas', e: 'encabezado' },
            { v: 'Participación', e: 'encabezado' },
            { v: 'Peso relativo', e: 'encabezado' },
        ],
    ];

    if (ordenados.length === 0) {
        resumen.push([{ v: 'Sin restaurantes registrados', e: 'textoTenue' }]);
    }

    ordenados.forEach((r) => {
        const participacion = totalVentas > 0 ? r.totalRevenue / totalVentas : 0;
        resumen.push([
            { v: r.name, e: 'texto' },
            { v: r.totalOrders, e: 'numero' },
            { v: r.totalRevenue, e: 'moneda' },
            { v: participacion, e: 'porcentaje' },
            { v: barra(participacion), e: 'texto' },
        ]);
    });

    resumen.push([
        { v: 'TOTAL', e: 'total' },
        { v: totalPedidos, e: 'totalNumero' },
        { v: totalVentas, e: 'totalMoneda' },
        { v: totalVentas > 0 ? 1 : 0, e: 'totalPorcentaje' },
        { v: '', e: 'total' },
    ]);

    resumen.push([], seccion('ESTADO DE LOS PEDIDOS'), [
        { v: 'Estado', e: 'encabezado' },
        { v: 'Pedidos', e: 'encabezado' },
        // Importe y no "Ventas": incluye el de los cancelados, que no es venta
        { v: 'Importe', e: 'encabezado' },
        { v: 'Proporción', e: 'encabezado' },
        { v: 'Peso relativo', e: 'encabezado' },
    ]);

    if (porEstado.size === 0) {
        resumen.push([{ v: 'Sin pedidos en el período seleccionado', e: 'textoTenue' }]);
    }

    [...porEstado.entries()]
        .sort((a, b) => b[1].pedidos - a[1].pedidos)
        .forEach(([estado, valores]) => {
            const proporcion = totalPedidos > 0 ? valores.pedidos / totalPedidos : 0;
            resumen.push([
                { v: ETIQUETA_ESTADO[estado] ?? estado, e: 'texto' },
                { v: valores.pedidos, e: 'numero' },
                { v: valores.ventas, e: 'moneda' },
                { v: proporcion, e: 'porcentaje' },
                { v: barra(proporcion), e: 'texto' },
            ]);
        });

    resumen.push(
        [],
        seccion('ORIGEN DEL PEDIDO'),
        [
            { v: 'Tipo de usuario', e: 'encabezado' },
            { v: 'Pedidos', e: 'encabezado' },
            { v: 'Ventas', e: 'encabezado' },
            { v: 'Proporción', e: 'encabezado' },
            { v: 'Peso relativo', e: 'encabezado' },
        ],
        [
            { v: 'Socio registrado', e: 'texto' },
            { v: pedidosSocio, e: 'numero' },
            { v: ventasSocio, e: 'moneda' },
            { v: totalPedidos > 0 ? pedidosSocio / totalPedidos : 0, e: 'porcentaje' },
            { v: barra(totalPedidos > 0 ? pedidosSocio / totalPedidos : 0), e: 'texto' },
        ],
        [
            { v: 'Invitado mediante código QR', e: 'texto' },
            { v: pedidosInvitado, e: 'numero' },
            { v: ventasInvitado, e: 'moneda' },
            { v: totalPedidos > 0 ? pedidosInvitado / totalPedidos : 0, e: 'porcentaje' },
            { v: barra(totalPedidos > 0 ? pedidosInvitado / totalPedidos : 0), e: 'texto' },
        ],
        [],
        seccion('CUMPLIMIENTO DE LA LOPDP'),
        [
            { v: 'Usuarios con consentimiento otorgado', e: 'etiquetaKpi' },
            { v: consentidos, e: 'kpiNumero' },
            { v: '', e: 'etiquetaKpi' },
            { v: 'Cobertura del consentimiento', e: 'etiquetaKpi' },
            { v: coberturaConsentimiento, e: 'totalPorcentaje' },
        ],
        [
            { v: 'Usuarios sin consentimiento registrado', e: 'etiquetaKpi' },
            { v: usuarios.length - consentidos, e: 'kpiNumero' },
            { v: '', e: 'etiquetaKpi' },
            { v: 'Detalle', e: 'etiquetaKpi' },
            { v: 'Ver la hoja Auditoría LOPDP', e: 'kpiTexto' },
        ]
    );

    // ── Hoja 2: ventas por restaurante ───────────────────────────────
    const hojaVentas: Fila[] = [
        [
            { v: 'ID', e: 'encabezado' },
            { v: 'Restaurante', e: 'encabezado' },
            { v: 'Estado', e: 'encabezado' },
            { v: 'Pedidos', e: 'encabezado' },
            { v: 'Ventas', e: 'encabezado' },
            { v: 'Ticket promedio', e: 'encabezado' },
            { v: 'Participación', e: 'encabezado' },
        ],
        ...ordenados.map((r): Fila => [
            { v: r.id, e: 'numero' },
            { v: r.name, e: 'texto' },
            {
                v: r.status === 'OPEN' ? 'Abierto' : 'Cerrado',
                e: r.status === 'OPEN' ? 'positivo' : 'negativo',
            },
            { v: r.totalOrders, e: 'numero' },
            { v: r.totalRevenue, e: 'moneda' },
            { v: r.averageTicket, e: 'moneda' },
            { v: totalVentas > 0 ? r.totalRevenue / totalVentas : 0, e: 'porcentaje' },
        ]),
        [
            { v: '', e: 'total' },
            { v: 'TOTAL GENERAL', e: 'total' },
            { v: '', e: 'total' },
            { v: totalPedidos, e: 'totalNumero' },
            { v: totalVentas, e: 'totalMoneda' },
            { v: ticketPromedio, e: 'totalMoneda' },
            { v: totalVentas > 0 ? 1 : 0, e: 'totalPorcentaje' },
        ],
    ];

    // ── Hoja 3: detalle de pedidos ───────────────────────────────────
    const detalle: Fila[] = [
        [
            { v: 'Pedido', e: 'encabezado' },
            { v: 'Fecha', e: 'encabezado' },
            { v: 'Restaurante', e: 'encabezado' },
            { v: 'Cliente', e: 'encabezado' },
            { v: 'Tipo', e: 'encabezado' },
            { v: 'Estado', e: 'encabezado' },
            { v: 'Total', e: 'encabezado' },
        ],
        ...pedidos.map((pedido): Fila => [
            { v: pedido.id, e: 'numero' },
            pedido.createdAt && !Number.isNaN(new Date(pedido.createdAt).getTime())
                ? { v: serieFecha(new Date(pedido.createdAt)), e: 'fecha' }
                : { v: 'Sin registro', e: 'textoTenue' },
            { v: pedido.restaurantName, e: 'texto' },
            { v: pedido.customerName || 'No identificado', e: 'texto' },
            { v: pedido.isGuest ? 'Invitado' : 'Socio', e: 'texto' },
            { v: ETIQUETA_ESTADO[pedido.status] ?? pedido.status, e: 'texto' },
            { v: Number(pedido.total) || 0, e: 'moneda' },
        ]),
    ];

    if (pedidos.length === 0) {
        detalle.push([{ v: 'Sin pedidos en el período seleccionado', e: 'textoTenue' }]);
    } else {
        detalle.push([
            { v: '', e: 'total' },
            { v: '', e: 'total' },
            { v: '', e: 'total' },
            { v: '', e: 'total' },
            { v: '', e: 'total' },
            { v: 'VENTAS (sin cancelados)', e: 'total' },
            { v: totalVentas, e: 'totalMoneda' },
        ]);
    }

    // ── Hoja 4: evolucion diaria ─────────────────────────────────────
    const evolucion: Fila[] = [
        [
            { v: 'Fecha', e: 'encabezado' },
            { v: 'Pedidos', e: 'encabezado' },
            { v: 'Ventas', e: 'encabezado' },
            { v: 'Ticket promedio', e: 'encabezado' },
            { v: 'Peso relativo', e: 'encabezado' },
        ],
        ...[...porDia.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([clave, valores]): Fila => {
                const [anio, mes, dia] = clave.split('-').map(Number);
                return [
                    { v: serieFecha(new Date(anio, mes - 1, dia)), e: 'fechaCorta' },
                    { v: valores.pedidos, e: 'numero' },
                    { v: valores.ventas, e: 'moneda' },
                    { v: valores.validos > 0 ? valores.ventas / valores.validos : 0, e: 'moneda' },
                    { v: barra(totalVentas > 0 ? valores.ventas / totalVentas : 0), e: 'texto' },
                ];
            }),
    ];

    if (porDia.size === 0) {
        evolucion.push([{ v: 'Sin pedidos con fecha registrada', e: 'textoTenue' }]);
    }

    // ── Hoja 5: auditoria de consentimientos ─────────────────────────
    const auditoria: Fila[] = [
        [
            { v: 'ID', e: 'encabezado' },
            { v: 'Usuario', e: 'encabezado' },
            { v: 'Correo electrónico', e: 'encabezado' },
            { v: 'Rol', e: 'encabezado' },
            { v: 'Consentimiento', e: 'encabezado' },
            { v: 'Fecha del consentimiento', e: 'encabezado' },
            { v: 'Cuenta', e: 'encabezado' },
        ],
        ...usuarios.map((usuario): Fila => [
            { v: usuario.id, e: 'numero' },
            { v: usuario.fullName, e: 'texto' },
            { v: usuario.email, e: 'texto' },
            { v: usuario.roleName, e: 'texto' },
            {
                v: usuario.consentGiven ? 'Otorgado' : 'No registrado',
                e: usuario.consentGiven ? 'positivo' : 'negativo',
            },
            usuario.consentDateRaw && !Number.isNaN(new Date(usuario.consentDateRaw).getTime())
                ? { v: serieFecha(new Date(usuario.consentDateRaw)), e: 'fecha' }
                : { v: 'Sin fecha', e: 'textoTenue' },
            {
                v: usuario.active ? 'Activa' : 'Dada de baja',
                e: usuario.active ? 'texto' : 'textoTenue',
            },
        ]),
        [
            { v: '', e: 'total' },
            { v: 'TOTAL DE USUARIOS', e: 'total' },
            { v: usuarios.length, e: 'totalNumero' },
            { v: 'Con consentimiento', e: 'total' },
            { v: consentidos, e: 'totalNumero' },
            { v: coberturaConsentimiento, e: 'totalPorcentaje' },
            { v: '', e: 'total' },
        ],
    ];

    return [
        {
            nombre: 'Resumen',
            filas: resumen,
            anchos: [38, 14, 16, 16, 26],
            congelar: 4,
            combinar: ['A1:E1', 'A2:E2', 'A3:E3'],
        },
        {
            nombre: 'Ventas por restaurante',
            filas: hojaVentas,
            anchos: [8, 34, 14, 12, 16, 18, 16],
            congelar: 1,
        },
        {
            nombre: 'Detalle de pedidos',
            filas: detalle,
            anchos: [10, 20, 30, 28, 14, 20, 14],
            congelar: 1,
        },
        {
            nombre: 'Evolución diaria',
            filas: evolucion,
            anchos: [16, 12, 16, 18, 26],
            congelar: 1,
        },
        {
            nombre: 'Auditoría LOPDP',
            filas: auditoria,
            anchos: [8, 28, 34, 20, 18, 24, 16],
            congelar: 1,
        },
    ];
}

/** Genera el libro y lo entrega al navegador como descarga. */
export function descargarReporteExcel(datos: DatosReporte): void {
    const fecha = datos.generado.toISOString().slice(0, 10);
    descargarLibro(`reporte-castillo-${datos.rango}-${fecha}.xlsx`, construirHojasReporte(datos));
}
