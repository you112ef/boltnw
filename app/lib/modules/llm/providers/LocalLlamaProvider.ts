// app/lib/modules/llm/providers/LocalLlamaProvider.ts
import { BaseProvider, type ExecuteParams, type ProviderExecuteUpdates } from '../base-provider';
import type { ModelInfo } from '../types';

// Assume llama.cpp server runs on localhost:8080 and has a similar API to OpenAI completions
const LOCAL_LLAMA_API_URL = 'http://localhost:8080/v1/chat/completions'; // Or '/completion' depending on llama.cpp server setup

export class LocalLlamaProvider extends BaseProvider {
  constructor() {
    super({
      id: 'local-llama', // Matches LOCAL_PROVIDERS entry
      name: 'Local LLaMA',
      type: 'local',
      messageRole: 'user',
      docsUrl: '',
      // Icon can be added if an SVG is created
    });
  }

  async execute({ messages, updates, model }: ExecuteParams) {
    const abortController = new AbortController();
    updates.onAbort(() => abortController.abort());

    try {
      const response = await fetch(LOCAL_LLAMA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model?.id || 'local-model', // Default model name if not specified
          messages: messages,
          stream: true, // Assuming llama.cpp server supports streaming
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        // Try to parse errorBody if it's JSON, otherwise use as is
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

      // Process stream (similar to OpenAIProvider's stream processing)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let eolIndex;
        // Process multiple events if they are buffered
        while ((eolIndex = buffer.indexOf('\n\n')) >= 0) {
          const line = buffer.slice(0, eolIndex).trim();
          buffer = buffer.slice(eolIndex + 2); // Keep the +2 for consistency with typical SSE

          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6);
            if (jsonStr === '[DONE]') {
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
              console.error('Error parsing Local LLaMA stream JSON:', e, jsonStr);
              // It's possible that a non-JSON error message comes through the stream
              updates.onError(`Error parsing stream: ${e.message}. Received: ${jsonStr}`);
              return; // Stop processing on stream parse error
            }
          }
        }
      }
      updates.onComplete();

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Local LLaMA request aborted');
        updates.onComplete();
      } else {
        console.error('Error executing Local LLaMA provider:', error);
        updates.onError(error.message || 'Unknown error during Local LLaMA execution.');
      }
    }
  }

  // Define available models for this local provider
  async getModels(): Promise<ModelInfo[]> {
    // This could fetch from the llama.cpp server if it has a models endpoint,
    // or just return a predefined list.
    return [
      {
        id: 'local-model', // A default model ID
        name: 'Default LLaMA Model',
        provider: 'local-llama',
        type: 'chat',
        context: 4096, // Example context window
        features: ['streaming'],
      },
      // Add other local models if available
    ];
  }
}
