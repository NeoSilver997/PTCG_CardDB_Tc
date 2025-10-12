---
applyTo: '**'
---
# Pokemon TCG Card Database Data Dictionary

This document provides a comprehensive data dictionary for the Pokemon TCG Card Database, detailing all tables, columns, relationships, and data constraints.

## Database Overview

The database consists of two main SQLite files:
- `pokemon_cards.db`: Main normalized database with separate tables for different entities
- `PTCG_Web/public/ptcg_cards.db`: Web application database with flattened card data

## Table: cards (pokemon_cards.db)

**Purpose**: Main card information table containing core Pokemon card data.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | No | Primary key, unique card identifier |
| name | TEXT | No | Card name in Chinese |
| evolution_stage | TEXT | Yes | Evolution stage (基礎/1階進化/2階進化) |
| web_card_id | TEXT | Yes | Web service card identifier |
| image_url | TEXT | Yes | Full URL to card image |
| card_type | TEXT | No | Card type (寶可夢/物品卡/支援者/競技場) |
| hp | INTEGER | Yes | Hit points (Pokemon cards only) |
| attribute | TEXT | Yes | Pokemon type/element |
| weakness | TEXT | Yes | Weakness value (e.g., "×2") |
| weakness_type | TEXT | Yes | Weakness type (e.g., 火) |
| resistance | TEXT | Yes | Resistance value (e.g., "-30") |
| resistance_type | TEXT | Yes | Resistance type |
| retreat_cost | INTEGER | Yes | Number of energy required to retreat |
| collector_number | TEXT | Yes | Card number in expansion (e.g., "001/100") |
| rarity | TEXT | Yes | Card rarity (C/H/R/U/S/SR/AR) |
| expansion_id | INTEGER | Yes | Foreign key to expansions table |
| illustrator_id | INTEGER | Yes | Foreign key to illustrators table |
| pokemon_info | TEXT | Yes | Additional Pokemon information |
| tier | TEXT | Yes | Card tier/ranking |
| score | REAL | Yes | Card score/rating |
| score_breakdown | TEXT | Yes | Detailed score breakdown (JSON format) |
| primary_effect_type | TEXT | Yes | Primary effect classification |
| special_effect_type | TEXT | Yes | Special effect classification |

**Relationships**:
- `expansion_id` → `expansions.id`
- `illustrator_id` → `illustrators.id`

**Constraints**:
- Primary key: `id`
- Foreign keys enforce referential integrity

## Table: skills (pokemon_cards.db)

**Purpose**: Pokemon attack/move information.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | No | Primary key, unique skill identifier |
| card_id | INTEGER | No | Foreign key to cards table |
| skill_number | INTEGER | No | Skill number (1 or 2 for attacks) |
| name | TEXT | Yes | Skill/attack name |
| cost | TEXT | Yes | Energy cost (e.g., "無火火") |
| damage | TEXT | Yes | Damage value (e.g., "30", "30+") |
| effect | TEXT | Yes | Skill effect description |

**Relationships**:
- `card_id` → `cards.id`

**Constraints**:
- Primary key: `id`
- Foreign key: `card_id` references `cards.id`

## Table: abilities (pokemon_cards.db)

**Purpose**: Pokemon ability information.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | No | Primary key, unique ability identifier |
| card_id | INTEGER | No | Foreign key to cards table |
| name | TEXT | Yes | Ability name |
| description | TEXT | Yes | Ability effect description |

**Relationships**:
- `card_id` → `cards.id`

**Constraints**:
- Primary key: `id`
- Foreign key: `card_id` references `cards.id`

## Table: evolutions (pokemon_cards.db)

**Purpose**: Pokemon evolution chain information.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | No | Primary key, unique evolution record |
| card_id | INTEGER | No | Foreign key to cards table |
| evolution | TEXT | Yes | Evolution target card name |

**Relationships**:
- `card_id` → `cards.id`

**Constraints**:
- Primary key: `id`
- Foreign key: `card_id` references `cards.id`

## Table: subtypes (pokemon_cards.db)

**Purpose**: Pokemon subtype classifications (Ancient, Future, etc.).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | No | Primary key, unique subtype record |
| card_id | INTEGER | No | Foreign key to cards table |
| subtype | TEXT | Yes | Subtype classification |

**Relationships**:
- `card_id` → `cards.id`

**Constraints**:
- Primary key: `id`
- Foreign key: `card_id` references `cards.id`

## Table: primary_cards (pokemon_cards.db)

**Purpose**: Primary card effect classifications.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | No | Primary key |
| name | TEXT | Yes | Card name |
| skill_name | TEXT | Yes | Primary skill/ability name |
| primary_card_id | INTEGER | Yes | Reference to main card |

## Table: expansions (pokemon_cards.db)

**Purpose**: Card expansion/set information.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | No | Primary key, unique expansion identifier |
| name | TEXT | Yes | Expansion name in Chinese |
| code | TEXT | Yes | Expansion code (e.g., "AC1a") |
| mark | TEXT | Yes | Regulation mark |

**Constraints**:
- Primary key: `id`

## Table: illustrators (pokemon_cards.db)

**Purpose**: Card illustrator information.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | INTEGER | No | Primary key, unique illustrator identifier |
| name | TEXT | Yes | Illustrator name |

**Constraints**:
- Primary key: `id`

## Table: cards (PTCG_Web/public/ptcg_cards.db)

