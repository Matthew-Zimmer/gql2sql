import { collectionType, relationExtension } from '../utils/nexusBuilder';

export const AuthorCollection = collectionType({
  name: 'Author',
  definition(t) {
    t.id('id');
    t.alias('first_name').string('firstName');
    t.alias('last_name').string('lastName');
    t.relation('id', 'Post', 'author_id').collection('posts');
  }
});
