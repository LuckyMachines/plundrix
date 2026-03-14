import { Router, type Request, type Response } from 'express';
import {
  createGame,
  registerPlayer,
  submitAction,
  resolveRound,
} from '../contract-write.js';
import { getSignerAddress } from '../contract-write.js';
import type { Address } from 'viem';

const router = Router();

router.post('/tx/create-game', async (_req: Request, res: Response) => {
  try {
    const result = await createGame();
    res.json({ success: true, signerAddress: getSignerAddress(), ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tx/register-player', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.body;
    if (!gameId || typeof gameId !== 'number') {
      res.status(400).json({ success: false, error: 'gameId (number) required' });
      return;
    }
    const result = await registerPlayer(gameId);
    res.json({ success: true, signerAddress: getSignerAddress(), ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tx/submit-action', async (req: Request, res: Response) => {
  try {
    const { gameId, action, sabotageTarget } = req.body;
    if (!gameId || typeof gameId !== 'number') {
      res.status(400).json({ success: false, error: 'gameId (number) required' });
      return;
    }
    if (!action || typeof action !== 'number' || action < 1 || action > 3) {
      res.status(400).json({ success: false, error: 'action (1-3) required' });
      return;
    }
    const target = (sabotageTarget || '0x0000000000000000000000000000000000000000') as Address;
    const result = await submitAction(gameId, action, target);
    res.json({ success: true, signerAddress: getSignerAddress(), ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tx/resolve-round', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.body;
    if (!gameId || typeof gameId !== 'number') {
      res.status(400).json({ success: false, error: 'gameId (number) required' });
      return;
    }
    const result = await resolveRound(gameId);
    res.json({ success: true, signerAddress: getSignerAddress(), ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', signer: getSignerAddress() });
});

export default router;
