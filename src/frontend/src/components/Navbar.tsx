import type { ReactNode } from "react";
import type { Notification } from "../api/types";
import NotificationBell from "./NotificationBell";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface NavLinkProps {
  href: string;
  onClick: () => void;
  children: ReactNode;
}
function NavLink({ href, onClick, children }: NavLinkProps) {
  return (
    <Button
      variant="link"
      size="sm"
      nativeButton={false}
      role="link"
      render={
        <a
          href={href}
          onClick={(event) => {
            event.preventDefault();
            onClick();
          }}
        />
      }
      className="h-auto cursor-pointer p-0 text-primary"
    >
      {children}
    </Button>
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
          <Button
            variant="link"
            size="lg"
            nativeButton={false}
            role="link"
            render={
              <a
                href="/dashboard"
                onClick={(event) => {
                  if (onDashboard) {
                    event.preventDefault();
                    onDashboard();
                  }
                }}
              />
            }
            className="h-auto cursor-pointer p-0 text-xl font-bold text-foreground"
          >
            Career<span className="text-purple-600">Connect</span>
          </Button>
          {isRecruiter && <Badge variant="secondary">Recruiter</Badge>}
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
          <Button variant="outline" size="sm" onClick={onLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "Logging out…" : "Log out"}
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
