/**
 * Generador de libros de Excel (.xlsx) sin dependencias externas.
 *
 * Un archivo .xlsx es un contenedor ZIP con documentos XML en su interior, de
 * modo que aqui se construyen ambas piezas: el empaquetado ZIP (con el metodo
 * de almacenamiento directo, sin compresion) y las hojas, los estilos y el
 * libro en formato SpreadsheetML. Se evita asi incorporar una libreria de
 * terceros al proyecto y se obtiene un archivo que Microsoft Excel, LibreOffice
 * Calc y Google Sheets abren de forma nativa.
 */

// ─── Tipos publicos ──────────────────────────────────────────────────────────

/** Estilos disponibles para una celda. El indice real se resuelve en cellXfs. */
export type Estilo =
    | 'titulo'
    | 'subtitulo'
    | 'seccion'
    | 'encabezado'
    | 'texto'
    | 'textoTenue'
    | 'numero'
    | 'moneda'
    | 'porcentaje'
    | 'fecha'
    | 'fechaCorta'
    | 'etiquetaKpi'
    | 'kpiMoneda'
    | 'kpiNumero'
    | 'kpiTexto'
    | 'total'
    | 'totalNumero'
    | 'totalMoneda'
    | 'totalPorcentaje'
    | 'positivo'
    | 'negativo';

export type Valor = string | number | boolean | null | undefined;

export interface Celda {
    v: Valor;
    e?: Estilo;
}

export type Fila = (Valor | Celda)[];