**Purpose**: Flattened card data for web application (single table design).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Name | TEXT | Yes | Card name |
| EvolutionStage | TEXT | Yes | Evolution stage |
| CardID | INTEGER | Yes | Card identifier |
| ImageURL | TEXT | Yes | Image URL |
| CardType | TEXT | Yes | Card type |
| HP | INTEGER | Yes | Hit points |
| Type | TEXT | Yes | Pokemon type |
| AbilityName | TEXT | Yes | Pokemon ability name |
| AbilityEffect | TEXT | Yes | Ability effect description |
| Skill1Name | TEXT | Yes | First attack/skill name |
| Skill1Energy | TEXT | Yes | First skill energy cost |
| Skill1Damage | TEXT | Yes | First skill damage |
| Skill1Effect | TEXT | Yes | First skill effect |
| Skill2Name | TEXT | Yes | Second attack/skill name |
| Skill2Energy | TEXT | Yes | Second skill energy cost |
| Skill2Damage | TEXT | Yes | Second skill damage |
| Skill2Effect | TEXT | Yes | Second skill effect |
| Weakness | REAL | Yes | Weakness value |
| WeaknessType | TEXT | Yes | Weakness type |
| Resistance | REAL | Yes | Resistance value |
| ResistanceType | TEXT | Yes | Resistance type |
| RetreatCost | REAL | Yes | Retreat cost |
| CollectorNumber | TEXT | Yes | Collector number |
| Rarity | TEXT | Yes | Card rarity |
| RegulationMark | TEXT | Yes | Regulation mark |
| ExpansionName | TEXT | Yes | Expansion name |
| ExpansionCode | TEXT | Yes | Expansion code |
| Illustrator | TEXT | Yes | Illustrator name |
| PokemonInfo | TEXT | Yes | Pokemon information |
| Evolution | TEXT | Yes | Evolution information |
| Subtypes | TEXT | Yes | Subtype classifications |
| Artist | TEXT | Yes | Artist name (duplicate of Illustrator) |
| PrimaryEffectType | TEXT | Yes | Primary effect type |
| SpecialEffectType | TEXT | Yes | Special effect type |
| AbilityStats | TEXT | Yes | Ability statistics |
| Tier | TEXT | Yes | Card tier |
| Score | TEXT | Yes | Card score |
| ScoreBreakdown | TEXT | Yes | Score breakdown |
| SpecialTag | TEXT | Yes | Special tags |

## Data Types and Constraints

### Common Data Types
- **INTEGER**: Whole numbers (IDs, HP, counts)
- **REAL**: Decimal numbers (scores, damage modifiers)
- **TEXT**: String data (names, descriptions, codes)

### Card Type Values
- `寶可夢`: Pokemon cards
- `物品卡`: Item cards
- `支援者`: Supporter cards
- `競技場`: Stadium cards

### Rarity Values
- `C`: Common
- `R`: Rare
- `U`: Uncommon
- `S`: Secret Rare
- `SR`: Secret Rare (8)
- `AR`: Amazing Rare (14)
- `RR`: Rare (4)
- `MUR`: Mega Ultra Rare (20)
- `BWR`: Black White Rare (19)
- `ACE`: ACE Spec (18)
- `SSR`: Super Secret Rare (17)
- `UR`: Ultra Rare (10)
- `SAR`: Special Amazing Rare (15)

**Rarity Scoring System**:
```
rarities = {
    "AR": "14",   # Amazing Rare
    "SR": "8",    # Super Secret Rare
    "RR": "4",    # Rare
    "MUR": "20",  # Ultra Rare
    "BWR": "19",  # Rare
    "ACE": "18",  # ACE SPEC
    "SSR": "17",  # Super Secret Rare
    "UR": "10"    # Ultra Rare
}
```

### Evolution Stage Values
- `基礎`: Basic
- `1階進化`: Stage 1 Evolution
- `2階進化`: Stage 2 Evolution

## Database Relationships

```
expansions (1) ──── (many) cards
illustrators (1) ─── (many) cards
cards (1) ──── (many) skills
cards (1) ──── (many) abilities
cards (1) ──── (many) evolutions
cards (1) ──── (many) subtypes
```

## Data Validation Rules

### Deck Construction Rules
- Maximum 4 copies of same non-basic energy card by name
- Unlimited basic energy cards
- Only 1 ACE SPEC card total per deck
- 60 cards minimum per deck

### Card Data Integrity
- Pokemon cards must have HP values
- Evolution cards must reference valid basic forms
- Skill costs must match valid energy types
- Weakness/resistance values must be valid multipliers

## Indexing Strategy

**Recommended Indexes**:
- `cards.name` (for name searches)
- `cards.card_type` (for type filtering)
- `cards.expansion_id` (for expansion filtering)
- `cards.rarity` (for rarity filtering)
- `skills.card_id` (for skill lookups)
- `abilities.card_id` (for ability lookups)

## Data Import/Export

### Source Data Files
- `PTCG_Web/source/cards_output_all_mega.csv`: Primary card data source
- `masterdb/all_cards.json`: JSON format card data
- `PTCG_Web/data/decks.json`: Deck construction data

### Data Processing Scripts
- `csv_to_sqlite.py`: CSV to SQLite conversion
- `html_to_sqlite.py`: HTML scraping to database
- `optimize_db.py`: Database optimization and cleanup

This data dictionary serves as the authoritative reference for database structure, relationships, and data integrity rules for the Pokemon TCG Card Database project.