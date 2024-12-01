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

  const urlEncodedTitle = encodeURIComponent(ctx.media.title);
  const urlEncodedReleaseYear = encodeURIComponent(ctx.media.releaseYear);
  let url = `https://ntflx.wafflehacker.io/scrape?title=${urlEncodedTitle}&type=${ctx.media.type}&releaseYear=${urlEncodedReleaseYear}`;
  if (ctx.media.type === 'show') url += `&season=${ctx.media.season.number}&episode=${ctx.media.episode.number}`;
  const response = await ctx.fetcher(url);
  ctx.progress(100);

  if (response.statusCode === 404) {
    throw new NotFoundError('Movie Not Found');
  }

  if (response) return response as SourcererOutput;

  clearInterval(interval);
  throw new NotFoundError('No data found for this movie');
}

export const netMirrorScraper = makeSourcerer({
  id: 'netmirror',
  name: 'NTFLX',
  rank: 130,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
