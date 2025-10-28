import { z } from 'zod';

// Zod schemas for packing-related types

export const PackingItemSchema = z.object({
  id: z.number().optional(), // Client-side temporary ID; DB will generate its own
  name: z.string().min(1, 'Item name is required'),
  qty: z.union([z.number(), z.string()]).transform((val) => String(val)),
  category: z.string().min(1, 'Category is required'),
  // Accept null coming from DB or existing payload and normalize to undefined
  notes: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (v === null ? undefined : v)),
  optional: z.boolean().optional().default(false),
  packed: z.boolean(),
});

export const PackingListMetaSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  days: z.number().min(1, 'Days must be at least 1'),
  people: z.object({
    adults: z.number().min(0),
    children: z.number().min(0),
  }),
  season: z.string().min(1, 'Season is required'),
  transport: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (v === null ? undefined : v)),
  accommodation: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (v === null ? undefined : v)),
  activities: z
    .union([z.array(z.string()), z.null()])
    .optional()
    .transform((v) => (v === null ? undefined : v)),
  archetype: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (v === null ? undefined : v)),
  regenerationCount: z
    .union([z.number(), z.null()])
    .optional()
    .transform((v) => (v === null ? undefined : v)),
});

export const ChecklistItemSchema = z.object({
  id: z.number().optional(), // Make ID optional since it's client-side generated
  task: z.string().min(1, 'Task is required'),
  done: z.boolean(),
});

export const GenerateDetailsSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  days: z.string().min(1, 'Days is required'),
  adults: z.string().min(1, 'Adults count is required'),
  childrenAges: z.string(),
  season: z.string().min(1, 'Season is required'),
  transport: z.string(),
  accommodation: z.string(),
  activities: z.string(),
  special: z.string(),
  region: z.string().optional(),
  travelStyle: z.string().optional(),
  language: z.string().optional(),
});

export const SavedListSchema = z.object({
  packingItems: z.array(PackingItemSchema),
  checklistItems: z.array(ChecklistItemSchema),
  categories: z.array(z.string()),
  listMeta: PackingListMetaSchema.nullable(),
});

export const ValidationRequestSchema = z.object({
  currentList: z.array(PackingItemSchema),
  changes: z
    .object({
      notes: z.string().optional(),
    })
    .optional(),
});

export const CategorizationRequestSchema = z.object({
  items: z.array(PackingItemSchema),
  categories: z.array(z.string()),
});

export const AIPackingActionSchema = z.object({
  action: z.enum(['generate', 'validate', 'categorize']),
  payload: z.object({
    details: GenerateDetailsSchema.optional(),
    currentList: z.array(PackingItemSchema).optional(),
    changes: z
      .object({
        notes: z.string().optional(),
      })
      .optional(),
    items: z.array(PackingItemSchema).optional(),
    categories: z.array(z.string()).optional(),
    // Trip context (used for persisting token usage & regeneration counters)
    tripId: z.string().uuid().optional(),
  }),
});

// DTOs for API responses
export const AIPackingListResponseSchema = z.object({
  meta: PackingListMetaSchema,
  checklist: z.array(
    z.object({
      task: z.string(),
      done: z.boolean(),
    })
  ),
  items: z.array(PackingItemSchema.omit({ id: true, packed: true })),
});

export const ValidationResultSchema = z.object({
  missing: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      reason: z.string(),
    })
  ),
  remove: z.array(
    z.object({
      name: z.string(),
      reason: z.string(),
    })
  ),
  adjust: z.array(
    z.object({
      name: z.string(),
      field: z.string(),
      current: z.any(),
      suggested: z.any(),
      reason: z.string(),
    })
  ),
  replace: z.array(
    z.object({
      items_to_remove: z.array(z.string()),
      suggested_item: z.object({
        name: z.string(),
        category: z.string(),
      }),
      reason: z.string(),
    })
  ),
  error: z.string().optional(),
});

export const CategorizationResultSchema = z.array(
  z.object({
    id: z.number(),
    category: z.string(),
  })
);

// Type exports from schemas
export type PackingItemDTO = z.infer<typeof PackingItemSchema>;
export type PackingListMetaDTO = z.infer<typeof PackingListMetaSchema>;
export type ChecklistItemDTO = z.infer<typeof ChecklistItemSchema>;
export type GenerateDetailsDTO = z.infer<typeof GenerateDetailsSchema>;
export type SavedListDTO = z.infer<typeof SavedListSchema>;
export type ValidationRequestDTO = z.infer<typeof ValidationRequestSchema>;
export type CategorizationRequestDTO = z.infer<typeof CategorizationRequestSchema>;
export type AIPackingActionDTO = z.infer<typeof AIPackingActionSchema>;
export type AIPackingListResponseDTO = z.infer<typeof AIPackingListResponseSchema>;
export type ValidationResultDTO = z.infer<typeof ValidationResultSchema>;
export type CategorizationResultDTO = z.infer<typeof CategorizationResultSchema>;
