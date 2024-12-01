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

  let url = `https://insertunit.wafflehacker.io/scrape${ctx.media.imdbId}`;
  if (ctx.media.type === 'show') url += `/${ctx.media.season.number}/${ctx.media.episode.number}`;
  const response = await ctx.fetcher(url);
  ctx.progress(100);

  if (response.statusCode === 404) {
    throw new NotFoundError('Movie Not Found');
  }

  if (response) return response as SourcererOutput;

  clearInterval(interval);
  throw new NotFoundError('No data found for this movie');
}

export const insertunitScraper = makeSourcerer({
  id: 'insertunit',
  name: 'Insertunit',
  rank: 60,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
