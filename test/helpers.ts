import { readFileSync } from "node:fs";

export const fixture = (name: string): string => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
export const fixtureJson = <T = Record<string, unknown>>(name: string): T => JSON.parse(fixture(name)) as T;
export const transcript = (): string => fixture("transcript-sample.jsonl");
