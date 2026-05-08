import { SlidingWindowRateLimitOptions } from '@arcjet/node';

export interface CustomSlidingWindowLimitOptions extends SlidingWindowRateLimitOptions<
  []
> {
  name?: string;
}
