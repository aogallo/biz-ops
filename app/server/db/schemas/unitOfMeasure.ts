import { relations } from 'drizzle-orm'
import {
  pgEnum,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import type { z } from 'zod'
import { organizationModel } from './auth'
import { timestamps } from './common'

export const uomCategoryEnum = pgEnum('uom_category', [
  'weight',
  'volume',
  'count',
  'other',
])

export const unitOfMeasureModel = pgTable('unit_of_measure', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  name: text('name').notNull(),
  abbreviation: text('abbreviation').notNull(),
  category: uomCategoryEnum('category').notNull().default('count'),
  ...timestamps,
})

export const unitOfMeasureRelations = relations(
  unitOfMeasureModel,
  ({ one }) => ({
    organization: one(organizationModel, {
      fields: [unitOfMeasureModel.organizationId],
      references: [organizationModel.id],
    }),
  })
)

export const selectUnitOfMeasureSchema = createSelectSchema(unitOfMeasureModel)
export const insertUnitOfMeasureSchema = createInsertSchema(unitOfMeasureModel)
export const updateUnitOfMeasureSchema = createUpdateSchema(unitOfMeasureModel)

export type UnitOfMeasure = z.infer<typeof selectUnitOfMeasureSchema>
export type InsertUnitOfMeasure = z.infer<typeof insertUnitOfMeasureSchema>
export type UpdateUnitOfMeasure = z.infer<typeof updateUnitOfMeasureSchema>
