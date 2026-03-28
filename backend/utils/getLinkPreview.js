import ogs from 'open-graph-scraper';

export async function getLinkPreview(url) {
  try {
    const { result } = await ogs({ url, timeout: 5000 });
    if (!result.success) return null;

    return {
      url,
      title: result.ogTitle || '',
      description: result.ogDescription || '',
      image: result.ogImage?.[0]?.url || '',
      siteName: result.ogSiteName || '',
    };
  } catch {
    return null;
  }
}