import { supabase, supabaseAdmin } from '@/config/database';
import { User } from '@supabase/supabase-js';
import logger from '@/utils/logger';

export class SupabaseService {
  // Auth methods
  static async signUp(email: string, password: string, metadata?: any) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        logger.error('Supabase signup error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Supabase signup service error:', error);
      throw error;
    }
  }

  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error('Supabase signin error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Supabase signin service error:', error);
      throw error;
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Supabase signout error:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Supabase signout service error:', error);
      throw error;
    }
  }

  static async getUser(token: string) {
    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (error) {
        logger.error('Supabase get user error:', error);
        throw error;
      }

      return data.user;
    } catch (error) {
      logger.error('Supabase get user service error:', error);
      throw error;
    }
  }

  // Database methods
  static async createRecord(table: string, data: any) {
    try {
      const { data: record, error } = await supabaseAdmin
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        logger.error(`Create record error in ${table}:`, error);
        throw error;
      }

      return record;
    } catch (error) {
      logger.error(`Create record service error in ${table}:`, error);
      throw error;
    }
  }

  static async updateRecord(table: string, id: string, data: any) {
    try {
      const { data: record, error } = await supabaseAdmin
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Update record error in ${table}:`, error);
        throw error;
      }

      return record;
    } catch (error) {
      logger.error(`Update record service error in ${table}:`, error);
      throw error;
    }
  }

  static async deleteRecord(table: string, id: string) {
    try {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        logger.error(`Delete record error in ${table}:`, error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error(`Delete record service error in ${table}:`, error);
      throw error;
    }
  }

  static async getRecord(table: string, id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error(`Get record error in ${table}:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error(`Get record service error in ${table}:`, error);
      throw error;
    }
  }

  static async getRecords(table: string, filters?: any, pagination?: any) {
    try {
      let query = supabaseAdmin.from(table).select('*', { count: 'exact' });

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply pagination
      if (pagination) {
        const { page, limit, sort, order } = pagination;
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        if (sort) {
          query = query.order(sort, { ascending: order === 'asc' });
        }
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error(`Get records error in ${table}:`, error);
        throw error;
      }

      return { data, count };
    } catch (error) {
      logger.error(`Get records service error in ${table}:`, error);
      throw error;
    }
  }

  // Storage methods
  static async uploadFile(bucket: string, path: string, file: Buffer, options?: any) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, file, options);

      if (error) {
        logger.error('Supabase upload error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Supabase upload service error:', error);
      throw error;
    }
  }

  static async deleteFile(bucket: string, path: string) {
    try {
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        logger.error('Supabase delete file error:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Supabase delete file service error:', error);
      throw error;
    }
  }

  static getPublicUrl(bucket: string, path: string) {
    try {
      const { data } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      logger.error('Supabase get public URL service error:', error);
      throw error;
    }
  }
}