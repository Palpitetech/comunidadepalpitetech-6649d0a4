import React from "react";

type Loteria = "lotofacil" | "megasena";

const THEMES: Record<Loteria, React.CSSProperties> = {
  lotofacil: {
    ["--primary" as any]: "270 60% 50%",
    ["--primary-foreground" as any]: "0 0% 100%",
    ["--ring" as any]: "270 60% 50%",
    ["--accent" as any]: "270 60% 95%",
    ["--accent-foreground" as any]: "270 60% 30%",
  },
  megasena: {
    ["--primary" as any]: "125 70% 40%",
    ["--primary-foreground" as any]: "0 0% 100%",
    ["--ring" as any]: "125 70% 40%",
    ["--accent" as any]: "125 70% 95%",
    ["--accent-foreground" as any]: "125 70% 25%",
  },
};

interface Props {
  loteria: Loteria;
  children: React.ReactNode;
}

export function GeradorTheme({ loteria, children }: Props) {
  return <div style={THEMES[loteria]}>{children}</div>;
}
