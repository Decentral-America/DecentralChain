export const waitTime = (time: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, time));
