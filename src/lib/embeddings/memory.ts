export interface MemoryRecord {
  id: string;
  type: 'cv' | 'analysis' | 'roadmap';
  text: string;
  embedding?: number[];
}

const records: MemoryRecord[] = [];

export const remember = (record: MemoryRecord) => {
  records.push(record);
};

export const recall = () => [...records];

// TODO: Replace this in-memory array with Gemini Embedding 2 backed semantic memory.
