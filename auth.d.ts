export declare class A1AuthError extends Error {
    constructor(message: string);
}
/**
 * Build a PEM string from a raw base64 SPKI public key (no armor, as A1
 * returns it). Handles both the bare-base64 form and an already-PEM'd form.
 */
export declare function spkiBase64ToPem(key: string): string;
/**
 * RSA-encrypt (PKCS#1 v1.5) `plaintext` with the given SPKI public key and
 * return base64 ciphertext — the format A1 expects in the Password field.
 */
export declare function rsaEncryptPassword(publicKey: string, plaintext: string): string;
//# sourceMappingURL=auth.d.ts.map