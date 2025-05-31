// app/lib/modules/llm/providers/LocalLlamaProvider.ts
import { BaseProvider } from '../base-provider';
import type { ModelInfo, ExecuteParams, ProviderConfig } from '../types';
import type { LanguageModelV1 } from 'ai'; // Required for getModelInstance
// streamToResponse is not used in this client-side execution model.
// import { streamToResponse } from 'ai';

// Assuming llama.cpp server runs on localhost:8080 and has a similar API to OpenAI completions
const LOCAL_LLAMA_API_URL = 'http://localhost:8080/v1/chat/completions';

export class LocalLlamaProvider extends BaseProvider {
  // Implementing abstract/required properties from BaseProvider/ProviderInfo
  name: string = 'Local LLaMA'; // Corresponds to ProviderConfig.name

  staticModels: ModelInfo[] = [
    {
      id: 'local-model',
      name: 'Default LLaMA Model',
      provider: 'local-llama', // Matches this provider's ID
      type: 'chat',
      context: 4096,
      features: ['streaming'],
    },
  ];

  config: ProviderConfig = {
    id: 'local-llama',
    type: 'local' as const,
    name: 'Local LLaMA',
    messageRole: 'user' as const,
    docsUrl: '', // Not strictly necessary for local
    baseUrlKey: '',
    apiTokenKey: '',
    baseUrl: '',
  };

  // Optional properties from ProviderInfo
  // icon?: string = 'path/to/local-llama-icon.svg';
  // getApiKeyLink?: string = '';
  // labelForGetApiKey?: string = '';

  constructor() {
    super(); // Ensure BaseProvider constructor is called if it has logic
  }

  async execute({ messages, updates, model, abortSignal }: ExecuteParams & { abortSignal?: AbortSignal }) {
    try {
      const response = await fetch(LOCAL_LLAMA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model?.id || 'local-model',
          messages: messages,
          stream: true,
        }),
        signal: abortSignal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let detailedError = errorBody;
        try {
          const jsonError = JSON.parse(errorBody);
          detailedError = jsonError.error?.message || jsonError.message || errorBody;
        } catch (e) {
          // Not JSON, use text directly
        }
        updates.onError(`Local LLaMA API request failed: ${response.status} ${response.statusText}. ${detailedError}`);
        return;
      }

      if (!response.body) {
        updates.onError('Local LLaMA response body is null');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let eolIndex;
        // Process multiple events if they are buffered. Assumes OpenAI-like SSE format (data: {...}\n\n)
        while ((eolIndex = buffer.indexOf('\n\n')) >= 0) {
          const line = buffer.slice(0, eolIndex).trim();
          buffer = buffer.slice(eolIndex + 2); // Consume the processed part + EOL chars

          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6);
            if (jsonStr.trim() === '[DONE]') {
              updates.onComplete();
              return;
            }
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                updates.onUpdate(content);
              }
            } catch (e) {
              console.error('Error parsing Local LLaMA stream JSON:', e, "\nRaw JSON string:", jsonStr);
              updates.onError(`Error parsing stream: ${e.message}. Received: ${jsonStr}`);
              return;
            }
          }
        }
      }
      updates.onComplete();

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Local LLaMA request aborted by client');
        updates.onComplete();
      } else {
        console.error('Error executing Local LLaMA provider:', error);
        updates.onError(error.message || 'Unknown error during Local LLaMA execution.');
      }
    }
  }

  // Implementing abstract method from BaseProvider
  getModelInstance(options: {
    model: string;
    serverEnv?: Record<string, any>;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, any>;
  }): LanguageModelV1 {
    console.warn(`getModelInstance called for LocalLlamaProvider with model ${options.model}. This provider is intended for client-side execution via its 'execute' method.`);

    // This dummy implementation is to satisfy the abstract class requirement.
    // It should not be used for actual LLM operations on the server for this provider.
    return {
      provider: this.config.id,
      modelId: options.model,
      doStream: async (params) => {
        console.error("LocalLlamaProvider's dummy doStream called. This indicates incorrect server-side usage.");
        // Vercel AI SDK v3 uses params.onChunk which returns {writable, update}
        // For older versions or direct stream manipulation:
        const stream = new ReadableStream({
          start(controller) {
            const message = "Error: LocalLlamaProvider not configured for server-side streaming via getModelInstance.";
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: message } }] })}\n\n`));
            controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
            controller.close();
          }
        });
        // The return type of doStream is Promise<({ stream: ReadableStream; ... })>
        // Constructing the full object expected by the AI SDK.
        return Promise.resolve({
          stream: stream,
          rawResponse: { headers: new Headers() }, // Minimal raw response
          cachedData: undefined, // No caching
          headers: {}, // Additional headers if any
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'error' as const,
          logprobs: undefined, // Optional
          toolCalls: undefined, // Optional
          toolResult: undefined, // Optional
        });
      },
      // Implement other methods like doGenerate if required by LanguageModelV1 or BaseProvider
      // For example, a dummy doGenerate:
      doGenerate: async (params) => {
        console.error("LocalLlamaProvider's dummy doGenerate called.");
        return {
          text: "Error: LocalLlamaProvider not configured for server-side generation.",
          toolCalls: [],
          finishReason: 'error' as const,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          rawResponse: { headers: new Headers() },
        };
      }
    } as LanguageModelV1;
  }
}
