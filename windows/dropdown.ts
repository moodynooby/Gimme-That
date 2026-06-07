"use strict";
// License: MIT

export function setupDatalist(inputId: string, options: string[]) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  if (!input) {
    throw new Error(`Invalid input id: ${inputId}`);
  }

  const listId = `${inputId}-list`;
  const existing = document.getElementById(listId);
  if (existing) {
    existing.remove();
  }

  const list = document.createElement("datalist");
  list.id = listId;
  for (const opt of options) {
    const el = document.createElement("option");
    el.value = opt;
    list.appendChild(el);
  }
  input.parentNode!.insertBefore(list, input.nextSibling);
  input.setAttribute("list", listId);

  return {
    get value() { return input!.value; },
    set value(v: string) { input!.value = v || ""; },
    onchange(cb: () => void) {
      input!.addEventListener("change", cb);
      input!.addEventListener("input", cb);
    },
  };
}
