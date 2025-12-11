interface Env {
  /**
   * Binding that serves built assets from ./dist
   */
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

const SPA_FALLBACK_PATH = '/index.html';

function wantsHtml(request: Request) {
  const accept = request.headers.get('accept');
  return accept?.includes('text/html');
}

function isAssetLikePath(url: URL) {
  return url.pathname.includes('.');
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const assetResponse = await env.ASSETS.fetch(request);

    const shouldFallbackToSpa =
      assetResponse.status === 404 &&
      (request.method === 'GET' || request.method === 'HEAD') &&
      wantsHtml(request) &&
      !isAssetLikePath(url);

    if (shouldFallbackToSpa) {
      const rewritten = new Request(new URL(SPA_FALLBACK_PATH, url).toString(), request);
      return env.ASSETS.fetch(rewritten);
    }

    return assetResponse;
  },
};
