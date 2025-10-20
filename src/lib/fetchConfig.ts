/**
 * Configuration pour les appels fetch avec gestion des erreurs SSL
 * Résout les problèmes ERR_SSL_BAD_RECORD_MAC_ALERT
 */

export interface FetchConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: FormData | string;
  timeout?: number;
  retries?: number;
}

export class SecureFetch {
  private static defaultConfig: FetchConfig = {
    timeout: 300000, // 5 minutes
    retries: 3,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'MoovMoneyReport/1.0',
    }
  };

  /**
   * Effectue un appel fetch sécurisé avec gestion des erreurs SSL
   */
  static async fetch(url: string, config: FetchConfig = {}): Promise<Response> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= (finalConfig.retries || 3); attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

        const response = await fetch(url, {
          method: finalConfig.method || 'POST',
          headers: finalConfig.headers,
          body: finalConfig.body,
          signal: controller.signal,
          // Configuration pour éviter les erreurs SSL
          credentials: 'same-origin',
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }

        return response;

      } catch (error) {
        lastError = error as Error;
        
        // Si c'est une erreur SSL, on attend un peu avant de réessayer
        if (this.isSSLError(error)) {
          console.warn(`Tentative ${attempt + 1} échouée (SSL), nouvelle tentative dans 2s...`, error);
          if (attempt < (finalConfig.retries || 3)) {
            await this.delay(2000 * (attempt + 1)); // Délai progressif
            continue;
          }
        }
        
        // Pour les autres erreurs, on peut réessayer immédiatement
        if (attempt < (finalConfig.retries || 3)) {
          console.warn(`Tentative ${attempt + 1} échouée, nouvelle tentative...`, error);
          await this.delay(1000);
          continue;
        }
        
        throw error;
      }
    }

    throw lastError || new Error('Toutes les tentatives ont échoué');
  }

  /**
   * Vérifie si l'erreur est liée à SSL
   */
  private static isSSLError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return message.includes('ssl') || 
           message.includes('tls') || 
           message.includes('certificate') ||
           message.includes('bad_record_mac') ||
           message.includes('handshake');
  }

  /**
   * Délai utilitaire
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Upload de fichier avec gestion SSL
   */
  static async uploadFile(endpoint: string, formData: FormData, config: FetchConfig = {}): Promise<any> {
    const response = await this.fetch(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
    });

    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await response.json();
      } else {
        return { inserted: 0 };
      }
    } catch (parseError) {
      console.warn('Erreur de parsing de la réponse:', parseError);
      return { inserted: 0 };
    }
  }
}

/**
 * Hook pour utiliser SecureFetch dans les composants React
 */
export function useSecureFetch() {
  return {
    uploadFile: SecureFetch.uploadFile,
    fetch: SecureFetch.fetch,
  };
}
