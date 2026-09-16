import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

// Recibe el HTML de un reporte de paid media y devuelve el PDF 16:9 (254 ×
// 142,9 mm, medida de una slide de Google Slides).
//
// Vive acá y no en n8n porque n8n Cloud no tiene Chrome ni puede correr
// Puppeteer. n8n sigue siendo el orquestador y llama a esta ruta con el HTML
// que acaba de generar el nodo `render`.
//
// Se manda el HTML en el body y no la URL publicada a propósito: el reporte se
// sube por FTP y nada garantiza que sea legible en el instante en que el nodo
// de upload devuelve OK. Con el markup, el PDF es función pura de lo que
// produjo `render`, sin depender del timing de publicación.

// Puppeteer necesita filesystem y proceso real: no corre en el runtime edge.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Cold start + launch de Chromium + render. Un reporte de nueve slides tarda
// unos segundos; el techo está por la cuenta patológica, no por la normal.
export const maxDuration = 60

const MAX_HTML_BYTES = 8 * 1024 * 1024

// Comparación en tiempo constante para que el token no se pueda reconstruir
// midiendo la respuesta. El largo se compara antes porque timingSafeEqual tira
// si difiere, y ese throw filtraría el largo.
function tokenValido(recibido: string | null, esperado: string): boolean {
  if (!recibido) return false
  const a = Buffer.from(recibido)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  const secreto = process.env.REPORTS_PDF_TOKEN

  // Sin token configurado la ruta se niega a funcionar. Es a propósito: si no,
  // sería un renderizador abierto para cualquiera que encuentre el path.
  if (!secreto) {
    console.error('[reportes/pdf] falta REPORTS_PDF_TOKEN')
    return NextResponse.json({ error: 'Ruta no configurada' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!tokenValido(bearer, secreto)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let html: unknown
  let filename: unknown

  try {
    ;({ html, filename } = await request.json())
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  if (typeof html !== 'string' || html.length === 0) {
    return NextResponse.json({ error: 'html es requerido' }, { status: 400 })
  }

  if (Buffer.byteLength(html) > MAX_HTML_BYTES) {
    return NextResponse.json({ error: 'html demasiado grande' }, { status: 413 })
  }

  const nombre =
    typeof filename === 'string' && /^[a-z0-9-]{1,120}$/.test(filename)
      ? filename
      : 'reporte'

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

  try {
    // En local, CHROME_EXECUTABLE_PATH apunta al Chrome de la máquina: el
    // Chromium empaquetado de @sparticuz/chromium es un build de Linux y no
    // sirve para probar en Windows.
    const executablePath =
      process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath())

    browser = await puppeteer.launch({
      args: process.env.CHROME_EXECUTABLE_PATH ? [] : chromium.args,
      executablePath,
      headless: true,
    })

    const page = await browser.newPage()

    // 960 px es el ancho real de una hoja de 254 mm a 96 dpi. No es cosmético:
    // el reporte tiene un breakpoint `max-width: 980px`, así que con un
    // viewport más ancho se maquetaría de una forma y se imprimiría de otra.
    await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 })

    // `load` espera a la hoja de estilos de Google Fonts, porque un <link> de
    // CSS bloquea ese evento. Pero NO espera a los archivos .woff2 que esa hoja
    // pide después, y sin ellos el render sale con la tipografía de fallback:
    // de ahí la segunda espera explícita.
    //
    // (puppeteer 25 ya no acepta `networkidle0` en setContent — solo `load` y
    // `domcontentloaded`. fonts.ready es de todos modos la señal correcta acá:
    // espera exactamente lo que importa en vez de adivinar por inactividad.)
    await page.setContent(html, { waitUntil: 'load', timeout: 30_000 })
    await page.evaluateHandle('document.fonts.ready')

    const pdf = await page.pdf({
      // preferCSSPageSize deja el @page del stylesheet como única fuente de
      // verdad del tamaño. Repetir 254 × 142,9 mm acá sería un segundo lugar
      // para olvidarse de actualizar.
      preferCSSPageSize: true,
      // La banda oscura del footer y los acentos de los KPI son contenido, no
      // decoración: sin esto el PDF sale en blanco y negro.
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombre}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[reportes/pdf] falló el render', error)
    return NextResponse.json({ error: 'Falló el render del PDF' }, { status: 500 })
  } finally {
    await browser?.close()
  }
}
