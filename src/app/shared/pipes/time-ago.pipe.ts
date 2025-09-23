import { ChangeDetectorRef, NgZone, OnDestroy, Pipe, PipeTransform } from '@angular/core';

type Unit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: false,
})
export class TimeAgoPipe implements PipeTransform, OnDestroy {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

  transform(
    value: Date | string | number | null | undefined,
    opts?: { locale?: string; now?: number }
  ): string {
    if (value == null) return '';

    const ts = typeof value === 'number' ? value : new Date(value).getTime();
    if (Number.isNaN(ts)) return '';

    const now = opts?.now ?? Date.now();
    const diff = ts - now;

    // schedule next update based on current distance
    this.clearTimer();
    const nextTick = this.nextUpdateInterval(Math.abs(diff));
    if (nextTick > 0) {
      this.zone.runOutsideAngular(() => {
        this.timer = setTimeout(() => {
          // re-render
          this.zone.run(() => this.cdr.markForCheck());
        }, nextTick);
      });
    }

    const rtf = new Intl.RelativeTimeFormat(opts?.locale, { numeric: 'auto' });
    const { unit, amount } = this.toBestUnit(diff);
    return rtf.format(amount, unit as Intl.RelativeTimeFormatUnit);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private nextUpdateInterval(absMs: number): number {
    if (absMs < 60_000) return 1_000;          // update every second under 1 min
    if (absMs < 3_600_000) return 30_000;      // every 30s under 1 hour
    if (absMs < 86_400_000) return 5 * 60_000; // every 5 min under 1 day
    return 60 * 60_000;                        // hourly after 1 day
  }

  private toBestUnit(ms: number): { unit: Unit; amount: number } {
    const sec = Math.round(ms / 1000);
    const min = Math.round(sec / 60);
    const hr  = Math.round(min / 60);
    const day = Math.round(hr / 24);
    const week = Math.round(day / 7);
    const month = Math.round(day / 30); // rough
    const year  = Math.round(day / 365);

    if (Math.abs(sec) < 45)   return { unit: 'second', amount: sec };
    if (Math.abs(min) < 45)   return { unit: 'minute', amount: min };
    if (Math.abs(hr)  < 22)   return { unit: 'hour',   amount: hr };
    if (Math.abs(day) < 26)   return { unit: 'day',    amount: day };
    if (Math.abs(week) < 4)   return { unit: 'week',   amount: week };
    if (Math.abs(month) < 18) return { unit: 'month',  amount: month };
    return { unit: 'year', amount: year };
  }
}
