import { TupleMap } from '../structures/tuppleMap';
import { XY } from '../types';
import { eventBus } from './eventBus';

export type SubscribeParams = {
  to?: XY;
  topic?: string;
  radius?: number;
};

export class MessageBus {
  subscribers = new TupleMap<SubscribeParams[]>();

  subscribe(subscriber: XY, params: SubscribeParams) {
    const { to, topic } = params;
    const radius = params.radius ?? 0;

    const current = this.subscribers.get(subscriber) ?? [];
    current.push({ to, topic, radius });

    this.subscribers.set(subscriber, current);
  }

  unsubscribe(subscriber: XY) {
    this.subscribers.delete(subscriber);
  }

  send(from: XY, params: SubscribeParams, payload: unknown) {
    for (const [subscriber, subscriptions] of this.subscribers.entries()) {
      for (const sub of subscriptions) {
        let match = true;

        if ((params.topic || sub.topic) && params.topic !== sub.topic) {
          match = false;
        }

        if (params.to && sub.to) {
          const subCoord = sub.to;
          const msgCoord = params.to;
          const subRadius = sub.radius ?? 0;
          const msgRadius = params.radius ?? 0;
          const dist =
            Math.abs(subCoord[0] - msgCoord[0]) +
            Math.abs(subCoord[1] - msgCoord[1]);
          if (dist > subRadius + msgRadius) {
            match = false;
          }
        }

        if (match) {
          eventBus.emit(
            `block:${subscriber[0]},${subscriber[1]}:message`,
            from,
            payload,
          );
        }
      }
    }
  }
}

export default new MessageBus();
