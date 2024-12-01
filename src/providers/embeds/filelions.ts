/* eslint-disable no-console */
import * as unpacker from 'unpacker';

import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

const packedRegex = /<script type=(?:['"]text\/javascript['"])?\s*>(eval\(function\(p,a,c,k,e,[\s\S]*?\))\s*<\/script>/;
const linkRegex = /file:"([^"]+)"/;

export const filelionsScraper = makeEmbed({
  id: 'filelions',
  name: 'Filelions',
  rank: 165,
  async scrape(ctx) {
    const streamRes = await ctx.proxiedFetcher<string>(ctx.url);
    // eslint-disable-next-line no-console
    const packed = streamRes.match(packedRegex);

    if (!packed || !packed[1]) {
      console.error('Packed script content not found.');
      throw new Error('Packed script content not found');
    }

    const unpacked = unpacker.unpack(packed[1]);

    const linkMatch = unpacked.match(linkRegex);
    if (!linkMatch || !linkMatch[1]) {
      console.error('File URL not found in the unpacked script.');
      throw new Error('File URL not found in the unpacked script');
    }

    const proxiedPlaylist = `https://m3u8.wafflehacker.io/m3u8-proxy?url=${encodeURIComponent(linkMatch[1])}`;
    console.log('Proxied Playlist URL:', proxiedPlaylist);
    if (!proxiedPlaylist || proxiedPlaylist === '') throw new Error('filelions file not found');
    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: proxiedPlaylist,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
