# GraphKuli


GraphKuli is a GraphQL framework to generate API from Database using GraphQL language.

- Connect and convert existing database into API
- Schema in form of graphql language
- Support relational database MySQL
- CRUD without a headache
- Less endpoint, more data to show
- Filtering easily
- Unlimited nested AND, OR filtering 
- Pagination with offset and limit
- Basic auth as default

You can also:
  - Remove and replace basic auth with your favourite auth library
  - 


> The overriding design goal for Markdown's
> formatting syntax is to make it as readable
> as possible. The idea is that a
> Markdown-formatted document should be
> publishable as-is, as plain text, without
> looking like it's been marked up with tags
> or formatting instructions.

### Installation
Graphkuli is available as the `graphkuli` package on npm
```sh
$ npm i -g graphkuli
$ graphkuli -o path/directory -d testdb
$ cd directory
$ npm install
$ npm start
```

### Filtering
For filtering purpose, use `filter` argument. For a custom operator, use `_` notation in front of the arguments.
```
{
  article(filter:{
    _title:{like:"al"},
    _user:{gt:"2"},
    active:1
  }){
    id
    user
    title
    active
}
```

Nested filtering:
```
(title LIKE '%al%' AND user>2 AND (title IN ('i') OR active=1)) OR user=7
```

Query:
```
{
  article(filter:{
    OR:{
      user:7,
      AND:{
        _title:{like:"al"},
        _user:{gt:"2"},
        OR:{
          _title:{in:"i"},
          active: 1,
        }
    }
    }
  }){
    id
    user
    title
    active
  }
}
```

Operator:
- like
- in
- notin
- gt
- gte
- lt
- lte

### Pagination
- limit
- offset
- orderBy
```
{
  article(limit:5,offset:2, orderBy:"id_desc"){
    id
    user
    title
    active
  }
}
```


### Upcoming Features
- Support relation database postgre[soon], sqlite[soon]
- Support non-relational database [soon]
- Convert single table [soon]
- Pagination with pointer [soon]
- Update schema on database schema changed [soon]

License
----

MIT
