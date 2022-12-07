import { collectionType, relationExtension } from '../utils/nexusBuilder';

export const PostCollection = collectionType({
  name: 'Post',
  definition(t) {
    t.id('id');
    t.string('title');
    t.field('authors', { type: 'Authors', extensions: { ...relationExtension('Author', 'author_id', 'id') } });
  }
});

