import sqlite3

db_path = 'pokemon_cards.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check table schema for name field constraints
cursor.execute('PRAGMA table_info(cards)')
columns = cursor.fetchall()

print('Cards table schema:')
for col in columns:
    nullable = "NULL" if col[3] == 0 else "NOT NULL"
    default = f" DEFAULT {col[4]}" if col[4] is not None else ""
    print(f'  {col[1]}: {col[2]} {nullable}{default}')

# Check if there are any CHECK constraints
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='cards'")
create_table_sql = cursor.fetchone()
if create_table_sql:
    print(f'\nCreate table SQL:\n{create_table_sql[0]}')

conn.close()