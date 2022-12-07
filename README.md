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

1. Junction tables need to be tested
2. Summary filters and sorts need to be applied
3. limit and offset style pagination

