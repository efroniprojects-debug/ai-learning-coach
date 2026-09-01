export interface DirectQuestionAttachment {
  imageData?: string;
  documentData?: string;
}

/** A direct exercise attachment is the authoritative source for this turn. */
export function shouldRetrieveKnowledgeContext(input: DirectQuestionAttachment): boolean {
  return !input.imageData && !input.documentData;
}
