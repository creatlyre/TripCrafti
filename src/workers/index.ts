// Worker entry point for Durable Objects
export { ItineraryDurableObject } from './ItineraryDurableObject';

export default {
  async fetch(): Promise<Response> {
    return new Response('Durable Objects Worker - Use the bound Durable Object instead', { status: 200 });
  },
};
