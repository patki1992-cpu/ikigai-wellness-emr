import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Search } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function Header({ title, subtitle, children }: HeaderProps) {
  const { user } = useAuth();

  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  const getUserName = () => {
    if (!user) return "User";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    if (firstName || lastName) {
      return `Dr. ${firstName} ${lastName}`.trim();
    }
    return user.email || "User";
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-header-title">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground" data-testid="text-header-subtitle">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search patients..."
              className="pl-10 w-64"
              data-testid="input-search-global"
            />
          </div>
          {children}
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8" data-testid="avatar-user">
              <AvatarImage src={user?.profileImageUrl} alt="Profile" />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground" data-testid="text-user-name">
                {getUserName()}
              </p>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-logout"
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
