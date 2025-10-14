import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const saltRounds = 10;
const secret = 'your-secret-key'; // In a real app, use an environment variable

async function openDb() {
  return open({
    filename: './public/users.db',
    driver: sqlite3.Database,
  });
}

export async function POST(request: Request) {
  const { action, username, password } = await request.json();
  const db = await openDb();

  if (action === 'register') {
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const result = await db.run('INSERT INTO users (username, password) VALUES (?, ?)', username, hashedPassword);
      return NextResponse.json({ message: 'User registered successfully', userId: result.lastID });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
  }

  if (action === 'login') {
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, secret, { expiresIn: '1h' });
    return NextResponse.json({ token });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}