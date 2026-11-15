import type { ReactNode } from "react";
import type { Notification } from "../api/types";
import NotificationBell from "./NotificationBell";

interface NavLinkProps {
  href: string;
  onClick: () => void;
  children: ReactNode;
}
function NavLink({ href, onClick, children }: NavLinkProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
      className="text-sm font-medium text-purple-600 hover:underline cursor-pointer"
    >
      {children}
    </a>
  );
}

interface NavbarProps {
  token: string;
  onLogout: () => void | Promise<void>;
  isLoggingOut?: boolean;
  onBrowseJobs?: () => void;
  onSavedJobs?: () => void;
  onInterviewPrep?: () => void;
  onDashboard?: () => void;
  isRecruiter?: boolean;
  onNotificationClick?: (notification: Notification) => void | Promise<void>;
}

function Navbar({
  token,
  onLogout,
  isLoggingOut = false,
  onBrowseJobs,
  onSavedJobs,
  onInterviewPrep,
  onDashboard,
  isRecruiter = false,
  onNotificationClick,
}: NavbarProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <a
            href="/dashboard"
            onClick={(event) => {
              if (onDashboard) {
                event.preventDefault();
                onDashboard();
              }
            }}
            className="text-xl font-bold text-gray-900 cursor-pointer"
          >
            Career<span className="text-purple-600">Connect</span>
          </a>
          {isRecruiter && (
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
              Recruiter
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {onDashboard && (
            <NavLink href="/dashboard" onClick={onDashboard}>
              Dashboard
            </NavLink>
          )}
          {onBrowseJobs && (
            <NavLink href="/jobs" onClick={onBrowseJobs}>
              Browse Jobs
            </NavLink>
          )}
          {!isRecruiter && onSavedJobs && (
            <NavLink href="/saved" onClick={onSavedJobs}>
              Saved Jobs
            </NavLink>
          )}
          {!isRecruiter && onInterviewPrep && (
            <NavLink href="/interview" onClick={onInterviewPrep}>
              Interview Prep
            </NavLink>
          )}
          <NotificationBell token={token} onNotificationClick={onNotificationClick} />
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
