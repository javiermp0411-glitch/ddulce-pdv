const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const operationalPermissions = new Set([
  'dashboard.read',
  'sales.read',
  'sales.create',
  'pos.use',
  'inventory.read',
  'inventory.adjust',
  'expenses.read',
  'expenses.create',
]);

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function adminHeaders(adminKey: string) {
  return {
    apikey: adminKey,
    Authorization: `Bearer ${adminKey}`,
    'Content-Type': 'application/json',
  };
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  let publishableKey = '';
  let secretKey = '';
  const publishableKeys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (publishableKeys) {
    try {
      const keys = JSON.parse(publishableKeys) as Record<string, unknown>;
      if (typeof keys.default === 'string') publishableKey = keys.default;
    } catch {
      return jsonResponse({ error: 'La configuración de claves públicas no es válida.' }, 500);
    }
  }
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (secretKeys) {
    try {
      const keys = JSON.parse(secretKeys) as Record<string, unknown>;
      if (typeof keys.default === 'string') secretKey = keys.default;
    } catch {
      return jsonResponse({ error: 'La configuración de claves de la función no es válida.' }, 500);
    }
  }
  publishableKey ||= Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  secretKey ||= Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const serviceRoleJwt = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const adminKey = serviceRoleJwt || secretKey;
  const appUrl = Deno.env.get('APP_URL')?.replace(/\/$/, '');
  if (!supabaseUrl || !publishableKey || !adminKey || !appUrl) {
    return jsonResponse({ error: 'La función no está configurada.' }, 500);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Inicia sesión con una cuenta owner.' }, 401);
  }

  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: authorization,
      },
    });
    if (!userResponse.ok) {
      return jsonResponse({ error: 'La sesión no es válida.' }, 401);
    }
    const caller = await userResponse.json() as { id?: string };
    if (!caller.id) return jsonResponse({ error: 'La sesión no es válida.' }, 401);

    const ownerResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(caller.id)}&select=role,status,must_set_password`,
      { headers: { apikey: publishableKey, Authorization: authorization } },
    );
    if (!ownerResponse.ok) {
      console.error('Owner profile lookup failed with status', ownerResponse.status);
      return jsonResponse({ error: 'No se pudo verificar el permiso de owner.' }, 503);
    }
    const [profile] = await ownerResponse.json() as { role: string; status: string; must_set_password: boolean }[];
    if (profile?.role !== 'owner' || profile.status !== 'active' || profile.must_set_password) {
      return jsonResponse({ error: 'Solo una cuenta owner activa puede invitar usuarios.' }, 403);
    }

    let input: {
      email?: unknown;
      displayName?: unknown;
      role?: unknown;
      permissions?: unknown;
    };
    try {
      input = await request.json();
    } catch {
      return jsonResponse({ error: 'La solicitud no tiene un formato válido.' }, 400);
    }

    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : '';
    const role = input.role;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return jsonResponse({ error: 'Escribe un correo electrónico válido.' }, 400);
    }
    if (!displayName || displayName.length > 120) {
      return jsonResponse({ error: 'El nombre es obligatorio y debe tener máximo 120 caracteres.' }, 400);
    }
    if (role !== 'admin' && role !== 'staff') {
      return jsonResponse({ error: 'El rol seleccionado no es válido.' }, 400);
    }

    const requestedPermissions = Array.isArray(input.permissions) ? input.permissions : [];
    if (role === 'staff' && requestedPermissions.some((permission) => typeof permission !== 'string' || !operationalPermissions.has(permission))) {
      return jsonResponse({ error: 'La lista de permisos contiene valores no permitidos.' }, 400);
    }
    const permissions = role === 'staff' ? [...new Set(requestedPermissions as string[])] : [];
    const headers = adminHeaders(adminKey);

    const inviteResponse = await fetch(
      `${supabaseUrl}/auth/v1/invite?redirect_to=${encodeURIComponent(`${appUrl}/app`)}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, data: { display_name: displayName } }),
      },
    );
    const invitedUser = await inviteResponse.json().catch(() => null) as { id?: string } | null;
    if (!inviteResponse.ok || !invitedUser?.id) {
      return jsonResponse({ error: 'No se pudo enviar la invitación. Verifica el correo y si ya existe una cuenta.' }, 400);
    }

    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(invitedUser.id)}`,
      {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ display_name: displayName, role, status: 'active' }),
      },
    );

    let permissionsResponse: Response | null = null;
    if (profileResponse.ok && permissions.length > 0) {
      permissionsResponse = await fetch(`${supabaseUrl}/rest/v1/user_permissions`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify(permissions.map((permission_key) => ({
          user_id: invitedUser.id,
          permission_key,
          granted_by: caller.id,
        }))),
      });
    }

    if (!profileResponse.ok || (permissionsResponse && !permissionsResponse.ok)) {
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(invitedUser.id)}`, {
        method: 'DELETE',
        headers,
      });
      return jsonResponse({ error: 'No se pudo configurar la cuenta; se canceló la invitación.' }, 503);
    }

    return jsonResponse({ invited: true }, 201);
  } catch {
    return jsonResponse({ error: 'Ocurrió un error al procesar la invitación.' }, 500);
  }
});
