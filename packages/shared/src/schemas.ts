import { z } from 'zod';
import { 
  ZONES, 
  AGENT_STATES, 
  SVG_HEAD_TYPES, 
  SVG_BODY_TYPES, 
  SVG_HAND_TYPES, 
  SVG_FOOT_TYPES 
} from './constants';

export const SvgPartsSchema = z.object({
  head: z.enum(SVG_HEAD_TYPES),
  body: z.enum(SVG_BODY_TYPES),
  hands: z.enum(SVG_HAND_TYPES),
  feet: z.enum(SVG_FOOT_TYPES)
});

export const AgentConfigSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(50),
  personality: z.string(),
  svgParts: SvgPartsSchema,
});

export type AgentConfigInput = z.infer<typeof AgentConfigSchema>;

export const ChatMessageSchema = z.object({
  text: z.string().min(1)
});

export const FeedRequestSchema = z.object({
  snackId: z.string()
});

export const AgentModelStrategySchema = z.object({
  planningModelId: z.string().min(1),
  quickTaskModelId: z.string().min(1),
  fallbackModelId: z.string().min(1),
  switchRules: z.object({
    useQuickTaskForShortTasks: z.boolean(),
    fallbackOnQuota: z.boolean(),
    fallbackOnUnavailable: z.boolean(),
  }),
});

export const ActiveModelSchema = z.object({
  modelId: z.string().min(1),
});

export const LocalModelPullSchema = z.object({
  modelId: z.string().min(1),
});
