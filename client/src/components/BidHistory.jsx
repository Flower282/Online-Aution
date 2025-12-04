import { User } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

export function BidHistory({ bids }) {
    const formatTime = (date) => {
        const now = Date.now();
        const diff = now - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} ngày trước`;
        if (hours > 0) return `${hours} giờ trước`;
        if (minutes > 0) return `${minutes} phút trước`;
        return 'Vừa xong';
    };

    return (
        <div className="space-y-3">
            <h3>Lịch sử đấu giá</h3>
            <ScrollArea className="h-[300px] rounded-lg border p-4">
                {!bids || bids.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <p>Chưa có ai đặt giá</p>
                        <p className="text-sm">Hãy là người đầu tiên!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bids.map((bid, index) => (
                            <div
                                key={bid._id || bid.id || index}
                                className={`flex items-center justify-between p-3 rounded-lg ${index === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{bid.bidder?.username || bid.bidder?.name || 'Người dùng'}</p>
                                        <p className="text-sm text-muted-foreground">{formatTime(bid.bidTime || bid.time)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">${(bid.bidAmount || bid.amount)?.toLocaleString()}</p>
                                    {index === 0 && (
                                        <span className="text-xs text-primary">Giá cao nhất</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

