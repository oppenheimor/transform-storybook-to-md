export interface StoriesData {
  meta: MetaData | null;
  storyExports: Story[];
}

export interface MetaData {
  componentDescription?: string;
}

export interface Story {
  name: string;
  type: 'api' | 'demo';
  displayName?: string;
  description?: string;
  code?: string;
}