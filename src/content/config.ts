import { defineCollection, z } from 'astro:content';

export const GALLERY_CATEGORY_ORDER = [
  'Hash dry sift',
  'Hash Frozen',
  'Hash Premium Frozen',
  'Hash Static',
  'Hash Premium static',
  'Hash plasma Static',
  'Weed direct Spain',
  'Weed direct USA',
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORY_ORDER)[number];

export const galleryCategorySchema = z.enum(
  GALLERY_CATEGORY_ORDER as unknown as [GalleryCategory, ...GalleryCategory[]],
);

const site = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().default('707'),
    subtitle: z.string().nullable().optional(),
    heroTickerText: z.string().nullable().optional(),
    heroImage: z.string().nullable().optional(),
    vetrinaButtonLabel: z.string().nullable().optional(),
    vetrinaPageLabel: z.string().nullable().optional(),
    homeLinkLabel: z.string().nullable().optional(),
    galleryEmptyText: z.string().nullable().optional(),
    homeFooter: z.string().nullable().optional(),
    vetrinaFooter: z.string().nullable().optional(),
    navLinks: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().nullable().optional(),
          color: z.enum(['amber', 'mint', 'violet', 'rose', 'sky']).nullable().optional(),
        }),
      )
      .default([]),
  }),
});

const gallery = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: galleryCategorySchema,
    media: z.string().nullable().optional(),
    mediaMp4: z.string().nullable().optional(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { site, gallery };
