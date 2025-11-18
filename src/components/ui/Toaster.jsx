import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        style: {
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--card-foreground))',
        },
        className: 'backdrop-blur-xl',
      }}
    />
  );
}