export const testOgPng = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export class GoogleFont {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

export function render() {
  return { asPng: async () => ({ image: testOgPng.slice() }) };
}
