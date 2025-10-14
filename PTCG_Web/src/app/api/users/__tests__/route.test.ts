import { POST } from '../route';
import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('sqlite');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options ? options.status : 200,
    })),
  },
}));

const saltRounds = 10;
const secret = 'your-secret-key';

describe('POST /api/users', () => {
  let db: any;

  beforeEach(() => {
    db = {
      run: jest.fn(),
      get: jest.fn(),
    };
    (open as jest.Mock).mockResolvedValue(db);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user', async () => {
    const hashedPassword = 'hashedPassword';
    (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
    db.run.mockResolvedValue({ lastID: 1 });

    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ action: 'register', username: 'testuser', password: 'password' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('User registered successfully');
    expect(body.userId).toBe(1);
    expect(bcrypt.hash).toHaveBeenCalledWith('password', saltRounds);
    expect(db.run).toHaveBeenCalledWith('INSERT INTO users (username, password) VALUES (?, ?)', 'testuser', hashedPassword);
  });

  it('should return an error if username already exists', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    db.run.mockRejectedValue({ code: 'SQLITE_CONSTRAINT' });

    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ action: 'register', username: 'testuser', password: 'password' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('Username already exists');
  });

  it('should login an existing user', async () => {
    const user = { id: 1, username: 'testuser', password: 'hashedPassword' };
    db.get.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('token');

    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', username: 'testuser', password: 'password' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.token).toBe('token');
    expect(db.get).toHaveBeenCalledWith('SELECT * FROM users WHERE username = ?', 'testuser');
    expect(bcrypt.compare).toHaveBeenCalledWith('password', user.password);
    expect(jwt.sign).toHaveBeenCalledWith({ userId: user.id, username: user.username }, secret, { expiresIn: '1h' });
  });

  it('should return an error for invalid login credentials', async () => {
    db.get.mockResolvedValue(null);

    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', username: 'testuser', password: 'password' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid username or password');
  });

  it('should return an error for invalid action', async () => {
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid action');
  });
});