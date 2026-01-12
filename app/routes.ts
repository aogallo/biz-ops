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
  route("/api/users/bulk-create", "routes/api.users.bulk-create.tsx"), // TODO: Refactor to use action

  // Public invitation acceptance
  route("/invitation/accept/:token", "./features/invitation/routes/accept.$token.tsx"),

  // App routes with sidebar layout
  layout("./layout/AppLayout.tsx", [
    ...prefix("organization", [
      index("./features/organization/routes/index.tsx"),
      route("/new", "./features/organization/routes/CreateOrganization.tsx"),
    ]),
    ...prefix("invitations", [
      index("./features/invitation/routes/index.tsx"),
      route("/new", "./features/invitation/routes/new.tsx"),
    ]),
    ...prefix("admin", [
      route("/users", "./features/admin/routes/users.tsx"),
      route("/users/create", "./features/admin/routes/users.create.tsx"),
      route("/users/bulk-create", "./features/admin/routes/users.bulk-create.tsx"),
      route("/invitations", "./features/admin/routes/invitations.tsx"),
      route("/organizations/create", "./features/admin/routes/organizations.create.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
