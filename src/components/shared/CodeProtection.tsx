import { useEffect } from "react";

/**
 * Componente de proteção contra cópia e inspeção de código.
 * Dificulta (não impede totalmente) a engenharia reversa.
 */
export function CodeProtection() {
  useEffect(() => {
    // 1. Desabilitar menu de contexto (right-click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Bloquear atalhos de DevTools e seleção
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I (DevTools), Ctrl+Shift+J (Console), Ctrl+Shift+C (Inspect)
      if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key.toUpperCase() === "U") {
        e.preventDefault();
        return false;
      }
      // Ctrl+S (Save page)
      if (e.ctrlKey && e.key.toUpperCase() === "S") {
        e.preventDefault();
        return false;
      }
      // Ctrl+A (Select All) - only block in body context
      if (e.ctrlKey && e.key.toUpperCase() === "A") {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          return false;
        }
      }
    };

    // 3. Desabilitar arrastar elementos
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 4. Detectar DevTools via tamanho da janela
    let devtoolsOpen = false;
    const detectDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      
      if (widthDiff || heightDiff) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          // Limpar console quando DevTools é aberto
          console.clear();
          console.log(
            "%c⚠️ AVISO DE SEGURANÇA",
            "color: red; font-size: 24px; font-weight: bold;"
          );
          console.log(
            "%cEste é um recurso do navegador destinado a desenvolvedores. Se alguém pediu para você copiar e colar algo aqui, é um golpe.",
            "color: red; font-size: 14px;"
          );
        }
      } else {
        devtoolsOpen = false;
      }
    };

    // 5. Sobrescrever console em produção
    if (import.meta.env.PROD) {
      const noop = () => {};
      const originalConsole = { ...console };
      // Keep warn and error for actual issues, clear everything else
      Object.assign(console, {
        log: noop,
        debug: noop,
        info: noop,
        table: noop,
        dir: noop,
        dirxml: noop,
        trace: noop,
        group: noop,
        groupCollapsed: noop,
        groupEnd: noop,
        clear: originalConsole.clear,
        warn: originalConsole.warn,
        error: originalConsole.error,
      });
    }

    // 6. Desabilitar seleção de texto via CSS injection
    const style = document.createElement("style");
    style.textContent = `
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      input, textarea, [contenteditable="true"], .selectable {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);

    // Adicionar listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);
    
    const devtoolsInterval = setInterval(detectDevTools, 1000);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      clearInterval(devtoolsInterval);
      document.head.removeChild(style);
    };
  }, []);

  return null;
}
