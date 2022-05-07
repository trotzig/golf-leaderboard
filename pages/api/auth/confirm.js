import prisma from '../../../src/prisma';
import crypto from 'crypto';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(400).send('This endpoint accepts GET requests');
  }
  return res.redirect('/auth/invalid-token');
}
