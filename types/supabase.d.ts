declare module "@supabase/supabase-js" {
    export interface PostgrestFilterBuilder<T> {
      [x: string]: any;
      eq(column: string, value: any): PostgrestFilterBuilder<T>;
      neq(column: string, value: any): PostgrestFilterBuilder<T>;
      gt(column: string, value: any): PostgrestFilterBuilder<T>;
      gte(column: string, value: any): PostgrestFilterBuilder<T>;
      lt(column: string, value: any): PostgrestFilterBuilder<T>;
      lte(column: string, value: any): PostgrestFilterBuilder<T>;
      like(column: string, pattern: string): PostgrestFilterBuilder<T>;
      ilike(column: string, pattern: string): PostgrestFilterBuilder<T>;
      is(column: string, value: any): PostgrestFilterBuilder<T>;
      in(column: string, values: any[]): PostgrestFilterBuilder<T>;
      contains(column: string, value: any): PostgrestFilterBuilder<T>;
      containedBy(column: string, value: any): PostgrestFilterBuilder<T>;
      rangeLt(column: string, range: any): PostgrestFilterBuilder<T>;
      rangeGt(column: string, range: any): PostgrestFilterBuilder<T>;
      rangeGte(column: string, range: any): PostgrestFilterBuilder<T>;
      rangeLte(column: string, range: any): PostgrestFilterBuilder<T>;
      rangeAdjacent(column: string, range: any): PostgrestFilterBuilder<T>;
      overlaps(column: string, value: any): PostgrestFilterBuilder<T>;
      textSearch(column: string, query: string, options?: { config?: string }): PostgrestFilterBuilder<T>;
      filter(column: string, operator: string, value: any): PostgrestFilterBuilder<T>;
      match(query: object): PostgrestFilterBuilder<T>;
      single(): Promise<{ data: T; error: any }>;
      maybeSingle(): Promise<{ data: T | null; error: any }>;
      select(columns?: string): PostgrestFilterBuilder<T>;
      order(column: string, options?: { ascending?: boolean }): PostgrestFilterBuilder<T>;
      limit(count: number): PostgrestFilterBuilder<T>;
      range(from: number, to: number): PostgrestFilterBuilder<T>;
    }
  
    export interface PostgrestQueryBuilder<T> {
      select(columns?: string): PostgrestFilterBuilder<T>;
      insert(values: any, options?: { returning?: string; count?: 'exact' | 'planned' | 'estimated' }): PostgrestFilterBuilder<T>;
      upsert(values: any, options?: { returning?: string; onConflict?: string; ignoreDuplicates?: boolean; count?: 'exact' | 'planned' | 'estimated' }): PostgrestFilterBuilder<T>;
      update(values: any, options?: { returning?: string; count?: 'exact' | 'planned' | 'estimated' }): PostgrestFilterBuilder<T>;
      delete(options?: { returning?: string; count?: 'exact' | 'planned' | 'estimated' }): PostgrestFilterBuilder<T>;
    }
  
    export interface SupabaseClient {
      from<T = any>(table: string): PostgrestQueryBuilder<T>;
      auth: {
        signUp(options: { email: string; password: string }): Promise<{ data: any; error: any }>;
        signIn(options: { email: string; password: string }): Promise<{ data: any; error: any }>;
        signOut(): Promise<{ error: any }>;
        getSession(): Promise<{ data: { session: any }; error: any }>;
      };
    }
  
    export function createClient(url: string, key: string, options?: any): SupabaseClient;
  }
  