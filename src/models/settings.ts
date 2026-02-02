import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';
import {
  Settings,
  SettingsData,
  SettingsResponse,
  PaginatedResponse,
  PaginationMeta,
} from '../types';

export class SettingsModel {
  /**
   * Create a new settings object
   */
  static async create(data: SettingsData): Promise<SettingsResponse> {
    const uid = uuidv4();
    const queryText = `
      INSERT INTO settings (uid, data)
      VALUES ($1, $2)
      RETURNING uid, data, created_at, updated_at
    `;

    const results = await query<Settings>(queryText, [uid, JSON.stringify(data)]);
    return this.formatSettings(results[0]);
  }

  /**
   * Get all settings with pagination
   */
  static async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<PaginatedResponse<SettingsResponse>> {
    // Validate and sanitize pagination parameters
    const sanitizedLimit = Math.min(Math.max(parseInt(String(limit), 10) || 10, 1), 100);
    const sanitizedOffset = Math.max(parseInt(String(offset), 10) || 0, 0);

    // Get total count
    const countResults = await query<{ count: string }>('SELECT COUNT(*) FROM settings');
    const totalCount = parseInt(countResults[0].count, 10);

    // Get paginated data
    const dataQuery = `
      SELECT uid, data, created_at, updated_at
      FROM settings
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const dataResults = await query<Settings>(dataQuery, [sanitizedLimit, sanitizedOffset]);
    const items = dataResults.map((row) => this.formatSettings(row));

    const pagination: PaginationMeta = {
      total: totalCount,
      limit: sanitizedLimit,
      offset: sanitizedOffset,
      totalPages: Math.ceil(totalCount / sanitizedLimit),
      currentPage: Math.floor(sanitizedOffset / sanitizedLimit) + 1,
      hasNext: sanitizedOffset + sanitizedLimit < totalCount,
      hasPrevious: sanitizedOffset > 0 && sanitizedOffset < totalCount,
    };

    return { items, pagination };
  }

  /**
   * Find a settings object by UID
   */
  static async findByUid(uid: string): Promise<SettingsResponse | null> {
    const queryText = `
      SELECT uid, data, created_at, updated_at
      FROM settings
      WHERE uid = $1
    `;

    const results = await query<Settings>(queryText, [uid]);

    if (results.length === 0) {
      return null;
    }

    return this.formatSettings(results[0]);
  }

  /**
   * Update (replace) a settings object
   */
  static async update(
    uid: string,
    data: SettingsData
  ): Promise<SettingsResponse | null> {
    const queryText = `
      UPDATE settings
      SET data = $1, updated_at = CURRENT_TIMESTAMP
      WHERE uid = $2
      RETURNING uid, data, created_at, updated_at
    `;

    const results = await query<Settings>(queryText, [JSON.stringify(data), uid]);

    if (results.length === 0) {
      return null;
    }

    return this.formatSettings(results[0]);
  }

  /**
   * Delete a settings object (idempotent)
   */
  static async delete(uid: string): Promise<boolean> {
    const queryText = 'DELETE FROM settings WHERE uid = $1 RETURNING uid';
    const results = await query<{ uid: string }>(queryText, [uid]);

    // Returns true if deleted, false if not found
    // Both cases are successful from idempotency perspective
    return results.length > 0;
  }

  /**
   * Format settings object for response
   */
  private static formatSettings(row: Settings): SettingsResponse {
    return {
      uid: row.uid,
      data: row.data,
      _metadata: {
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    };
  }
}