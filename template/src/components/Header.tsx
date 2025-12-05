import { Gavel, Search, User, Heart, Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Gavel className="h-6 w-6 text-primary" />
            <span className="font-medium">SubastaPro</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm hover:text-primary transition-colors">
              Inicio
            </a>
            <a href="#" className="text-sm hover:text-primary transition-colors">
              Explorar
            </a>
            <a href="#" className="text-sm hover:text-primary transition-colors">
              Cómo funciona
            </a>
            <a href="#" className="text-sm hover:text-primary transition-colors">
              Vender
            </a>
          </nav>
        </div>
        
        <div className="hidden lg:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar subastas..." 
              className="pl-9 bg-input-background border-border"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          <Button className="hidden sm:flex">
            Iniciar sesión
          </Button>
        </div>
      </div>
    </header>
  );
}