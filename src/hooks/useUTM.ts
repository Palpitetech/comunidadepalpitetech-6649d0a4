import { useEffect } from "react";

export function useUTM() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = params.get("utm");
    if (utm) {
      localStorage.setItem("utm_source", utm);
    }
  }, []);
}

export function getStoredUTM(): string | null {
  return localStorage.getItem("utm_source");
}

export function clearUTM() {
  localStorage.removeItem("utm_source");
}
