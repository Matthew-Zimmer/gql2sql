import { collectionType, relationExtension } from '../utils/nexusBuilder';

export const PostCollection = collectionType({
  name: 'Post',
  definition(t) {
    t.id('id');
    t.string('title');
    t.relation('author_id', 'Author', 'id').collection('authors');
  }
});

