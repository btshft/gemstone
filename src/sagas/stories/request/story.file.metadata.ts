export type StoryFileMetadata = {
  url: string;
  taken_at: number;
  expiring_at: number;
  caption?: string;
  codec?: string;
  type: number;
  duration?: number;
};
