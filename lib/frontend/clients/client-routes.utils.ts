export const CLIENT_ROUTES = {
  list: "/clients",
  create: "/clients/create",
  view: (clientId: string) => `/clients/view/${clientId}`,
  edit: (clientId: string) => `/clients/edit/${clientId}`,
} as const;
