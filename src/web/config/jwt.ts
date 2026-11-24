export const getJwtSecret = (): string =>
  process.env.JWT_SECRET || 'uku_secret_key_2026';


