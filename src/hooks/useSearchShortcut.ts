'use client'

import { useEffect, useRef } from 'react'

/**
 * Ctrl+K (⌘K en Mac) enfoca y selecciona el buscador de la cabecera; Escape lo
 * suelta. Devuelve la ref que hay que colgar del `<input>` y el texto del hint
 * para el `<kbd>`.
 *
 * Lo usan los tres buscadores que portalean al header (reportes, clientes,
 * CRM). Vive acá y no copiado en cada topbar porque el atajo es uno solo: si
 * dos pantallas lo resuelven distinto, el usuario aprende un atajo que a veces
 * anda y a veces no.
 *
 * ⚠️ El listener va en `window`, NUNCA en el input: todo el punto del atajo es
 * funcionar cuando el input todavía no tiene el foco.
 */
export function useSearchShortcut() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) {
        // Obligatorio: Chrome se queda con Ctrl+K para la omnibox y Firefox
        // para su barra de búsqueda. Sin esto el foco se va del documento.
        e.preventDefault()
        inputRef.current?.select()
        return
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return { inputRef, shortcutHint: shortcutHint() }
}

/**
 * Se lee `navigator` en el render, sin estado ni efecto: los tres topbars que
 * usan este hook renderizan sus controles dentro de un portal que sólo se abre
 * después de encontrar el host en el DOM. O sea, nunca corre en el server y no
 * hay HTML que hidratar contra el que esto pueda diferir.
 */
function shortcutHint(): string {
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'Ctrl K'
}

/**
 * Clases del `<kbd>` del hint. Oculto abajo de `lg`: en 160px de input el
 * badge le come el texto tipeado al usuario.
 */
export const SHORTCUT_HINT_CLASS =
  'pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-secondary px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted-foreground lg:block'
