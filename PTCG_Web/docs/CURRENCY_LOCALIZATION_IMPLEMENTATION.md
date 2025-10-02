# Currency Localization Implementation

## Overview
The market price system now automatically detects card regions/languages and sets appropriate default currencies:
- **HKD (Hong Kong Dollar)** for Chinese cards
- **JPY (Japanese Yen)** for Japanese cards  
- **USD (US Dollar)** for English/other cards

## Features Implemented

### 1. Automatic Currency Detection
The system analyzes cards to determine appropriate currency:

#### Detection Logic (Priority Order):
1. **Expansion Code Analysis**: Checks for region indicators (hk, tw, cn, jp, en, us)
2. **Card Name Language**: Detects Chinese/Japanese characters
3. **Expansion Name Language**: Analyzes expansion name for language patterns
4. **Regional Patterns**: Recognizes common regional expansion names

#### Currency Mapping:
- **Chinese Cards → HKD**: Cards with Chinese characters or Hong Kong/Taiwan/China region codes
- **Japanese Cards → JPY**: Cards with Japanese characters or Japan region codes  
- **English Cards → USD**: English cards or fallback default

### 2. Enhanced Currency Support

#### Added HKD Support:
- Hong Kong Dollar added to all currency dropdowns
- Proper currency symbol display (HK$)
- First position in Market page dropdown (common for Chinese card collections)

#### Currency Symbols:
- **USD**: $ (US Dollar)
- **HKD**: HK$ (Hong Kong Dollar)  
- **JPY**: ¥ (Japanese Yen)
- **EUR**: € (Euro)
- **GBP**: £ (British Pound)

### 3. Updated User Interface

#### Card Detail Modal:
- Currency automatically set based on card region when opening price form
- Currency dropdown shows symbols and currency codes
- Form resets maintain card-specific currency

#### Market Page:
- HKD set as default for new price entries
- Enhanced currency dropdown with symbols
- Price displays show appropriate currency symbols
- All price history shows correct currency formatting

## Technical Implementation

### New Utility Functions (`src/utils/currency.ts`):

```typescript
// Detects appropriate currency for a card
getDefaultCurrencyForCard(card: PTCGCard): string

// Gets currency symbol for display  
getCurrencySymbol(currency: string): string

// Gets currency name for display
getCurrencyName(currency: string): string
```

### Detection Algorithm:
1. **Expansion Code Check**: `hk|tw|cn` → HKD, `jp|ja` → JPY, `en|us|na` → USD
2. **Character Analysis**: Chinese characters → HKD, Japanese characters → JPY
3. **Regional Keywords**: Pattern matching for regional expansion names
4. **Default Fallback**: USD for unrecognized cards

## Usage Examples

### Character Detection:
- **Chinese Card**: "皮卡丘" → **HKD**
- **Japanese Card**: "ピカチュウ" → **JPY**  
- **English Card**: "Pikachu" → **USD**

### Region Code Detection:
- **Expansion Code**: "hk001" → **HKD**
- **Expansion Code**: "jp-001" → **JPY**
- **Expansion Code**: "en-001" → **USD**

### Regional Patterns:
- **Expansion Name**: "繁體中文版" → **HKD**
- **Expansion Name**: "日本版ポケモン" → **JPY**
- **Expansion Name**: "English Edition" → **USD**

## User Experience

### Automatic Behavior:
1. User clicks card to view details
2. System detects card region/language
3. Market price form opens with appropriate currency pre-selected
4. User enters price without manual currency selection
5. Prices display with correct regional currency symbols

### Manual Override:
- Users can still manually change currency if needed
- All supported currencies remain available in dropdown
- Currency preference applies per-price entry

## Benefits

1. **Regional Accuracy**: Matches currency to card's actual market region
2. **User Convenience**: No manual currency selection needed
3. **Data Quality**: Encourages region-appropriate price data
4. **Cultural Relevance**: Respects regional trading practices
5. **Automatic Intelligence**: System learns from card characteristics

## Supported Regions

| Region | Currency | Symbol | Detection Method |
|--------|----------|---------|-----------------|
| Hong Kong/Taiwan/China | HKD | HK$ | Chinese characters, region codes |
| Japan | JPY | ¥ | Japanese characters, region codes |  
| US/International | USD | $ | English text, fallback default |
| Europe | EUR | € | Manual selection |
| UK | GBP | £ | Manual selection |

This implementation makes the market price system more intelligent and user-friendly by automatically adapting to different card regions and markets.