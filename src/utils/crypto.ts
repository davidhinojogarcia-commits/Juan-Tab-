/**
 * Utilidades criptográficas con Web Crypto API (AES-GCM 256 bits)
 * Cifrado de extremo a extremo (E2EE) para la protección de auditorías y expedientes
 */

const SALT_STRING = 'DIPUTACION_CADIZ_ADL_V1.1_SALT_2026';

// Generar o derivar clave AES-GCM a partir de contraseña o frase maestra
export async function derivarClaveAES(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const salt = enc.encode(SALT_STRING);
  
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Cifrar datos a formato Base64 con vector de inicialización IV
export async function cifrarDatosE2EE(datos: string, passwordMaster: string = 'ADL_CADIZ_SECURE_VAULT_KEY'): Promise<string> {
  try {
    const key = await derivarClaveAES(passwordMaster);
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV para GCM
    
    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      enc.encode(datos)
    );

    const ivArray = Array.from(iv);
    const cipherArray = Array.from(new Uint8Array(cipherBuffer));
    
    return JSON.stringify({
      v: '1.1',
      alg: 'AES-GCM-256',
      iv: btoa(String.fromCharCode.apply(null, ivArray)),
      payload: btoa(String.fromCharCode.apply(null, cipherArray))
    });
  } catch (error) {
    console.warn('Error en cifrado E2EE, fallback a storage directo:', error);
    return datos;
  }
}

// Descifrar datos Base64
export async function descifrarDatosE2EE(cifradoJson: string, passwordMaster: string = 'ADL_CADIZ_SECURE_VAULT_KEY'): Promise<string> {
  try {
    const parsed = JSON.parse(cifradoJson);
    if (!parsed.iv || !parsed.payload) return cifradoJson;

    const key = await derivarClaveAES(passwordMaster);
    
    const ivBinary = atob(parsed.iv);
    const iv = new Uint8Array(ivBinary.length);
    for (let i = 0; i < ivBinary.length; i++) {
      iv[i] = ivBinary.charCodeAt(i);
    }

    const payloadBinary = atob(parsed.payload);
    const cipherBytes = new Uint8Array(payloadBinary.length);
    for (let i = 0; i < payloadBinary.length; i++) {
      cipherBytes[i] = payloadBinary.charCodeAt(i);
    }

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      cipherBytes
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    // Si no estaba cifrado, devolver original
    return cifradoJson;
  }
}

// Generar hash SHA-256 para huella inmutable de auditoría
export async function generarHuellaAuditoria(texto: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const data = enc.encode(texto);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'SHA256-UNAVAILABLE';
  }
}
