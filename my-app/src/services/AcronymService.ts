import { AcronymMatch } from '../types';

export class AcronymService {
  private static apiUrl = '/api/acronyms';

  static async findMatches(input: string): Promise<AcronymMatch[]> {
    console.log(`Searching for acronym matches for input: ${input}`);
    try {
      const response = await fetch(`${this.apiUrl}/search?query=${encodeURIComponent(input)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`Received ${data.length} matches for input: ${input}`);
      return data;
    } catch (error) {
      console.error('Error fetching acronym matches:', error);
      throw error;
    }
  }

  static async suggestAcronym(acronym: string, expansion: string, context: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ acronym, expansion, context }),
    });
    if (!response.ok) {
      throw new Error('Failed to suggest acronym');
    }
  }
}