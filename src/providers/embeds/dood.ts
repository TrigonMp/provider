import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

export const doodScraper = makeEmbed({
  id: 'dood',
  name: 'dood',
  rank: 173,
  async scrape(ctx) {
    let url = ctx.url;
    if (ctx.url.includes('primewire')) {
      const request = await ctx.proxiedFetcher.full(ctx.url);
      url = request.finalUrl;
    }

    // Extract ID from URL
    const urlSegments = url.split('/');
    const videoId = urlSegments.pop() || urlSegments.pop();

    const vidScrapeURL = `https://dood.wafflehacker.io/video/${videoId}`;
    const vidScrape = await ctx.fetcher(vidScrapeURL);

    ctx.progress(50);

    if (vidScrape.videoUrl?.length === 0) {
      throw new NotFoundError('No Video Found');
    }

    ctx.progress(100);

    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
          disabled: true,
          flags: [flags.CORS_ALLOWED],
          captions: [],
          qualities: {
            unknown: {
              type: 'mp4',
              url: vidScrape.videoUrl,
            },
          },
        },
      ],
    };
  },
});
