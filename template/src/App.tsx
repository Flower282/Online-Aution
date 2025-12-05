import { useState } from "react";
import { Header } from "./components/Header";
import { AuctionCard } from "./components/AuctionCard";
import { AuctionDetail } from "./components/AuctionDetail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { toast, Toaster } from "sonner@2.0.3";
import type { Auction } from "./components/AuctionCard";

export default function App() {
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  
  // Mock data for auctions
  const [auctions, setAuctions] = useState<Auction[]>([
    {
      id: "1",
      title: "Reloj de Lujo Rolex Submariner",
      description: "Reloj automático de acero inoxidable en condición impecable. Incluye caja original y papeles de autenticidad.",
      image: "https://images.unsplash.com/photo-1670177257750-9b47927f68eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3YXRjaHxlbnwxfHx8fDE3NTk4NjcyNjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentBid: 15750,
      startingBid: 12000,
      totalBids: 23,
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      category: "Relojes",
      seller: "LuxuryTime",
      condition: "Excelente"
    },
    {
      id: "2",
      title: "Cámara Vintage Leica M3",
      description: "Cámara analógica clásica de 35mm. Totalmente funcional con lente Summicron 50mm f/2.",
      image: "https://images.unsplash.com/photo-1495121553079-4c61bcce1894?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwY2FtZXJhfGVufDF8fHx8MTc1OTkzOTQyNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentBid: 3200,
      startingBid: 2500,
      totalBids: 15,
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours
      category: "Fotografía",
      seller: "VintageGear",
      condition: "Muy bueno"
    },
    {
      id: "3",
      title: "Ferrari 488 GTB 2018",
      description: "Deportivo de alto rendimiento con motor V8 biturbo. Solo 8,500 km, mantenimiento completo.",
      image: "https://images.unsplash.com/photo-1541348263662-e068662d82af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjYXJ8ZW58MXx8fHwxNzU5ODY5NTQzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentBid: 285000,
      startingBid: 250000,
      totalBids: 47,
      endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
      category: "Vehículos",
      seller: "ExoticCars",
      condition: "Como nuevo"
    },
    {
      id: "4",
      title: "MacBook Pro 16\" M3 Max",
      description: "Laptop profesional de última generación. 64GB RAM, 2TB SSD. Sellado, sin abrir.",
      image: "https://images.unsplash.com/photo-1754928864131-21917af96dfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsYXB0b3B8ZW58MXx8fHwxNzU5OTU0Nzc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentBid: 3850,
      startingBid: 3200,
      totalBids: 31,
      endTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      category: "Tecnología",
      seller: "TechDeals",
      condition: "Nuevo"
    },
    {
      id: "5",
      title: "Bolso Louis Vuitton Neverfull MM",
      description: "Bolso de diseñador auténtico en lona monogram. Incluye certificado de autenticidad.",
      image: "https://images.unsplash.com/photo-1601924928357-22d3b3abfcfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ25lciUyMGhhbmRiYWd8ZW58MXx8fHwxNzU5OTE0NTQyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentBid: 1450,
      startingBid: 1200,
      totalBids: 19,
      endTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
      category: "Moda",
      seller: "LuxuryBags",
      condition: "Excelente"
    },
    {
      id: "6",
      title: "Obra de Arte Original - Pintura al Óleo",
      description: "Paisaje abstracto contemporáneo, 120x90cm. Firmado por artista reconocido.",
      image: "https://images.unsplash.com/flagged/photo-1572392640988-ba48d1a74457?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBwYWludGluZ3xlbnwxfHx8fDE3NTk5MDc5NTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentBid: 5800,
      startingBid: 4500,
      totalBids: 12,
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      category: "Arte",
      seller: "GaleriaModerna",
      condition: "Nuevo"
    },
    {
      id: "7",
      title: "Anillo de Diamantes 2.5 Quilates",
      description: "Anillo de compromiso en oro blanco 18k con diamante certificado. Corte brillante.",
      image: "https://images.unsplash.com/photo-1589674668791-4889d2bba4c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWFtb25kJTIwcmluZ3xlbnwxfHx8fDE3NTk5Mjc1NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentBid: 18500,
      startingBid: 15000,
      totalBids: 28,
      endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
      category: "Joyería",
      seller: "DiamondElite",
      condition: "Nuevo"
    },
    {
      id: "8",
      title: "PlayStation 5 Pro Edición Limitada",
      description: "Consola de nueva generación con diseño exclusivo. Incluye 2 controles y 5 juegos.",
      image: "https://images.unsplash.com/photo-1580234797602-22c37b2a6230?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBjb25zb2xlfGVufDF8fHx8MTc1OTk1NDc4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentBid: 720,
      startingBid: 600,
      totalBids: 42,
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
      category: "Tecnología",
      seller: "GamersParadise",
      condition: "Nuevo"
    }
  ]);

  // Mock bid history for each auction
  const [bidHistories, setBidHistories] = useState<Record<string, Array<{
    id: string;
    bidder: string;
    amount: number;
    time: Date;
  }>>>({
    "1": [
      { id: "b1", bidder: "Juan P.", amount: 15750, time: new Date(Date.now() - 5 * 60000) },
      { id: "b2", bidder: "María G.", amount: 15500, time: new Date(Date.now() - 15 * 60000) },
      { id: "b3", bidder: "Carlos R.", amount: 15200, time: new Date(Date.now() - 45 * 60000) }
    ],
    "2": [
      { id: "b1", bidder: "Ana M.", amount: 3200, time: new Date(Date.now() - 10 * 60000) },
      { id: "b2", bidder: "Pedro L.", amount: 3100, time: new Date(Date.now() - 30 * 60000) }
    ],
    "3": [
      { id: "b1", bidder: "Ricardo V.", amount: 285000, time: new Date(Date.now() - 20 * 60000) },
      { id: "b2", bidder: "Elena S.", amount: 280000, time: new Date(Date.now() - 60 * 60000) }
    ],
    "4": [
      { id: "b1", bidder: "Miguel T.", amount: 3850, time: new Date(Date.now() - 8 * 60000) }
    ],
    "5": [
      { id: "b1", bidder: "Sofia K.", amount: 1450, time: new Date(Date.now() - 12 * 60000) }
    ],
    "6": [
      { id: "b1", bidder: "Fernando B.", amount: 5800, time: new Date(Date.now() - 25 * 60000) }
    ],
    "7": [
      { id: "b1", bidder: "Valentina R.", amount: 18500, time: new Date(Date.now() - 7 * 60000) }
    ],
    "8": [
      { id: "b1", bidder: "Diego F.", amount: 720, time: new Date(Date.now() - 3 * 60000) }
    ]
  });

  const categories = ["all", "Relojes", "Tecnología", "Arte", "Vehículos", "Moda", "Joyería", "Fotografía"];

  const filteredAuctions = activeCategory === "all" 
    ? auctions 
    : auctions.filter(a => a.category === activeCategory);

  const handlePlaceBid = (auctionId: string, amount: number) => {
    // Update auction
    setAuctions(prev => prev.map(auction => 
      auction.id === auctionId 
        ? { ...auction, currentBid: amount, totalBids: auction.totalBids + 1 }
        : auction
    ));

    // Add to bid history
    setBidHistories(prev => ({
      ...prev,
      [auctionId]: [
        {
          id: `b${Date.now()}`,
          bidder: "Tú",
          amount,
          time: new Date()
        },
        ...(prev[auctionId] || [])
      ]
    }));

    toast.success(`¡Puja realizada con éxito! $${amount.toLocaleString()}`, {
      description: "Eres el mejor postor actual"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="mb-12 text-center space-y-4">
          <h1>Subastas en Vivo</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubre artículos únicos y puja por tus favoritos. Nuevas subastas cada día con 
            productos verificados y garantía del vendedor.
          </p>
        </div>

        {/* Category tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2">
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category === "all" ? "Todas" : category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-muted/30 text-center">
            <p className="text-2xl font-medium text-primary">{auctions.length}</p>
            <p className="text-sm text-muted-foreground">Subastas activas</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 text-center">
            <p className="text-2xl font-medium text-primary">
              {auctions.reduce((sum, a) => sum + a.totalBids, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Pujas totales</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 text-center">
            <p className="text-2xl font-medium text-primary">24/7</p>
            <p className="text-sm text-muted-foreground">Disponibilidad</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 text-center">
            <p className="text-2xl font-medium text-primary">100%</p>
            <p className="text-sm text-muted-foreground">Seguro</p>
          </div>
        </div>

        {/* Auction grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAuctions.map(auction => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              onClick={() => setSelectedAuction(auction)}
            />
          ))}
        </div>

        {filteredAuctions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay subastas en esta categoría actualmente
            </p>
          </div>
        )}
      </main>

      {/* Auction detail modal */}
      {selectedAuction && (
        <AuctionDetail
          auction={selectedAuction}
          onClose={() => setSelectedAuction(null)}
          bids={bidHistories[selectedAuction.id] || []}
          onPlaceBid={(amount) => handlePlaceBid(selectedAuction.id, amount)}
        />
      )}

      <Toaster position="top-right" />
    </div>
  );
}