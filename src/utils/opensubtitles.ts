import { Caption, labelToLanguageCode, removeDuplicatedLanguages } from '@/providers/captions';
import { IndividualEmbedRunnerOptions } from '@/runners/individualRunner';
import { ProviderRunnerOptions } from '@/runners/runner';

function fixJson(jsonStr: string): string {
  let lastIndex = Math.max(jsonStr.lastIndexOf('}'), jsonStr.lastIndexOf(']'));

  // Continue trimming and testing until valid JSON is found
  while (lastIndex > -1) {
    try {
      const testJson = jsonStr.substring(0, lastIndex + 1);
      JSON.parse(testJson); // Test if the JSON is valid
      return testJson; // If valid, return the fixed JSON
    } catch (e) {
      // Move the last index back and keep trimming
      lastIndex = Math.max(jsonStr.lastIndexOf('}', lastIndex - 1), jsonStr.lastIndexOf(']', lastIndex - 1));
    }
  }

  // As a last resort, return an empty array if no valid JSON could be extracted
  return '[]';
}

export async function addOpenSubtitlesCaptions(
  captions: Caption[],
  ops: ProviderRunnerOptions | IndividualEmbedRunnerOptions,
  media: string,
): Promise<Caption[]> {
  try {
    const [imdbId, season, episode] = atob(media)
      .split('.')
      .map((x, i) => (i === 0 ? x : Number(x) || null));
    if (!imdbId) return captions;
    // Ensure imdbId is treated as a string and slice it properly
    const apiUrl = `https://subs.whvx.net/search?id=${String(imdbId)}${
      season && episode ? `&season=${season}&episode=${episode}` : ''
    }`;

    const rawResponse = await ops.proxiedFetcher(apiUrl, {
      headers: {
        'X-User-Agent': 'VLSub 0.10.2',
      },
    });

    // Try to fix the JSON if needed
    const jsonResponse = fixJson(typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse));
    const Res = JSON.parse(jsonResponse);

    const openSubtitlesCaptions: Caption[] = [];
    for (const caption of Res) {
      // Retain the original SubDownloadLink, just adjust encoding in the link
      const url = caption.url;
      const language = caption.language;
      if (!url || !language) continue;
      openSubtitlesCaptions.push({
        id: url,
        opensubtitles: true,
        url,
        type: caption.format || 'srt',
        hasCorsRestrictions: false,
        language,
      });
    }
    return [...captions, ...removeDuplicatedLanguages(openSubtitlesCaptions)];
  } catch (e) {
    console.error('Error processing OpenSubtitles captions:', e);
    return captions;
  }
}
