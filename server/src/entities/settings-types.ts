// These are not entities, but types used by the SettingsService/Controller

export const GradingSystem = {
    Traditional: 'Traditional',
    CBC: 'CBC'
} as const;
export type GradingSystem = typeof GradingSystem[keyof typeof GradingSystem];

export interface SchoolInfo {
    name: string;
    address: string;
    phone: string;
    email: string;
    logoUrl?: string;
    gradingSystem: GradingSystem;
}

export interface DarajaSettings {
    consumerKey: string;
    consumerSecret: string;
    shortCode: string;
    passkey: string;
    paybillNumber: string;
}
