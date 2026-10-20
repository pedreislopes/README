"use client";

import type { ComponentProps } from "react";

/** Caixa de seleção que aplica a escolha na hora (sem precisar apertar um botão). */
export function SelectAutoEnvio(props: ComponentProps<"select">) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
