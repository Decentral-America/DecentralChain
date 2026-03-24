import { type IOneArgFunction, type TMessageContent } from '../bus/types.js';

/**
 * Abstract base class for message transport adapters.
 * Subclass this to create custom transport mechanisms.
 */
export abstract class Adapter {
  public abstract send(data: TMessageContent): this;
  public abstract addListener(cb: IOneArgFunction<TMessageContent, void>): this;
  public abstract destroy(): void;
}
