import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppWindow, ChevronLeft, MoreHorizontal, RefreshCw, X } from "lucide-react";
import type { TrayApp } from "../dockApps";

interface SystemTrayPanelProps {
  onBack: () => void;
  onPinChange?: (pinned: boolean) => void;
}

export function SystemTrayPanel({ onBack, onPinChange }: SystemTrayPanelProps) {
  const [apps, setApps] = useState<TrayApp[]>([]);
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await invoke<TrayApp[]>("get_tray_apps");
      setApps(next);
      const pairs = await Promise.all(next.map(async (app) => {
        const key = `${app.path.toLowerCase()}|${app.name.toLowerCase()}`;
        try {
          const icon = await invoke<string | null>("get_app_icon", {
            path: app.path,
            name: app.name,
            hwnd: app.window_handles[0] ?? null
          });
          return icon ? ([key, icon] as const) : null;
        } catch {
          return null;
        }
      }));
      setIcons(Object.fromEntries(pairs.filter((pair): pair is readonly [string, string] => pair !== null)));
    } catch {
      setError("Bloom couldn't read the running tray icons.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    onPinChange?.(true);
    void refresh();
    const interval = setInterval(() => void refresh(), 8000);
    return () => {
      clearInterval(interval);
      onPinChange?.(false);
    };
  }, [onPinChange, refresh]);

  const activate = async (app: TrayApp) => {
    const trayId = app.tray_ids[0];
    if (!trayId) return;
    try {
      await invoke("activate_tray_icon", { trayId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't activate this tray icon.");
    }
  };

  const showMenu = async (event: React.MouseEvent, app: TrayApp) => {
    event.preventDefault();
    event.stopPropagation();
    const trayId = app.tray_ids[0];
    if (!trayId) return;
    try {
      await invoke("show_tray_context_menu", { trayId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open this tray menu.");
    }
  };

  return (
    <div className="in-notch-tool-panel system-tray-panel" onClick={(event) => event.stopPropagation()}>
      <div className="in-notch-panel-heading">
        <button className="in-notch-panel-back" onClick={onBack} title="Back to Control Center" aria-label="Back">
          <ChevronLeft size={15} />
        </button>
        <div className="in-notch-panel-heading-title">
          <span>System Tray</span>
          <small>{apps.length} {apps.length === 1 ? "icon" : "icons"}</small>
        </div>
        <button className="in-notch-panel-action" onClick={() => void refresh()} title="Refresh tray icons" aria-label="Refresh">
          <RefreshCw size={14} className={loading ? "tray-refresh-spinning" : ""} />
        </button>
        <button className="in-notch-panel-action" onClick={onBack} title="Close" aria-label="Close">
          <X size={14} />
        </button>
      </div>
      {error && <div className="in-notch-panel-error">{error}</div>}
      {loading && apps.length === 0 ? (
        <div className="in-notch-panel-empty">Loading running tray icons…</div>
      ) : apps.length === 0 ? (
        <div className="in-notch-panel-empty">
          <AppWindow size={22} strokeWidth={1.5} />
          <span>No application tray icons are running.</span>
        </div>
      ) : (
        <div className="in-notch-tray-grid">
          {apps.map((app) => {
            const key = `${app.path.toLowerCase()}|${app.name.toLowerCase()}`;
            return (
              <div className="in-notch-tray-item" key={`${key}|${app.tray_ids.join(",")}`}>
                <button className="in-notch-tray-main" onClick={() => void activate(app)} title={`Activate ${app.name}`}>
                  <span className="in-notch-tray-icon">
                    {icons[key] ? <img src={icons[key]} alt="" draggable={false} /> : <AppWindow size={19} />}
                  </span>
                  <span className="in-notch-tray-name">{app.name}</span>
                </button>
                <button className="in-notch-tray-menu" onClick={(event) => void showMenu(event, app)} onContextMenu={(event) => void showMenu(event, app)} title={`Open ${app.name} menu`} aria-label={`Open ${app.name} menu`}>
                  <MoreHorizontal size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="in-notch-panel-footnote">Right-click an icon or use ••• for its native menu.</div>
    </div>
  );
}
