-- MetroGlassOps: API key system
-- Version: 2.3.0
-- Description: Adds an api_keys table so external clients (Donald's bot,
--              permit-pulse, future integrations) can call /api/v1/* with a
--              Bearer token. Tokens are stored as a SHA-256 hex hash; only
--              the prefix is kept in cleartext so they can be identified in
--              the UI later. Two SQL helpers (issue_api_key, revoke_api_key)
--              let the operator manage keys without leaving the SQL editor.

-- ---------- Table ----------

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read','write']::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_active
  ON public.api_keys(key_hash)
  WHERE revoked_at IS NULL;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Internal users can manage api keys" ON public.api_keys;
CREATE POLICY "Internal users can manage api keys"
  ON public.api_keys FOR ALL
  TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

-- ---------- Helpers ----------

-- Issue a new API key. Returns the plaintext token EXACTLY ONCE — copy it
-- immediately, the only thing the database keeps is the hash. Default
-- scopes are read+write; pass a subset like ARRAY['read'] for a read-only
-- token.
CREATE OR REPLACE FUNCTION public.issue_api_key(
  p_name TEXT,
  p_scopes TEXT[] DEFAULT ARRAY['read','write']::text[]
)
RETURNS TABLE(token TEXT, prefix TEXT, key_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_random TEXT;
  v_token  TEXT;
  v_prefix TEXT;
  v_hash   TEXT;
  v_id     UUID;
BEGIN
  -- 32 bytes -> 64 hex chars of entropy
  v_random := encode(extensions.gen_random_bytes(32), 'hex');
  v_token  := 'mgops_live_' || v_random;
  v_prefix := substring(v_token from 1 for 18); -- mgops_live_xxxxxxx
  v_hash   := encode(extensions.digest(v_token, 'sha256'), 'hex');

  INSERT INTO public.api_keys (name, key_hash, key_prefix, scopes)
  VALUES (p_name, v_hash, v_prefix, p_scopes)
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_token, v_prefix, v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_api_key(TEXT, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_api_key(TEXT, TEXT[]) TO authenticated;

-- Revoke an existing key by id.
CREATE OR REPLACE FUNCTION public.revoke_api_key(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.api_keys
  SET revoked_at = NOW()
  WHERE id = p_id AND revoked_at IS NULL
  RETURNING TRUE;
$$;

REVOKE ALL ON FUNCTION public.revoke_api_key(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_api_key(UUID) TO authenticated;

COMMENT ON TABLE public.api_keys IS
  'Bearer tokens for /api/v1/* — cleartext token is never stored, only its SHA-256 hash. Use public.issue_api_key() and public.revoke_api_key() to manage.';
