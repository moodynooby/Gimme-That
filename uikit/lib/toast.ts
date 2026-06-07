"use strict";

type ToastVariant = "success" | "error" | "info";

const TOAST_DURATION = 4000;
let container: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}

function createToast(message: string, variant: ToastVariant): void {
  const el = document.createElement("div");
  el.className = `toast toast-${variant}`;
  el.textContent = message;
  el.addEventListener("click", () => {
    el.classList.add("toast-leaving");
    setTimeout(() => el.remove(), 300);
  });
  getContainer().appendChild(el);
  requestAnimationFrame(() => el.classList.add("toast-visible"));
  setTimeout(() => {
    el.classList.add("toast-leaving");
    setTimeout(() => el.remove(), 300);
  }, TOAST_DURATION);
}

export default class Toast {
  static success(message: string) {
    createToast(message, "success");
  }

  static error(message: string) {
    createToast(message, "error");
  }

  static info(message: string) {
    createToast(message, "info");
  }
}
