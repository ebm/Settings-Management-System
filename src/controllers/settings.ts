import { Request, Response } from 'express';
import { SettingsModel } from '../models/settings';
import { SettingsData, ApiError } from '../types';

export class SettingsController {
  /**
   * POST /settings - Create a new settings object
   */
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const data: SettingsData = req.body;

      // Validate that body contains some data
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        const error: ApiError = {
          error: 'Bad Request',
          message: 'Request body must contain a non-empty JSON object',
        };
        return res.status(400).json(error);
      }

      const settings = await SettingsModel.create(data);

      return res.status(201).json(settings);
    } catch (error) {
      console.error('Error creating settings:', error);
      const apiError: ApiError = {
        error: 'Internal Server Error',
        message: 'Failed to create settings object',
      };
      return res.status(500).json(apiError);
    }
  }

  /**
   * GET /settings - Get all settings with pagination
   */
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const limit = req.query.limit as string | undefined;
      const offset = req.query.offset as string | undefined;

      const result = await SettingsModel.findAll(
        limit ? parseInt(limit, 10) : undefined,
        offset ? parseInt(offset, 10) : undefined
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching settings:', error);
      const apiError: ApiError = {
        error: 'Internal Server Error',
        message: 'Failed to fetch settings',
      };
      return res.status(500).json(apiError);
    }
  }

  /**
   * GET /settings/:uid - Get a specific settings object
   */
  static async getOne(req: Request, res: Response): Promise<Response> {
    try {
      const { uid } = req.params;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uid)) {
        const error: ApiError = {
          error: 'Bad Request',
          message: 'Invalid UUID format',
        };
        return res.status(400).json(error);
      }

      const settings = await SettingsModel.findByUid(uid);

      if (!settings) {
        const error: ApiError = {
          error: 'Not Found',
          message: `Settings object with uid '${uid}' not found`,
        };
        return res.status(404).json(error);
      }

      return res.status(200).json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      const apiError: ApiError = {
        error: 'Internal Server Error',
        message: 'Failed to fetch settings object',
      };
      return res.status(500).json(apiError);
    }
  }

  /**
   * PUT /settings/:uid - Update (replace) a settings object
   */
  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const { uid } = req.params;
      const data: SettingsData = req.body;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uid)) {
        const error: ApiError = {
          error: 'Bad Request',
          message: 'Invalid UUID format',
        };
        return res.status(400).json(error);
      }

      // Validate that body contains some data
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        const error: ApiError = {
          error: 'Bad Request',
          message: 'Request body must contain a non-empty JSON object',
        };
        return res.status(400).json(error);
      }

      const settings = await SettingsModel.update(uid, data);

      if (!settings) {
        const error: ApiError = {
          error: 'Not Found',
          message: `Settings object with uid '${uid}' not found`,
        };
        return res.status(404).json(error);
      }

      return res.status(200).json(settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      const apiError: ApiError = {
        error: 'Internal Server Error',
        message: 'Failed to update settings object',
      };
      return res.status(500).json(apiError);
    }
  }

  /**
   * DELETE /settings/:uid - Delete a settings object (idempotent)
   */
  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { uid } = req.params;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uid)) {
        const error: ApiError = {
          error: 'Bad Request',
          message: 'Invalid UUID format',
        };
        return res.status(400).json(error);
      }

      await SettingsModel.delete(uid);

      // Return 204 No Content for successful deletion (idempotent)
      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting settings:', error);
      const apiError: ApiError = {
        error: 'Internal Server Error',
        message: 'Failed to delete settings object',
      };
      return res.status(500).json(apiError);
    }
  }
}
