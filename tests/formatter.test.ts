import { buildGameEmbed, buildAiResponseEmbed, buildErrorEmbed } from '../src/discord/formatters/gameEmbed';
import { Giveaway } from '../src/services/gamerpower';

const makeGiveaway = (overrides: Partial<Giveaway> = {}): Giveaway => ({
  id: 1,
  title: 'Awesome Game',
  worth: '$19.99',
  thumbnail: '',
  image: '',
  description: '',
  instructions: '',
  open_giveaway_url: 'https://www.gamerpower.com/open/awesome-game',
  published_date: '2024-06-01',
  type: 'Full Game',
  platforms: 'Steam',
  end_date: '2099-12-31 00:00:00',
  users: 500,
  status: 'Active',
  gamerpower_url: 'https://www.gamerpower.com/awesome-game',
  open_giveaway: 'https://store.steampowered.com/awesome',
  ...overrides,
});

describe('buildGameEmbed', () => {
  it('returns an empty-state embed when no giveaways provided', () => {
    const { embeds, components } = buildGameEmbed([]);
    expect(embeds).toHaveLength(1);
    expect(embeds[0]?.data.description).toContain('Belum menemukan');
    expect(components).toHaveLength(0);
  });

  it('returns embed with fields for each game', () => {
    const giveaways = [makeGiveaway(), makeGiveaway({ id: 2, title: 'Another Game' })];
    const { embeds } = buildGameEmbed(giveaways);
    expect(embeds).toHaveLength(1);
    expect(embeds[0]?.data.fields).toHaveLength(2);
  });

  it('caps display at 5 games', () => {
    const giveaways = Array.from({ length: 8 }, (_, i) =>
      makeGiveaway({ id: i + 1, title: `Game ${i + 1}` }),
    );
    const { embeds } = buildGameEmbed(giveaways);
    expect(embeds[0]?.data.fields).toHaveLength(5);
  });

  it('includes GamerPower in the footer', () => {
    const { embeds } = buildGameEmbed([makeGiveaway()]);
    expect(embeds[0]?.data.footer?.text).toContain('GamerPower');
  });

  it('creates a claim button per game with a URL', () => {
    const { components } = buildGameEmbed([makeGiveaway()]);
    expect(components).toHaveLength(1);
  });

  it('does not create a button for games without open_giveaway_url', () => {
    const { components } = buildGameEmbed([makeGiveaway({ open_giveaway_url: '' })]);
    expect(components).toHaveLength(0);
  });
});

describe('buildAiResponseEmbed', () => {
  it('sets the description to the AI text', () => {
    const embed = buildAiResponseEmbed('Here are some free games!');
    expect(embed.data.description).toBe('Here are some free games!');
  });

  it('truncates text at 4096 characters', () => {
    const longText = 'a'.repeat(5000);
    const embed = buildAiResponseEmbed(longText);
    expect(embed.data.description?.length).toBe(4096);
  });
});

describe('buildErrorEmbed', () => {
  it('sets the description to the error message', () => {
    const embed = buildErrorEmbed('Something went wrong.');
    expect(embed.data.description).toBe('Something went wrong.');
  });

  it('uses a red colour', () => {
    const embed = buildErrorEmbed('Error');
    expect(embed.data.color).toBe(0xe74c3c);
  });
});
