/** Message type discriminator. */
export const EventType = {
  Action: 1,
  Event: 0,
  Response: 2,
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

/** Response status discriminator. */
export const ResponseStatus = {
  Error: 1,
  Success: 0,
} as const;
export type ResponseStatus = (typeof ResponseStatus)[keyof typeof ResponseStatus];

/** Channel identifier type. */
export type TChannelId = string | number;

/** A single-argument function type. */
export type IOneArgFunction<T, R> = (data: T) => R;

/** Event message shape. */
export interface IEventData {
  type: typeof EventType.Event;
  channelId?: TChannelId | undefined;
  name: string | number | symbol;
  data?: unknown;
}

/** Request (action) message shape. */
export interface IRequestData {
  id: string | number;
  channelId?: TChannelId | undefined;
  type: typeof EventType.Action;
  name: string | number | symbol;
  data?: unknown;
}

/** Response message shape. */
export interface IResponseData {
  id: string | number;
  channelId?: TChannelId | undefined;
  type: typeof EventType.Response;
  status: ResponseStatus;
  content: unknown;
}

/** Union of all message content types sent through the bus. */
export type TMessageContent = IEventData | IRequestData | IResponseData;
