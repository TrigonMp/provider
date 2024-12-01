/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

const linkRegex = /'hls':\s*'([a-zA-Z0-9+/]+={0,2})'/;
const redirectRegex = /window\.location\.href = '(https?:\/\/[^']+)'/;

// Define the return type as string for the safeBase64Decode function
function safeBase64Decode(encodedString: string): string {
  try {
    return atob(encodedString);
  } catch (e) {
    console.error('Failed to decode base64 string:', e);
    throw new Error('Base64 decoding error');
  }
}

export const voeScraper = makeEmbed({
  id: 'voe',
  name: 'voe.sx',
  rank: 180,
  async scrape(ctx) {
    let embedRes = await ctx.proxiedFetcher.full<string>(ctx.url);
    let embed = embedRes.body;

    // Check for redirection via window.location.href
    const redirectMatch = embed.match(redirectRegex);
    if (redirectMatch) {
      // Fetch new embed from the redirection URL
      embedRes = await ctx.proxiedFetcher.full<string>(redirectMatch[1]);
      embed = embedRes.body;
    }

    // Attempt to extract the HLS URL from the modified embed content
    const playerSrc = embed.match(linkRegex);
    if (!playerSrc || playerSrc.length < 2) {
      throw new Error('Stream URL not found in embed code');
    }
    const streamUrl = playerSrc[1];
    const decodedStreamUrl = safeBase64Decode(streamUrl); // Decode the base64 HLS URL
    const proxiedStreamUrl = `https://m3u8.wafflehacker.io/m3u8-proxy?url=${encodeURIComponent(decodedStreamUrl)}`;
    if (!streamUrl) throw new Error('Stream url not found in embed code');

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: proxiedStreamUrl,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
