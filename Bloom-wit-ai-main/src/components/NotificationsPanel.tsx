import { Bell, ChevronLeft, ExternalLink, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface NotificationsPanelProps {
  onBack: () => void;
}

export function NotificationsPanel({ onBack }: NotificationsPanelProps) {
  return (
    <div className="in-notch-tool-panel notifications-panel" onClick={(event) => event.stopPropagation()}>
      <div className="in-notch-panel-heading">
        <button className="in-notch-panel-back" onClick={onBack} title="Back to Control Center" aria-label="Back">
          <ChevronLeft size={15} />
        </button>
        <div className="in-notch-panel-heading-title">
          <span>Notifications</span>
          <small>Windows notification center</small>
        </div>
        <button className="in-notch-panel-action" onClick={onBack} title="Close" aria-label="Close">
          <X size={14} />
        </button>
      </div>
      <div className="in-notch-notification-empty">
        <span className="in-notch-notification-icon"><Bell size={22} strokeWidth={1.7} /></span>
        <strong>Your notifications stay in Windows</strong>
        <p>Windows keeps notification history in its own system surface. Open it from here without leaving Bloom's notch controls.</p>
        <button className="in-notch-notification-open" onClick={() => void invoke("open_notification_center").catch(console.error)}>
          Open Windows Notification Center <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
}
