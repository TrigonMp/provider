import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 1;
    ctx.progress(progress);
  }, 100);

  let url = `https://2embed.wafflehacker.io/scrape?id=${ctx.media.imdbId}`;
  if (ctx.media.type === 'show') url += `&s=${ctx.media.season.number}&e=${ctx.media.episode.number}`;
  const response = await ctx.fetcher(url);
  ctx.progress(100);

  if (response.statusCode === 404) {
    throw new NotFoundError('Movie Not Found');
  }

  if (response) return response as SourcererOutput;

  clearInterval(interval);
  throw new NotFoundError('No data found for this movie');
}

export const twoEmbedScraper = makeSourcerer({
  id: '2embed',
  name: '2Embed',
  rank: 140,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
