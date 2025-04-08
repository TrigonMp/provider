import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const embedPage = await ctx.proxiedFetcher(
    `https://vidsrc.su/embed/${ctx.media.type === 'movie' ? `movie/${ctx.media.tmdbId}` : `tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`}`,
  );

  const servers = [...embedPage.matchAll(/label: 'Server (1|2|3|5|7|8|10|11)', url: '(https.*)'/g)] // only server 1,2 and 3 are flixhq
    .sort((a, b) => {
      // ranking for servers
      const ranks: Record<string, number> = {
        '7': 10,
        '11': 20,
        '10': 30,
        '1': 40,
        '3': 50,
        '2': 60,
        '5': 70,
        '8': 80,
      }; // server 8 > 5 > 2 ...
      return ranks[b[1]] - ranks[a[1]];
    })
    .map((x) => x[2]);

  if (!servers[0]) throw new NotFoundError('No flixhq playlist found');

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        playlist: servers[0],
        type: 'hls',
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}
export const vidsrcsuScraper = makeSourcerer({
  id: 'vidsrcsu',
  name: 'vidsrc.su (FlixHQ)',
  rank: 229,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
