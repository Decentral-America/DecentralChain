/** Message type discriminator. */
export enum EventType {
  Event = 0,
  Action = 1,
  Response = 2,
}

/** Response status discriminator. */
export enum ResponseStatus {
  Success = 0,
  Error = 1,
}

/** Channel identifier type. */
export type TChannelId = string | number;

/** A single-argument function type. */
export type IOneArgFunction<T, R> = (data: T) => R;

/** Event message shape. */
export interface IEventData {
  type: EventType.Event;
  channelId?: TChannelId | undefined;
  name: string | number | symbol;
  data?: unknown;
}

/** Request (action) message shape. */
export interface IRequestData {
  id: string | number;
  channelId?: TChannelId | undefined;
  type: EventType.Action;
  name: string | number | symbol;
  data?: unknown;
}

/** Response message shape. */
export interface IResponseData {
  id: string | number;
  channelId?: TChannelId | undefined;
  type: EventType.Response;
  status: ResponseStatus;
  content: unknown;
}

/** Union of all message content types sent through the bus. */
export type TMessageContent = IEventData | IRequestData | IResponseData;
