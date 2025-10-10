import React, { useState } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export const UserProfile: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = () => {
    if (!user) return "U";
    
    // Se tem last_name (nome completo), pega primeira letra de cada palavra
    if (user.last_name && user.last_name.trim()) {
      const nameParts = user.last_name.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    
    // Se tem first_name e last_name separados
    if (user.first_name && user.first_name.trim()) {
      return user.first_name[0].toUpperCase();
    }
    
    // Senão usa username
    if (user.username && user.username.length > 0) {
      return user.username[0].toUpperCase();
    }
    
    return "U";
  };

  const getUserDisplayName = () => {
    if (!user) return "Usuário";
    
    // Se tem last_name (nome completo baseado no seu exemplo)
    if (user.last_name && typeof user.last_name === 'string' && user.last_name.trim()) {
      return user.last_name.trim();
    }
    
    // Se tem first_name, usa ele
    if (user.first_name && typeof user.first_name === 'string' && user.first_name.trim()) {
      return user.first_name.trim();
    }
    
    // Senão usa username
    if (user.username && typeof user.username === 'string' && user.username.trim()) {
      return user.username.trim();
    }
    
    return "Usuário";
  };



  // Se está carregando, mostra um indicador simples
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
        <div className="hidden sm:block w-20 h-4 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-3 px-3 py-2 h-auto">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <div className="text-sm font-medium text-foreground">
              {getUserDisplayName()}
            </div>
            <div className="text-xs text-muted-foreground">
              {user.username}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="text-sm font-medium bg-primary text-primary-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground">
                {getUserDisplayName()}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {user.email || user.username}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  ID: {user.username}
                </Badge>
                {user.is_superuser && (
                  <Badge variant="secondary" className="text-xs">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};