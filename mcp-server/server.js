const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'pokemon_cards.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

// MCP Server implementation
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class PokemonCardsServer {
  constructor() {
    this.server = new Server(
      {
        name: 'pokemon-cards-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // Tool: call
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'search_cards':
          return this.searchCards(args);
        case 'get_card_details':
          return this.getCardDetails(args);
        case 'get_card_abilities':
          return this.getCardAbilities(args);
        case 'get_card_skills':
          return this.getCardSkills(args);
        case 'get_card_evolutions':
          return this.getCardEvolutions(args);
        case 'get_expansions':
          return this.getExpansions(args);
        case 'get_illustrators':
          return this.getIllustrators(args);
        case 'get_max_damage':
          return this.getMaxDamage(args);
        case 'get_summary':
          return this.getSummary(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_cards',
            description: 'Search for Pokemon cards by name, rarity, expansion, or type.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query for card name' },
                rarity: { type: 'string', description: 'Filter by rarity (e.g., AR, SR)' },
                expansion: { type: 'string', description: 'Filter by expansion name' },
                card_type: { type: 'string', description: 'Filter by card type (e.g., 寶可夢, 物品卡)' },
                limit: { type: 'number', description: 'Maximum number of results', default: 10 }
              }
            }
          },
          {
            name: 'get_card_details',
            description: 'Get detailed information for a specific card.',
            inputSchema: {
              type: 'object',
              properties: {
                card_id: { type: 'number', description: 'Card ID' },
                web_card_id: { type: 'string', description: 'Web Card ID' }
              },
              oneOf: [{ required: ['card_id'] }, { required: ['web_card_id'] }]
            }
          },
          {
            name: 'get_card_abilities',
            description: 'Get abilities for a specific card.',
            inputSchema: {
              type: 'object',
              properties: {
                card_id: { type: 'number', description: 'Card ID' }
              },
              required: ['card_id']
            }
          },
          {
            name: 'get_card_skills',
            description: 'Get skills (attacks) for a specific card.',
            inputSchema: {
              type: 'object',
              properties: {
                card_id: { type: 'number', description: 'Card ID' }
              },
              required: ['card_id']
            }
          },
          {
            name: 'get_card_evolutions',
            description: 'Get evolution chain for a specific card.',
            inputSchema: {
              type: 'object',
              properties: {
                card_id: { type: 'number', description: 'Card ID' }
              },
              required: ['card_id']
            }
          },
          {
            name: 'get_expansions',
            description: 'List all expansions.',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_illustrators',
            description: 'List all illustrators.',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_max_damage',
            description: 'Get the highest damage value and the card/skill that has it.',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_summary',
            description: 'Get summary statistics of the Pokemon card database.',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });
  }

  async searchCards(args) {
    const { query, rarity, expansion, card_type, limit = 10 } = args;
    let sql = `
      SELECT c.id, c.name, c.rarity, e.name as expansion, c.card_type
      FROM cards c
      LEFT JOIN expansions e ON c.expansion_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (query) {
      sql += ' AND c.name LIKE ?';
      params.push(`%${query}%`);
    }
    if (rarity) {
      sql += ' AND c.rarity = ?';
      params.push(rarity);
    }
    if (expansion) {
      sql += ' AND e.name LIKE ?';
      params.push(`%${expansion}%`);
    }
    if (card_type) {
      sql += ' AND c.card_type = ?';
      params.push(card_type);
    }

    sql += ` LIMIT ${limit}`;

    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] });
      });
    });
  }

  async getCardDetails(args) {
    const { card_id, web_card_id } = args;
    let sql = `
      SELECT c.*, e.name as expansion_name, i.name as illustrator_name
      FROM cards c
      LEFT JOIN expansions e ON c.expansion_id = e.id
      LEFT JOIN illustrators i ON c.illustrator_id = i.id
      WHERE
    `;
    const params = [];

    if (card_id) {
      sql += ' c.id = ?';
      params.push(card_id);
    } else if (web_card_id) {
      sql += ' c.web_card_id = ?';
      params.push(web_card_id);
    }

    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve({ content: [{ type: 'text', text: JSON.stringify(row, null, 2) }] });
      });
    });
  }

  async getCardAbilities(args) {
    const { card_id } = args;
    const sql = 'SELECT * FROM abilities WHERE card_id = ?';

    return new Promise((resolve, reject) => {
      db.all(sql, [card_id], (err, rows) => {
        if (err) reject(err);
        else resolve({ content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] });
      });
    });
  }

  async getCardSkills(args) {
    const { card_id } = args;
    const sql = 'SELECT * FROM skills WHERE card_id = ? ORDER BY skill_number';

    return new Promise((resolve, reject) => {
      db.all(sql, [card_id], (err, rows) => {
        if (err) reject(err);
        else resolve({ content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] });
      });
    });
  }

  async getCardEvolutions(args) {
    const { card_id } = args;
    const sql = 'SELECT * FROM evolutions WHERE card_id = ?';

    return new Promise((resolve, reject) => {
      db.all(sql, [card_id], (err, rows) => {
        if (err) reject(err);
        else resolve({ content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] });
      });
    });
  }

  async getExpansions(args) {
    const sql = 'SELECT * FROM expansions';

    return new Promise((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve({ content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] });
      });
    });
  }

  async getIllustrators(args) {
    const sql = 'SELECT * FROM illustrators';

    return new Promise((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve({ content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] });
      });
    });
  }

  async getMaxDamage(args) {
    const sql = `
      SELECT c.name, s.name as skill_name, s.damage, CAST(SUBSTR(s.damage, 1, INSTR(s.damage || ' ', ' ') - 1) AS INTEGER) as damage_num
      FROM skills s
      JOIN cards c ON s.card_id = c.id
      WHERE s.damage != '' AND s.damage IS NOT NULL AND damage_num IS NOT NULL
      ORDER BY damage_num DESC
      LIMIT 1
    `;

    return new Promise((resolve, reject) => {
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve({ content: [{ type: 'text', text: JSON.stringify(row, null, 2) }] });
      });
    });
  }

  async getSummary(args) {
    const summary = {};

    return new Promise((resolve, reject) => {
      // Get total cards
      db.get('SELECT COUNT(*) as total_cards FROM cards', [], (err, row) => {
        if (err) return reject(err);
        summary.total_cards = row.total_cards;

        // Get total expansions
        db.get('SELECT COUNT(*) as total_expansions FROM expansions', [], (err, row) => {
          if (err) return reject(err);
          summary.total_expansions = row.total_expansions;

          // Get total illustrators
          db.get('SELECT COUNT(*) as total_illustrators FROM illustrators', [], (err, row) => {
            if (err) return reject(err);
            summary.total_illustrators = row.total_illustrators;

            // Get rarity distribution
            db.all('SELECT rarity, COUNT(*) as count FROM cards GROUP BY rarity ORDER BY count DESC', [], (err, rows) => {
              if (err) return reject(err);
              summary.rarity_distribution = rows;

              // Get card type distribution
              db.all('SELECT card_type, COUNT(*) as count FROM cards GROUP BY card_type ORDER BY count DESC', [], (err, rows) => {
                if (err) return reject(err);
                summary.card_type_distribution = rows;

                resolve({ content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] });
              });
            });
          });
        });
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Pokemon Cards MCP Server running...');
  }
}

// Run the server
const server = new PokemonCardsServer();
server.run().catch(console.error);