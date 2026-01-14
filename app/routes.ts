import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/login.tsx"),
  route("/logout", "routes/logout.tsx"),

  // API Routes
  route("/api/auth/*", "routes/api.auth.$.tsx"), // Required by Better Auth

  // Public invitation acceptance
  route(
    "/invitation/accept/:token",
    "./features/invitation/routes/accept.$token.tsx",
  ),

  // App routes with sidebar layout
  layout("./layout/AppLayout.tsx", [
    ...prefix("organization", [
      index("./features/organization/routes/index.tsx"),
      route("/new", "./features/organization/routes/create.tsx"),
      route("/:slug", "./features/organization/routes/show.tsx"),
    ]),
    ...prefix("products", [
      index("./features/products/routes/index.tsx"),
      route("/new", "./features/products/routes/create.tsx"),
      route("/:sku", "./features/products/routes/show.tsx"),
      route("/:sku/edit", "./features/products/routes/edit.tsx"),
    ]),
    ...prefix("business-partners", [
      index("./features/business-partners/routes/index.tsx"),
      route("/new", "./features/business-partners/routes/create.tsx"),
      route("/:id", "./features/business-partners/routes/show.tsx"),
      route("/:id/edit", "./features/business-partners/routes/edit.tsx"),
    ]),
    ...prefix("invitations", [
      index("./features/invitation/routes/index.tsx"),
      route("/new", "./features/invitation/routes/new.tsx"),
    ]),
    ...prefix("admin", [
      route("/users", "./features/admin/routes/users.tsx"),
      route("/users/create", "./features/admin/routes/users.create.tsx"),
      route(
        "/users/bulk-create",
        "./features/admin/routes/users.bulk-create.tsx",
      ),
      route("/invitations", "./features/admin/routes/invitations.tsx"),
      route(
        "/organizations/create",
        "./features/admin/routes/organizations.create.tsx",
      ),
    ]),
  ]),
] satisfies RouteConfig;
