const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"]);

export const isValidHttpUrl = (value?: string | null): boolean => {
  const trimmed = value?.trim();
  if (!trimmed) return true;

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const isValidYouTubeUrl = (value?: string | null): boolean => {
  const trimmed = value?.trim();
  if (!trimmed) return true;

  if (!isValidHttpUrl(trimmed)) return false;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    if (!YOUTUBE_HOSTS.has(host)) return false;

    if (host === "youtu.be") {
      return url.pathname.length > 1;
    }

    if (url.pathname.startsWith("/watch")) {
      return url.searchParams.has("v");
    }

    return (
      url.pathname.startsWith("/embed/") ||
      url.pathname.startsWith("/shorts/") ||
      url.pathname.startsWith("/live/")
    );
  } catch {
    return false;
  }
};

export const toYouTubeEmbedUrl = (value?: string | null): string => {
  const trimmed = value?.trim();
  if (!trimmed || !isValidYouTubeUrl(trimmed)) return "";

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    if (host === "youtu.be") {
      const videoId = url.pathname.replace(/^\//, "").split("/")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    if (url.pathname.startsWith("/embed/")) {
      const videoId = url.pathname.replace("/embed/", "").split("/")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    if (url.pathname.startsWith("/shorts/")) {
      const videoId = url.pathname.replace("/shorts/", "").split("/")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    if (url.pathname.startsWith("/live/")) {
      const videoId = url.pathname.replace("/live/", "").split("/")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    const videoId = url.searchParams.get("v");
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  } catch {
    return "";
  }
};

export const normalizeExternalUrl = (value?: string | null): string => {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};
