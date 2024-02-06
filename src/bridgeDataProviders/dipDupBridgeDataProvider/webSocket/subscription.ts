export interface Subscription {
  readonly id: number;
  readonly query: string;

  subscribersCount: number;
}
