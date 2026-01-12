import { organization } from "~/server/db/schema";

import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import type z from "zod";

export const organizationCreateSchema = createInsertSchema(organization);
export type OrganizationCreate = z.infer<typeof organizationCreateSchema>;

export const organizationUpdateSchema = createUpdateSchema(organization);
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>;