export interface Hoja {
    /** Nombre de la pestaña. Excel lo limita a 31 caracteres. */
    nombre: string;
    filas: Fila[];
    /** Ancho de cada columna, en caracteres. */
    anchos?: number[];
    /** Numero de filas superiores que quedan fijas al desplazarse. */
    congelar?: number;
    /** Rangos combinados, por ejemplo "A1:F1". */
    combinar?: string[];
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const INDICE_ESTILO: Record<Estilo, number> = {
    titulo: 1,
    subtitulo: 2,
    seccion: 3,
    encabezado: 4,
    texto: 5,
    textoTenue: 6,
    numero: 7,
    moneda: 8,
    porcentaje: 9,
    fecha: 10,
    fechaCorta: 21,
    etiquetaKpi: 11,
    kpiMoneda: 12,
    kpiNumero: 13,
    kpiTexto: 14,
    total: 15,
    totalNumero: 16,
    totalMoneda: 17,
    totalPorcentaje: 18,
    positivo: 19,
    negativo: 20,
};

const ESTILOS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="5">
<numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00"/>
<numFmt numFmtId="165" formatCode="0.0%"/>
<numFmt numFmtId="166" formatCode="dd/mm/yyyy\\ hh:mm"/>
<numFmt numFmtId="167" formatCode="#,##0"/>
<numFmt numFmtId="168" formatCode="dd/mm/yyyy"/>
</numFmts>
<fonts count="9">
<font><sz val="11"/><color rgb="FF1F2937"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFF89B01"/><name val="Calibri"/></font>
<font><b/><sz val="18"/><color rgb="FF181818"/><name val="Calibri"/></font>
<font><sz val="10"/><color rgb="FF6B7280"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF181818"/><name val="Calibri"/></font>
<font><b/><sz val="16"/><color rgb="FF181818"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF166534"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF991B1B"/><name val="Calibri"/></font>
<font><b/><sz val="12"/><color rgb="FF181818"/><name val="Calibri"/></font>
</fonts>
<fills count="8">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF181818"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF89B01"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF3F4F6"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF7ED"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFDCFCE7"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border>
<left style="thin"><color rgb="FFD1D5DB"/></left>
<right style="thin"><color rgb="FFD1D5DB"/></right>
<top style="thin"><color rgb="FFD1D5DB"/></top>
<bottom style="thin"><color rgb="FFD1D5DB"/></bottom>
<diagonal/>
</border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="22">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="8" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
<xf numFmtId="167" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="164" fontId="5" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="167" fontId="5" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="5" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="167" fontId="4" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="164" fontId="4" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="165" fontId="4" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="6" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="7" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="168" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

// ─── Utilidades de XML y de celdas ───────────────────────────────────────────

function escapar(texto: string): string {
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        // Excel rechaza los caracteres de control en el XML de la hoja.
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

/** Convierte un indice de columna (0) en su letra (A, B, ... AA). */
export function letraColumna(indice: number): string {
    let letra = '';
    let n = indice;
    while (n >= 0) {
        letra = String.fromCharCode((n % 26) + 65) + letra;
        n = Math.floor(n / 26) - 1;
    }
    return letra;
}

/**
 * Convierte una fecha al numero de serie que utiliza Excel, que cuenta los dias
 * transcurridos desde el 30 de diciembre de 1899. La fecha se toma en hora
 * local para que coincida con lo que muestra la aplicacion.
 */
export function serieFecha(fecha: Date): number {
    const utc = Date.UTC(
        fecha.getFullYear(),
        fecha.getMonth(),
        fecha.getDate(),
        fecha.getHours(),
        fecha.getMinutes(),
        fecha.getSeconds()
    );
    return utc / 86400000 + 25569;
}

function normalizar(celda: Valor | Celda): Celda {
    if (celda !== null && typeof celda === 'object') return celda as Celda;
    return { v: celda as Valor };
}

function celdaXml(referencia: string, celda: Celda): string {
    const estilo = celda.e ? ` s="${INDICE_ESTILO[celda.e]}"` : '';
    const valor = celda.v;

    if (valor === null || valor === undefined || valor === '') {
        return `<c r="${referencia}"${estilo}/>`;
    }
    if (typeof valor === 'number' && Number.isFinite(valor)) {
        return `<c r="${referencia}"${estilo}><v>${valor}</v></c>`;
    }
    if (typeof valor === 'boolean') {
        return `<c r="${referencia}"${estilo} t="b"><v>${valor ? 1 : 0}</v></c>`;
    }
    return `<c r="${referencia}"${estilo} t="inlineStr"><is><t xml:space="preserve">${escapar(String(valor))}</t></is></c>`;
}

function hojaXml(hoja: Hoja): string {
    const vista = hoja.congelar
        ? `<sheetView showGridLines="0" workbookViewId="0"><pane ySplit="${hoja.congelar}" topLeftCell="A${hoja.congelar + 1}" activePane="bottomLeft" state="frozen"/></sheetView>`
        : '<sheetView showGridLines="0" workbookViewId="0"/>';

    const columnas = hoja.anchos?.length
        ? `<cols>${hoja.anchos
              .map((ancho, i) => `<col min="${i + 1}" max="${i + 1}" width="${ancho}" customWidth="1"/>`)
              .join('')}</cols>`
        : '';

    const filas = hoja.filas
        .map((fila, indiceFila) => {
            const numero = indiceFila + 1;
            const celdas = fila
                .map((celda, indiceColumna) =>
                    celdaXml(`${letraColumna(indiceColumna)}${numero}`, normalizar(celda))
                )
                .join('');
            return `<row r="${numero}">${celdas}</row>`;
        })
        .join('');

    const combinadas = hoja.combinar?.length
        ? `<mergeCells count="${hoja.combinar.length}">${hoja.combinar
              .map((rango) => `<mergeCell ref="${rango}"/>`)
              .join('')}</mergeCells>`
        : '';

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews>${vista}</sheetViews><sheetFormatPr defaultRowHeight="15"/>${columnas}<sheetData>${filas}</sheetData>${combinadas}</worksheet>`;
}

/** Excel rechaza algunos caracteres en el nombre de la pestaña y la limita a 31. */
function nombreValido(nombre: string): string {
    return nombre.replace(/[\\/:*?[\]]/g, '-').slice(0, 31) || 'Hoja';
}

// ─── Empaquetado ZIP ─────────────────────────────────────────────────────────

const TABLA_CRC = (() => {
    const tabla = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        tabla[i] = c >>> 0;
    }
    return tabla;
})();

function crc32(datos: Uint8Array): number {
    let c = 0xffffffff;
    for (let i = 0; i < datos.length; i++) {
        c = TABLA_CRC[(c ^ datos[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
}

interface Entrada {
    nombre: string;
    datos: Uint8Array;
}

/**
 * Arma el contenedor ZIP. Los archivos se almacenan sin comprimir (metodo 0),
 * lo que mantiene el codigo acotado; el tamaño resultante es adecuado porque el
 * contenido son documentos XML de pocos cientos de kilobytes.
 */
function empaquetar(entradas: Entrada[]): Uint8Array {
    const codificador = new TextEncoder();
    const ahora = new Date();
    const hora =
        (ahora.getHours() << 11) | (ahora.getMinutes() << 5) | Math.floor(ahora.getSeconds() / 2);
    const fecha =
        ((ahora.getFullYear() - 1980) << 9) | ((ahora.getMonth() + 1) << 5) | ahora.getDate();

    const locales: Uint8Array[] = [];
    const centrales: Uint8Array[] = [];
    let desplazamiento = 0;

    for (const entrada of entradas) {
        const nombre = codificador.encode(entrada.nombre);
        const suma = crc32(entrada.datos);

        const cabecera = new Uint8Array(30 + nombre.length);
        const vista = new DataView(cabecera.buffer);
        vista.setUint32(0, 0x04034b50, true);
        vista.setUint16(4, 20, true);
        vista.setUint16(6, 0x0800, true); // nombres en UTF-8
        vista.setUint16(8, 0, true); // sin compresion
        vista.setUint16(10, hora, true);
        vista.setUint16(12, fecha, true);
        vista.setUint32(14, suma, true);
        vista.setUint32(18, entrada.datos.length, true);
        vista.setUint32(22, entrada.datos.length, true);
        vista.setUint16(26, nombre.length, true);
        vista.setUint16(28, 0, true);
        cabecera.set(nombre, 30);

        locales.push(cabecera, entrada.datos);

        const central = new Uint8Array(46 + nombre.length);
        const vistaCentral = new DataView(central.buffer);
        vistaCentral.setUint32(0, 0x02014b50, true);
        vistaCentral.setUint16(4, 20, true);
        vistaCentral.setUint16(6, 20, true);
        vistaCentral.setUint16(8, 0x0800, true);
        vistaCentral.setUint16(10, 0, true);
        vistaCentral.setUint16(12, hora, true);
        vistaCentral.setUint16(14, fecha, true);
        vistaCentral.setUint32(16, suma, true);
        vistaCentral.setUint32(20, entrada.datos.length, true);
        vistaCentral.setUint32(24, entrada.datos.length, true);
        vistaCentral.setUint16(28, nombre.length, true);
        vistaCentral.setUint32(42, desplazamiento, true);
        central.set(nombre, 46);
        centrales.push(central);

        desplazamiento += cabecera.length + entrada.datos.length;
    }

    const tamanoCentral = centrales.reduce((total, bloque) => total + bloque.length, 0);
    const fin = new Uint8Array(22);
    const vistaFin = new DataView(fin.buffer);
    vistaFin.setUint32(0, 0x06054b50, true);
    vistaFin.setUint16(8, entradas.length, true);
    vistaFin.setUint16(10, entradas.length, true);
    vistaFin.setUint32(12, tamanoCentral, true);
    vistaFin.setUint32(16, desplazamiento, true);

    const bloques = [...locales, ...centrales, fin];
    const total = bloques.reduce((suma, bloque) => suma + bloque.length, 0);
    const salida = new Uint8Array(total);
    let posicion = 0;
    for (const bloque of bloques) {
        salida.set(bloque, posicion);
        posicion += bloque.length;
    }
    return salida;
}

// ─── Construccion del libro ──────────────────────────────────────────────────

/** Devuelve el contenido binario del libro con las hojas indicadas. */
export function generarLibro(hojas: Hoja[]): Uint8Array {
    const codificador = new TextEncoder();
    const nombres = hojas.map((hoja) => nombreValido(hoja.nombre));

    const tipos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${hojas
    .map(
        (_, i) =>
            `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join('\n')}
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

    const relacionesRaiz = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

    const libro = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${nombres
        .map((nombre, i) => `<sheet name="${escapar(nombre)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
        .join('')}</sheets>
</workbook>`;

    const relacionesLibro = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${hojas
    .map(
        (_, i) =>
            `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    )
    .join('\n')}
<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    const entradas: Entrada[] = [
        { nombre: '[Content_Types].xml', datos: codificador.encode(tipos) },
        { nombre: '_rels/.rels', datos: codificador.encode(relacionesRaiz) },
        { nombre: 'xl/workbook.xml', datos: codificador.encode(libro) },
        { nombre: 'xl/_rels/workbook.xml.rels', datos: codificador.encode(relacionesLibro) },
        { nombre: 'xl/styles.xml', datos: codificador.encode(ESTILOS_XML) },
        ...hojas.map((hoja, i) => ({
            nombre: `xl/worksheets/sheet${i + 1}.xml`,
            datos: codificador.encode(hojaXml(hoja)),
        })),
    ];

    return empaquetar(entradas);
}

/**
 * Genera el libro y lo entrega al navegador como descarga. Se utiliza un objeto
 * de tipo Blob en lugar de una direccion de datos incrustada, ya que esta ultima
 * queda sujeta al limite de longitud de la direccion y algunos navegadores la
 * bloquean, que era el motivo por el que la exportacion anterior no descargaba.
 */
export function descargarLibro(nombreArchivo: string, hojas: Hoja[]): void {
    const contenido = generarLibro(hojas);
    const blob = new Blob([contenido], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    // La liberacion se aplaza para no invalidar la direccion antes de que el
    // navegador termine de iniciar la descarga.
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}
