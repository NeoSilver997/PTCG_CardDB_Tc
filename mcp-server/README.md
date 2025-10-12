# Pokemon Cards MCP Server

This is a Model Context Protocol (MCP) server that provides access to a SQLite database of Pokemon card data.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure the database file `../pokemon_cards.db` exists.

3. Run the server:
   ```bash
   npm start
   ```

## Available Tools

- **search_cards**: Search for cards by name, rarity, expansion, or type.
- **get_card_details**: Get full details for a specific card.
- **get_card_abilities**: Get abilities for a card.
- **get_card_skills**: Get skills/attacks for a card.
- **get_card_evolutions**: Get evolution chain for a card.
- **get_expansions**: List all expansions.
- **get_illustrators**: List all illustrators.

## Database Schema

The server connects to `pokemon_cards.db` with the following tables:
- cards
- expansions
- illustrators
- abilities
- skills
- evolutions
- subtypes

## Usage with MCP Clients

Configure your MCP client to use this server by specifying the command to run the server.