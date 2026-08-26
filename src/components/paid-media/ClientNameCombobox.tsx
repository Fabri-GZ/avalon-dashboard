'use client'

import { NameCombobox } from './NameCombobox'

// D10: la deduplicación de `client_name` la confirma una persona, nunca es
// automática. La mecánica (autocompletar, aviso de casi-coincidencia, ítem
// explícito para crear) vive en `NameCombobox`, que PM y Operador también
// usan; acá queda solo el copy propio del campo Cliente.

interface Props {
  value: string
  onChange: (name: string) => void
  existingNames: string[]
  id?: string
}

export function ClientNameCombobox({ value, onChange, existingNames, id }: Props) {
  return (
    <NameCombobox
      value={value}
      onChange={onChange}
      options={existingNames}
      placeholder="Nombre del cliente"
      createLabel="cliente"
      nearMatchQuestion="¿es el mismo cliente?"
      id={id}
    />
  )
}
