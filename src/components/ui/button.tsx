import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        // El hover NO cambia el color del texto, y no es una preferencia
        // estética: `hover:text-accent-foreground`, que es lo que trae shadcn,
        // apunta a un token que está invertido entre temas. En claro
        // `--accent-foreground` es #f3f4f6 (casi blanco) sobre un `--accent`
        // de #e8d9ff, y en oscuro es #0b0b0f (casi negro). En los dos casos el
        // texto desaparecía al pasar el mouse.
        //
        // No se arregla el token porque tres lugares lo usan como relleno
        // neutro claro en vez de como foreground — los tracks de progreso de
        // ChatbotSection y el texto sobre violeta de Login/Register — y ahí el
        // valor actual sí es el correcto. Invertirlo los rompe. El arreglo
        // vive acá, que es donde el token se usaba con su semántica real.
        //
        // El fondo es un tinte de `--primary` en vez de `--accent`: el
        // #e8d9ff crudo era demasiado saturado para un hover. El tinte va más
        // fuerte en oscuro porque un 5% de #a047ff sobre #111116 es invisible.
        outline:
          "border bg-background shadow-xs hover:bg-primary/5 hover:text-foreground hover:border-primary/40 dark:bg-input/30 dark:border-input dark:hover:bg-primary/15 dark:hover:border-primary/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-primary/5 hover:text-foreground dark:hover:bg-primary/15",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
