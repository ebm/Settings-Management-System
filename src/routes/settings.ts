import express, { Router } from 'express';
import { SettingsController } from '../controllers/settings';

const router: Router = express.Router();

// Create a new settings object
router.post('/', SettingsController.create);

// Get all settings (paginated)
router.get('/', SettingsController.getAll);

// Get a specific settings object by UID
router.get('/:uid', SettingsController.getOne);

// Update (replace) a settings object
router.put('/:uid', SettingsController.update);

// Delete a settings object
router.delete('/:uid', SettingsController.delete);

export default router;
