import { defineEventHandler } from 'h3';

export default defineEventHandler(() => ({
  user: null,
  message: 'Auth user endpoint ready',
}));
