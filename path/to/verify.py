import sqlite3

conn = sqlite3.connect('pokemon_cards.db')
print("Total records:", conn.execute("SELECT COUNT(*) FROM card_csv").fetchone()[0])
conn.close()