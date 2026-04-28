import fs from 'node:fs';
import path from 'node:path';
import { getCollection, getEntry } from 'astro:content';
import { withBaseUrl } from './withBaseUrl';

export interface SiteSettings {
  title: string;
  subtitle: string | null;
  heroTickerText: string | null;
  heroImage: string | null;
  vetrinaButtonLabel: string | null;
  vetrinaPageLabel: string | null;
  homeLinkLabel: string | null;
  galleryEmptyText: string | null;
  homeFooter: string | null;
  vetrinaFooter: string | null;
  navLinks: Array<{
    label: string;
    url: string | null;
    color: string | null;
  }>;
}

export interface GalleryItemData {
  title: string;
  mediaUrl: string | null;
  mp4Url: string | null;
  pubDate: string;
}

function cleanText(value: string | null | undefined): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : null;
}

function localAssetPath(value: string | null | undefined): string | null {
  const path = cleanText(value);
  return path ? withBaseUrl(path) : null;
}

function mp4SiblingExists(mediaPath: string): string | null {
  const trimmed = mediaPath.trim();
  if (!/\.webm$/i.test(trimmed)) return null;
  const mp4Rel = trimmed.replace(/\.webm$/i, '.mp4').replace(/^\//, '');
  const abs = path.join(process.cwd(), 'public', mp4Rel);
  if (!fs.existsSync(abs)) return null;
  return withBaseUrl(`/${mp4Rel}`);
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const entry = await getEntry('site', 'settings');
  if (!entry) return null;

  return {
    title: cleanText(entry.data.title) ?? '707',
    subtitle: cleanText(entry.data.subtitle),
    heroTickerText: cleanText(entry.data.heroTickerText),
    heroImage: localAssetPath(entry.data.heroImage),
    vetrinaButtonLabel: cleanText(entry.data.vetrinaButtonLabel),
    vetrinaPageLabel: cleanText(entry.data.vetrinaPageLabel),
    homeLinkLabel: cleanText(entry.data.homeLinkLabel),
    galleryEmptyText: cleanText(entry.data.galleryEmptyText),
    homeFooter: cleanText(entry.data.homeFooter),
    vetrinaFooter: cleanText(entry.data.vetrinaFooter),
    navLinks: entry.data.navLinks.map((link) => ({
      label: link.label,
      url: cleanText(link.url),
      color: cleanText(link.color),
    })),
  };
}

export async function getGalleryItems(): Promise<GalleryItemData[]> {
  const items = await getCollection('gallery', ({ data }) => !data.draft);

  return items
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .map((item) => {
      const mediaUrl = localAssetPath(item.data.media);
      const explicitMp4 = localAssetPath(cleanText(item.data.mediaMp4) ?? undefined);
      const rawMedia = cleanText(item.data.media);
      const siblingMp4 =
        explicitMp4 === null && cleanText(item.data.mediaMp4) == null && rawMedia
          ? mp4SiblingExists(rawMedia)
          : null;
      const mp4Url = explicitMp4 ?? siblingMp4;
      return {
        title: item.data.title,
        mediaUrl,
        mp4Url,
        pubDate: item.data.pubDate.toISOString(),
      };
    });
}
