import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import jwt from 'jsonwebtoken';

const secret = 'your-secret-key'; // In a real app, use an environment variable

async function openDb() {
  return open({
    filename: './public/users.db',
    driver: sqlite3.Database,
  });
}

export async function POST(request: Request) {
  const { action, cardId, quantity } = await request.json();
  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: number };
    const db = await openDb();

    if (action === 'add') {
      const existingCard = await db.get('SELECT * FROM collections WHERE user_id = ? AND card_id = ?', decoded.userId, cardId);
      if (existingCard) {
        await db.run('UPDATE collections SET quantity = ? WHERE id = ?', existingCard.quantity + quantity, existingCard.id);
      } else {
        await db.run('INSERT INTO collections (user_id, card_id, quantity) VALUES (?, ?, ?)', decoded.userId, cardId, quantity);
      }
      return NextResponse.json({ message: 'Card added to collection' });
    }

    if (action === 'remove') {
      const existingCard = await db.get('SELECT * FROM collections WHERE user_id = ? AND card_id = ?', decoded.userId, cardId);
      if (existingCard) {
        if (existingCard.quantity > quantity) {
          await db.run('UPDATE collections SET quantity = ? WHERE id = ?', existingCard.quantity - quantity, existingCard.id);
        } else {
          await db.run('DELETE FROM collections WHERE id = ?', existingCard.id);
        }
      }
      return NextResponse.json({ message: 'Card removed from collection' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: number };
    const db = await openDb();
    const collection = await db.all('SELECT * FROM collections WHERE user_id = ?', decoded.userId);
    return NextResponse.json({ collection });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}