export function decodeBase64(base64: string, encoding: 'base64' | 'base64url' = 'base64'): Uint8Array {
    let normalizedBase64 = base64;
    
    if (encoding === 'base64url') {
        normalizedBase64 = base64
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const padding = normalizedBase64.length % 4;
        if (padding) {
            normalizedBase64 += '='.repeat(4 - padding);
        }
    }
    
    const binaryString = atob(normalizedBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
}

const BASE64_ENCODE_CHUNK_SIZE = 32 * 1024;

export function encodeBase64(buffer: Uint8Array, encoding: 'base64' | 'base64url' = 'base64'): string {
    let binaryString = '';

    for (let offset = 0; offset < buffer.length; offset += BASE64_ENCODE_CHUNK_SIZE) {
        const chunk = buffer.subarray(offset, offset + BASE64_ENCODE_CHUNK_SIZE);
        let chunkString = '';

        for (let index = 0; index < chunk.length; index++) {
            chunkString += String.fromCharCode(chunk[index]);
        }

        binaryString += chunkString;
    }

    const base64 = btoa(binaryString);
    
    if (encoding === 'base64url') {
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
    
    return base64;
}
