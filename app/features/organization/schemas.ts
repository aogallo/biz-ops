import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import type z from "zod";
import { organizationModel } from "~/server/db/schemas/auth";

export const organizationCreateSchema = createInsertSchema(
  organizationModel,
).omit({
  id: true,
});
export type OrganizationCreate = z.infer<typeof organizationCreateSchema>;

export const organizationUpdateSchema = createUpdateSchema(organizationModel);
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>;
