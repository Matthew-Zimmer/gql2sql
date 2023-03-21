import { collectionType } from 'gql2sql';

export const PostCollection = collectionType({
  name: 'Post',
  definition(t) {
    t.id('id');

    t.string('title');

    t.relation('id', 'AuthorToPost', 'post_id').
      relation('author_id', 'Author', 'id').
      field('author', { type: "Author" });
  }
});

