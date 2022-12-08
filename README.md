# Setup

1. In one terminal

```sh
docker run -e POSTGRES_USER=root -e POSTGRES_PASSWORD=password -p 5432:5432 postgres
```

2. In another terminal
```sh
npm install
npx prisma generate
npx prisma db push
python3 ingest.py
npm run dev
```

3. Go to http://localhost:4000/graphql
4. Mess around in the playground

## TODO

1. [x] Junction tables need to be tested (need to add pagination to junction tables)
2. Summary filters and sorts need to be applied
3. [x] limit and offset style pagination (maybe only half done see comments in code about maybe needing more sorting)
4. Fix nulls for details having no data
5. respect skip directives for data selection

