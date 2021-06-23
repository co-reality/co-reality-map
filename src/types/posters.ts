export interface Category {
  category: string;
  subcategory: string;
}

export type Poster = {
  authorName: string;
  categories: string[];
  subcategories?: Array<Category>;
  title: string;
  authors?: string[];
  contactEmail?: string;
  introVideoUrl?: string;
  thumbnailUrl?: string;
  keywords?: string[];
  introduction?: string;
  moreInfoUrl?: string;
  moreInfoUrls?: string[];
  moreInfoUrlTitle?: string;
  posterId?: string;
};
