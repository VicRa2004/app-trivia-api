export const frontUrl = process.env.FRONT_URL || 'http://localhost:5173';

/**
 * Retorna la configuración de CORS origen.
 * En desarrollo (NODE_ENV !== 'production'), permite:
 * - localhost y 127.0.0.1
 * - Direcciones IP privadas (10.x, 172.16-31.x, 192.168.x)
 * - El origen especificado en FRONT_URL
 *
 * En producción, solo permite el origen de FRONT_URL.
 */
export const getCorsOrigin = (): string | RegExp => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (!isDevelopment) {
    // En producción, solo permitir el origen configurado
    return frontUrl;
  }

  // En desarrollo, permitir múltiples orígenes para facilitar desarrollo local
  // Regex que acepta: localhost, 127.0.0.1, e IPs privadas en puertos 3000-9999
  return /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[01])\.\d{1,3}\.\d{1,3}):\d+$/;
};
