declare module "@xenova/transformers" {
  interface PipelineOptions {
    pooling?: "mean" | "cls" | "max";
    normalize?: boolean;
  }

  interface PipelineOutput {
    data: Float32Array;
  }

  interface PipelineInitOptions {
    trust_remote_code?: boolean;
  }

  type PipelineType = "feature-extraction";

  export function pipeline(
    task: PipelineType,
    model: string,
    options?: PipelineInitOptions
  ): Promise<
    (text: string, options?: PipelineOptions) => Promise<PipelineOutput>
  >;
}
