import { Order } from "./order.model";

export function upsert(list: Order[], order: Order) {
    const i = list.findIndex(o => o.id === order.id);
    if (i === -1) return [...list, order];
    const copy = [...list]; copy[i] = order; return copy;
  }
  