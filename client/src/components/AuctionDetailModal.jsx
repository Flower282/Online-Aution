import { useState } from "react";
import { X, User as UserIcon, Package, Shield, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { CountdownTimer } from "./CountdownTimer";
import { BidHistory } from "./BidHistory";
import { Alert, AlertDescription } from "./ui/alert";

export function AuctionDetailModal({ auction, onClose, bids, onPlaceBid }) {
    const [bidAmount, setBidAmount] = useState("");
    const [error, setError] = useState("");

    const currentPrice = auction.currentPrice || auction.startingPrice;
    const minimumBid = currentPrice + 50;
    const suggestedBids = [
        minimumBid,
        minimumBid + 100,
        minimumBid + 250,
        minimumBid + 500
    ];

    const timeLeft = auction.timeLeft || 0;
    const endTime = new Date(Date.now() + timeLeft);
    const isEnded = timeLeft <= 0;

    const handleBidSubmit = () => {
        const amount = parseFloat(bidAmount);

        if (isNaN(amount)) {
            setError("Vui lòng nhập số tiền hợp lệ");
            return;
        }

        if (amount < minimumBid) {
            setError(`Giá đặt tối thiểu là $${minimumBid.toLocaleString()}`);
            return;
        }

        if (onPlaceBid) {
            onPlaceBid(amount);
        }
        setBidAmount("");
        setError("");
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-screen p-4 md:p-8">
                <div className="max-w-6xl mx-auto bg-background rounded-lg shadow-xl">
                    <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background">
                        <h2>Chi tiết đấu giá</h2>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 p-6">
                        {/* Left column - Images and description */}
                        <div className="space-y-6">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                <img
                                    src={auction.itemPhoto || "https://picsum.photos/600"}
                                    alt={auction.itemName}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3>Mô tả</h3>
                                    <p className="text-muted-foreground mt-2">
                                        {auction.itemDescription}
                                    </p>
                                    <p className="text-muted-foreground mt-2">
                                        Sản phẩm này đã được xác minh và kiểm tra kỹ lưỡng.
                                        Đấu giá sẽ tự động kết thúc khi hết thời gian.
                                    </p>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Danh mục</p>
                                            <p>{auction.itemCategory}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Trạng thái</p>
                                            <p>Đã xác minh</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Người bán</p>
                                            <p>{auction.sellerName || auction.seller?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Lượt đấu giá</p>
                                            <p>{auction.bidsCount || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right column - Bidding */}
                        <div className="space-y-6">
                            <div>
                                <Badge variant="secondary">{auction.itemCategory}</Badge>
                                <h2 className="mt-2">{auction.itemName}</h2>
                            </div>

                            <div className="p-6 rounded-lg bg-muted/30 space-y-4">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-muted-foreground">Giá hiện tại</span>
                                    <span className="text-3xl font-medium text-primary">
                                        ${currentPrice?.toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {auction.bidsCount || 0} lượt đấu giá
                                    </span>
                                    <span className="text-muted-foreground">
                                        Giá khởi điểm: ${auction.startingPrice?.toLocaleString()}
                                    </span>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <span className="text-sm text-muted-foreground">Thời gian còn lại</span>
                                    {!isEnded ? (
                                        <CountdownTimer endTime={endTime} />
                                    ) : (
                                        <p className="text-muted-foreground">Đã kết thúc</p>
                                    )}
                                </div>
                            </div>

                            {!isEnded && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-muted-foreground">
                                            Giá đặt của bạn (tối thiểu ${minimumBid.toLocaleString()})
                                        </label>
                                        <div className="flex gap-2 mt-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                    $
                                                </span>
                                                <Input
                                                    type="number"
                                                    value={bidAmount}
                                                    onChange={(e) => {
                                                        setBidAmount(e.target.value);
                                                        setError("");
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleBidSubmit();
                                                        }
                                                    }}
                                                    placeholder={minimumBid.toString()}
                                                    className="pl-7"
                                                />
                                            </div>
                                            <Button onClick={handleBidSubmit} className="px-8">
                                                Đặt giá
                                            </Button>
                                        </div>
                                        {error && (
                                            <Alert variant="destructive" className="mt-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>{error}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-sm text-muted-foreground">Đặt giá nhanh</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            {suggestedBids.map((amount) => (
                                                <Button
                                                    key={amount}
                                                    variant="outline"
                                                    onClick={() => {
                                                        setBidAmount(amount.toString());
                                                        setError("");
                                                    }}
                                                >
                                                    ${amount.toLocaleString()}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Separator />

                            <BidHistory bids={bids || auction.bids || []} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

