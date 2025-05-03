export interface Prompt {
  title: string;
  body: string;
  phaseTags: string[];
  productTags: string[];
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
