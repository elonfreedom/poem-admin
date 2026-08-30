import { generateAccessible } from '#/lib/access';

async function generateAccess(options: {
  roles: string[];
  router: any;
  routes: any[];
}) {
  return await generateAccessible(options);
}

export { generateAccess };
