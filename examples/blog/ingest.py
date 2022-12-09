import pandas as pd
import os
import psycopg2
from io import StringIO

conn = psycopg2.connect(
  host='localhost',
  port=5432,
  user='root',
  password='password'
)

cur = conn.cursor()

cur.execute("SET session_replication_role = 'replica'")
conn.commit()

for file in os.listdir('data'):
  df = pd.read_csv(f'data/{file}')
  buf = StringIO()
  df.to_csv(buf, index=False, header=False)
  buf.seek(0)
  cur.copy_from(buf, file.split('.')[0], sep=',')
  conn.commit()

cur.execute("SET session_replication_role = 'origin'")
conn.commit()

cur.close()
conn.close()
  