import { initializeI18n, t } from "./i18n.js?v=20261002-3";

const storageKey = "docviewkit-theme";

function initialTheme() {
  const stored = localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-label", t(theme === "dark" ? "切换到浅色主题" : "切换到深色主题"));
  });
}

initializeI18n();
applyTheme(initialTheme());

// Keep one navigation tree: inline when it fits, native light-dismiss when compact.
const menuButton = document.querySelector("[data-menu-toggle]");
const menu = document.getElementById(menuButton?.getAttribute("aria-controls"));
if (menu && menuButton) {
  const header = menu.closest(".site-header");
  const row = menu.closest(".site-nav");
  const nativePopover = "popover" in HTMLElement.prototype;
  let previousWidth = 0;
  const isOpen = () => nativePopover ? menu.matches(":popover-open") : menu.classList.contains("open");
  const close = () => {
    if (nativePopover && isOpen()) menu.hidePopover();
    menu.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  };
  const position = () => header.style.setProperty("--nav-menu-top", `${header.getBoundingClientRect().bottom + 8}px`);
  const layout = () => {
    const width = row.clientWidth;
    if (header.dataset.navLayout === "compact" && width <= previousWidth) {
      previousWidth = width;
      position();
      return;
    }
    previousWidth = width;
    const open = isOpen();
    const focused = document.activeElement;
    menu.removeAttribute("popover");
    header.dataset.navLayout = "wide";
    const compact = row.scrollWidth > width;
    header.dataset.navLayout = compact ? "compact" : "wide";
    menu.classList.remove("open");
    if (compact && nativePopover) {
      menu.setAttribute("popover", "auto");
      menuButton.setAttribute("popovertarget", menu.id);
      if (open) {
        menu.showPopover({ source: menuButton });
        if (menu.contains(focused)) focused.focus({ preventScroll: true });
      }
    } else {
      menuButton.removeAttribute("popovertarget");
      if (compact && open) menu.classList.add("open");
    }
    menuButton.setAttribute("aria-expanded", String(compact && open));
    if (!compact && focused === menuButton) menu.querySelector("a")?.focus();
    else if (compact && !open && menu.contains(focused)) menuButton.focus();
    position();
  };
  menu.addEventListener("toggle", () => menuButton.setAttribute("aria-expanded", String(isOpen())));
  menu.addEventListener("click", event => { if (event.target.closest("a")) close(); });
  if (!nativePopover) {
    menuButton.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
      if (open) menu.querySelector("a")?.focus();
    });
    document.addEventListener("click", event => {
      if (isOpen() && !menu.contains(event.target) && !menuButton.contains(event.target)) close();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && isOpen()) { close(); menuButton.focus(); }
    });
  }
  layout();
  let layoutFrame = 0;
  const observer = new ResizeObserver(() => {
    if (layoutFrame) return;
    layoutFrame = requestAnimationFrame(() => { layoutFrame = 0; layout(); });
  });
  observer.observe(row);
  observer.observe(menu);
}

document.addEventListener("click", async (event) => {
  const themeButton = event.target.closest("[data-theme-toggle]");
  if (themeButton) {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(storageKey, theme);
    applyTheme(theme);
    return;
  }

  const copyButton = event.target.closest("[data-copy-target]");
  if (copyButton) {
    const target = document.getElementById(copyButton.dataset.copyTarget);
    if (!target) return;
    const previous = copyButton.textContent;
    try {
      await navigator.clipboard.writeText(target.textContent);
      copyButton.textContent = t("已复制");
    } catch {
      copyButton.textContent = t("复制失败");
    }
    window.setTimeout(() => { copyButton.textContent = previous; }, 1800);
  }
});

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});
