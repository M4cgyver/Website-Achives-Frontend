import bcrypt from "bcrypt";
import { sha3_512 } from "js-sha3";

export const hashDJB2 = (str: string, seed: number | undefined = undefined): number => {
    let hash = seed || parseInt(process.env.HASH_DJB2_DEFAULT_SALT || '5381', 10);
    const length = str.length;
    for (let i = 0; i < length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
  
    return hash >>> 0; 
};

export const hashSHA3 = (str: string, salt: string | undefined = undefined): string => {
    const defaultSalt = "Q5sE9vP3mD8hG2kR4nA7wY6jF1tZ0xXc";
    const finalSalt = salt || process.env.HASH_SHA3_DEFAULT_SEED || defaultSalt;
    const saltedString = str + finalSalt + str;
    return sha3_512(saltedString);
};