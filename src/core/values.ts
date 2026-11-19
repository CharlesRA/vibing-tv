// Closed sets of values are `as const` objects; this derives their union type.
export type Values<T> = T[keyof T];
