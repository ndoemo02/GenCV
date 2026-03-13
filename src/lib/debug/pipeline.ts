export const logPipeline = (stage: string, payload: Record<string, unknown>) => {
  console.info('[PIPELINE]', stage, payload);
};
