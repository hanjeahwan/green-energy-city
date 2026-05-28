import type { CSSProperties } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

export type ToastTone = "ok" | "warn" | "info" | "crit"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-ok" />
        ),
        info: (
          <InfoIcon className="size-4 text-info" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-warn" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-crit" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-accent" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--popover)",
          "--success-text": "var(--popover-foreground)",
          "--success-border": "rgba(var(--ok-rgb), 0.45)",
          "--info-bg": "var(--popover)",
          "--info-text": "var(--popover-foreground)",
          "--info-border": "rgba(var(--energy-cyan-rgb), 0.45)",
          "--warning-bg": "var(--popover)",
          "--warning-text": "var(--popover-foreground)",
          "--warning-border": "rgba(var(--warn-rgb), 0.55)",
          "--error-bg": "var(--popover)",
          "--error-text": "var(--popover-foreground)",
          "--error-border": "rgba(var(--crit-rgb), 0.55)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      toastOptions={{
        style: {
          padding: "8px 12px",
        },
        classNames: {
          toast: "cn-toast border-border bg-popover text-popover-foreground text-xs leading-[1.35] shadow-[0_16px_40px_rgba(var(--shadow-rgb),0.5)]",
          description: "text-text-mute",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-secondary text-secondary-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
