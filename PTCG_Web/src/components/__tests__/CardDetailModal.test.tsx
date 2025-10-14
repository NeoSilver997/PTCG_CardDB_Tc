import { render, screen, waitFor } from '../../test-utils/test-utils';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import CardDetailModal from '../CardDetailModal';
import { PTCGCard } from '../../types/card';

const mockCard: PTCGCard = {
  CardID: 1,
  Name: 'Pikachu',
  CardType: 'Pokémon',
  Rarity: 'Common',
  ExpansionName: 'Base Set',
  ExpansionCode: 'BS',
  Skill1Name: 'Thunder Shock',
  Skill1Effect: 'Flip a coin. If heads, the Defending Pokémon is now Paralyzed.',
  Skill2Name: 'Thunder Jolt',
  Skill2Effect: 'Flip a coin. If heads, this Pokémon does 10 damage to itself.',
  AbilityName: 'Static',
  AbilityEffect: 'If this Pokémon is your Active Pokémon and is damaged by an opponent\'s attack (even if this Pokémon is Knocked Out), the Attacking Pokémon is now Paralyzed.',
  Type: 'Lightning',
  HP: 60,
  RetreatCost: 1,
  WeaknessType: 'Fighting',
  ResistanceType: 'Metal',
  AttackCost: ['L', 'C'],
  DefenseCost: [],
  SpecialCost: [],
  Tier: 'S',
  RegulationMark: 'F',
  PrimaryEffectType: 'Status',
  SpecialEffectType: 'Damage',
  AbilityStats: 'Paralyze',
  CardArt: '/images/pikachu.png',
  EvolvesFrom: '',
};

const mockRelatedCards: PTCGCard[] = [
    { CardID: 2, Name: 'Raichu', CardType: 'Pokémon', Rarity: 'Rare', ExpansionName: 'Base Set', ExpansionCode: 'BS', EvolvesFrom: 'Pikachu', CardArt: '/images/raichu.png' },
    { CardID: 3, Name: 'Voltorb', CardType: 'Pokémon', Rarity: 'Common', ExpansionName: 'Base Set', ExpansionCode: 'BS', CardArt: '/images/voltorb.png' },
];

const mockAllCards: PTCGCard[] = [
    mockCard,
    ...mockRelatedCards,
    { CardID: 4, Name: 'Charmander', CardType: 'Pokémon', Rarity: 'Common', ExpansionName: 'Base Set', ExpansionCode: 'BS', CardArt: '/images/charmander.png' },
];

describe('CardDetailModal', () => {
  it('should not render when the card is not defined', () => {
    const { container } = render(
      <CardDetailModal
        card={null as any}
        relatedCards={[]}
        allCards={[]}
        onClose={() => {}}
        onCardClick={() => {}}
        onAddToDeck={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal with card details', () => {
    render(
      <CardDetailModal
        card={mockCard}
        relatedCards={mockRelatedCards}
        allCards={mockAllCards}
        onClose={() => {}}
        onCardClick={() => {}}
        onAddToDeck={() => {}}
      />
    );

    expect(screen.getByText('Pikachu')).toBeInTheDocument();
    expect(screen.getByText('Base Set')).toBeInTheDocument();
    expect(screen.getByText('Static')).toBeInTheDocument();
    expect(screen.getByText('Thunder Shock')).toBeInTheDocument();
    expect(screen.getByText('Raichu')).toBeInTheDocument();
    expect(screen.getByText('Voltorb')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <CardDetailModal
        card={mockCard}
        relatedCards={mockRelatedCards}
        allCards={mockAllCards}
        onClose={onClose}
        onCardClick={() => {}}
        onAddToDeck={() => {}}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onCardClick when a related card is clicked', async () => {
    const onCardClick = jest.fn();
    const user = userEvent.setup();
    render(
      <CardDetailModal
        card={mockCard}
        relatedCards={mockRelatedCards}
        allCards={mockAllCards}
        onClose={() => {}}
        onCardClick={onCardClick}
        onAddToDeck={() => {}}
      />
    );

    const relatedCard = screen.getByText('Raichu');
    await user.click(relatedCard);

    expect(onCardClick).toHaveBeenCalledWith(mockRelatedCards[0]);
  });

  it('calls onAddToDeck when the add to deck button is clicked', async () => {
    const onAddToDeck = jest.fn();
    const user = userEvent.setup();
    render(
      <CardDetailModal
        card={mockCard}
        relatedCards={mockRelatedCards}
        allCards={mockAllCards}
        onClose={() => {}}
        onCardClick={() => {}}
        onAddToDeck={onAddToDeck}
      />
    );

    const addToDeckButton = screen.getAllByRole('button', { name: /add to deck/i })[0];
    await user.click(addToDeckButton);

    expect(onAddToDeck).toHaveBeenCalledWith(mockCard, 1);
  });
});