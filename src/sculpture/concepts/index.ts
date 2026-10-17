import { interlocked } from './interlocked';
import { monolith } from './monolith';
import { refined } from './refined';
import { tension } from './tension';
import type { ConceptDefinition, ConceptId } from '../types';

export const CONCEPTS: readonly ConceptDefinition[] = [monolith, interlocked, refined, tension];
export const conceptById = (id: ConceptId) => CONCEPTS.find((c) => c.id === id) ?? monolith;
