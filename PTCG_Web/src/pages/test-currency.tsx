import { getDefaultCurrencyForCard, getCurrencySymbol, getCurrencyName } from '../utils/currency';
import { PTCGCard } from '../types/card';

export default function TestCurrency() {
  // Test data for currency detection
  const chineseCard: PTCGCard = {
    Name: "皮卡丘",
    CardID: 1001,
    ImageURL: "",
    Rarity: "Rare",
    ExpansionName: "繁體中文版",
    ExpansionCode: "tc",
    CardType: "Pokémon",
    Evolution: "",
    EvolutionStage: "",
    HP: "60",
    Type: "Lightning",
    Weakness: "",
    WeaknessType: "",
    Resistance: "",
    ResistanceType: "",
    Skill1Name: "Thunderbolt",
    Skill1Energy: "",
    Skill1Damage: "",
    Skill1Effect: "",
    Skill2Name: "",
    Skill2Energy: "",
    Skill2Damage: "",
    Skill2Effect: "",
    AbilityName: "",
    AbilityEffect: "",
    RetreatCost: "",
    Illustrator: "",
    CollectorNumber: "",
    RegulationMark: "",
    Artist: "",
    SpecialTag: "",
    PrimaryEffectType: "",
    SpecialEffectType: "",
    AbilityStats: ""
  };

  const japaneseCard: PTCGCard = {
    Name: "ピカチュウ",
    CardID: 1002,
    ImageURL: "",
    Rarity: "Rare",
    ExpansionName: "拡張パック",
    ExpansionCode: "s1H",
    CardType: "Pokémon",
    Evolution: "",
    EvolutionStage: "",
    HP: "60",
    Type: "Lightning",
    Weakness: "",
    WeaknessType: "",
    Resistance: "",
    ResistanceType: "",
    Skill1Name: "10まんボルト",
    Skill1Energy: "",
    Skill1Damage: "",
    Skill1Effect: "",
    Skill2Name: "",
    Skill2Energy: "",
    Skill2Damage: "",
    Skill2Effect: "",
    AbilityName: "",
    AbilityEffect: "",
    RetreatCost: "",
    Illustrator: "",
    CollectorNumber: "",
    RegulationMark: "",
    Artist: "",
    SpecialTag: "",
    PrimaryEffectType: "",
    SpecialEffectType: "",
    AbilityStats: ""
  };

  const englishCard: PTCGCard = {
    Name: "Pikachu",
    CardID: 1003,
    ImageURL: "",
    Rarity: "Rare",
    ExpansionName: "Base Set",
    ExpansionCode: "BS",
    CardType: "Pokémon",
    Evolution: "",
    EvolutionStage: "",
    HP: "60",
    Type: "Lightning",
    Weakness: "",
    WeaknessType: "",
    Resistance: "",
    ResistanceType: "",
    Skill1Name: "Thunderbolt",
    Skill1Energy: "",
    Skill1Damage: "",
    Skill1Effect: "",
    Skill2Name: "",
    Skill2Energy: "",
    Skill2Damage: "",
    Skill2Effect: "",
    AbilityName: "",
    AbilityEffect: "",
    RetreatCost: "",
    Illustrator: "",
    CollectorNumber: "",
    RegulationMark: "",
    Artist: "",
    SpecialTag: "",
    PrimaryEffectType: "",
    SpecialEffectType: "",
    AbilityStats: ""
  };

  const testCurrency = (card: PTCGCard, description: string) => {
    const currency = getDefaultCurrencyForCard(card);
    const symbol = getCurrencySymbol(currency);
    const name = getCurrencyName(currency);
    return `${description}: ${currency} (${symbol} - ${name})`;
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Currency Detection Test</h1>
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test Results</h2>
          <ul className="space-y-2 text-sm font-mono">
            <li>{testCurrency(chineseCard, "Chinese card")}</li>
            <li>{testCurrency(japaneseCard, "Japanese card")}</li>
            <li>{testCurrency(englishCard, "English card")}</li>
          </ul>
        </div>
        
        <div className="p-4 bg-blue-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Expected Results</h2>
          <ul className="space-y-2 text-sm">
            <li>Chinese card should default to: HKD (HK$ - Hong Kong Dollar)</li>
            <li>Japanese card should default to: JPY (¥ - Japanese Yen)</li>
            <li>English card should default to: USD ($ - US Dollar)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}