import { collectionType } from 'gql2sql';

export const AuthorCollection = collectionType({
  name: 'Author',
  definition(t) {
    t.id('id');

    t.alias('first_name').
      string('firstName');

    t.alias('last_name').
      string('lastName');

    t.relation('id', 'AuthorToPost', 'author_id').
      relation('post_id', 'Post', 'id').
      collection('posts');
  }
});
