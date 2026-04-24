import { z } from 'zod';
import { 
  ZONES, 
  AGENT_STATES, 
  SVG_HEAD_TYPES, 
  SVG_BODY_TYPES, 
  SVG_HAND_TYPES, 
  SVG_FOOT_TYPES 
} from './constants';
import { type ZoneType } from './constants';

const ZoneSchema = z.enum(Object.values(ZONES) as [ZoneType, ...ZoneType[]]);

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

export const ModelOperationsLogFilterSchema = z.object({
  severity: z.enum(['info', 'warning', 'error']).optional(),
  eventType: z.string().optional(),
  agentId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const SanctuaryTaskFilterSchema = z.object({
  zone: ZoneSchema.optional(),
  status: z.enum(['queued', 'active', 'blocked', 'completed', 'failed']).optional(),
  agentId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const HeartbeatFilterSchema = z.object({
  agentId: z.string().optional(),
  zone: ZoneSchema.optional(),
  staleAfterMs: z.coerce.number().int().min(1_000).max(300_000).optional(),
});
