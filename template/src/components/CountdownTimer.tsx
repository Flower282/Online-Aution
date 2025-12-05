import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endTime: Date;
  compact?: boolean;
}

export function CountdownTimer({ endTime, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(endTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  function getTimeLeft(endTime: Date) {
    const total = endTime.getTime() - Date.now();
    
    if (total <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return { days, hours, minutes, seconds, expired: false };
  }

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Finalizada</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-destructive" />
        <span className="text-sm">
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Clock className="h-5 w-5 text-destructive" />
      <div className="flex gap-2">
        {timeLeft.days > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-2xl font-medium">{timeLeft.days}</span>
            <span className="text-xs text-muted-foreground">días</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-medium">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground">horas</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-medium">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground">min</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-medium">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground">seg</span>
        </div>
      </div>
    </div>
  );
}