import sqlite3
import time
import os

# Database path
DB_PATH = 'x:\\Document\\PokemonDBDownload\\pokemon_cards.db'

def connect_db():
    """Create a connection to the database with optimized settings"""
    try:
        # Use timeout to handle locked database
        conn = sqlite3.connect(DB_PATH, timeout=30.0)
        # Enable foreign keys
        conn.execute('PRAGMA foreign_keys = ON')
        # Use a less aggressive journal mode to avoid locks
        conn.execute('PRAGMA journal_mode = DELETE')
        # Set synchronous mode to NORMAL for better performance
        conn.execute('PRAGMA synchronous = NORMAL')
        # Set cache size to 5000 pages (about 20MB)
        conn.execute('PRAGMA cache_size = 5000')
        # Set temp store to memory
        conn.execute('PRAGMA temp_store = MEMORY')
        return conn
    except sqlite3.OperationalError as e:
        print(f"Database connection error: {str(e)}")
        print("Trying alternative connection method...")
        # Try with minimal settings if the database is locked
        conn = sqlite3.connect(DB_PATH, timeout=60.0)
        return conn

def analyze_db_structure(conn):
    """Analyze database structure and print table information"""
    print("\n=== Database Structure Analysis ===")
    
    # Get list of tables
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print(f"Found {len(tables)} tables:")
    for table in tables:
        table_name = table[0]
        print(f"\nTable: {table_name}")
        
        # Get column info
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        print(f"Columns: {len(columns)}")
        for col in columns:
            col_id, name, type_name, notnull, default_val, pk = col
            pk_str = "PRIMARY KEY" if pk else ""
            print(f"  - {name} ({type_name}) {pk_str}")
        
        # Get index info
        cursor.execute(f"PRAGMA index_list({table_name})")
        indexes = cursor.fetchall()
        print(f"Indexes: {len(indexes)}")
        for idx in indexes:
            idx_name = idx[1]
            print(f"  - {idx_name}")
            
        # Count rows
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        row_count = cursor.fetchone()[0]
        print(f"Row count: {row_count}")

def analyze_query_performance(conn):
    """Analyze query performance for common operations"""
    print("\n=== Query Performance Analysis ===")
    cursor = conn.cursor()
    
    # Test queries
    test_queries = [
        ("SELECT * FROM card_csv LIMIT 100", "Simple SELECT"),
        ("SELECT * FROM card_csv WHERE name LIKE '%Pikachu%'", "Name search"),
        ("SELECT * FROM card_csv WHERE expansion = 'SV1a'", "Expansion filter"),
        ("SELECT * FROM card_csv WHERE attribute = 'Fire'", "Attribute filter"),
        ("SELECT * FROM card_csv WHERE hp > 100", "HP filter"),
        ("SELECT * FROM card_csv WHERE name LIKE '%Pikachu%' AND attribute = 'Electric'", "Combined filter")
    ]
    
    for query, description in test_queries:
        try:
            start_time = time.time()
            cursor.execute(query)
            results = cursor.fetchall()
            end_time = time.time()
            print(f"{description}: {end_time - start_time:.4f}s, {len(results)} results")
        except Exception as e:
            print(f"{description}: Error - {str(e)}")

def create_indexes(conn):
    """Create indexes on commonly queried columns"""
    print("\n=== Creating Indexes ===")
    cursor = conn.cursor()
    
    # Define indexes to create
    indexes = [
        ("card_csv", "name_idx", "name"),
        ("card_csv", "expansion_idx", "expansion"),
        ("card_csv", "attribute_idx", "attribute"),
        ("card_csv", "hp_idx", "hp"),
        ("card_csv", "web_card_id_idx", "web_card_id"),
        ("card_csv", "card_type_idx", "card_type"),
        # Composite indexes for common query combinations
        ("card_csv", "name_attr_idx", "name, attribute"),
        ("card_csv", "expansion_attr_idx", "expansion, attribute")
    ]
    
    for table, index_name, columns in indexes:
        try:
            start_time = time.time()
            cursor.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table}({columns})")
            end_time = time.time()
            print(f"Created index {index_name} on {table}({columns}) in {end_time - start_time:.4f}s")
        except Exception as e:
            print(f"Error creating index {index_name}: {str(e)}")
    
    conn.commit()

def optimize_database(conn):
    """Run VACUUM and ANALYZE to optimize the database"""
    print("\n=== Optimizing Database ===")
    cursor = conn.cursor()
    
    try:
        print("Running ANALYZE...")
        start_time = time.time()
        cursor.execute("ANALYZE")
        end_time = time.time()
        print(f"ANALYZE completed in {end_time - start_time:.4f}s")
        
        print("Running VACUUM...")
        start_time = time.time()
        cursor.execute("VACUUM")
        end_time = time.time()
        print(f"VACUUM completed in {end_time - start_time:.4f}s")
    except Exception as e:
        print(f"Error optimizing database: {str(e)}")

def main():
    print("=== Pokemon Card Database Optimization Tool ===")
    print(f"Database: {DB_PATH}")
    
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}")
        return
    
    # Connect to database with retry mechanism
    max_retries = 3
    retry_count = 0
    conn = None
    
    while retry_count < max_retries:
        try:
            print(f"Connecting to database (attempt {retry_count + 1}/{max_retries})...")
            conn = connect_db()
            break
        except Exception as e:
            retry_count += 1
            print(f"Connection attempt {retry_count} failed: {str(e)}")
            if retry_count >= max_retries:
                print("Maximum retries reached. Could not connect to database.")
                return
            time.sleep(2)  # Wait before retrying
    
    if not conn:
        print("Failed to establish database connection.")
        return
    
    try:
        # Analyze database structure
        try:
            analyze_db_structure(conn)
        except Exception as e:
            print(f"Error analyzing database structure: {str(e)}")
        
        # Analyze query performance before optimization
        try:
            print("\nPerformance before optimization:")
            analyze_query_performance(conn)
        except Exception as e:
            print(f"Error analyzing query performance: {str(e)}")
        
        # Create indexes
        try:
            create_indexes(conn)
        except Exception as e:
            print(f"Error creating indexes: {str(e)}")
            # Try to continue with other optimizations
        
        # Optimize database
        try:
            optimize_database(conn)
        except Exception as e:
            print(f"Error optimizing database: {str(e)}")
        
        # Analyze query performance after optimization
        try:
            print("\nPerformance after optimization:")
            analyze_query_performance(conn)
        except Exception as e:
            print(f"Error analyzing post-optimization performance: {str(e)}")
        
        print("\n=== Optimization Complete ===")
        print("The database has been optimized with the following improvements:")
        print("1. Added indexes on frequently queried columns")
        print("2. Set optimal PRAGMA settings for better performance")
        print("3. Ran ANALYZE to update statistics")
        print("4. Ran VACUUM to defragment the database")
        print("\nThese optimizations should significantly improve query performance.")
        
    except Exception as e:
        print(f"Unexpected error during optimization: {str(e)}")
    finally:
        if conn:
            try:
                conn.close()
                print("Database connection closed successfully.")
            except Exception as e:
                print(f"Error closing database connection: {str(e)}")


if __name__ == "__main__":
    main()