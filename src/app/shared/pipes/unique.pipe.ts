import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'unique', standalone: true })
export class UniquePipe implements PipeTransform {
  transform(items: any[] = [], key: string): any[] {
    const set = new Set(items.map(i => i?.[key]).filter(Boolean));
    return Array.from(set);
  }
}
