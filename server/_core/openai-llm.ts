import OpenAI from 'openai';
import { ENV } from './env';

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type MessageContent = string | TextContent | ImageContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text" || part.type === "image_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message): OpenAI.Chat.ChatCompletionMessageParam => {
  const { role, name, tool_call_id, content } = message;

  if (role === "tool" || role === "function") {
    const textContent = ensureArray(content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role: "tool",
      content: textContent,
      tool_call_id: tool_call_id || "",
    };
  }

  const contentParts = ensureArray(content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role: role as "system" | "user" | "assistant",
      content: contentParts[0].text,
      ...(name && { name }),
    };
  }

  return {
    role: role as "system" | "user" | "assistant",
    content: contentParts as OpenAI.Chat.ChatCompletionContentPart[],
    ...(name && { name }),
  } as OpenAI.Chat.ChatCompletionMessageParam;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}): OpenAI.Chat.ChatCompletionCreateParams["response_format"] => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema") {
      return {
        type: "json_schema",
        json_schema: explicitFormat.json_schema,
      };
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const client = getOpenAIClient();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    maxTokens,
    max_tokens,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const normalizedMessages = messages.map(normalizeMessage);
  
  const requestParams: OpenAI.Chat.ChatCompletionCreateParams = {
    model: "gpt-4o-mini", // Cost-effective model for parsing
    messages: normalizedMessages,
    max_tokens: maxTokens || max_tokens || 16384,
  };

  if (tools && tools.length > 0) {
    requestParams.tools = tools as OpenAI.Chat.ChatCompletionTool[];
  }

  if (toolChoice || tool_choice) {
    const choice = toolChoice || tool_choice;
    if (choice) {
      if (typeof choice === "string") {
        requestParams.tool_choice = choice;
      } else if ("name" in choice) {
        requestParams.tool_choice = {
          type: "function",
          function: { name: choice.name },
        };
      } else {
        requestParams.tool_choice = choice;
      }
    }
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    requestParams.response_format = normalizedResponseFormat;
  }

  try {
    const response = await client.chat.completions.create(requestParams);

    // Convert OpenAI response to our InvokeResult format
    return {
      id: response.id,
      created: response.created,
      model: response.model,
      choices: response.choices.map(choice => ({
        index: choice.index,
        message: {
          role: choice.message.role as Role,
          content: choice.message.content || "",
          tool_calls: choice.message.tool_calls as ToolCall[] | undefined,
        },
        finish_reason: choice.finish_reason || null,
      })),
      usage: response.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens,
          }
        : undefined,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(
      `OpenAI API call failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

