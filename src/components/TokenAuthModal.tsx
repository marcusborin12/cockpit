import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Shield, Key, AlertTriangle, Lock } from "lucide-react";

interface TokenAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (token: string) => void;
  jobTemplateName?: string;
  isValidating?: boolean;
  error?: string | null;
}

export const TokenAuthModal: React.FC<TokenAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticate,
  jobTemplateName,
  isValidating = false,
  error,
}) => {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onAuthenticate(token.trim());
    }
  };

  const handleClose = () => {
    setToken("");
    setShowToken(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Autenticação de Segurança
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Token necessário para executar o job template
              </DialogDescription>
            </div>
          </div>
          
          {jobTemplateName && (
            <div className="bg-gray-50 rounded-lg p-3 border">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Job Template:</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {jobTemplateName}
              </Badge>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token" className="text-sm font-medium">
              Token de Acesso AWX
            </Label>
            <div className="relative">
              <Input
                id="token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Insira seu token de autenticação"
                className="pr-10 font-mono text-sm"
                disabled={isValidating}
                autoComplete="off"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowToken(!showToken)}
                disabled={isValidating}
              >
                {showToken ? (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Este token será usado para autenticar a execução no AWX
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Alert className="border-orange-200 bg-orange-50">
            <Lock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-800">
              <strong>Requisito de Segurança:</strong> Cada execução requer autenticação individual. 
              O token não é armazenado e deve ser inserido a cada operação.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isValidating}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!token.trim() || isValidating}
              className="gap-2"
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Autenticar e Executar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};