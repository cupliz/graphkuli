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


### Installation
Graphkuli is available as the `graphkuli` package on npm
```sh
$ npm i -g graphkuli
$ graphkuli -o path/directory -d testdb
$ cd directory
$ npm install
$ npm start
```

### Query
Basically, there is 2 type of output in GraphQL, Object and List. GraphKuli is simply using one endpoint to cover both of query.

This query returns a list of data.
```
{
  article{
    id
    title
    active
  }
}
```

And this returns a single object.
```
{
  article(id:6){
    id
    title
    active
  }
}
```

### Filtering
For filtering purpose, use `filter` argument. For a custom operator, use `_` notation in front of the arguments.
Query:
```
{
  article(filter:{
    _title:{like:"al"},
    _user:{gt:"2"},
    active:1
  }){
    id
    title
    active
  }
}
```

### Nested filtering:

You can do nested filtering like this

>(title LIKE '%al%' AND user>2 AND (title IN ('i') OR active=1)) OR user=7

using query like this.

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
    title
    active
  }
}
```

### Mutations

Creating new data is easy as this. 

```
mutation {
  article(do:"create",input:{
    id: 10,
    user: 2,
    title: "Create new article",
    active: 1
  }){
    id
    title
    active
  }
}
```

Or Update:
```
mutation {
  article(do:"update", id:10, input:{
    id: 11,
    user: 3,
    title: "Update existing data",
    active: 1
  }){
    id
    title
    active
  }
}
```

Or Delete:
```
mutation {
  article(do:"delete", id:10){
    id
    title
    active
  }
}
```


### Upcoming Features
- join-monster []
- Add example
- Add demo
- Support relation database postgre[soon], sqlite[soon]
- Support non-relational database [soon]
- Convert single table [soon]
- Pagination with pointer [soon]
- Update schema on database schema changed [soon]

License
----

MIT
