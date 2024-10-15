const { PostLoader } = require('./postloader');
const { cfg } = require('./test_setup');

// TODO: please mock files!
const fs = require('fs');


test('PostLoader fields method', () => {
    const post = new PostLoader("./posts/test_text.md", cfg);

    /* this post has fields
     *  title: Test post
     *  date: 25 Sep 2024
     *  category: blog_post
     *  tags: test,technical,user-generated,math,compsci
     */

    expect(post.field("title")).toBe("Test post")
    expect(post.field("category")).toBe("blog_post")
    expect(() => post.field("doesnotexist")).toThrow()
    expect(() => post.field(-1)).toThrow(TypeError)
})
